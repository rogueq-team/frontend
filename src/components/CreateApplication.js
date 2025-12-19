// components/CreateApplication.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AspNetApiService from '../services/aspnetApi';
import './CreateApplication.css';

function CreateApplication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    description: '',
    cost: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Проверяем, может ли пользователь создавать заявки
  const canCreateApplication = user?.userType === 'advertiser' || 
                              user?.userType === 'both';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canCreateApplication) {
      setMessage({
        type: 'error',
        text: '❌ Только рекламодатели могут создавать заявки'
      });
      return;
    }

    // Валидация
    if (!formData.description.trim()) {
      setMessage({
        type: 'error',
        text: '❌ Заполните описание заявки'
      });
      return;
    }

    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      setMessage({
        type: 'error',
        text: '❌ Укажите положительную сумму'
      });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const applicationData = {
        description: formData.description.trim(),
        cost: parseFloat(formData.cost),
        status: 0
      };

      console.log('📤 Создаем заявку:', applicationData);
      
      const response = await AspNetApiService.createApplication(applicationData);
      
      console.log('✅ Заявка создана:', response);
      
      setMessage({
        type: 'success',
        text: '✅ Заявка успешно создана!'
      });

      // Очистка формы
      setFormData({
        description: '',
        cost: '',
      });

      // Перенаправление через 2 секунды
      setTimeout(() => {
        navigate('/applications');
      }, 2000);

    } catch (error) {
      console.error('❌ Ошибка создания заявки:', error);
      
      let errorMessage = 'Произошла ошибка при создании заявки';
      
      if (error.message.includes('Сумма должна быть положительной')) {
        errorMessage = '❌ Сумма должна быть положительной';
      } else if (error.message.includes('нет прав')) {
        errorMessage = '❌ У вас нет прав для создания заявок';
      }
      
      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canCreateApplication) {
    return (
      <div className="create-application-page">
        <div className="no-permission">
          <h2>🚫 Нет доступа</h2>
          <p>Создавать заявки могут только рекламодатели.</p>
          <p>Ваш тип аккаунта: {user?.userType === 'contentmaker' ? 'Контент-мейкер' : 'Пользователь'}</p>
          <button onClick={() => navigate('/dashboard')}>
            Вернуться в кабинет
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-application-page">
      <div className="create-application-container">
        <div className="create-application-header">
          <button 
            onClick={() => navigate(-1)}
            className="back-btn"
          >
            ← Назад
          </button>
          <h1>Создание новой заявки</h1>
        </div>

        {message.text && (
          <div className={`status-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-application-form">
          <div className="form-section">
            <h3>Основная информация</h3>
            
            <div className="form-group">
              <label htmlFor="description" className="required">
                Описание заявки
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Опишите, что именно вам нужно (услуги контент-мейкера, требования, сроки и т.д.)"
                rows="6"
                required
              />
              <div className="field-hint">
                Подробно опишите задачу, чтобы контент-мейкеры лучше понимали что требуется
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="cost" className="required">
                Бюджет (₽)
              </label>
              <input
                type="number"
                id="cost"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                placeholder="10000"
                min="100"
                step="100"
                required
              />
              <div className="field-hint">
                Укажите сумму, которую вы готовы заплатить за выполнение работы
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Создание...' : '📝 Создать заявку'}
            </button>
            
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/applications')}
              disabled={isLoading}
            >
              Отмена
            </button>
          </div>
        </form>

        <div className="create-application-info">
          <h3>💡 Как это работает?</h3>
          <ol>
            <li>Вы создаете заявку с описанием задачи и бюджетом</li>
            <li>Контент-мейкеры видят вашу заявку в общем списке</li>
            <li>Заинтересованные контент-мейкеры откликаются на заявку</li>
            <li>Вы выбираете лучшего исполнителя и начинаете работу</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default CreateApplication;