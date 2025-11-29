const API_BASE_URL = 'https://localhost:7157';

class AspNetApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.isRefreshing = false;
  }

  async request(endpoint, options = {}) {
  const url = `${this.baseUrl}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  let token = localStorage.getItem('authToken');
  
  if (!token) {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        token = user.token || user.Token;
        if (token) {
          localStorage.setItem('authToken', token); 
        }
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
  }

  if (token) {
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    config.headers['Authorization'] = `Bearer ${cleanToken}`;
    console.log('🔐 Добавлен Authorization header:', `Bearer ${cleanToken.substring(0, 20)}...`);
  }

    try {
      console.log('Making request to:', url);
      const response = await fetch(url, config);

      if (response.status === 401 && token && !this.isRefreshing) {
        console.log('🔄 JWT токен истек, автоматически обновляем...');
        this.isRefreshing = true;
        
        try {
          const user = JSON.parse(localStorage.getItem('user'));
          const refreshToken = user?.refreshToken;
          
          if (refreshToken) {
            console.log('🔄 Используем refresh token для получения нового JWT');
            const refreshResult = await this.refreshToken(refreshToken);
            
            if (refreshResult && (refreshResult.JwtToken || refreshResult.jwtToken)) {
              const newToken = refreshResult.JwtToken || refreshResult.jwtToken;
              const newRefreshToken = refreshResult.RefreshToken || refreshResult.refreshToken;
              
              localStorage.setItem('authToken', newToken);
              if (user) {
                user.token = newToken;
                user.refreshToken = newRefreshToken;
                localStorage.setItem('user', JSON.stringify(user));
              }
              
              console.log('✅ Токены обновлены, повторяем запрос...');
              
              config.headers['Authorization'] = `Bearer ${newToken}`;
              const retryResponse = await fetch(url, config);
              
              if (!retryResponse.ok) {
                const errorText = await retryResponse.text();
                throw new Error(errorText || `HTTP error! status: ${retryResponse.status}`);
              }
              
              const data = await retryResponse.json();
              this.isRefreshing = false;
              return data;
            }
          } else {
            console.log('❌ Refresh token не найден');
            throw new Error('Refresh token отсутствует');
          }
        } catch (refreshError) {
          console.error('❌ Ошибка при автоматическом обновлении токена:', refreshError);
          this.isRefreshing = false;
          throw refreshError;
        }
        
        this.isRefreshing = false;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response:', data);
      return data;
      
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      console.log('🔄 Отправка refresh token:', refreshToken ? 'есть' : 'отсутствует');
      
      const response = await fetch(`${this.baseUrl}/Auth/RefreshToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: refreshToken
        }),
      });

      if (response.status === 200) {
        const data = await response.json();
        console.log('✅ Успешное обновление токена:', data);
        return data;
      } 
      else if (response.status === 400) {
        const data = await response.json();
        console.log('✅ Обновление токена (400):', data);
        return data;
      }
      else if (response.status === 401) {
        const errorText = await response.text();
        let errorMessage = 'Ошибка обновления токена';
        
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorText;
          } catch {
            errorMessage = errorText;
          }
        }
        
        console.log('❌ Ошибка 401:', errorMessage);
        throw new Error(errorMessage);
      }
      else {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
      
    } catch (error) {
      console.error('🔄 API Error:', error);
      throw error;
    }
  }

  // 🔐 АУТЕНТИФИКАЦИЯ
  async register(userData) {
    try {
      console.log('🔐 Отправка данных регистрации:', userData);
      
      const response = await fetch(`${this.baseUrl}/Auth/Registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          login: userData.login,
          email: userData.email,
          password: userData.password,
          role: userData.role,
          type: userData.type
        }),
      });

      console.log('🔐 Response status:', response.status);
      
      if (response.status === 200) {
        const data = await response.json();
        console.log('✅ Успешная регистрация:', data);
        return data;
      } 
      else if (response.status === 400 || response.status === 409) {
        const errorText = await response.text();
        let errorMessage = 'Ошибка регистрации';
        
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorText;
          } catch {
            errorMessage = errorText;
          }
        }
        
        console.log('❌ Ошибка регистрации:', errorMessage);
        throw new Error(errorMessage);
      }
      else {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
      
    } 
    catch (error) {
        console.error('🔐 API Error:', error);
        throw error;
      }
  }

  async getCurrentUser() {
    return this.request('/Auth/Me', {
      method: 'GET'
    });
  }

  async login(email, password) {
  try {
    console.log('🔐 Отправка данных авторизации:', { email, password });
    
    const response = await fetch(`${this.baseUrl}/Auth/Authentication`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      }),
    });

    console.log('🔐 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('🔐 Response text:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Ошибка парсинга JSON:', parseError);
      throw new Error('Неверный формат ответа от сервера');
    }
    
    if (response.status === 200) {
      console.log('✅ Успешная авторизация. ВСЕ ПОЛЯ ОТВЕТА:', data);
      
      const token = data.JWTtoken || data.jwtToken || data.jwTtoken || data.token || data.JwtToken || data.accessToken;
      
      if (!token) {
        console.error('❌ Токен не найден в ответе. Все поля:', Object.keys(data));
        throw new Error('Токен не получен от сервера');
      }
      
      const refreshToken = data.RefreshToken || data.refreshToken;
      
      console.log('🔐 Полученные токены:', { token, refreshToken });
      
      const userDataFromBackend = data.user || data;
      const isDeleted = userDataFromBackend.deleted_at !== null && 
                       userDataFromBackend.deleted_at !== undefined;
      
      console.log('🔍 Проверка deleted_at:', userDataFromBackend.deleted_at);
      console.log('🔍 Аккаунт удален?:', isDeleted);
      
      if (isDeleted) {
        console.log('❌ Аккаунт помечен как удаленный в БД');
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        throw new Error('Этот аккаунт был удален. Восстановление невозможно.');
      }
      
      return data;
    } 
    else if (response.status === 400 || response.status === 401) {
      const errorMessage = data.message || data.error || 'Ошибка авторизации';
      console.log('❌ Ошибка авторизации:', errorMessage);
      throw new Error(errorMessage);
    }
    else {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
  } catch (error) {
    console.error('🔐 API Error:', error);
    throw error;
  }
}

async deleteUser() {
  try {
    console.log('🗑️ Отправка запроса на удаление пользователя...');
    
    const endpoint = '/Auth/Delete';
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
    });

    
    const responseText = await response.text();
    console.log('🗑️ Response text:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('🗑️ Parsed response data:', data);
    } catch (parseError) {
      console.log('🗑️ Response is not JSON:', responseText);
      throw new Error('Неверный формат ответа от сервера');
    }
    
    if (response.status === 200) {
      console.log('✅ Пользователь успешно удален:', data);
      return data;
    } 
  } catch (error) {
    console.error('🗑️ API Error:', error);
    throw error;
  }
}
  // 👤 ПОЛЬЗОВАТЕЛИ
  async getUser(id) {
    return this.request(`/User/${id}`);
  }

  async updateUser(id, userData) {
    return this.request(`/User/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // 📋 ЗАКАЗЫ
  async getOrders() {
    return this.request('/Order');
  }

  async createOrder(orderData) {
    return this.request('/Order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }
} 



export default new AspNetApiService();