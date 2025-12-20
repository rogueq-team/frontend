import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OrdersList from './Applications';
import './Dashboard.css';

function Dashboard() {
  const { user, logout, getCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false); // ← ДОБАВИТЬ

  // 🔄 ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ ПРИ ЗАХОДЕ В КАБИНЕТ
  useEffect(() => {
    // ✅ ПРЕДОТВРАЩАЕМ ПОВТОРНУЮ ЗАГРУЗКУ
    if (dataLoaded) return;

    const loadUserData = async () => {
      console.log('🔄 Dashboard: Загружаем актуальные данные пользователя...');
      setIsLoading(true);
      
      try {
        const result = await getCurrentUser();
        
        if (result.success) {
          console.log('✅ Dashboard: Данные пользователя обновлены:', result.user);
          setDataLoaded(true); // ← ПОМЕЧАЕМ ЧТО ДАННЫЕ ЗАГРУЖЕНЫ
        } else {
          console.error('❌ Dashboard: Ошибка загрузки данных:', result.error);
        }
      } catch (error) {
        console.error('❌ Dashboard: Исключение при загрузке:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [getCurrentUser, dataLoaded]); // ← ДОБАВИТЬ dataLoaded в зависимости

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 🔄 ТЕСТОВАЯ КНОПКА ДЛЯ РУЧНОЙ ПРОВЕРКИ
  const handleTestGetCurrentUser = async () => {
    console.log('🧪 Ручная проверка getCurrentUser...');
    const result = await getCurrentUser();
    console.log('🧪 Результат ручной проверки:', result);
    
    if (result.success) {
      alert('✅ Данные успешно обновлены!\nПроверьте консоль для деталей');
    } else {
      alert(`❌ Ошибка: ${result.error}`);
    }
  };

  if (!user || isLoading) {
    return (
      <div className="loading-container">
        <div>🔄 Загрузка данных пользователя...</div>
        <button 
          className="test-btn"
          onClick={handleTestGetCurrentUser}
          style={{marginTop: '20px'}}
        >
          🧪 Тест: Проверить загрузку данных
        </button>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        return <OrdersList />;
      case 'analytics':
        return (
          <div className="tab-content-placeholder">
            <div className="placeholder-icon">📈</div>
            <h2>Аналитика</h2>
            <p>Раздел аналитики находится в разработке</p>
            <p>Скоро здесь появятся графики и статистика по вашей активности</p>
            
            {/* 🔄 ТЕСТОВАЯ КНОПКА В РАЗДЕЛЕ АНАЛИТИКИ */}
            <button 
              className="test-btn"
              onClick={handleTestGetCurrentUser}
              style={{marginTop: '20px'}}
            >
              🧪 Проверить загрузку данных
            </button>
          </div>
        );
      case 'overview':
      default:
        return (
          <>
            {/* 🔄 ТЕСТОВАЯ КНОПКА В ОБЗОРЕ */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2>Обзор профиля</h2>
              <button 
                className="test-btn"
                onClick={handleTestGetCurrentUser}
              >
                🧪 Обновить данные
              </button>
            </div>

            {/* Существующий контент дашборда */}
            <div className="user-info-card">
              <h3>Профиль</h3>
              <div className="user-details">
                <div className="user-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Аватар" className="avatar-image" />
                  ) : (
                    <span>{user.avatar}</span>
                  )}
                </div>
                <div className="user-data">
                  <p><strong>Имя:</strong> {user.name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Тип аккаунта:</strong> {user.userType === 'advertiser' ? 'Рекламодатель' : 'Контентмейкер'}</p>
                  <p><strong>Дата регистрации:</strong> {user.  rationDate}</p>
                  <p><strong>Баланс:</strong> {user.balance.toLocaleString()} ₽</p>
                  {user.bio && <p><strong>О себе:</strong> {user.bio}</p>}
                  {user.isVerified && <p><strong>✅ Верифицирован</strong></p>}
                </div>
              </div>
            </div>

            <div className="stats-cards">
              <div className="stat-card">
                <h3>Баланс</h3>
                <p className="stat-value">{user.balance.toLocaleString()} ₽</p>
                <button 
                  className="primary-btn"
                  onClick={() => navigate('/add-funds')}
                >
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
            
            <div className="quick-actions">
              <h2>Быстрые действия</h2>
              <div className="action-buttons">
                <button className="action-btn" onClick={() => navigate('/settings')}>
                  ⚙️ Настройки
                </button>
                <button className="action-btn" onClick={() => setActiveTab('analytics')}>
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
          </>
        );
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Личный кабинет {user.userType === 'advertiser' ? 'рекламодателя' : 'контентмейкера'}</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Выйти
        </button>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Обзор
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 Мои заказы
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Аналитика
        </button>
      </div>

      <div className="dashboard-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default Dashboard;