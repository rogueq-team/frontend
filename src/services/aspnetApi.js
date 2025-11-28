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

    // Добавляем JWT токен авторизации
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      console.log('Making request to:', url);
      const response = await fetch(url, config);
      
      // 🔄 АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ JWT ТОКЕНА
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
              
              // 🔄 ОБНОВЛЯЕМ ТОКЕНЫ В LOCALSTORAGE
              localStorage.setItem('authToken', newToken);
              if (user) {
                user.token = newToken;
                user.refreshToken = newRefreshToken;
                localStorage.setItem('user', JSON.stringify(user));
              }
              
              console.log('✅ Токены обновлены, повторяем запрос...');
              
              // Повторяем оригинальный запрос с новым токеном
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

      console.log('🔄 Response status:', response.status);
      
      // Обрабатываем разные статусы
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
    return this.request('/Auth/me', {
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
      
      if (response.status === 200) {
        const data = await response.json();
        console.log('✅ Успешная авторизация:', data);
        return data;
      } 
      else if (response.status === 400) {
        const errorText = await response.text();
        let errorMessage = 'Ошибка валидации данных';
        
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.errors) {
              const validationErrors = Object.values(errorData.errors).flat();
              errorMessage = validationErrors.join(', ') || 'Ошибка валидации';
            } else {
              errorMessage = errorData.message || errorText;
            }
          } catch {
            errorMessage = errorText;
          }
        }
        
        console.log('❌ Ошибка 400:', errorMessage);
        throw new Error(errorMessage);
      }
      else if (response.status === 401) {
        const errorText = await response.text();
        const errorMessage = errorText || 'Неверный email или пароль';
        console.log('❌ Ошибка 401:', errorMessage);
        throw new Error(errorMessage);
      }
      else {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
      
    } catch (error) {
      console.error('🔐 API Error:', error);
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