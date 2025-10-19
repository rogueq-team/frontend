import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import AvatarUpload from './AvatarUpload';
import ConfirmModal from './ConfirmModal'; // Создадим этот компонент
import './Settings.css';

function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Используем react-hook-form
  const { register, watch, setValue, handleSubmit, formState: { isDirty }, reset } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      website: '',
      description: '',
      avatar: user?.avatar || '',
      socialLinks: {
        youtube: '',
        instagram: '',
        telegram: '',
        tiktok: '',
        vk: ''
      }
    }
  });

  // Следим за изменениями формы
  const formData = watch();

  // Прокрутка вверх
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Обработчик аватара
  const handleAvatarChange = (newAvatar) => {
    setValue('avatar', newAvatar, { shouldDirty: true });
  };

  // Сохранение формы
  const onSubmit = (data) => {
    console.log('Сохранение настроек:', data);
    reset(data); // Сбрасываем dirty состояние
    // Здесь будет отправка на сервер
  };

  // Навигация с проверкой изменений
  const handleBackToDashboard = () => {
    if (isDirty) {
      setShowConfirmModal(true);
    } else {
      navigate('/dashboard');
    }
  };

  const confirmLeave = () => {
    setShowConfirmModal(false);
    navigate('/dashboard');
  };

  const cancelLeave = () => {
    setShowConfirmModal(false);
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <button
            onClick={handleBackToDashboard}
            className="back-btn"
            title="Вернуться в личный кабинет"
          >
            ← Назад
          </button>
          <h1>Настройки профиля</h1>
        </div>

        <div className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Основные данные
          </button>
          {user?.userType === 'contentmaker' && (
            <button
              className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
              onClick={() => setActiveTab('social')}
            >
              Социальные сети
            </button>
          )}
          <button
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Безопасность
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="settings-form">
          {/* Вкладка основных данных */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <h2>Основная информация</h2>

              <div className="avatar-section">
                <h3>Аватар профиля</h3>
                <AvatarUpload
                  currentAvatar={formData.avatar}
                  onAvatarChange={handleAvatarChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">
                  {user?.userType === 'advertiser' ? 'Название компании' : 'Имя и фамилия'}
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder={user?.userType === 'advertiser' ? 'Введите название компании' : 'Введите ваше имя'}
                  {...register('name')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  placeholder="your@email.com"
                  {...register('email')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Телефон</label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="+7 (999) 999-99-99"
                  {...register('phone')}
                />
              </div>

              {user?.userType === 'advertiser' && (
                <div className="form-group">
                  <label htmlFor="website">Веб-сайт компании</label>
                  <input
                    type="url"
                    id="website"
                    placeholder="https://example.com"
                    {...register('website')}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="description">
                  {user?.userType === 'advertiser' ? 'О компании' : 'О себе'}
                </label>
                <textarea
                  id="description"
                  placeholder={user?.userType === 'advertiser' ? 'Расскажите о вашей компании...' : 'Расскажите о себе...'}
                  rows="4"
                  {...register('description')}
                />
              </div>
            </div>
          )}

          {/* Вкладка социальных сетей */}
          {activeTab === 'social' && user?.userType === 'contentmaker' && (
            <div className="tab-content">
              <h2>Привязка социальных сетей</h2>
              <p className="section-description">
                Привяжите ваши социальные сети для получения статистики и предложений по сотрудничеству
              </p>

              <div className="social-grid">
                {['youtube', 'instagram', 'telegram', 'tiktok', 'vk'].map((platform) => (
                  <div key={platform} className="social-input-group">
                    <label htmlFor={`social_${platform}`}>
                      <span className="social-icon">
                        {platform === 'youtube' && '📺'}
                        {platform === 'instagram' && '📷'}
                        {platform === 'telegram' && '✈️'}
                        {platform === 'tiktok' && '🎵'}
                        {platform === 'vk' && '👥'}
                      </span>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </label>
                    <input
                      type="url"
                      id={`social_${platform}`}
                      placeholder={`https://${platform}.com/yourprofile`}
                      {...register(`socialLinks.${platform}`)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Вкладка безопасности */}
          {activeTab === 'security' && (
            <div className="tab-content">
              <h2>Безопасность</h2>
              <div className="form-group">
                <label htmlFor="currentPassword">Текущий пароль</label>
                <input
                  type="password"
                  id="currentPassword"
                  placeholder="Введите текущий пароль"
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">Новый пароль</label>
                <input
                  type="password"
                  id="newPassword"
                  placeholder="Введите новый пароль"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Подтвердите новый пароль</label>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Повторите новый пароль"
                />
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className={`save-btn ${isDirty ? 'active' : 'inactive'}`}
              disabled={!isDirty}
            >
              {isDirty ? '💾 Сохранить изменения' : '✅ Сохранено'}
            </button>

            <div className="right-actions">
              {isDirty && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => reset()}
                >
                  🔄 Сбросить
                </button>
              )}
              <button
                type="button"
                className="back-dashboard-btn"
                onClick={handleBackToDashboard}
              >
                ← В кабинет
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Кастомный модал вместо confirm */}
      <button disabled={!isDirty}>
        {isDirty ? '💾 Сохранить изменения' : '✅ Сохранено'}
      </button>
    </div>
  );
}

export default Settings;