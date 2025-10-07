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
  const [error, setError] = useState('');
  
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prevState => ({
      ...prevState,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      setError('Заполните все поля');
      return;
    }

    try {
      const result = await login(loginData.email, loginData.password, userType);
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Ошибка входа. Проверьте данные.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Вход в аккаунт</h2>
        
        {error && <div className="error-message global-error">{error}</div>}
        
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
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={loginData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
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