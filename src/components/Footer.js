import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-content">
        <div className="footer-links">
          <Link to="/about" className="footer-link">О платформе</Link>
          <Link to="/contacts" className="footer-link">Контакты</Link>
          <Link to="/terms" className="footer-link">Пользовательское соглашение</Link>
          <Link to="/privacy" className="footer-link">Политика конфиденциальности</Link>
          <Link to="/support" className="footer-link">Поддержка</Link>
        </div>
        <div className="footer-copyright">
          <p>&copy; 2025 BrandConnect. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;