import React from 'react';
import './ConfirmModal.css';

function ConfirmModal({ isOpen, onConfirm, onCancel, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onCancel} className="modal-btn cancel">
            Отмена
          </button>
          <button onClick={onConfirm} className="modal-btn confirm">
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;