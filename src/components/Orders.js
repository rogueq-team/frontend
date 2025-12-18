// components/Orders.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Orders.css';

function Orders() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Временные данные для демонстрации
  const mockOrders = [
    {
      id: 1,
      title: 'Реклама на YouTube канале',
      description: 'Нужно разместить рекламу в видео на канале про технологии',
      budget: 50000,
      deadline: '2024-12-30',
      status: 'open',
      client: 'TechCorp',
      category: 'Технологии',
      type: user?.userType === 'contentmaker' ? 'advertiser' : 'contentmaker'
    },
    {
      id: 2,
      title: 'Обзор продукта в Instagram',
      description: 'Требуется обзор нового косметического продукта',
      budget: 30000,
      deadline: '2024-12-25',
      status: 'in_progress',
      client: 'BeautyBrand',
      category: 'Красота',
      type: user?.userType === 'contentmaker' ? 'advertiser' : 'contentmaker'
    },
    {
      id: 3,
      title: 'Создание TikTok клипов',
      description: 'Нужны короткие клипы для рекламы мобильной игры',
      budget: 40000,
      deadline: '2024-12-20',
      status: 'completed',
      client: 'GameStudio',
      category: 'Игры',
      type: user?.userType === 'contentmaker' ? 'advertiser' : 'contentmaker'
    }
  ];

  const mockApplications = [
    {
      id: 1,
      orderId: 1,
      applicant: user?.userType === 'contentmaker' ? 'Иван Иванов' : 'ТехноБлогер',
      message: 'Готов выполнить заказ, имею опыт в технологической тематике',
      price: 45000,
      status: 'pending',
      createdAt: '2024-12-10'
    },
    {
      id: 2,
      orderId: 2,
      applicant: user?.userType === 'contentmaker' ? 'Мария Петрова' : 'BeautyGuru',
      message: 'Специализируюсь на beauty контенте, 100k подписчиков',
      price: 28000,
      status: 'accepted',
      createdAt: '2024-12-09'
    }
  ];

  useEffect(() => {
    // Здесь будет загрузка реальных данных с API
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Временное использование мок данных
        setOrders(mockOrders);
        setApplications(mockApplications);
        
        // TODO: Реальные API запросы
        // if (user?.userType === 'contentmaker') {
        //   const ordersData = await AspNetApiService.getAdvertiserOrders();
        //   setOrders(ordersData);
        // } else {
        //   const ordersData = await AspNetApiService.getContentMakerOrders();
        //   setOrders(ordersData);
        // }
        
      } catch (err) {
        console.error('Ошибка загрузки заказов:', err);
        setError('Не удалось загрузить заказы');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Фильтрация заказов по статусу
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'open') return order.status === 'open';
    if (activeTab === 'in_progress') return order.status === 'in_progress';
    if (activeTab === 'completed') return order.status === 'completed';
    return true;
  });

  // Получение заявок для конкретного заказа
  const getOrderApplications = (orderId) => {
    return applications.filter(app => app.orderId === orderId);
  };

  // Обработчик подачи заявки
  const handleApply = (orderId) => {
    const price = prompt('Укажите вашу цену за выполнение заказа:');
    if (price) {
      alert(`Заявка на заказ #${orderId} подана с ценой ${price} руб.`);
      // TODO: Отправка на бекенд
    }
  };

  // Обработчик принятия заявки
  const handleAcceptApplication = (applicationId) => {
    if (window.confirm('Вы уверены, что хотите принять эту заявку?')) {
      alert(`Заявка #${applicationId} принята!`);
      // TODO: Отправка на бекенд
    }
  };

  // Обработчик создания нового заказа
  const handleCreateOrder = () => {
    // TODO: Модальное окно или страница создания заказа
    alert('Создание нового заказа');
  };

  // Определяем заголовок страницы
  const pageTitle = user?.userType === 'contentmaker' 
    ? 'Заявки от рекламодателей' 
    : 'Заявки от контент-мейкеров';

  // Определяем тип контрагента
  const counterpartType = user?.userType === 'contentmaker' 
    ? 'Рекламодатель' 
    : 'Контент-мейкер';

  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <h1>{pageTitle}</h1>
          
          {user?.userType === 'advertiser' && (
            <button 
              className="create-order-btn"
              onClick={handleCreateOrder}
            >
              + Создать заказ
            </button>
          )}
        </div>

        <div className="orders-stats">
          <div className="stat-card">
            <h3>{orders.length}</h3>
            <p>Всего заказов</p>
          </div>
          <div className="stat-card">
            <h3>{orders.filter(o => o.status === 'open').length}</h3>
            <p>Открытых</p>
          </div>
          <div className="stat-card">
            <h3>{orders.filter(o => o.status === 'in_progress').length}</h3>
            <p>В работе</p>
          </div>
          <div className="stat-card">
            <h3>{orders.filter(o => o.status === 'completed').length}</h3>
            <p>Завершенных</p>
          </div>
        </div>

        <div className="orders-tabs">
          <button 
            className={`status-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Все
          </button>
          <button 
            className={`status-tab ${activeTab === 'open' ? 'active' : ''}`}
            onClick={() => setActiveTab('open')}
          >
            Открытые
          </button>
          <button 
            className={`status-tab ${activeTab === 'in_progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('in_progress')}
          >
            В работе
          </button>
          <button 
            className={`status-tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Завершенные
          </button>
        </div>

        {isLoading ? (
          <div className="loading">Загрузка заказов...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="orders-list">
            {filteredOrders.length === 0 ? (
              <div className="no-orders">
                <p>Нет доступных заказов</p>
                {user?.userType === 'advertiser' && (
                  <button 
                    className="create-order-btn"
                    onClick={handleCreateOrder}
                  >
                    Создать первый заказ
                  </button>
                )}
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-title-section">
                      <h3>{order.title}</h3>
                      <span className={`status-badge ${order.status}`}>
                        {order.status === 'open' && 'Открыт'}
                        {order.status === 'in_progress' && 'В работе'}
                        {order.status === 'completed' && 'Завершен'}
                      </span>
                    </div>
                    <div className="order-price">
                      <span className="price">{order.budget.toLocaleString()} ₽</span>
                    </div>
                  </div>
                  
                  <div className="order-body">
                    <p className="order-description">{order.description}</p>
                    
                    <div className="order-details">
                      <div className="detail">
                        <span className="detail-label">{counterpartType}:</span>
                        <span className="detail-value">{order.client}</span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Категория:</span>
                        <span className="detail-value">{order.category}</span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Дедлайн:</span>
                        <span className="detail-value">{order.deadline}</span>
                      </div>
                    </div>
                    
                    {/* Для контент-мейкеров показываем кнопку подачи заявки */}
                    {user?.userType === 'contentmaker' && order.status === 'open' && (
                      <button 
                        className="apply-btn"
                        onClick={() => handleApply(order.id)}
                      >
                        Подать заявку
                      </button>
                    )}
                    
                    {/* Для рекламодателей показываем заявки */}
                    {user?.userType === 'advertiser' && (
                      <div className="applications-section">
                        <h4>Заявки ({getOrderApplications(order.id).length})</h4>
                        {getOrderApplications(order.id).length === 0 ? (
                          <p className="no-applications">Заявок пока нет</p>
                        ) : (
                          getOrderApplications(order.id).map(app => (
                            <div key={app.id} className="application-card">
                              <div className="application-header">
                                <div className="applicant-info">
                                  <strong>{app.applicant}</strong>
                                  <span>Предложил: {app.price.toLocaleString()} ₽</span>
                                </div>
                                <span className={`application-status ${app.status}`}>
                                  {app.status === 'pending' && 'На рассмотрении'}
                                  {app.status === 'accepted' && 'Принята'}
                                  {app.status === 'rejected' && 'Отклонена'}
                                </span>
                              </div>
                              <p className="application-message">{app.message}</p>
                              <div className="application-footer">
                                <span className="application-date">
                                  Подана: {app.createdAt}
                                </span>
                                {app.status === 'pending' && (
                                  <button 
                                    className="accept-btn"
                                    onClick={() => handleAcceptApplication(app.id)}
                                  >
                                    Принять
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;