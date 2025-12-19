// components/ApplicationDetailsModal.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AspNetApiService from '../services/aspnetApi';
import './ApplicationDetailsModal.css';
import ConfirmModal from './ConfirmModal';

function ApplicationDetailsModal({ application, onClose, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    description: application?.description || '',
    cost: application?.cost || 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = user?.userId === application?.userId;

  useEffect(() => {
    if (application) {
      setIsEditing(false);
      setEditData({
        description: application?.description || '',
        cost: application?.cost || 0
      });
      setMessage({ type: '', text: '' });
    }
  }, [application]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditData({
        description: application?.description || '',
        cost: application?.cost || 0
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: name === 'cost' ? parseFloat(value) || 0 : value
    }));
  };


  const handleQuickStatusChange = async (newStatus) => {
    // Используем ваш ConfirmModal вместо window.confirm
    setQuickStatusChangeData({
      show: true,
      newStatus: newStatus,
      statusInfo: getStatusInfo(newStatus)
    });
  };

  // Добавьте состояние для модалки подтверждения
  const [quickStatusChangeData, setQuickStatusChangeData] = useState({
    show: false,
    newStatus: null,
    statusInfo: null
  });

  // Функция подтверждения изменения статуса
  const confirmQuickStatusChange = async () => {
    const { newStatus } = quickStatusChangeData;
    
    setIsLoading(true);
    setQuickStatusChangeData({ show: false, newStatus: null, statusInfo: null });

    try {
      console.log('🔄 Меняем статус на:', newStatus, getStatusInfo(newStatus).label);
      
      // 🔥 ВАЖНО: Вызываем API для обновления на бекенде
      const result = await AspNetApiService.updateApplication(
        application.applicationId,
        {
          description: application.description,  // Сохраняем текущее описание
          cost: application.cost,                // Сохраняем текущую стоимость
          status: newStatus                      // Новый статус
        }
      );

      console.log('✅ Результат изменения статуса:', result);
      
      if (result && (result.success || result.applicationId)) {
        // Обновляем заявку в родительском компоненте
        if (onUpdate) {
          onUpdate({
            ...application,
            status: newStatus
          });
        }

        // Показываем сообщение об успехе
        setMessage({ 
          type: 'success', 
          text: `✅ Статус заявки изменен на "${getStatusInfo(newStatus).label}"` 
        });

        // Автоматически скрываем сообщение через 3 секунды
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);

      } else {
        throw new Error('Не удалось изменить статус');
      }

    } catch (error) {
      console.error('❌ Ошибка изменения статуса:', error);
      
      let errorMessage = 'Произошла ошибка при изменении статуса';
      
      if (error.message.includes('не найдена')) {
        errorMessage = '❌ Заявка не найдена';
      } else if (error.message.includes('нет прав')) {
        errorMessage = '❌ У вас нет прав для изменения статуса';
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };



  
const handleSave = async () => {  
  if (!editData.description.trim()) {
    setMessage({ type: 'error', text: '❌ Заполните описание' });
    return;
  }

  if (editData.cost <= 0) {
    setMessage({ type: 'error', text: '❌ Сумма должна быть положительной' });
    return;
  }

  setIsLoading(true);
  setMessage({ type: '', text: '' });

  try {
    console.log('🔄 Сохраняем изменения:', {
      applicationId: application.applicationId,
      data: editData
    });
    
    const result = await AspNetApiService.updateApplication(
      application.applicationId,
      {
        description: editData.description,
        cost: editData.cost,
        status: application.status
      }
    );

    console.log('✅ Результат обновления:', result);
    
    // Проверяем разные форматы ответа
    if (result && (result.success || result.applicationId || result.message)) {
      setMessage({ 
        type: 'success', 
        text: result.message || '✅ Заявка успешно обновлена!' 
      });

      // Обновляем данные в родительском компоненте
      if (onUpdate) {
        onUpdate({
          ...application,
          description: editData.description,
          cost: editData.cost,
        });
      }

      setTimeout(() => {
        setIsEditing(false);
        setMessage({ type: '', text: '' });
        onClose();
      }, 2000);
    } else {
      throw new Error('Неизвестный формат ответа');
    }

  } catch (error) {
    console.error('❌ Ошибка обновления заявки:', error);
    console.error('❌ Подробности ошибки:', error.message);
    
    let errorMessage = 'Произошла ошибка при обновлении заявки';
    
    if (error.message.includes('Сумма должна быть положительной')) {
      errorMessage = '❌ Сумма должна быть положительной';
    } else if (error.message.includes('не найдена') || error.message.includes('not found')) {
      errorMessage = '❌ Заявка не найдена';
    } else if (error.message.includes('нет прав')) {
      errorMessage = '❌ У вас нет прав для редактирования этой заявки';
    }
    
    setMessage({ type: 'error', text: errorMessage });
  } finally {
    setIsLoading(false);
  }
};

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
    console.log('🗑️ Удаляем заявку:', application.applicationId);
    
    const result = await AspNetApiService.deleteApplication(application.applicationId);
    
    console.log('✅ Результат удаления:', result);
    
    if (result && result.success) {
      // Уведомляем родительский компонент об удалении
      if (onDelete) {
        onDelete(application.applicationId);
      }
      
      // Показываем сообщение об успехе
      setMessage({ 
        type: 'success', 
        text: '✅ Заявка успешно удалена!' 
      });
      
      // Закрываем модалку через 1.5 секунды
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } else {
      throw new Error('Не удалось удалить заявку');
    }
    
  } catch (error) {
    console.error('❌ Ошибка удаления заявки:', error);
    
    let errorMessage = 'Произошла ошибка при удалении заявки';
    
    if (error.message.includes('не найдена')) {
      errorMessage = '❌ Заявка не найдена';
    } else if (error.message.includes('нет прав')) {
      errorMessage = '❌ У вас нет прав для удаления этой заявки';
    } else if (error.message.includes('запрещен')) {
      errorMessage = '❌ Доступ запрещен';
    }
    
    setMessage({ type: 'error', text: errorMessage });
  } finally {
    setIsLoading(false);
  }
};

  const getStatusInfo = (statusCode) => {
    const statuses = {
      0: { label: 'Новая', color: '#28a745', icon: '🆕' },
      1: { label: 'В работе', color: '#007bff', icon: '⚙️' },
      2: { label: 'Завершена', color: '#6c757d', icon: '✅' },
      3: { label: 'Отменена', color: '#dc3545', icon: '❌' }
    };
    return statuses[statusCode] || statuses[0];
  };

  const statusInfo = getStatusInfo(application?.status);

  if (!application) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Детали заявки</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {message.text && (
          <div className={`status-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="modal-body">
          <div className="application-info">
            <div className="info-section">
              <h3>Основная информация</h3>
              
              <div className="info-row">
                <span className="info-label">ID заявки:</span>
                <span className="info-value">{application.applicationId}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Статус:</span>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: statusInfo.color }}
                >
                  {statusInfo.icon} {statusInfo.label}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Бюджет:</span>
                <span className="info-value price">
                  {application.cost?.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              {application.userId && (
                <div className="info-row">
                  <span className="info-label">Автор:</span>
                  <span className="info-value">{application.userId}</span>
                </div>
              )}

              {application.createdAt && (
                <div className="info-row">
                  <span className="info-label">Создана:</span>
                  <span className="info-value">
                    {new Date(application.createdAt).toLocaleString('ru-RU')}
                  </span>
                </div>
              )}
            </div>

            <div className="info-section">
              <h3>Описание</h3>
              {isEditing ? (
                <textarea
                  name="description"
                  value={editData.description}
                  onChange={handleInputChange}
                  className="edit-textarea"
                  rows="6"
                  placeholder="Опишите задачу..."
                />
              ) : (
                <div className="description-text">
                  {application.description || 'Нет описания'}
                </div>
              )}
            </div>

            {isEditing && (
              <div className="info-section">
                <h3>Редактирование бюджета</h3>
                <div className="edit-cost">
                  <input
                    type="number"
                    name="cost"
                    value={editData.cost}
                    onChange={handleInputChange}
                    min="1"
                    step="100"
                    className="cost-input"
                  />
                  <span className="currency">₽</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {(isOwner || user?.isAdmin) && !isEditing && (
          <div className="quick-status-actions">
            <h4>Быстрое изменение статуса:</h4>
            <div className="quick-status-buttons">
              {application.status !== 0 && (
                <button 
                  className="status-btn new"
                  onClick={() => handleQuickStatusChange(0)}
                  disabled={isLoading}
                >
                  🆕 Сделать "Новой"
                </button>
              )}
              {application.status !== 1 && (
                <button 
                  className="status-btn in-progress"
                  onClick={() => handleQuickStatusChange(1)}
                  disabled={isLoading}
                >
                  ⚙️ В работу
                </button>
              )}
              {application.status !== 2 && (
                <button 
                  className="status-btn completed"
                  onClick={() => handleQuickStatusChange(2)}
                  disabled={isLoading}
                >
                  ✅ Завершить
                </button>
              )}
              {application.status !== 3 && (
                <button 
                  className="status-btn canceled"
                  onClick={() => handleQuickStatusChange(3)}
                  disabled={isLoading}
                >
                  ❌ Отменить
                </button>
              )}
            </div>
          </div>
        )}

        {quickStatusChangeData.show && (
          <ConfirmModal
            isOpen={true}
            onConfirm={confirmQuickStatusChange}
            onCancel={() => setQuickStatusChangeData({ show: false, newStatus: null, statusInfo: null })}
            title="Изменение статуса заявки"
            message={`Вы уверены, что хотите изменить статус заявки на "${quickStatusChangeData.statusInfo?.label}"?`}
            confirmText="Изменить"
            cancelText="Отмена"
            type="warning"
          />
        )}

        <div className="modal-actions">
          {isOwner ? (
            <>
              {isEditing ? (
                <>
                  <button 
                    className="action-btn save-btn"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Сохранение...' : '💾 Сохранить'}
                  </button>
                  <button 
                    className="action-btn cancel-btn"
                    onClick={handleEditToggle}
                    disabled={isLoading}
                  >
                    ❌ Отменить
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="action-btn edit-btn"
                    onClick={handleEditToggle}
                    disabled={isLoading}
                  >
                    ✏️ Редактировать
                  </button>
                   <button 
                    className="action-btn delete-btn"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isLoading}
                  >
                    🗑️ Удалить
                  </button>
                </>
              )}
            </>
          ) : (
            <button 
              className="action-btn apply-btn"
              onClick={() => console.log('Откликнуться на заявку')}
            >
              📝 Откликнуться
            </button>
          )}
          
          <button 
            className="action-btn close-action-btn"
            onClick={onClose}
            disabled={isLoading}
          >
            Закрыть
          </button>
        </div>
      </div>
      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={true}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          title="Удаление заявки"
          message="Вы уверены, что хотите удалить эту заявку? Это действие нельзя отменить."
          confirmText="Удалить"
          cancelText="Отмена"
          type="danger"
        />
      )}
    </div>
  );
}

export default ApplicationDetailsModal;