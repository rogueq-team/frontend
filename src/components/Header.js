// components/Header.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileClick = () => {
    navigate('/dashboard');
  };

  return (
    <header className="main-header">
      <div className="header-content">
        <Link to="/" className="header-title">
          BrandConnect
        </Link>
        
        <nav className="header-nav">
          <Link to="/" className="nav-link">Главная</Link>
          <Link to="/about" className="nav-link">О нас</Link>
          <Link to="/applications" className="nav-link">Заказы</Link>
          
          {isAuthenticated ? (
            // ✅ ПОКАЗЫВАЕМ ДЛЯ АВТОРИЗОВАННОГО ПОЛЬЗОВАТЕЛЯ
            <div className="user-section">
              <span className="user-greeting">
                Привет, {user?.name || user?.email?.split('@')[0] || 'Пользователь'}!
              </span>
              <button 
                className="nav-link profile-link"
                onClick={handleProfileClick}
                style={{background: 'none', border: 'none', cursor: 'pointer'}}
              >
                Личный кабинет
              </button>
              <button 
                className="logout-btn-header"
                onClick={handleLogout}
                title="Выйти"
              >
                🚪
              </button>
            </div>
          ) : (
            // ✅ ПОКАЗЫВАЕМ ДЛЯ НЕАВТОРИЗОВАННОГО ПОЛЬЗОВАТЕЛЯ
            <>
              <Link to="/login" className="nav-link">Войти</Link>
              <Link to="/register" className="nav-link">Регистрация</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;