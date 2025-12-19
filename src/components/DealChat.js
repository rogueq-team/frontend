// components/DealChat.js - улучшенная версия
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AspNetApiService from '../services/aspnetApi';
import './DealChat.css';

function DealChat() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [dealInfo, setDealInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Автоматическая прокрутка к последнему сообщению
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Загрузка информации о сделке
  useEffect(() => {
    const loadDealInfo = async () => {
      setIsLoading(true);
      try {
        // TODO: Реализовать получение сделки с бекенда
        // const dealData = await AspNetApiService.getDeal(dealId);
        
        // Временные данные
        setDealInfo({
          id: dealId,
          title: 'Сделка по заявке',
          advertiser: 'Рекламодатель',
          advertiserId: 'adv-123',
          contentMaker: 'Контент-мейкер',
          contentMakerId: 'cm-456',
          budget: 10000,
          status: 'active',
          createdAt: new Date().toISOString(),
          applicationDescription: 'Описание оригинальной заявки'
        });

        // Временные сообщения
        setMessages([
          { 
            id: 1, 
            senderId: 'adv-123', 
            senderName: 'Рекламодатель',
            senderType: 'advertiser',
            text: 'Привет! Интересует ваше предложение по созданию контента', 
            time: '10:00',
            date: '2024-01-15'
          },
          { 
            id: 2, 
            senderId: 'cm-456', 
            senderName: 'Контент-мейкер',
            senderType: 'contentmaker',
            text: 'Здравствуйте! Рад, что заинтересовались. Я могу подготовить контент в течение недели', 
            time: '10:05',
            date: '2024-01-15'
          },
          { 
            id: 3, 
            senderId: 'adv-123', 
            senderName: 'Рекламодатель',
            senderType: 'advertiser',
            text: 'Отлично! Давайте обсудим детали. Какие форматы контента вы предлагаете?', 
            time: '10:10',
            date: '2024-01-15'
          },
        ]);

      } catch (error) {
        console.error('Ошибка загрузки сделки:', error);
        alert('Не удалось загрузить информацию о сделке');
      } finally {
        setIsLoading(false);
      }
    };

    if (dealId) {
      loadDealInfo();
    }
  }, [dealId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const tempId = Date.now();
    const newMsg = {
      id: tempId,
      senderId: user?.id || 'current-user',
      senderName: user?.name || 'Вы',
      senderType: user?.userType,
      text: newMessage,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      isSending: true
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // TODO: Отправить сообщение на бекенд
    // try {
    //   const result = await AspNetApiService.sendDealMessage(dealId, newMessage);
    //   // Обновляем сообщение с ID от сервера
    //   setMessages(prev => prev.map(msg => 
    //     msg.id === tempId ? { ...msg, id: result.messageId, isSending: false } : msg
    //   ));
    // } catch (error) {
    //   console.error('Ошибка отправки сообщения:', error);
    //   // Помечаем сообщение как неотправленное
    //   setMessages(prev => prev.map(msg => 
    //     msg.id === tempId ? { ...msg, isSending: false, error: true } : msg
    //   ));
    // }
    
    // Временно убираем флаг отправки
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, isSending: false } : msg
      ));
    }, 1000);
  };

  const getOtherParticipant = () => {
    if (!dealInfo) return 'Участник';
    
    if (user?.userType === 'advertiser') {
      return dealInfo.contentMaker;
    } else {
      return dealInfo.advertiser;
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

  return (
    <div className="deal-chat-container">
      <div className="deal-info-sidebar">
        <h2>Сделка #{dealId?.substring(0, 8)}...</h2>
        
        <div className="deal-details">
          <div className="detail-item">
            <span className="label">Рекламодатель:</span>
            <span className="value">{dealInfo?.advertiser}</span>
          </div>
          <div className="detail-item">
            <span className="label">Контент-мейкер:</span>
            <span className="value">{dealInfo?.contentMaker}</span>
          </div>
          <div className="detail-item">
            <span className="label">Бюджет:</span>
            <span className="value price">{dealInfo?.budget?.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="detail-item">
            <span className="label">Статус:</span>
            <span className={`status-badge ${dealInfo?.status}`}>
              {dealInfo?.status === 'active' ? 'Активна' : 
               dealInfo?.status === 'completed' ? 'Завершена' : 
               dealInfo?.status === 'canceled' ? 'Отменена' : 'Ожидание'}
            </span>
          </div>
          
          {dealInfo?.applicationDescription && (
            <div className="detail-item">
              <span className="label">Описание заявки:</span>
              <span className="value" style={{ fontSize: '14px', fontWeight: 'normal' }}>
                {dealInfo.applicationDescription}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <h3>Чат по сделке</h3>
          <div className="chat-participants">
            <span>👤 {getOtherParticipant()}</span>
            <span>💬 {messages.length} сообщений</span>
          </div>
        </div>

        <div className="chat-messages" ref={chatContainerRef}>
          {messages.map(msg => {
            const isOwnMessage = msg.senderType === user?.userType;
            const messageDate = new Date(msg.date).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long'
            });
            
            return (
              <div 
                key={msg.id} 
                className={`message ${isOwnMessage ? 'outgoing' : 'incoming'}`}
              >
                {!isOwnMessage && (
                  <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>
                    {msg.senderName}
                  </div>
                )}
                <div className="message-content">
                  {msg.text}
                  {msg.isSending && (
                    <span style={{ fontSize: '12px', opacity: 0.7, marginLeft: '8px' }}>
                      (отправляется...)
                    </span>
                  )}
                  {msg.error && (
                    <span style={{ fontSize: '12px', color: '#dc3545', marginLeft: '8px' }}>
                      (не отправлено)
                    </span>
                  )}
                </div>
                <div className="message-time">
                  {msg.time} • {messageDate}
                </div>
              </div>
            );
          })}
          
          {isTyping && !user?.userType && (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
              Печатает...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Напишите сообщение ${getOtherParticipant()}...`}
            rows="2"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
          >
            📤 Отправить
          </button>
        </div>
      </div>
    </div>
  );
}

export default DealChat;