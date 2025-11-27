import React, { createContext, useContext, useState, useEffect } from 'react';
import AspNetApiService from '../services/aspnetApi';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Проверяем есть ли сохраненный пользователь при загрузке
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Функция входа с реальным бэкендом
  // Функция входа с реальным бэкендом
const login = async (email, password, userType) => {
  setIsLoading(true);
  
  try {
    console.log('Logging in with:', { email, password, userType });
    
    // РЕАЛЬНЫЙ ЗАПРОС К БЭКЕНДУ
    const response = await AspNetApiService.login(email, password);
    
    console.log('Login response:', response);
    
    if (response && response.Login) {
      // Преобразуем UserType из строки обратно в наш формат
      const userTypeFromBackend = response.UserType === "1" ? 'advertiser' : 'contentmaker';
      
      // Создаем объект пользователя для фронтенда
      const userData = {
        id: Date.now(), // временно
        name: email.split('@')[0], // используем часть email как имя
        email: response.Email,
        userType: userTypeFromBackend,
        avatar: userTypeFromBackend === 'advertiser' ? '🏢' : '🎬',
        registrationDate: new Date().toISOString().split('T')[0],
        balance: userTypeFromBackend === 'advertiser' ? 50000 : 15000,
        campaigns: userTypeFromBackend === 'advertiser' ? 5 : 3,
        statistics: {
          views: 12500,
          clicks: 345,
          conversions: 28,
          engagement: 4.2
        },
        // Сохраняем токены
        token: response.JWTToken,
        refreshToken: response.RefreshToken
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authToken', response.JWTToken);
      
      return { success: true, user: userData };
    } else {
      return { success: false, error: 'Неверный email или пароль' };
    }
    
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  } finally {
    setIsLoading(false);
  }
};

  // Функция регистрации с реальным бэкендом
const register = async (userData) => {
  setIsLoading(true);
  
  try {
    console.log('Registering user:', userData);
    
    // Подготавливаем данные для бэкенда
    const backendUserData = {
      name: userData.username,
      login: userData.email,
      email: userData.email,
      password: userData.password,
      role: 0, // всегда обычный пользователь
       type: userData.userType === 'advertiser' ? 1 : 0
    };
    
    // РЕАЛЬНЫЙ ЗАПРОС К БЭКЕНДУ
    console.log('backendUserData:', backendUserData); // ← ДОБАВЬТЕ ЭТО
    const response = await AspNetApiService.register(backendUserData);
    
    console.log('Register response:', response);
    
    if (response && response.jwtToken) {
      // Преобразуем UserType из строки обратно в наш формат
      const userTypeFromBackend = response.userType === "Advertiser" ? 'advertiser' : 'contentmaker';

      // Создаем объект пользователя для фронтенда
      const newUser = {
        id: Date.now(),
        name: userData.username,
        email: response.email, // email в camelCase
        userType: userTypeFromBackend,
        avatar: userTypeFromBackend === 'advertiser' ? '🏢' : '🎬',
        registrationDate: new Date().toISOString().split('T')[0],
        balance: 0,
        campaigns: 0,
        statistics: {
          views: 0,
          clicks: 0,
          conversions: 0,
          engagement: 0
        },
        // Сохраняем токены для будущих запросов
        token: response.jwtToken, // jwtToken в camelCase
        refreshToken: response.refreshToken // refreshToken в camelCase (если есть)
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Сохраняем токен отдельно для API запросов
      localStorage.setItem('authToken', response.JWTToken);
      
      return { success: true, user: newUser };
    } else {
      return { success: false, error: 'Ошибка регистрации' };
    }
    
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, error: error.message };
  } finally {
    setIsLoading(false);
  }
};

  // Функция выхода
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Функция обновления пользователя
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};