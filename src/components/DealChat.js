// components/DealChat.js - обновленная версия
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AspNetApiService from '../services/aspnetApi';
import './DealChat.css';

function DealChat() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [dealInfo, setDealInfo] = useState(null);
  const [applicationInfo, setApplicationInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDealData = async () => {
      if (!dealId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('📦 Загружаем данные сделки:', dealId);
        
        // 1. Загружаем информацию о сделке
        const dealData = await AspNetApiService.getDeal(dealId); // Нужно добавить этот метод
        setDealInfo(dealData);
        
        // 2. Если есть applicationId - загружаем информацию о заявке
        if (dealData.applicationId) {
          try {
            const appData = await AspNetApiService.getApplicationById(dealData.applicationId);
            setApplicationInfo(appData);
          } catch (appError) {
            console.log('⚠️ Не удалось загрузить заявку:', appError);
          }
        }
        
        // 3. Загружаем сообщения (если есть такой метод)
        try {
          const messagesData = await AspNetApiService.getDealMessages(dealId);
          setMessages(messagesData || []);
        } catch (messagesError) {
          console.log('⚠️ Не удалось загрузить сообщения:', messagesError);
          // Используем мок-сообщения
          setMessages([
            { 
              id: 1, 
              senderId: 'advertiser', 
              text: 'Привет! Давайте обсудим детали проекта.', 
              time: '10:00',
              date: new Date().toISOString().split('T')[0]
            }
          ]);
        }
        
      } catch (err) {
        console.error('❌ Ошибка загрузки сделки:', err);
        setError('Не удалось загрузить информацию о сделке');
        
        // Если сделка не найдена, предлагаем вернуться
        if (err.message.includes('не найдена') || err.message.includes('404')) {
          setTimeout(() => {
            if (window.confirm('Сделка не найдена. Вернуться к списку заявок?')) {
              navigate('/applications');
            }
          }, 1000);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDealData();
  }, [dealId, navigate]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const tempMessage = {
      id: Date.now(),
      senderId: user?.id,
      senderName: user?.name || 'Вы',
      senderType: user?.userType,
      text: newMessage,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      isSending: true
    };
    
    setMessages([...messages, tempMessage]);
    setNewMessage('');
    
    try {
      // Отправляем сообщение на сервер
      await AspNetApiService.sendDealMessage(dealId, newMessage);
      
      // Обновляем статус сообщения
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? { ...msg, isSending: false } : msg
      ));
      
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? { ...msg, isSending: false, error: true } : msg
      ));
    }
  };

  if (isLoading) {
    return (
      <div className="deal-chat-container">
        <div className="loading">
          Загрузка чата...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="deal-chat-container">
        <div className="error-state">
          <h3>❌ Ошибка</h3>
          <p>{error}</p>
          <button onClick={() => navigate('/applications')}>
            Вернуться к заявкам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="deal-chat-container">
      {/* ... остальной код DealChat ... */}
    </div>
  );
}

export default DealChat;