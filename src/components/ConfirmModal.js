// ConfirmModal.js - улучшенная версия
import React from 'react';
import './ConfirmModal.css';

function ConfirmModal({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title = "Подтверждение", 
  message = "Вы уверены?",
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  type = "default" // default, danger, warning, success
}) {
  if (!isOpen) return null;

  const getButtonClass = () => {
    switch(type) {
      case 'danger': return 'modal-btn danger';
      case 'warning': return 'modal-btn warning';
      case 'success': return 'modal-btn success';
      default: return 'modal-btn confirm';
    }
  };

  const getIcon = () => {
    switch(type) {
      case 'danger': return '⚠️';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return '❓';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <span className="modal-icon">{getIcon()}</span>
          <h3>{title}</h3>
        </div>
        
        <div className="modal-body">
          <p>{message}</p>
        </div>
        
        <div className="modal-actions">
          <button onClick={onCancel} className="modal-btn cancel">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={getButtonClass()}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;