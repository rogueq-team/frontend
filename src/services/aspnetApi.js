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
  console.log('Данные в aspnetApi:', userData);
  return this.request('/Auth/Registration', {
    method: 'POST',
    body: JSON.stringify({
      name: userData.username || userData.username,
      login: userData.email,
      email: userData.email,
      password: userData.password,
      role: 0,
      type: userData.type // ← просто передаём type как есть
    }),
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