import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import AvatarUpload from './AvatarUpload';
import ConfirmModal from './ConfirmModal';
import './Settings.css';

function Settings() {
  const { user, deleteAccount, updateUserInfo, changePassword } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Используем react-hook-form
  const { 
    register, 
    watch, 
    setValue, 
    handleSubmit, 
    formState: { isDirty, errors }, 
    reset,
    trigger 
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      website: '',
      description: '',
      avatar: '',
      socialLinks: {
        youtube: '',
        instagram: '',
        telegram: '',
        tiktok: '',
        vk: ''
      },
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Следим за изменениями формы
  const formData = watch();

  // Инициализация формы данными пользователя
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        website: user.website || '',
        description: user.bio || '',
        avatar: user.avatar || '',
        socialLinks: user.socialLinks || {
          youtube: '',
          instagram: '',
          telegram: '',
          tiktok: '',
          vk: ''
        },
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user, reset]);

  // Прокрутка вверх при смене вкладки
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Обработчик изменения аватара
  const handleAvatarChange = (newAvatar) => {
    setValue('avatar', newAvatar, { shouldDirty: true });
  };

  // Обработчик отправки формы
  const onSubmit = async (data) => {
    console.log('Сохранение настроек:', data);
    
    if (activeTab === 'profile') {
      await saveProfile(data);
    } else if (activeTab === 'security') {
      await changeUserPassword(data);
    } else if (activeTab === 'social') {
      await saveSocialLinks(data);
    }
  };

  // Сохранение профиля
  const saveProfile = async (data) => {
    setProfileLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Валидация обязательных полей
      const isValid = await trigger(['name', 'email', 'description']);
      
      if (!isValid) {
        setMessage({ 
          type: 'error', 
          text: 'Пожалуйста, заполните все обязательные поля правильно' 
        });
        return;
      }
      
      // Проверка поля "О себе"
      if (!data.description || data.description.trim() === '') {
        setMessage({ 
          type: 'error', 
          text: 'Поле "О себе" не может быть пустым' 
        });
        return;
      }
      
      if (data.description.trim().length < 3) {
        setMessage({ 
          type: 'error', 
          text: 'Поле "О себе" должно содержать минимум 3 символа' 
        });
        return;
      }
      
      // Подготовка данных для отправки
      const userData = {
        name: data.name.trim(),
        email: data.email.trim(),
        login: data.email.trim(), // Используем email как логин
        bio: data.description.trim(),
        avatarPath: data.avatar || '',
        type: user?.userType === 'advertiser' ? 1 : 0,
        balance: user?.balance || 0,
        socialLinks: []
      };
      
      console.log('📤 Отправляем данные профиля:', userData);
      
      // Вызов API
      const result = await updateUserInfo(userData);
      
      if (result.success) {
        setMessage({ type: 'success', text: '✅ Профиль успешно обновлен!' });
        reset(data); // Сброс dirty состояния
        
        // Автоматическое скрытие сообщения
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: `❌ ${result.error}` });
      }
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      setMessage({ type: 'error', text: '❌ Произошла ошибка при сохранении' });
    } finally {
      setProfileLoading(false);
    }
  };

  // Смена пароля
  const changeUserPassword = async (data) => {
    setPasswordLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Валидация
      const isValid = await trigger(['currentPassword', 'newPassword', 'confirmPassword']);
      
      if (!isValid) {
        return;
      }
      
      // Проверка совпадения паролей
      if (data.newPassword !== data.confirmPassword) {
        setMessage({ type: 'error', text: '❌ Новые пароли не совпадают' });
        return;
      }
      
      // Проверка длины пароля
      if (data.newPassword.length < 6) {
        setMessage({ type: 'error', text: '❌ Пароль должен быть не менее 6 символов' });
        return;
      }
      
      console.log('🔐 Меняем пароль...');
      
      // Вызов API
      const result = await changePassword(data.currentPassword, data.newPassword);
      
      if (result.success) {
        setMessage({ type: 'success', text: '✅ Пароль успешно изменен!' });
        
        // Сброс полей пароля
        setValue('currentPassword', '');
        setValue('newPassword', '');
        setValue('confirmPassword', '');
        
        // Автоматическое скрытие сообщения
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: `❌ ${result.error}` });
      }
    } catch (error) {
      console.error('Ошибка смены пароля:', error);
      setMessage({ type: 'error', text: '❌ Произошла ошибка при смене пароля' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Сохранение социальных ссылок
  const saveSocialLinks = async (data) => {
    setProfileLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Подготовка данных
      const socialLinksArray = Object.values(data.socialLinks)
        .filter(link => link && link.trim() !== '')
        .map(link => link.trim());
      
      const userData = {
        name: user?.name || '',
        email: user?.email || '',
        login: user?.email || '',
        bio: user?.bio || '',
        socialLinks: socialLinksArray,
        type: user?.userType === 'advertiser' ? 1 : 0,
        balance: user?.balance || 0,
        avatarPath: user?.avatar || ''
      };
      
      console.log('📤 Сохраняем социальные ссылки:', userData);
      
      // Вызов API
      const result = await updateUserInfo(userData);
      
      if (result.success) {
        setMessage({ type: 'success', text: '✅ Социальные ссылки сохранены!' });
        reset(data);
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: `❌ ${result.error}` });
      }
    } catch (error) {
      console.error('Ошибка сохранения ссылок:', error);
      setMessage({ type: 'error', text: '❌ Произошла ошибка при сохранении' });
    } finally {
      setProfileLoading(false);
    }
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

  // Удаление аккаунта
  const handleDeleteAccount = async () => {
    if (!isDeleteConfirm) {
      setIsDeleteConfirm(true);
      return;
    }

    setDeleteLoading(true);
    
    const finalConfirm = window.confirm(
      '⚠️ ВНИМАНИЕ! Это действие необратимо.\n\n' +
      'Все ваши данные будут безвозвратно удалены.\n' +
      'Вы уверены, что хотите удалить аккаунт?'
    );

    if (!finalConfirm) {
      setIsDeleteConfirm(false);
      setDeleteLoading(false);
      return;
    }

    try {
      const result = await deleteAccount();
      
      if (result.success) {
        alert('✅ Аккаунт успешно удален');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        alert(`❌ Ошибка: ${result.error}`);
        setIsDeleteConfirm(false);
      }
    } catch (error) {
      console.error('Ошибка при удалении:', error);
      alert('❌ Произошла ошибка при удалении аккаунта');
      setIsDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
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
          <button
            className={`tab-btn ${activeTab === 'danger' ? 'active danger-tab' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            ⚠️ Удаление
          </button>
        </div>

        {/* Сообщения о статусе */}
        {message.text && (
          <div className={`status-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="settings-form">
          {/* Уведомление об обязательных полях */}
          {activeTab === 'profile' && (
            <div className="required-fields-notice">
              <strong>⚠️ Внимание:</strong> Поля отмеченные * обязательны для заполнения
            </div>
          )}

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
                <label htmlFor="name" className="required">
                  {user?.userType === 'advertiser' ? 'Название компании' : 'Имя и фамилия'}
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder={user?.userType === 'advertiser' ? 'Введите название компании' : 'Введите ваше имя'}
                  {...register('name', { 
                    required: 'Это поле обязательно',
                    minLength: { value: 2, message: 'Минимум 2 символа' },
                    maxLength: { value: 100, message: 'Максимум 100 символов' }
                  })}
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="required">Email</label>
                <input
                  type="email"
                  id="email"
                  placeholder="your@email.com"
                  {...register('email', { 
                    required: 'Email обязателен',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Неверный формат email'
                    },
                    maxLength: { value: 255, message: 'Максимум 255 символов' }
                  })}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-text">{errors.email.message}</span>}
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
                <label htmlFor="description" className="required">
                  {user?.userType === 'advertiser' ? 'О компании' : 'О себе'}
                </label>
                <textarea
                  id="description"
                  placeholder={user?.userType === 'advertiser' ? 
                    'Расскажите о вашей компании...' : 
                    'Расскажите о себе...'}
                  rows="4"
                  {...register('description', { 
                    required: 'Это поле обязательно для заполнения',
                    minLength: { 
                      value: 3, 
                      message: 'Минимум 3 символа' 
                    },
                    maxLength: { 
                      value: 600, 
                      message: 'Максимум 600 символов' 
                    }
                  })}
                  className={errors.description ? 'error' : ''}
                />
                {errors.description && (
                  <span className="error-text">{errors.description.message}</span>
                )}
                <div className="field-hint">
                  Это поле обязательно для сохранения изменений
                </div>
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
              <p className="section-description">
                Измените ваш пароль для усиления безопасности аккаунта
              </p>
              
              <div className="form-group">
                <label htmlFor="currentPassword" className="required">Текущий пароль</label>
                <input
                  type="password"
                  id="currentPassword"
                  placeholder="Введите текущий пароль"
                  {...register('currentPassword', { 
                    required: 'Введите текущий пароль',
                    minLength: { value: 6, message: 'Минимум 6 символов' }
                  })}
                  className={errors.currentPassword ? 'error' : ''}
                />
                {errors.currentPassword && <span className="error-text">{errors.currentPassword.message}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="newPassword" className="required">Новый пароль</label>
                <input
                  type="password"
                  id="newPassword"
                  placeholder="Введите новый пароль (минимум 6 символов)"
                  {...register('newPassword', { 
                    required: 'Введите новый пароль',
                    minLength: { value: 6, message: 'Минимум 6 символов' }
                  })}
                  className={errors.newPassword ? 'error' : ''}
                />
                {errors.newPassword && <span className="error-text">{errors.newPassword.message}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword" className="required">Подтвердите новый пароль</label>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Повторите новый пароль"
                  {...register('confirmPassword', { 
                    required: 'Подтвердите новый пароль'
                  })}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword.message}</span>}
              </div>
            </div>
          )}

          {/* Вкладка удаления аккаунта */}
          {activeTab === 'danger' && (
            <div className="tab-content danger-zone">
              <h2>⚠️ Удаление аккаунта</h2>
              <div className="danger-content">
                <div className="warning-message">
                  <h3>🚨 Внимание! Это необратимое действие</h3>
                  <p>При удалении аккаунта будут безвозвратно удалены:</p>
                  <ul>
                    <li>• Все ваши личные данные</li>
                    <li>• История заказов и кампаний</li>
                    <li>• Статистика и аналитика</li>
                    <li>• Привязанные социальные сети</li>
                    <li>• Баланс и финансовые операции</li>
                  </ul>
                  <p className="final-warning">
                    <strong>Это действие нельзя отменить!</strong>
                  </p>
                </div>

                {!isDeleteConfirm ? (
                  <button
                    type="button"
                    className="delete-account-btn"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Загрузка...' : '🗑️ Удалить аккаунт'}
                  </button>
                ) : (
                  <div className="delete-confirmation">
                    <h3>❌ Вы уверены?</h3>
                    <p>Для подтверждения удаления введите ваш email:</p>
                    <div className="email-confirmation">
                      <strong>{user?.email}</strong>
                    </div>
                    <p>Это действие окончательно и не может быть отменено.</p>
                    
                    <div className="confirmation-buttons">
                      <button
                        type="button"
                        className="confirm-delete-btn"
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? 'Удаление...' : '✅ Да, удалить аккаунт'}
                      </button>
                      <button
                        type="button"
                        className="cancel-delete-btn"
                        onClick={() => setIsDeleteConfirm(false)}
                        disabled={deleteLoading}
                      >
                        ❌ Отмена
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className={`save-btn ${isDirty ? 'active' : 'inactive'}`}
              disabled={!isDirty || profileLoading || passwordLoading}
            >
              {profileLoading || passwordLoading ? (
                '⏳ Сохранение...'
              ) : isDirty ? (
                '💾 Сохранить изменения'
              ) : (
                '✅ Сохранено'
              )}
            </button>

            <div className="right-actions">
              {isDirty && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => reset()}
                  disabled={profileLoading || passwordLoading}
                >
                  🔄 Сбросить
                </button>
              )}
              <button
                type="button"
                className="back-dashboard-btn"
                onClick={handleBackToDashboard}
                disabled={profileLoading || passwordLoading}
              >
                ← В кабинет
              </button>
            </div>
          </div>
        </form>
      </div>

      {showConfirmModal && (
        <ConfirmModal
          message="У вас есть несохраненные изменения. Вы уверены, что хотите уйти?"
          onConfirm={confirmLeave}
          onCancel={cancelLeave}
        />
      )}
    </div>
  );
}

export default Settings;