import React, { useState, useRef } from 'react';
import './AvatarUpload.css';

function AvatarUpload({ currentAvatar, onAvatarChange }) {
  const [avatar, setAvatar] = useState(currentAvatar);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        return;
      }

      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newAvatar = e.target.result;
        setAvatar(newAvatar);
        onAvatarChange(newAvatar);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    onAvatarChange(null);
  };

  return (
    <div className="avatar-upload">
      <div 
        className="avatar-container"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleAvatarClick}
      >
        {avatar ? (
          <img src={avatar} alt="Аватар" className="avatar-image" />
        ) : (
          <div className="avatar-placeholder">
            📷
          </div>
        )}
        
        {/* Наложение при наведении */}
        <div className={`avatar-overlay ${isHovered ? 'visible' : ''}`}>
          <span className="upload-text">Сменить фото</span>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          style={{ display: 'none' }}
        />
      </div>

      <div className="avatar-actions">
        <button 
          type="button" 
          className="avatar-btn primary"
          onClick={handleAvatarClick}
        >
          📁 Выбрать файл
        </button>
        
        {avatar && (
          <button 
            type="button" 
            className="avatar-btn danger"
            onClick={handleRemoveAvatar}
          >
            🗑️ Удалить
          </button>
        )}
      </div>

      <div className="avatar-hint">
        <p>📏 Рекомендуемый размер: 200x200px</p>
        <p>💾 Максимальный размер: 5MB</p>
        <p>🎨 Форматы: JPG, PNG, GIF</p>
      </div>
    </div>
  );
}

export default AvatarUpload;