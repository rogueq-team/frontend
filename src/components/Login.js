import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [userType, setUserType] = useState('advertiser');
  const [errors, setErrors] = useState({}); // ← ДОБАВЛЕНО
  const [isSubmitting, setIsSubmitting] = useState(false); // ← ДОБАВЛЕНО
  
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prevState => ({
      ...prevState,
      [name]: value
    }));
    // Очищаем ошибки при изменении
    if (errors[name] || errors.submit) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        delete newErrors.submit;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация формы
    const newErrors = {};
    if (!loginData.email) newErrors.email = 'Email обязателен'; // ← ИСПРАВЛЕНО: formData → loginData
    if (!loginData.password) newErrors.password = 'Пароль обязателен'; // ← ИСПРАВЛЕНО: formData → loginData
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log('🔐 Начало авторизации');
    
    try {
      setIsSubmitting(true); // ← ИСПРАВЛЕНО: setIsLoading → setIsSubmitting
      
      const result = await login(loginData.email, loginData.password, userType); // ← ИСПРАВЛЕНО: formData → loginData
      
      console.log('🔐 Результат авторизации:', result);
      
      if (result.success) {
        console.log('✅ Авторизация успешна, переход в кабинет');
        navigate('/dashboard');
      } else {
        console.log('❌ Ошибка авторизации:', result.error);
        // Показываем понятную ошибку
        setErrors({ submit: result.error });
        alert(`Ошибка авторизации: ${result.error}`);
      }
      
    } catch (error) {
      console.log('❌ Исключение при авторизации:', error);
      setErrors({ submit: 'Произошла непредвиденная ошибка' });
      alert('Произошла непредвиденная ошибка при авторизации');
    } finally {
      setIsSubmitting(false); // ← ИСПРАВЛЕНО: setIsLoading → setIsSubmitting
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Вход в аккаунт</h2>
        
        {/* Показываем ошибки валидации */}
        {errors.submit && <div className="error-message global-error">{errors.submit}</div>}
        
        <div className="user-type-selector">
          <button
            type="button"
            className={`user-type-btn ${userType === 'advertiser' ? 'active' : ''}`}
            onClick={() => setUserType('advertiser')}
          >
            Я рекламодатель
          </button>
          <button
            type="button"
            className={`user-type-btn ${userType === 'contentmaker' ? 'active' : ''}`}
            onClick={() => setUserType('contentmaker')}
          >
            Я контентмейкер
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={loginData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={loginData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              required
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading || isSubmitting} // ← ОБНОВЛЕНО
          >
            {isLoading || isSubmitting ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="login-links">
          <p>
            Нет аккаунта? <Link to="/register" className="link">Зарегистрироваться</Link>
          </p>
          <p>
            <a href="#" className="link">Забыли пароль?</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;