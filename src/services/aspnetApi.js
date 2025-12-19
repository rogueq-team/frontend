const API_BASE_URL = 'http://localhost:5050';

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

async getDeal(dealId) {
  return this.request(`/Deal/GetDeal/${dealId}`, {
    method: 'GET'
  });
}

async getDealMessages(dealId) {
  return this.request(`/Deal/${dealId}/messages`, {
    method: 'GET'
  });
}

async sendDealMessage(dealId, message) {
  return this.request(`/Deal/${dealId}/message`, {
    method: 'POST',
    body: JSON.stringify({ message })
  });
}

async getDealByApplicationId(applicationId) {
  return this.request(`/Deal/GetByApplication/${applicationId}`, {
    method: 'GET'
  });
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

 // 📋 ПОЛУЧЕНИЕ ВСЕХ ЗАЯВОК (для контент-мейкеров)
async getAllApplications() {
  return this.request('/Applications/GetAllApp', {
    method: 'GET'
  });
}

// 📋 ПОЛУЧЕНИЕ ЗАЯВОК ПОЛЬЗОВАТЕЛЯ (для рекламодателей)
async getUserApplications() {
  return this.request('/Applications/GetByUser', {
    method: 'GET'
  });
}

// 📋 ПОЛУЧЕНИЕ КОНКРЕТНОЙ ЗАЯВКИ ПО ID
async getApplicationById(id) {
  return this.request(`/Applications/GetApp/${id}`, {
    method: 'GET'
  });
}

// 📋 СОЗДАНИЕ ЗАЯВКИ (уже правильный метод)
async createApplication(applicationData) {
  return this.request('/Applications/CreateApp', {
    method: 'POST',
    body: JSON.stringify({
      description: applicationData.description,  
      cost: applicationData.cost,                
      status: applicationData.status || 0        
    }),
  });
}

async updateApplication(applicationId, applicationData) {
  try {
    console.log('🔄 Обновление заявки:', { applicationId, applicationData });
    
    const response = await fetch(`${this.baseUrl}/Applications/ApplicationUpdate/${applicationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        description: applicationData.description,
        cost: applicationData.cost,
        status: applicationData.status
      }),
    });

    console.log('📤 Response status:', response.status);
    console.log('📤 Response headers:', response.headers);
    
    // Проверяем статус ответа
    if (response.status === 204) {
      // 204 No Content - успех, но без тела ответа
      console.log('✅ Заявка успешно обновлена (204 No Content)');
      return { success: true, message: 'Заявка обновлена' };
    }
    
    if (response.status === 200) {
      // Пробуем получить JSON
      const responseText = await response.text();
      console.log('📤 Response text:', responseText);
      
      if (responseText) {
        try {
          const data = JSON.parse(responseText);
          console.log('✅ Parsed response:', data);
          return data;
        } catch (parseError) {
          console.log('⚠️ Response is not JSON:', responseText);
          return { success: true, message: responseText || 'Заявка обновлена' };
        }
      } else {
        // Пустой ответ
        console.log('✅ Пустой ответ (200 OK)');
        return { success: true, message: 'Заявка обновлена' };
      }
    }
    
    // Обработка ошибок
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      
      let errorMessage = 'Ошибка обновления заявки';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorText;
      } catch {
        errorMessage = errorText || `HTTP error! status: ${response.status}`;
      }
      
      throw new Error(errorMessage);
    }
    
  } catch (error) {
    console.error('❌ API Error в updateApplication:', error);
    throw error;
  }
}

// 📋 УДАЛЕНИЕ ЗАЯВКИ (уже правильный метод)
async deleteApplication(applicationId) {
  try {
    console.log('🗑️ Удаление заявки с ID:', applicationId);
    
    const endpoint = `/Applications/DeleteApp/${applicationId}`;
    console.log('🔗 Endpoint:', endpoint);
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    console.log('🗑️ Response status:', response.status);
    console.log('🗑️ Response headers:', response.headers);
    
    // Проверяем разные статусы
    if (response.status === 204) {
      // 204 No Content - успешное удаление без тела ответа
      console.log('✅ Заявка успешно удалена (204 No Content)');
      return { success: true, message: 'Заявка удалена' };
    }
    
    if (response.status === 200) {
      const responseText = await response.text();
      console.log('🗑️ Response text (200):', responseText);
      
      if (responseText) {
        try {
          const data = JSON.parse(responseText);
          console.log('✅ Parsed response:', data);
          return data;
        } catch {
          return { success: true, message: responseText };
        }
      }
      return { success: true, message: 'Заявка удалена' };
    }
    
    // Обработка ошибок
    const errorText = await response.text();
    console.error('❌ Error response:', errorText);
    
    let errorMessage = 'Ошибка удаления заявки';
    if (response.status === 404) {
      errorMessage = 'Заявка не найдена';
    } else if (response.status === 403) {
      errorMessage = 'Нет прав для удаления этой заявки';
    } else if (response.status === 400) {
      errorMessage = 'Некорректный запрос';
    }
    
    // Пробуем извлечь сообщение из JSON
    if (errorText) {
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Если не JSON, используем текст ошибки
        if (errorText.trim()) {
          errorMessage = errorText;
        }
      }
    }
    
    throw new Error(errorMessage);
    
  } catch (error) {
    console.error('🗑️ API Error в deleteApplication:', error);
    throw error;
  }
}

// aspnetApi.js - улучшенный метод createDeal
async createDeal(applicationId, description = "") {
  try {
    console.log('🤝 Создание сделки для заявки:', applicationId);
    
    const response = await fetch(`${this.baseUrl}/Deal/CreateDeal?applicationId=${applicationId}&description=${encodeURIComponent(description)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({})
    });

    console.log('🤝 Response status:', response.status);
    
    if (response.status === 200 || response.status === 201) {
      const responseText = await response.text();
      console.log('🤝 Response text:', responseText);
      
      let data;
      if (responseText) {
        try {
          data = JSON.parse(responseText);
          console.log('✅ Сделка создана:', data);
        } catch {
          data = { success: true, message: responseText };
        }
      } else {
        data = { success: true };
      }
      
      return data;
    }
    
    const errorText = await response.text();
    console.error('❌ Error creating deal:', errorText);
    
    let errorMessage = 'Ошибка создания сделки';
    if (errorText) {
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorText;
      } catch {
        errorMessage = errorText;
      }
    }
    
    throw new Error(errorMessage);
    
  } catch (error) {
    console.error('❌ API Error в createDeal:', error);
    throw error;
  }
}


  async updateUserInfo(userData) {
    return this.request('/User/UpdateInformation', {
      method: 'POST', // ← ТОЧНО POST!
      body: JSON.stringify({
        Name: userData.name,
        Login: userData.login,
        Email: userData.email,
        Role: userData.role || 0,
        Type: userData.type || 1,
        Balance: userData.balance || 0,
        AvatarPath: userData.avatarPath || null,
        Bio: userData.bio || null,
        // 🔥 ВАЖНО: SocialLinks должен быть List<string> или null
        SocialLinks: userData.socialLinks && userData.socialLinks.length > 0 
          ? userData.socialLinks 
          : []
      }),
    });
  }


  // 🔐 СМЕНА ПАРОЛЯ
  async changePassword(oldPassword, newPassword) {
    return this.request('/User/ChangePassword', {
      method: 'POST', // ← Тоже POST
      body: JSON.stringify({
        oldPassword: oldPassword,
        newPassword: newPassword
      }),
    });
  }

} 



export default new AspNetApiService();