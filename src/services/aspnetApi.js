const API_BASE_URL = 'https://localhost:7157';

class AspNetApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
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
    console.log('Making request to:', url, config);
    const response = await fetch(url, config);
    
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
    
    // Обрабатываем разные статусы
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
    return this.request('/Auth/login', {
      method: 'POST', 
      body: JSON.stringify({ email, password }),
    });
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