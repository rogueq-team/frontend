import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AspNetApiService from '../services/aspnetApi';
import ApplicationDetailsModal from './ApplicationDetailsModal';
import './Applications.css';

function Applications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('my');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Для перезагрузки заявок

  // Функция для перезагрузки заявок
  const refreshApplications = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleViewDetails = (application) => {
    console.log('🔍 Открываем детали заявки:', application);
    setSelectedApplication(application);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedApplication(null);
  };

  const handleApplicationUpdate = (updatedApplication) => {
    setApplications(prev => prev.map(app => 
      app.applicationId === updatedApplication.applicationId 
        ? updatedApplication 
        : app
    ));
  };

  const handleApplicationDelete = (applicationId) => {
    setApplications(prev => prev.filter(app => 
      app.applicationId !== applicationId
    ));
    setShowModal(false);
  };

  // Загрузка заявок
  useEffect(() => {
    const loadApplications = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('👤 Текущий пользователь:', user?.userType);
        
        let data;
        
        if (user?.userType === 'advertiser' || user?.userType === 'both') {
          // Загружаем свои заявки для рекламодателей
          console.log('📋 Загружаем заявки пользователя...');
          data = await AspNetApiService.getUserApplications();
          setViewMode('my');
        } else {
          // Загружаем все заявки для контент-мейкеров
          console.log('📋 Загружаем все заявки...');
          data = await AspNetApiService.getAllApplications();
          setViewMode('available');
        }
        
        // ✅ Логирование после получения данных
        console.log('✅ Получены данные:', data);
        console.log('✅ Первая заявка в массиве:', data?.[0]);
        console.log('✅ Все поля заявки:', data?.[0] ? Object.keys(data[0]) : 'нет данных');
        
        setApplications(Array.isArray(data) ? data : []);
        
      } catch (err) {
        console.error('Ошибка загрузки заявок:', err);
        setError('Не удалось загрузить заявки');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadApplications();
    } else {
      setIsLoading(false);
    }
  }, [user, refreshTrigger]); // Добавляем refreshTrigger в зависимости

  // Фильтрация заявок
  const filteredApplications = applications.filter(app => {
    if (activeFilter === 'all') return true;
    
    // Приводим оба значения к строкам для сравнения
    return app.status.toString() === activeFilter;
  });

  // Создание новой заявки
  const handleCreate = () => {
    navigate('/applications/create');
  };

  // Редактирование заявки
  const handleEdit = (id) => {
    navigate(`/applications/${id}/edit`);
  };

  // Удаление заявки
  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту заявку?')) {
      return;
    }

    try {
      await AspNetApiService.deleteApplication(id);
      setApplications(prev => prev.filter(app => app.applicationId !== id));
      alert('Заявка успешно удалена');
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Не удалось удалить заявку');
    }
  };

  // Отклик на заявку (для контент-мейкеров)
  const handleApply = (application) => { // Изменяем параметр с applicationId на application
    console.log('📝 Открываем заявку для отклика:', application);
    setSelectedApplication(application);
    setShowModal(true);
  };

  // Получение информации о статусе
  const getStatusInfo = (statusCode) => {
    const code = typeof statusCode === 'string' ? parseInt(statusCode) : statusCode;
    const statuses = {
      0: { label: 'Новая', color: '#28a745', icon: '🆕' },
      1: { label: 'В работе', color: '#007bff', icon: '⚙️' },
      2: { label: 'Завершена', color: '#6c757d', icon: '✅' },
      3: { label: 'Отменена', color: '#dc3545', icon: '❌' }
    };
    return statuses[code] || statuses[1]; // Используем code вместо statusCode
  };

  // Для рекламодателей - статистика по заявкам
  const getAdvertiserStats = () => {
    const total = applications.length;
    const active = applications.filter(app => app.status === 0).length;
    const inProgress = applications.filter(app => app.status === 1).length;
    const completed = applications.filter(app => app.status === 2).length;
    const totalBudget = applications.reduce((sum, app) => sum + (app.cost || 0), 0);
    
    return { total, active, inProgress, completed, totalBudget };
  };

  const handleOpenChat = async (application) => {
  setIsLoading(true);
  
  try {
    console.log('💬 Получаем информацию о сделке для заявки:', application.applicationId);
    
    // 1. Получаем информацию о сделке по ID заявки
    const dealInfo = await AspNetApiService.getDealByApplicationId(application.applicationId);
    
    console.log('✅ Информация о сделке:', dealInfo);
    
    // Обработка разных форматов ответа
    let dealId = null;
    
    if (Array.isArray(dealInfo) && dealInfo.length > 0) {
      // Если ответ - массив, берем первый элемент
      dealId = dealInfo[0].id || dealInfo[0].dealId;
    } else if (dealInfo && (dealInfo.id || dealInfo.dealId)) {
      // Если ответ - объект
      dealId = dealInfo.id || dealInfo.dealId;
    }
    
    if (dealId) {
      // 2. Если сделка найдена - переходим в чат
      navigate(`/deal/${dealId}`);
      return;
    }
    
    // 3. Если сделка не найдена, но заявка в работе
    if (application.status === 1) {
      // Можно создать сделку автоматически или показать сообщение
      const shouldCreateDeal = window.confirm(
        'Сделка для этой заявки не найдена. Создать новую сделку?'
      );
      
      if (shouldCreateDeal) {
        // Создаем сделку с пустым описанием
        const newDeal = await AspNetApiService.createDeal(
          application.applicationId,
          `Сделка по заявке: ${application.description?.substring(0, 50)}...`
        );
        
        console.log('✅ Результат создания сделки:', newDeal);
        
        // Получаем ID созданной сделки
        const newDealId = newDeal.id || newDeal.dealId;
        
        if (newDealId) {
          navigate(`/deal/${newDealId}`);
          return;
        } else {
          console.error('❌ Сделка создана, но ID не получен:', newDeal);
          throw new Error('Не удалось получить ID созданной сделки');
        }
      }
    } else {
      alert('❌ Для этой заявки еще нет сделки. Заявка должна быть в статусе "В работе".');
    }
    
  } catch (error) {
    console.error('❌ Ошибка открытия чата:', error);
    
    let errorMessage = 'Не удалось открыть чат';
    
    if (error.message.includes('не найдена') || error.message.includes('404')) {
      errorMessage = '❌ Сделка для этой заявки не найдена';
    } else if (error.message.includes('нет прав')) {
      errorMessage = '❌ У вас нет доступа к этой сделке';
    } else if (error.message.includes('Не удалось получить ID')) {
      errorMessage = '❌ Сделка создана, но не удалось получить её ID';
    }
    
    alert(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  // Для контент-мейкеров - статистика по доступных заявках
  const getContentMakerStats = () => {
    const total = applications.length;
    const newApps = applications.filter(app => app.status === 0).length;
    const averageBudget = total > 0 
      ? applications.reduce((sum, app) => sum + (app.cost || 0), 0) / total 
      : 0;
    
    return { total, new: newApps, averageBudget };
  };

  if (!user) {
    return (
      <div className="applications-page">
        <div className="auth-required">
          <h2>Требуется авторизация</h2>
          <p>Для просмотра заявок необходимо войти в систему</p>
        </div>
      </div>
    );
  }

  const isAdvertiser = user?.userType === 'advertiser' || user?.userType === 'both';
  const isContentMaker = user?.userType === 'contentmaker' || user?.userType === 'both';
  const stats = isAdvertiser ? getAdvertiserStats() : getContentMakerStats();

  return (
    <div className="applications-page">
      <div className="applications-container">
        {/* Заголовок */}
        <div className="applications-header">
          <h1>
            {isAdvertiser ? 'Мои заявки' : 'Доступные заявки'}
          </h1>
          
          {isAdvertiser && (
            <button 
              className="create-application-btn"
              onClick={handleCreate}
            >
              + Создать заявку
            </button>
          )}
        </div>

        {/* Статистика */}
        <div className="applications-stats">
          {isAdvertiser ? (
            <>
              <div className="stat-card">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Всего заявок</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.active}</div>
                <div className="stat-label">Новые</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.inProgress}</div>
                <div className="stat-label">В работе</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.completed}</div>
                <div className="stat-label">Завершены</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {stats.totalBudget.toLocaleString()} ₽
                </div>
                <div className="stat-label">Общий бюджет</div>
              </div>
            </>
          ) : (
            <>
              <div className="stat-card">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Доступных заявок</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.new}</div>
                <div className="stat-label">Новых</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {Math.round(stats.averageBudget).toLocaleString()} ₽
                </div>
                <div className="stat-label">Средний бюджет</div>
              </div>
            </>
          )}
        </div>

        {/* Фильтры */}
        <div className="applications-filters">
          <button 
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Все
          </button>
          <button 
            className={`filter-btn ${activeFilter === '0' ? 'active' : ''}`}
            onClick={() => setActiveFilter('0')}
          >
            Новые
          </button>
          <button 
            className={`filter-btn ${activeFilter === '1' ? 'active' : ''}`}
            onClick={() => setActiveFilter('1')}
          >
            В работе
          </button>
          <button 
            className={`filter-btn ${activeFilter === '2' ? 'active' : ''}`}
            onClick={() => setActiveFilter('2')}
          >
            Завершенные
          </button>
        </div>

        {/* Состояние загрузки/ошибки */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Загрузка заявок...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>❌ {error}</p>
          </div>
        ) : (
          /* Список заявок */
          <div className="applications-list">
            {filteredApplications.length === 0 ? (
              <div className="no-applications">
                <div className="no-applications-icon">📋</div>
                <h3>Заявок не найдено</h3>
                <p>
                  {activeFilter !== 'all' 
                    ? `Нет заявок со статусом "${getStatusInfo(activeFilter).label}"` 
                    : isAdvertiser 
                      ? 'У вас еще нет заявок' 
                      : 'На данный момент нет доступных заявок'
                  }
                </p>
                {isAdvertiser && activeFilter === 'all' && (
                  <button 
                    className="create-application-btn"
                    onClick={handleCreate}
                  >
                    Создать первую заявку
                  </button>
                )}
              </div>
            ) : (
              filteredApplications.map(application => (
                <div key={application.applicationId} className="application-card">
                  <div className="application-header">
                    <div className="application-title-section">
                      <h3>
                        {application.description 
                          ? (application.description.length > 50 
                            ? `${application.description.substring(0, 50)}...` 
                            : application.description)
                          : `Заявка #${application.applicationId.substring(0, 8)}...`}
                      </h3>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusInfo(application.status).color }}
                      >
                        {getStatusInfo(application.status).icon} {getStatusInfo(application.status).label}
                      </span>
                    </div>
                    <div className="application-price">
                      <span className="price">
                        {application.cost?.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>

                  <div className="application-body">
                    <p className="application-description">
                      {application.description || 'Нет описания'}
                    </p>
                    
                    <div className="application-meta">
                      <span className="meta-item">
                        📅 ID: {application.applicationId.substring(0, 8)}...
                      </span>
                      {application.userId && (
                        <span className="meta-item">
                          👤 User: {application.userId.substring(0, 8)}...
                        </span>
                      )}
                      {application.createdAt && (
                        <span className="meta-item">
                          📅 Создано: {new Date(application.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="application-actions">
                    {isAdvertiser ? (
                      // Действия для создателя заявки
                      <>
                        {application.status === 0 && (
                            <button 
                              className="action-btn danger"
                              onClick={() => handleDelete(application.applicationId)}
                            >
                              🗑️ Удалить
                            </button>
                        )}
                        {application.status === 1 && (
                          <button 
                            className="action-btn chat-btn"
                            onClick={() => handleOpenChat(application)}
                            disabled={isLoading}
                          >
                            {isLoading ? '⏳ Загрузка...' : '💬 Чат'}
                          </button>
                        )}
                        <button 
                          className="action-btn outline"
                          onClick={() => handleViewDetails(application)}
                        >
                          👁️ Подробнее
                        </button>
                      </>
                    ) : (
                      // Действия для контент-мейкеров
                      <>
                        {application.status === 0 && (
                          <button 
                            className="action-btn primary"
                            onClick={() => handleApply(application)}
                          >
                            📝 Откликнуться
                          </button>
                        )}

                        {application.status === 1 && (
                          <button 
                            className="action-btn chat-btn"
                            onClick={() => handleOpenChat(application)}
                            disabled={isLoading}
                          >
                            {isLoading ? '⏳ Загрузка...' : '💬 Чат'}
                          </button>
                        )}

                        <button 
                          className="action-btn outline"
                          onClick={() => handleViewDetails(application)}
                        >
                          👁️ Подробнее
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Модальное окно с деталями заявки */}
      {showModal && selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          onClose={handleCloseModal}
          onUpdate={handleApplicationUpdate}
          onDelete={handleApplicationDelete}
          onRefresh={refreshApplications} // Теперь эта функция определена
        />
      )}
    </div>
  );
}

export default Applications;