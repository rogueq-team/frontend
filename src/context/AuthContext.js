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

  // 🔄 ЗАГРУЗКА ПОЛЬЗОВАТЕЛЯ ИЗ LOCALSTORAGE
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

  // 🔐 ФУНКЦИЯ ВХОДА
  const login = async (email, password, userType) => {
    setIsLoading(true);
    
    try {
      console.log('Logging in with:', { email, password });
      
      const response = await AspNetApiService.login(email, password);
      
      console.log('Login response:', response);
      
      if (response && (response.JWTtoken || response.jwtToken || response.jwTtoken)) {
        const token = response.JWTtoken || response.jwtToken || response.jwTtoken;
        const refreshToken = response.RefreshToken || response.refreshToken;
        
        console.log('🔐 Полученные токены:', { token, refreshToken });
        
        const userTypeFromBackend = response.user?.Type?.toLowerCase() || 
                                   response.user?.type?.toLowerCase() || 'contentmaker';
        const formattedUserType = userTypeFromBackend.includes('advertiser') ? 'advertiser' : 'contentmaker';
        
        const userData = {
          id: response.user?.Id || response.user?.id || Date.now(),
          name: response.user?.Login || response.user?.login || email.split('@')[0],
          email: response.user?.Email || response.user?.email || email,
          userType: formattedUserType,
          avatar: formattedUserType === 'advertiser' ? '🏢' : '🎬',
          registrationDate: new Date().toISOString().split('T')[0],
          balance: formattedUserType === 'advertiser' ? 50000 : 15000,
          campaigns: formattedUserType === 'advertiser' ? 5 : 3,
          statistics: {
            views: 12500,
            clicks: 345,
            conversions: 28,
            engagement: 4.2
          },
          token: token,
          refreshToken: refreshToken,
          backendData: response
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', token);
        
        return { 
          success: true, 
          user: userData,
          message: 'Авторизация успешна!' 
        };
      } else {
        console.log('❌ Неизвестный формат ответа:', response);
        return { 
          success: false, 
          error: 'Неизвестный формат ответа от сервера' 
        };
      }
      
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // 🔐 ФУНКЦИЯ РЕГИСТРАЦИИ
  const register = async (userData) => {
    setIsLoading(true);
    
    try {
      console.log('Registering user:', userData);
      
      const backendUserData = {
        name: userData.username,
        login: userData.email,
        email: userData.email,
        password: userData.password,
        role: 0,
        type: userData.userType === 'advertiser' ? 1 : 0
      };
      
      console.log('backendUserData:', backendUserData);
      const response = await AspNetApiService.register(backendUserData);
      
      console.log('Register response:', response);
      
      if (response && response.JWTToken) {
        const userTypeFromBackend = response.UserType === "Advertiser" ? 'advertiser' : 'contentmaker';

        const newUser = {
          id: Date.now(),
          name: userData.username,
          email: response.Email,
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
          token: response.JWTToken,
          refreshToken: response.RefreshToken,
          backendData: response
        };
        
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
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

  // 🔄 ФУНКЦИЯ ПОЛУЧЕНИЯ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
  const getCurrentUser = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching current user data...');
      const response = await AspNetApiService.getCurrentUser();
      
      console.log('Current user response:', response);
      
      if (response) {
        // 🔄 СОХРАНЯЕМ СУЩЕСТВУЮЩИЕ ТОКЕНЫ
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const existingToken = currentUser?.token;
        const existingRefreshToken = currentUser?.refreshToken;
        
        const userData = {
          id: response.id || Date.now(),
          name: response.name,
          email: response.email,
          userType: response.type === 1 ? 'advertiser' : 'contentmaker',
          avatar: response.avatarPath || (response.type === 1 ? '🏢' : '🎬'),
          registrationDate: response.createdAt ? new Date(response.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          balance: response.balance || 0,
          campaigns: 0,
          statistics: {
            views: 0,
            clicks: 0,
            conversions: 0,
            engagement: 0
          },
          bio: response.bio,
          socialLinks: response.socialLinks,
          isVerified: response.isVerified,
          login: response.login,
          role: response.role,
          token: existingToken,
          refreshToken: existingRefreshToken,
          backendData: response
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      } else {
        return { success: false, error: 'Не удалось загрузить данные пользователя' };
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 ФУНКЦИЯ ОБНОВЛЕНИЯ ТОКЕНА (ДЛЯ РУЧНОГО ВЫЗОВА)
  const refreshAuth = async () => {
    try {
      console.log('🔄 Ручной вызов обновления токена...');
      
      const user = JSON.parse(localStorage.getItem('user'));
      const refreshToken = user?.refreshToken;
      
      if (!refreshToken) {
        console.log('❌ Refresh token не найден');
        return { success: false, error: 'Refresh token отсутствует' };
      }
      
      const response = await AspNetApiService.refreshToken(refreshToken);
      
      console.log('🔄 Результат обновления токена:', response);
      
      if (response && (response.JwtToken || response.jwtToken)) {
        const newToken = response.JwtToken || response.jwtToken;
        const newRefreshToken = response.RefreshToken || response.refreshToken;
        
        // ОБНОВЛЯЕМ ТОКЕНЫ В ПОЛЬЗОВАТЕЛЕ
        const updatedUser = {
          ...user,
          token: newToken,
          refreshToken: newRefreshToken
        };
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('authToken', newToken);
        
        console.log('✅ Токены успешно обновлены');
        return { success: true, user: updatedUser };
      } else {
        console.log('❌ Неизвестный формат ответа при обновлении токена');
        return { success: false, error: 'Ошибка обновления токена' };
      }
      
    } catch (error) {
      console.error('🔄 Ошибка обновления токена:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  // 🚪 ФУНКЦИЯ ВЫХОДА
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  };

  // ✏️ ФУНКЦИЯ ОБНОВЛЕНИЯ ПОЛЬЗОВАТЕЛЯ
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
    getCurrentUser,
    refreshAuth,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};