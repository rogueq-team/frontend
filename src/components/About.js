import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './About.css';

function About() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="hero-content">
          <h1>BrandConnect</h1>
          <p className="hero-subtitle">
            Платформа для эффективного сотрудничества рекламодателей и контентмейкеров
          </p>
          <div className="hero-actions">
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="cta-button primary">
                  Начать работу
                </Link>
                <Link to="/login" className="cta-button secondary">
                  Войти в аккаунт
                </Link>
              </>
            ) : (
              <Link to="/dashboard" className="cta-button primary">
                Перейти в кабинет
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="about-content">
        <div className="container">
          <section className="features-section">
            <h2>Возможности платформы</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Для рекламодателей</h3>
                <ul>
                  <li>Поиск подходящих контентмейкеров</li>
                  <li>Создание рекламных кампаний</li>
                  <li>Аналитика эффективности</li>
                  <li>Управление бюджетом</li>
                </ul>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🎬</div>
                <h3>Для контентмейкеров</h3>
                <ul>
                  <li>Прием заказов на рекламу</li>
                  <li>Управление своими площадками</li>
                  <li>Статистика по проектам</li>
                  <li>Вывод заработка</li>
                </ul>
              </div>

              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3>Общие преимущества</h3>
                <ul>
                  <li>Безопасные сделки</li>
                  <li>Прозрачные условия</li>
                  <li>Техническая поддержка</li>
                  <li>Простой интерфейс</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="stats-section">
            <h2>BrandConnect в цифрах</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">активных пользователей</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">1,200+</div>
                <div className="stat-label">успешных кампаний</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">5M+</div>
                <div className="stat-label">общий охват</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">98%</div>
                <div className="stat-label">довольных клиентов</div>
              </div>
            </div>
          </section>

          <section className="cta-section">
            <h2>Готовы начать?</h2>
            <p>Присоединяйтесь к платформе уже сегодня и находите идеальных партнеров для вашего бизнеса</p>
            
            {!isAuthenticated ? (
              <div className="cta-actions">
                <Link to="/register" className="cta-button large">
                  Зарегистрироваться бесплатно
                </Link>
                <div className="cta-link-wrapper">
                  <span>Уже есть аккаунт? </span>
                  <Link to="/login" className="cta-link">
                    Перейти ко входу →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="cta-actions">
                <Link to="/dashboard" className="cta-button large">
                  Перейти в личный кабинет
                </Link>
                <div className="cta-link-wrapper">
                  <Link to="/settings" className="cta-link">
                    Настроить профиль →
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default About;