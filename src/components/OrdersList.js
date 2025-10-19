import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './OrdersList.css';

function OrdersList() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');

  // Mock данные заказов (разные для рекламодателей и контентмейкеров)
  const mockOrders = {
    advertiser: [
      {
        id: 1,
        title: 'Рекламная кампания "Новый продукт"',
        contentMaker: 'Иван Блогер',
        platform: 'YouTube',
        budget: 25000,
        status: 'active',
        deadline: '2024-02-15',
        progress: 75,
        type: 'video'
      },
      {
        id: 2,
        title: 'Продвижение в Instagram',
        contentMaker: 'Мария Креатив',
        platform: 'Instagram',
        budget: 15000,
        status: 'pending',
        deadline: '2024-02-20',
        progress: 0,
        type: 'post'
      },
      {
        id: 3,
        title: 'Обзор продукта в Telegram',
        contentMaker: 'ТехноБлог',
        platform: 'Telegram',
        budget: 10000,
        status: 'active',
        deadline: '2024-02-10',
        progress: 100,
        type: 'article'
      }
    ],
    contentmaker: [
      {
        id: 1,
        title: 'Создание обзора для TechCompany',
        advertiser: 'ООО "ТехноКомпания"',
        platform: 'YouTube',
        budget: 30000,
        status: 'active',
        deadline: '2024-02-12',
        progress: 60,
        type: 'video'
      },
      {
        id: 2,
        title: 'Рекламный пост в Instagram',
        advertiser: 'Бренд одежды "Style"',
        platform: 'Instagram',
        budget: 20000,
        status: 'review',
        deadline: '2024-02-18',
        progress: 100,
        type: 'post'
      },
      {
        id: 3,
        title: 'Интеграция в Stories',
        advertiser: 'Кофейня "Aroma"',
        platform: 'Instagram',
        budget: 8000,
        status: 'active',
        deadline: '2024-02-08',
        progress: 25,
        type: 'story'
      }
    ]
  };

  const orders = mockOrders[user?.userType] || [];

  const filteredOrders = activeFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeFilter);

  const getStatusInfo = (status) => {
    const statuses = {
      active: { label: 'Активен', color: '#28a745', icon: '🟢' },
      pending: { label: 'Ожидание', color: '#ffc107', icon: '🟡' },
      review: { label: 'На проверке', color: '#17a2b8', icon: '🔵' },
      completed: { label: 'Завершен', color: '#6c757d', icon: '⚫' }
    };
    return statuses[status] || statuses.pending;
  };

  const getTypeIcon = (type) => {
    const icons = {
      video: '🎬',
      post: '📝',
      story: '📱',
      article: '📄',
      banner: '🖼️'
    };
    return icons[type] || '📋';
  };

  const handleAction = (orderId, action) => {
    console.log(`Действие: ${action} для заказа ${orderId}`);
    // Здесь будет логика действий с заказами
  };

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>Мои заказы</h1>
        <div className="orders-filters">
          <button 
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Все
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'active' ? 'active' : ''}`}
            onClick={() => setActiveFilter('active')}
          >
            Активные
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveFilter('pending')}
          >
            Ожидание
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'review' ? 'active' : ''}`}
            onClick={() => setActiveFilter('review')}
          >
            На проверке
          </button>
        </div>
      </div>

      <div className="orders-stats">
        <div className="stat-card">
          <div className="stat-number">{orders.length}</div>
          <div className="stat-label">Всего заказов</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {orders.filter(o => o.status === 'active').length}
          </div>
          <div className="stat-label">Активных</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {orders.filter(o => o.status === 'completed').length}
          </div>
          <div className="stat-label">Завершено</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {orders.reduce((sum, order) => sum + order.budget, 0).toLocaleString()} ₽
          </div>
          <div className="stat-label">Общий бюджет</div>
        </div>
      </div>

      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-icon">📋</div>
            <h3>Заказов не найдено</h3>
            <p>Здесь появятся ваши активные заказы и проекты</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-type">
                  <span className="type-icon">{getTypeIcon(order.type)}</span>
                  <span className="order-title">{order.title}</span>
                </div>
                <div className="order-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusInfo(order.status).color }}
                  >
                    {getStatusInfo(order.status).icon} {getStatusInfo(order.status).label}
                  </span>
                </div>
              </div>

              <div className="order-details">
                <div className="detail-item">
                  <span className="detail-label">
                    {user?.userType === 'advertiser' ? 'Контентмейкер:' : 'Рекламодатель:'}
                  </span>
                  <span className="detail-value">
                    {user?.userType === 'advertiser' ? order.contentMaker : order.advertiser}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Площадка:</span>
                  <span className="detail-value">{order.platform}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Бюджет:</span>
                  <span className="detail-value budget">{order.budget.toLocaleString()} ₽</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Дедлайн:</span>
                  <span className="detail-value deadline">{order.deadline}</span>
                </div>
              </div>

              {order.progress > 0 && (
                <div className="progress-section">
                  <div className="progress-header">
                    <span>Прогресс выполнения:</span>
                    <span className="progress-percent">{order.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${order.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="order-actions">
                {order.status === 'active' && (
                  <>
                    <button 
                      className="action-btn primary"
                      onClick={() => handleAction(order.id, 'view')}
                    >
                      👁️ Посмотреть
                    </button>
                    <button 
                      className="action-btn secondary"
                      onClick={() => handleAction(order.id, 'message')}
                    >
                      💬 Написать
                    </button>
                  </>
                )}
                {order.status === 'pending' && (
                  <button 
                    className="action-btn primary"
                    onClick={() => handleAction(order.id, 'accept')}
                  >
                    ✅ Принять заказ
                  </button>
                )}
                {order.status === 'review' && (
                  <button 
                    className="action-btn primary"
                    onClick={() => handleAction(order.id, 'review')}
                  >
                    📋 Проверить
                  </button>
                )}
                <button 
                  className="action-btn outline"
                  onClick={() => handleAction(order.id, 'details')}
                >
                  ℹ️ Подробнее
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default OrdersList;