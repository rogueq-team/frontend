import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Личный кабинет {user.userType === 'advertiser' ? 'рекламодателя' : 'контентмейкера'}</h1>
      </div>

      <div className="dashboard-content">
        {/* Блок информации о пользователе */}
        <div className="user-info-card">
          <h2>Профиль</h2>
          <div className="user-details">
            <div className="user-avatar">
              {user.avatar ? (<img src={user.avatar} alt="Аватар" className="avatar-image" />) : (<span>{user.avatar}</span>)}
            </div>
            <div className="user-data">
              <p><strong>Имя:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Тип аккаунта:</strong> {user.userType === 'advertiser' ? 'Рекламодатель' : 'Контентмейкер'}</p>
              <p><strong>Дата регистрации:</strong> {user.registrationDate}</p>
            </div>
          </div>
        </div>

        {/* Блок статистики - разный для разных типов пользователей */}
        <div className="stats-cards">
          <div className="stat-card">
            <h3>Баланс</h3>
            <p className="stat-value">{user.balance.toLocaleString()} ₽</p>
            <button className="primary-btn">
              {user.userType === 'advertiser' ? 'Пополнить' : 'Вывести'}
            </button>
          </div>

          <div className="stat-card">
            <h3>{user.userType === 'advertiser' ? 'Активные кампании' : 'Активные проекты'}</h3>
            <p className="stat-value">{user.campaigns}</p>
            <button className="primary-btn">
              {user.userType === 'advertiser' ? 'Создать кампанию' : 'Новый проект'}
            </button>
          </div>

          <div className="stat-card">
            <h3>Статистика</h3>
            <p className="stat-value">{user.statistics.views.toLocaleString()}</p>
            <span>просмотров</span>
          </div>
        </div>

        {/* Блок быстрых действий - ДОБАВЛЯЕМ ЕГО */}
        <div className="quick-actions">
          <h2>Быстрые действия</h2>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => navigate('/settings')}>
              ⚙️ Настройки
            </button>
            <button className="action-btn">
              📊 Аналитика
            </button>
            <button className="action-btn">
              💬 Поддержка
            </button>
            {user.userType === 'advertiser' ? (
              <button className="action-btn">
                🎯 Создать кампанию
              </button>
            ) : (
              <button className="action-btn">
                📹 Мои площадки
              </button>
            )}
          </div>
        </div>

        {/* Дополнительные блоки в зависимости от типа пользователя */}
        {user.userType === 'advertiser' && (
          <div className="advertiser-specific">
            <h2>Мои рекламные кампании</h2>
            <div className="campaigns-list">
              <div className="campaign-item">Кампания "Новый продукт" - Активна</div>
              <div className="campaign-item">Кампания "Распродажа" - Завершена</div>
              <div className="campaign-item">Кампания "Брендинг" - На модерации</div>
            </div>
          </div>
        )}

        {user.userType === 'contentmaker' && (
          <div className="contentmaker-specific">
            <h2>Мои площадки</h2>
            <div className="platforms-list">
              <div className="platform-item">YouTube - 45K подписчиков</div>
              <div className="platform-item">Instagram - 23K подписчиков</div>
              <div className="platform-item">Telegram - 15K подписчиков</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;