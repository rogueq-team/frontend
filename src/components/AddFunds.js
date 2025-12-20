import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AspNetApiService from '../services/aspnetApi';
import './AddFunds.css';

const AddFunds = () => {
  const navigate = useNavigate();
  const { user, updateUserInfo } = useAuth();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Предустановленные суммы для быстрого выбора
  const presetAmounts = [100, 500, 1000, 2000, 5000];

  const handlePresetClick = (presetAmount) => {
    setAmount(presetAmount.toString());
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('Пожалуйста, введите корректную сумму');
      return;
    }

    const fundsToAdd = parseInt(amount);
    
    if (fundsToAdd < 10) {
      setError('Минимальная сумма пополнения: 10 ₽');
      return;
    }

    if (fundsToAdd > 100000) {
      setError('Максимальная сумма пополнения: 100,000 ₽');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log(`🔄 Пополнение баланса на ${fundsToAdd} ₽ для пользователя ${user?.id}`);
      
      // 1. Получаем актуальные данные пользователя
      const currentUserData = await AspNetApiService.request('/User/Me', { method : 'GET'});
      
      if (!currentUserData) {
        throw new Error('Не удалось получить данные пользователя');
      }

      // 2. Рассчитываем новый баланс
      const currentBalance = currentUserData.balance || 0;
      const newBalance = currentBalance + fundsToAdd;

      // 3. Подготавливаем данные для обновления
      const updateData = {
        name: currentUserData.name || "",
        login: currentUserData.login || "",
        email: currentUserData.email || "",
        role: currentUserData.role || 0,
        type: currentUserData.type || 0,
        balance: newBalance,
        avatarPath: currentUserData.avatarPath || "default-avatar.png",
        bio: currentUserData.bio || ""
      };

      // 4. Отправляем обновление на сервер
      const response = await AspNetApiService.request('/User/UpdateInformation', {method: 'POST',
        body: JSON.stringify(updateData)});

      if (response) {
        console.log(`✅ Баланс успешно пополнен! Было: ${currentBalance} ₽, Стало: ${newBalance} ₽`);
        
        // 5. Обновляем данные в контексте аутентификации
        if (updateUserInfo) {
          const updatedUser = {
            ...user,
            balance: newBalance,
            backendData: {
              ...user?.backendData,
              balance: newBalance
            }
          };
          updateUserInfo(updatedUser);
        }

        setSuccess(`✅ Баланс успешно пополнен на ${fundsToAdd.toLocaleString()} ₽!`);
        setAmount('');
        
        // Через 3 секунды можно вернуться в кабинет
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        throw new Error('Не удалось обновить баланс на сервере');
      }
    } catch (error) {
      console.error('❌ Ошибка при пополнении баланса:', error);
      setError(`Ошибка: ${error.message || 'Не удалось пополнить баланс'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="add-funds-container">
      <div className="add-funds-card">
        <button className="back-button" onClick={handleCancel}>
          ← Назад в кабинет
        </button>
        
        <div className="add-funds-header">
          <h1>💰 Пополнение баланса</h1>
          <p>Пополните ваш баланс для использования в сделках</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span>✅</span>
            <span>{success}</span>
            <p className="success-hint">Вы будете перенаправлены в личный кабинет через 3 секунды...</p>
          </div>
        )}

        <div className="balance-info">
          <div className="current-balance">
            <span>Текущий баланс:</span>
            <span className="balance-amount">{user?.balance?.toLocaleString() || 0} ₽</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="add-funds-form">
          <div className="form-group">
            <label htmlFor="amount">Сумма пополнения (₽)</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Введите сумму"
              min="10"
              max="100000"
              step="10"
              disabled={isLoading}
              autoFocus
            />
            <small>Минимальная сумма: 10 ₽, Максимальная: 100,000 ₽</small>
          </div>

          <div className="preset-amounts">
            <p>Быстрый выбор:</p>
            <div className="preset-buttons">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`preset-btn ${amount === preset.toString() ? 'active' : ''}`}
                  onClick={() => handlePresetClick(preset)}
                  disabled={isLoading}
                >
                  {preset.toLocaleString()} ₽
                </button>
              ))}
            </div>
          </div>

          <div className="calculated-total">
            <div className="total-item">
              <span>Текущий баланс:</span>
              <span>{user?.balance?.toLocaleString() || 0} ₽</span>
            </div>
            <div className="total-item">
              <span>Пополнение:</span>
              <span className="amount-to-add">
                {amount && !isNaN(amount) ? `+${parseInt(amount).toLocaleString()}` : '+0'} ₽
              </span>
            </div>
            <div className="total-item total">
              <span>Итоговый баланс:</span>
              <span className="final-amount">
                {user?.balance && amount && !isNaN(amount) 
                  ? (user.balance + parseInt(amount)).toLocaleString() 
                  : user?.balance?.toLocaleString() || 0} ₽
              </span>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading || !amount || isNaN(amount) || parseInt(amount) < 10}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Обработка...
                </>
              ) : (
                `Пополнить на ${amount && !isNaN(amount) ? parseInt(amount).toLocaleString() : 0} ₽`
              )}
            </button>
          </div>
        </form>

        <div className="add-funds-info">
          <h3>📋 Информация о пополнении</h3>
          <ul>
            <li>💳 Баланс пополняется мгновенно</li>
            <li>🔄 Деньги можно использовать сразу после пополнения</li>
            <li>📊 История операций сохраняется в вашем кабинете</li>
            <li>🛡️ Все операции защищены и безопасны</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddFunds;