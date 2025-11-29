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

  const deleteAccount = async () => {
  setIsLoading(true);
  
  try {
    console.log('🗑️ Начало удаления аккаунта...');
    
    const response = await AspNetApiService.deleteUser();
    
    console.log('🗑️ Результат удаления:', response);
    
    if (response && (response.user?.id || response.user?.Id || response.user?.email || response.user?.Email)) {
      console.log('✅ Аккаунт успешно удален (soft delete)');
      
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      
      setTimeout(() => {
        window.location.href = '/'; 
      }, 100);
      
      return { 
        success: true, 
        message: '✅ Аккаунт успешно удален',
        deletedUser: response.user
      };
    } else {
      console.log('❌ Неизвестный формат ответа:', response);
      return { 
        success: false, 
        error: 'Неизвестный формат ответа от сервера' 
      };
    }
    
  } catch (error) {
    console.error('🗑️ Delete account error:', error);
    
    let errorMessage = 'Произошла ошибка при удалении аккаунта';
    
    if (error.message.includes('Невалидный пользователь') || 
        error.message.includes('невалидный')) {
      errorMessage = 'Невалидный пользователь';
    } else if (error.message.includes('Пользователь не найден') || 
               error.message.includes('не найден')) {
      errorMessage = 'Пользователь не найден';
    } else {
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  } finally {
    setIsLoading(false);
  }
};

const login = async (email, password, userType) => {
  setIsLoading(true);
  
  try {
    console.log('Logging in with:', { email, password });
    
    const response = await AspNetApiService.login(email, password);
    
    console.log('Login response:', response);
    
    const token = response.JWTtoken || response.jwtToken || response.jwTtoken || response.token || response.JwtToken || response.accessToken;
    
    if (response && token) {
      const refreshToken = response.RefreshToken || response.refreshToken;
      
      console.log('🔐 Полученные токены:', { token, refreshToken });
      
      const userDataFromBackend = response.user || response;
      const isDeleted = userDataFromBackend.deleted_at !== null && 
                       userDataFromBackend.deleted_at !== undefined;
      
      console.log('🔍 Проверка deleted_at:', userDataFromBackend.deleted_at);
      console.log('🔍 Аккаунт удален?:', isDeleted);
      
      if (isDeleted) {
        console.log('❌ Аккаунт помечен как удаленный');
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        throw new Error('Этот аккаунт был удален. Восстановление невозможно.');
      }
      
      // Преобразуем UserType из строки в наш формат
      const userTypeFromBackend = userDataFromBackend?.Type?.toLowerCase() || 
                                 userDataFromBackend?.type?.toLowerCase() || 'contentmaker';
      const formattedUserType = userTypeFromBackend.includes('advertiser') ? 'advertiser' : 'contentmaker';
      
      // Создаем объект пользователя для фронтенда
      const userData = {
        id: userDataFromBackend?.Id || userDataFromBackend?.id || Date.now(),
        name: userDataFromBackend?.Login || userDataFromBackend?.login || email.split('@')[0],
        email: userDataFromBackend?.Email || userDataFromBackend?.email || email,
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
      
      console.log('✅ User data с токенами:', userData);
      
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
    
    if (error.message.includes('удален') || 
        error.message.includes('deleted') ||
        error.message.includes('удалён')) {
      return { 
        success: false, 
        error: '❌ Этот аккаунт был удален. Создайте новый аккаунт.' 
      };
    }
    
    return { 
      success: false, 
      error: error.message 
    };
  } finally {
    setIsLoading(false);
  }
};

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

  const getCurrentUser = async () => {
  setIsLoading(true);
  try {
    const response = await AspNetApiService.getCurrentUser();
    console.log('Current user response:', response);
    
    if (response) {
      const isDeleted = response.deleted_at !== null && 
                       response.deleted_at !== undefined;
      
      console.log('🔍 Проверка deleted_at в /me:', response.deleted_at);
      console.log('🔍 Аккаунт удален?:', isDeleted);
      
      if (isDeleted) {
        console.log('❌ Аккаунт помечен как удаленный в БД, выполняем выход');
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
        
        return { 
          success: false, 
          error: '❌ Ваш аккаунт был удален' 
        };
      }
      
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const existingToken = currentUser?.token;
      const existingRefreshToken = currentUser?.refreshToken;
      
      console.log('🔐 Существующие токены:', { 
        token: existingToken ? 'есть' : 'нет', 
        refreshToken: existingRefreshToken ? 'есть' : 'нет' 
      });
      
      // Преобразуем данные от бекенда в наш формат
      const userData = {
        id: response.id || response.Id || Date.now(),
        name: response.name || response.login || response.email,
        email: response.email || response.Email,
        userType: response.type === 1 || response.UserType === "Advertiser" ? 'advertiser' : 'contentmaker',
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

const testEndpoints = async () => {
  try {
    console.log('🔍 Тестируем endpoints...');
    const response = await fetch('https://localhost:7157/Auth/Me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    
    console.log('🔍 /Auth/Me статус:', response.status);
    const text = await response.text();
    console.log('🔍 /Auth/Me ответ:', text);
    
  } catch (error) {
    console.error('🔍 Ошибка теста:', error);
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
    deleteAccount,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};