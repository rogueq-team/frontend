import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AspNetApiService from '../services/aspnetApi';
import SignalRService from '../services/signalrService';
import './DealChat.css';

const DealChat = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dealInfo, setDealInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isSending, setIsSending] = useState(false);
  const [page, setPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const pageSize = 20;
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Функция для скролла к последнему сообщению (самому новому)
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Функция для сохранения позиции скролла при загрузке истории
  const preserveScrollPosition = useCallback(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const scrollTopBefore = container.scrollTop;
      
      return () => {
        const containerAfter = messagesContainerRef.current;
        const newScrollHeight = containerAfter.scrollHeight;
        const oldScrollHeight = containerAfter.scrollHeight - containerAfter.scrollTop + scrollTopBefore;
        containerAfter.scrollTop = newScrollHeight - oldScrollHeight;
      };
    }
  }, []);

  // Автоматический скролл при добавлении новых сообщений
  useEffect(() => {
    if (!isLoadingMore && messages.length > 0) {
      // Прокручиваем к низу только если пользователь уже был внизу
      const container = messagesContainerRef.current;
      if (container) {
        const isNearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 100;
        if (isNearBottom) {
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    }
  }, [messages, isLoadingMore, scrollToBottom]);

  // Инициализация подключения к чату
  useEffect(() => {
    const initChat = async () => {
      if (!isAuthenticated || !user?.token) {
        setError('Требуется авторизация');
        setIsLoading(false);
        return;
      }

      if (!dealId) {
        setError('ID сделки не указан');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');

        // Получаем информацию о сделке
        try {
          const dealResponse = await AspNetApiService.request(`/Deal/GetDeal/${dealId}`);
          setDealInfo(dealResponse);
        } catch (dealError) {
          console.error('Error fetching deal info:', dealError);
        }

        // Получаем токен
        const token = localStorage.getItem('authToken') || user.token;
        const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;

        // Настраиваем обработчики SignalR
        SignalRService.setOnMessageReceived(handleNewMessage);
        SignalRService.setOnMessageHistoryReceived(handleMessageHistory);
        SignalRService.setOnError(handleHubError);
        SignalRService.setOnReconnecting(() => setConnectionStatus('reconnecting'));
        SignalRService.setOnReconnected(() => setConnectionStatus('connected'));
        SignalRService.setOnClose(() => setConnectionStatus('disconnected'));

        // Начинаем подключение
        await SignalRService.startConnection(cleanToken);
        setConnectionStatus('connected');

        // Загружаем историю сообщений
        await loadMessageHistory(1);

      } catch (error) {
        console.error('Error initializing chat:', error);
        setError('Ошибка подключения к чату: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();

    // Очистка при размонтировании
    return () => {
      SignalRService.stopConnection();
    };
  }, [dealId, isAuthenticated, user?.token]);

  // Загрузка истории сообщений
  const loadMessageHistory = async (pageNumber) => {
    try {
      console.log(`📜 Loading message history for deal ${dealId}, page ${pageNumber}`);
      
      const restoreScroll = preserveScrollPosition();
      setIsLoadingMore(pageNumber > 1);
      
      // Вызываем метод хаба через SignalR
      await SignalRService.getMessageHistory(dealId, pageNumber, pageSize);
      
      if (restoreScroll) {
        setTimeout(restoreScroll, 0);
      }
      
    } catch (error) {
      console.error('Error loading message history:', error);
      setError('Ошибка загрузки истории сообщений: ' + error.message);
      
      // Если через SignalR не работает, пробуем через REST API
      try {
        console.log('🔄 Trying REST API for message history...');
        const response = await AspNetApiService.request(`/Messages/GetByDeal/${dealId}?page=${pageNumber}&pageSize=${pageSize}`);
        
        if (response && Array.isArray(response)) {
          // Сортируем сообщения по дате (от старых к новым) прямо с сервера
          const sortedResponse = [...response].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.CreatedAt || 0);
            const dateB = new Date(b.createdAt || b.CreatedAt || 0);
            return dateA.getTime() - dateB.getTime();
          });
          
          const formattedMessages = sortedResponse.map(msg => ({
            id: msg.id || msg.Id,
            text: msg.text || msg.Text,
            senderId: msg.userId || msg.UserId,
            senderName: msg.user?.name || msg.user?.Name || 'Неизвестный',
            timestamp: msg.createdAt || msg.CreatedAt || new Date().toISOString(),
            isOwn: (msg.userId || msg.UserId) === user?.id
          }));
          
          handleManualHistoryResponse(formattedMessages, response.length, pageNumber);
        }
      } catch (apiError) {
        console.error('API error too:', apiError);
      }
    } finally {
      if (pageNumber > 1) {
        setIsLoadingMore(false);
      }
    }
  };

  // Обработчик нового сообщения
  const handleNewMessage = (messageData) => {
    console.log('📨 Received new message:', messageData);
    
    let newMsg;
    
    if (typeof messageData === 'string') {
      newMsg = {
        id: Date.now(),
        text: messageData,
        senderId: 'other',
        senderName: 'Собеседник',
        timestamp: new Date().toISOString(),
        isOwn: false
      };
    } else if (typeof messageData === 'object') {
      newMsg = {
        id: messageData.MessageId || messageData.id || Date.now(),
        text: messageData.Text || messageData.text || messageData,
        senderId: messageData.SenderId || messageData.senderId || 'other',
        senderName: messageData.SenderName || messageData.senderName || 'Собеседник',
        timestamp: messageData.Timestamp || messageData.timestamp || new Date().toISOString(),
        isOwn: (messageData.SenderId || messageData.senderId) === user?.id
      };
    } else {
      console.warn('Unknown message format:', messageData);
      return;
    }
    // Добавляем новое сообщение в конец массива (самое новое)
    setMessages(prev => [...prev, newMsg]);
  };

  // Обработчик истории сообщений
  const handleMessageHistory = (historyData) => {
    console.log('📜 Received message history:', historyData);
    
    if (!historyData) {
      console.error('History data is null or undefined');
      return;
    }
    
    let messagesArray, totalCount;
    
    if (Array.isArray(historyData)) {
      messagesArray = historyData;
      totalCount = historyData.length;
    } else if (historyData.Messages && Array.isArray(historyData.Messages)) {
      messagesArray = historyData.Messages;
      totalCount = historyData.TotalCount || historyData.totalCount || messagesArray.length;
    } else if (historyData.messages && Array.isArray(historyData.messages)) {
      messagesArray = historyData.messages;
      totalCount = historyData.totalCount || historyData.TotalCount || messagesArray.length;
    } else {
      console.error('Unknown history data format:', historyData);
      return;
    }
    
    // Сортируем сообщения по дате (от старых к новым)
    const sortedMessages = [...messagesArray].sort((a, b) => {
      const dateA = new Date(a.Timestamp || a.timestamp || a.CreatedAt || a.createdAt || 0);
      const dateB = new Date(b.Timestamp || b.timestamp || b.CreatedAt || b.createdAt || 0);
      return dateA.getTime() - dateB.getTime();
    });
    
    const formattedMessages = sortedMessages.map(msg => ({
      id: msg.MessageId || msg.id || msg.Id || Date.now(),
      text: msg.Text || msg.text || msg.Message || msg.message || '',
      senderId: msg.SenderId || msg.senderId || msg.UserId || msg.userId,
      senderName: msg.SenderName || msg.senderName || 
                  msg.User?.Name || msg.user?.name || 
                  'Неизвестный',
      timestamp: msg.Timestamp || msg.timestamp || 
                 msg.CreatedAt || msg.createdAt || 
                 new Date().toISOString(),
      isOwn: (msg.SenderId || msg.senderId || msg.UserId || msg.userId) === user?.id
    }));
    
    console.log('📝 Formatted and sorted messages:', formattedMessages);
    
    handleFormattedMessages(formattedMessages, totalCount, page);
  };

  // Обработка отформатированных сообщений
  const handleFormattedMessages = (formattedMessages, totalCount, currentPage) => {
    if (currentPage === 1) {
      // Для первой страницы просто устанавливаем сообщения
      setMessages(formattedMessages);
      setTimeout(() => scrollToBottom(), 100); // Скроллим к самому новому сообщению
    } else {
      // Для последующих страниц добавляем старые сообщения в начало
      setMessages(prev => [...formattedMessages, ...prev]);
    }
    
    setTotalMessages(totalCount);
    setHasMore(formattedMessages.length === pageSize);
    setPage(currentPage);
  };

  // Ручная обработка истории через REST API
  const handleManualHistoryResponse = (formattedMessages, totalCount, currentPage) => {
    handleFormattedMessages(formattedMessages, totalCount, currentPage);
  };

  // Обработчик ошибок хаба
  const handleHubError = (error) => {
    console.error('Hub error:', error);
    setError(`Ошибка чата: ${error}`);
  };

  // Отправка сообщения
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSending) return;
    
    if (!SignalRService.isConnected()) {
      setError('Нет подключения к чату');
      return;
    }

    try {
      setIsSending(true);
      setError('');

      const messageDto = {
        DealId: dealId,
        Text: newMessage.trim()
      };

      console.log('📤 Sending message:', messageDto);
      await SignalRService.sendMessage(messageDto);
      
      // Добавляем сообщение локально для мгновенного отображения
      const tempMessage = {
        id: Date.now(),
        text: newMessage.trim(),
        senderId: user.id,
        senderName: user.name,
        timestamp: new Date().toISOString(),
        isOwn: false //пока пусть будет так, надо поправить бек, чтобы isown работал
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Ошибка отправки сообщения: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  // Загрузка предыдущих сообщений
  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      loadMessageHistory(page + 1);
    }
  };

  // Форматирование времени
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return '--:--';
      }
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  // Форматирование даты
  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Неизвестная дата';
      }
      
      const today = new Date();
      
      if (date.toDateString() === today.toDateString()) {
        return 'Сегодня';
      }
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Вчера';
      }
      
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return 'Неизвестная дата';
    }
  };

  // Группировка сообщений по датам (уже отсортированы от старых к новым)
  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      try {
        const date = new Date(message.timestamp).toDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(message);
      } catch {
        // Игнорируем сообщения с некорректной датой
      }
    });
    
    return groups;
  };

  // Восстановление подключения
  const handleRetryConnection = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const token = localStorage.getItem('authToken') || user.token;
      const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
      
      await SignalRService.startConnection(cleanToken);
      setConnectionStatus('connected');
      
      await loadMessageHistory(1);
    } catch (error) {
      setError('Не удалось подключиться: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Тестовая функция для загрузки сообщений напрямую через API
  const loadMessagesDirectly = async () => {
    try {
      setIsLoading(true);
      const response = await AspNetApiService.request(`/Messages/GetByDeal/${dealId}?page=1&pageSize=${pageSize}`);
      
      if (response && Array.isArray(response)) {
        // Сортируем сообщения по дате (от старых к новым)
        const sortedResponse = [...response].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.CreatedAt || 0);
          const dateB = new Date(b.createdAt || b.CreatedAt || 0);
          return dateA.getTime() - dateB.getTime();
        });
        
        const formattedMessages = sortedResponse.map(msg => ({
          id: msg.id || msg.Id,
          text: msg.text || msg.Text,
          senderId: msg.userId || msg.UserId,
          senderName: msg.user?.name || msg.user?.Name || 'Неизвестный',
          timestamp: msg.createdAt || msg.CreatedAt || new Date().toISOString(),
          isOwn: (msg.userId || msg.UserId) === user?.id
        }));
        
        setMessages(formattedMessages);
        setTotalMessages(response.length);
        setHasMore(response.length === pageSize);
        setError('');
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      setError('Ошибка загрузки сообщений: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="deal-chat-container">
        <div className="chat-loading">
          <div className="loading-spinner"></div>
          <p>Подключение к чату...</p>
          <button 
            className="retry-button"
            onClick={loadMessagesDirectly}
            style={{ marginTop: '10px' }}
          >
            Загрузить сообщения напрямую
          </button>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="deal-chat-container">
      <div className="chat-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          ← Назад
        </button>
        
        <div className="deal-info">
          <h2>Чат по сделке #{dealId?.substring(0, 8)}</h2>
          {dealInfo && (
            <p className="deal-details">
              {dealInfo.description || 'Обсуждение сделки'}
            </p>
          )}
        </div>
        
        <div className="connection-status">
          <span className={`status-indicator ${connectionStatus}`}>
            {connectionStatus === 'connected' && '🟢 Онлайн'}
            {connectionStatus === 'reconnecting' && '🟡 Переподключение...'}
            {connectionStatus === 'disconnected' && '🔴 Офлайн'}
          </span>
          {connectionStatus === 'disconnected' && (
            <button 
              className="retry-button small"
              onClick={handleRetryConnection}
              style={{ marginLeft: '10px' }}
            >
              Подключиться
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="global-error">
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={handleRetryConnection}>Попробовать снова</button>
            <button onClick={loadMessagesDirectly}>Загрузить сообщения напрямую</button>
          </div>
        </div>
      )}

      <div className="chat-main-wrapper">
        <div className="chat-messages-wrapper">
          <div 
            className="messages-container" 
            ref={messagesContainerRef}
          >
            {messages.length === 0 ? (
              <div className="no-messages">
                <p>Сообщений пока нет</p>
                <p className="hint">Начните общение первым!</p>
              </div>
            ) : (
              <>
                {hasMore && (
                  <div className="load-more-container">
                    <button 
                      className="load-more-button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? 'Загрузка...' : 'Загрузить предыдущие сообщения'}
                    </button>
                  </div>
                )}

                {Object.entries(messageGroups).map(([date, dateMessages]) => (
                  <div key={date} className="date-group">
                    <div className="date-divider">
                      <span>{formatDate(new Date(date))}</span>
                    </div>
                    
                    {dateMessages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`message ${message.isOwn ? 'outgoing' : 'incoming'}`}
                      >
                        <div className="message-content">
                          <div className="message-text">{message.text}</div>
                          <div className="message-footer">
                            <span className="message-time">
                              {formatTime(message.timestamp)}
                              {message.isOwn && ' ✓'}
                            </span>
                            {!message.isOwn && (
                              <span className="sender-name">{message.senderName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="chat-input-area">
          <form onSubmit={handleSendMessage} className="message-form">
            <div className="input-wrapper">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Введите сообщение..."
                className="message-input"
                disabled={isSending || connectionStatus !== 'connected'}
                rows="3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                    setTimeout(() => scrollToBottom(), 100);
                  }
                }}
              />
              
              <button
                type="submit"
                className="send-button"
                disabled={!newMessage.trim() || isSending || connectionStatus !== 'connected'}
              >
                {isSending ? (
                  <span className="sending-spinner"></span>
                ) : (
                  'Отправить'
                )}
              </button>
            </div>
            
            <div className="input-hint">
              {connectionStatus !== 'connected' ? (
                <span className="connection-warning">
                  Нет подключения. Сообщения не будут отправлены.
                </span>
              ) : (
                <span>Нажмите Enter для отправки, Shift+Enter для новой строки</span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DealChat;