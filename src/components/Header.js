import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="main-header">
      <div className="header-content">
        <Link to="/" className="header-title">
          BrandConnect
        </Link>
        <nav className="header-nav">
          <Link to="/" className="nav-link">О платформе</Link>
          <Link to="/contacts" className="nav-link">Контакты</Link>
          <Link to="/login" className="nav-link">Войти</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;