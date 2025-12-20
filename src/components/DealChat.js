import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AspNetApiService from '../services/aspnetApi';
import SignalRService from '../services/signalrService';
import './DealChat.css';

const DealChat = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUserInfo } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dealInfo, setDealInfo] = useState(null);
  const [applicationInfo, setApplicationInfo] = useState(null);
  const [otherUserInfo, setOtherUserInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isSending, setIsSending] = useState(false);
  const [page, setPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isProcessingDeal, setIsProcessingDeal] = useState(false);
  const pageSize = 20;
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Функция для скролла к последнему сообщению
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
      const container = messagesContainerRef.current;
      if (container) {
        const isNearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 100;
        if (isNearBottom) {
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    }
  }, [messages, isLoadingMore, scrollToBottom]);

  // Загрузка информации о сделке и связанных данных
  const loadDealInfo = async () => {
  try {
    console.log('📋 Загрузка информации о сделке...');
    
    // Получаем информацию о сделке
    const dealResponse = await AspNetApiService.getDeal(dealId);
    console.log('✅ Информация о сделке:', dealResponse);
    setDealInfo(dealResponse);
    
    // Получаем информацию о заявке
    if (dealResponse.applicationId) {
      try {
        const appResponse = await AspNetApiService.getApplicationById(dealResponse.applicationId);
        console.log('✅ Информация о заявке:', appResponse);
        setApplicationInfo(appResponse);
      } catch (appError) {
        console.error('Error loading application info:', appError);
      }
    }
    
    console.log('👤 Текущий пользователь:', user);
    
    // Определяем ID другого пользователя
    let otherUserId = null;
    if (dealResponse.advertiserId === user?.id) {
      otherUserId = dealResponse.platformId;
      console.log('🔹 Пользователь является рекламодателем в сделке');
    } else if (dealResponse.platformId === user?.id) {
      otherUserId = dealResponse.advertiserId;
      console.log('🔹 Пользователь является контент-мейкером в сделке');
    } else {
      console.log('⚠️ Пользователь не участвует в сделке');
    }
    
    // Загружаем информацию о другом пользователе
    if (otherUserId) {
      try {
        const userResponse = await AspNetApiService.getUser(otherUserId);
        console.log('✅ Информация о другом пользователе:', userResponse);
        setOtherUserInfo(userResponse);
      } catch (userError) {
        console.error('Error loading other user info:', userError);
      }
    }
    
  } catch (error) {
    console.error('Error loading deal info:', error);
    setError('Ошибка загрузки информации о сделке');
  }
};

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

        // Загружаем информацию о сделке и связанных данных
        await loadDealInfo();

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

        // Начинаем подключение и ждем его установления
        await SignalRService.startConnection(cleanToken);
        setConnectionStatus('connected');
        
        // Ждем полного установления подключения
        await new Promise(resolve => setTimeout(resolve, 500));

        // Загружаем историю сообщений ТОЛЬКО после установки подключения
        await loadMessageHistory(1);

      } catch (error) {
        console.error('Error initializing chat:', error);
        setError('Ошибка подключения к чату: ' + error.message);
        
        // Если SignalR не работает, пробуем загрузить через REST API
        try {
          console.log('🔄 SignalR failed, trying REST API...');
          await loadMessageHistory(1);
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
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

  // Загрузка истории сообщений (остается такой же как в предыдущем ответе)
  const loadMessageHistory = async (pageNumber) => {
    try {
      console.log(`📜 Loading message history for deal ${dealId}, page ${pageNumber}`);
      
      const restoreScroll = preserveScrollPosition();
      setIsLoadingMore(pageNumber > 1);
      
      // Проверяем подключение к SignalR
      const isSignalRConnected = SignalRService.isConnected();
      console.log(`🔗 SignalR connected: ${isSignalRConnected}`);
      
      if (isSignalRConnected) {
        // Вызываем метод хаба через SignalR
        await SignalRService.getMessageHistory(dealId, pageNumber, pageSize);
        return;
      }
      
      console.log('🔄 SignalR not connected, using REST API fallback...');
      throw new Error('SignalR not connected');
      
    } catch (error) {
      console.error('Error in SignalR or fallback:', error);
      
      // Если через SignalR не работает, пробуем через REST API
      try {
        console.log('🔄 Trying REST API for message history...');
        const response = await AspNetApiService.request(`/Messages/GetByDeal/${dealId}?page=${pageNumber}&pageSize=${pageSize}`);
        
        if (response && Array.isArray(response)) {
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
        setError('Ошибка загрузки истории сообщений. Проверьте подключение.');
      }
    } finally {
      if (pageNumber > 1) {
        setIsLoadingMore(false);
      }
    }
  };

  // Обработчик нового сообщения (остается такой же)
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
    
    setMessages(prev => [...prev, newMsg]);
  };

  // Обработчик истории сообщений (остается такой же)
  const handleMessageHistory = (historyData) => {
    console.log('📜 Received message history:', historyData);
    
    if (!historyData) {
      console.error('History data is null or undefined');
      handleFormattedMessages([], 0, 1);
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
      messagesArray = [historyData];
      totalCount = 1;
    }
    
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
      setMessages(formattedMessages);
      setTimeout(() => scrollToBottom(), 100);
    } else {
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

  // Отправка сообщения (остается такой же)
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
      
      const tempMessage = {
        id: Date.now(),
        text: newMessage.trim(),
        senderId: user.id,
        senderName: user.name,
        timestamp: new Date().toISOString(),
        isOwn: false
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

  // Группировка сообщений по датам
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

  // ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ СДЕЛКОЙ

  // Проверяем, является ли текущий пользователь рекламодателем в этой сделке
  const isAdvertiserInDeal = () => {
    console.log('🔍 Проверка является ли рекламодателем:');
    console.log('  - user?.id:', user?.id);
    console.log('  - dealInfo?.advertiserId:', dealInfo?.advertiserId);
    console.log('  - result:', user?.id === dealInfo?.advertiserId);
    return user?.id === dealInfo?.advertiserId;
  };

  // Проверяем, является ли текущий пользователь контент-мейкером в этой сделке
  const isContentMakerInDeal = () => {
    return user?.id === dealInfo?.platformId;
  };

  // Получаем стоимость сделки из информации о заявке
  const getDealCost = () => {
    return applicationInfo?.cost || 0;
  };

  // Подготовка диалога подтверждения
  const showConfirmationDialog = (action) => {
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  // Закрытие диалога подтверждения
  const closeConfirmationDialog = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  // Обновление баланса пользователя
  const updateUserBalance = async (userId, amount, isIncrement = true) => {
    try {
      console.log(`🔄 Обновление баланса пользователя ${userId} на ${amount} (${isIncrement ? '+' : '-'})`);
      
      // Получаем текущую информацию о пользователе
      const userInfo = await AspNetApiService.getUser(userId);
      const currentBalance = userInfo?.balance || 0;
      
      // Рассчитываем новый баланс
      const newBalance = isIncrement 
        ? currentBalance + amount 
        : currentBalance - amount;
      
      // Обновляем информацию о пользователе через API
      const updateData = {
        name: userInfo.name,
        login: userInfo.login,
        email: userInfo.email,
        role: userInfo.role,
        type: userInfo.type,
        balance: newBalance,
        avatarPath: userInfo.avatarPath || null,
        bio: userInfo.bio || null,
        socialLinks: userInfo.socialLinks || []
      };
      
      console.log('📤 Данные для обновления пользователя:', updateData);
      
      const response = await AspNetApiService.updateUserInfo(updateData);
      
      if (response && (response.success !== false)) {
        console.log(`✅ Баланс пользователя ${userId} обновлен: ${currentBalance} → ${newBalance}`);
        return true;
      } else {
        console.error('❌ Ошибка обновления баланса:', response);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Ошибка при обновлении баланса:', error);
      return false;
    }
  };

  // Обновление статуса сделки
  const updateDealStatus = async (newStatus) => {
    try {
      console.log(`🔄 Обновление статуса сделки ${dealId} на ${newStatus}`);
      
      const response = await AspNetApiService.updateDealStatus(dealId, newStatus);
      
      if (response && (response.success !== false)) {
        console.log(`✅ Статус сделки обновлен: ${newStatus}`);
        
        // Обновляем локальную информацию о сделке
        setDealInfo(prev => ({
          ...prev,
          status: newStatus
        }));
        
        return true;
      } else {
        console.error('❌ Ошибка обновления статуса сделки:', response);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Ошибка при обновлении статуса сделки:', error);
      return false;
    }
  };

  // Обработка отмены сделки
  const handleCancelDeal = async () => {
    setIsProcessingDeal(true);
    
    try {
      const dealCost = getDealCost();
      
      // 1. Возвращаем деньги рекламодателю (увеличиваем баланс)
      const advertiserUpdated = await updateUserBalance(
        dealInfo.advertiserId,
        dealCost,
        true // increment
      );
      
      if (!advertiserUpdated) {
        throw new Error('Не удалось вернуть деньги рекламодателю');
      }
      
      // 2. Обновляем статус сделки на "Отменена" (3)
      const statusUpdated = await updateDealStatus(3);
      
      if (!statusUpdated) {
        throw new Error('Не удалось обновить статус сделки');
      }
      
      // 3. Отправляем системное сообщение в чат
      const systemMessage = `Сделка отменена. ${dealCost} ₽ возвращены на баланс рекламодателя.`;
      await sendSystemMessage(systemMessage);
      
      alert('✅ Сделка отменена. Деньги возвращены на баланс рекламодателя.');
      
      // 4. Закрываем диалог подтверждения
      closeConfirmationDialog();
      
    } catch (error) {
      console.error('❌ Ошибка отмены сделки:', error);
      alert(`❌ Не удалось отменить сделку: ${error.message}`);
    } finally {
      setIsProcessingDeal(false);
    }
  };

  // Обработка завершения сделки
  const handleCompleteDeal = async () => {
    setIsProcessingDeal(true);
    
    try {
      const dealCost = getDealCost();
      
      // 1. Списываем деньги с баланса рекламодателя
      const advertiserUpdated = await updateUserBalance(
        dealInfo.advertiserId,
        dealCost,
        false // decrement
      );
      
      if (!advertiserUpdated) {
        throw new Error('Не удалось списать деньги с баланса рекламодателя');
      }
      
      // 2. Начисляем деньги на баланс контент-мейкера
      const contentMakerUpdated = await updateUserBalance(
        dealInfo.platformId,
        dealCost,
        true // increment
      );
      
      if (!contentMakerUpdated) {
        throw new Error('Не удалось начислить деньги контент-мейкеру');
      }
      
      // 3. Обновляем статус сделки на "Завершена" (2)
      const statusUpdated = await updateDealStatus(2);
      
      if (!statusUpdated) {
        throw new Error('Не удалось обновить статус сделки');
      }
      
      // 4. Отправляем системное сообщение в чат
      const systemMessage = `Сделка завершена. ${dealCost} ₽ переведены контент-мейкеру.`;
      await sendSystemMessage(systemMessage);
      
      alert('✅ Сделка завершена. Деньги переведены контент-мейкеру.');
      
      // 5. Закрываем диалог подтверждения
      closeConfirmationDialog();
      
    } catch (error) {
      console.error('❌ Ошибка завершения сделки:', error);
      alert(`❌ Не удалось завершить сделку: ${error.message}`);
    } finally {
      setIsProcessingDeal(false);
    }
  };

  // Отправка системного сообщения в чат
  const sendSystemMessage = async (text) => {
    try {
      if (SignalRService.isConnected()) {
        const messageDto = {
          DealId: dealId,
          Text: text,
          IsSystem: true
        };
        
        await SignalRService.sendMessage(messageDto);
      }
    } catch (error) {
      console.error('❌ Ошибка отправки системного сообщения:', error);
    }
  };

  // Обработчик подтверждения действия
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    
    if (confirmAction === 'cancel') {
      await handleCancelDeal();
    } else if (confirmAction === 'complete') {
      await handleCompleteDeal();
    }
  };

  // Проверка, можно ли управлять сделкой
  const canManageDeal = () => {
    // Проверяем что сделка активна (статус 1 - "В работе")
    const isDealActive = dealInfo?.status === 1;
  
    // Проверяем что пользователь - рекламодатель в этой сделке
    const isDealAdvertiser = isAdvertiserInDeal();
    
    console.log('🔍 Проверка прав управления сделкой:');
    console.log('  - dealInfo:', dealInfo);
    console.log('  - dealInfo?.status:', dealInfo?.status);
    console.log('  - isDealActive:', isDealActive);
    console.log('  - user?.id:', user?.id);
    console.log('  - dealInfo?.advertiserId:', dealInfo?.advertiserId);
    console.log('  - isDealAdvertiser:', isDealAdvertiser);
    console.log('  - canManageDeal:', isDealActive && isDealAdvertiser);
    
    return isDealActive && isDealAdvertiser;
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
            <div className="deal-details">
              <p>{dealInfo.description || 'Обсуждение сделки'}</p>
              {applicationInfo && (
                <p className="deal-cost">
                  Стоимость: <strong>{applicationInfo.cost?.toLocaleString('ru-RU')} ₽</strong>
                </p>
              )}
              {otherUserInfo && (
                <p className="other-user">
                  Собеседник: <strong>{otherUserInfo.name}</strong> ({otherUserInfo.userType === 1 ? 'Рекламодатель' : 'Контент-мейкер'})
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="deal-actions">
          {canManageDeal() && (
            <div className="action-buttons">
              <button 
                className="deal-action-btn cancel-btn"
                onClick={() => showConfirmationDialog('cancel')}
                disabled={isProcessingDeal || dealInfo?.status !== 1}
              >
                ❌ Отменить сделку
              </button>
              <button 
                className="deal-action-btn complete-btn"
                onClick={() => showConfirmationDialog('complete')}
                disabled={isProcessingDeal || dealInfo?.status !== 1}
              >
                ✅ Завершить сделку
              </button>
            </div>
          )}
          
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

      {/* Диалог подтверждения */}
      {showConfirmDialog && (
        <div className="confirmation-dialog-overlay">
          <div className="confirmation-dialog">
            <h3>Подтвердите действие</h3>
            
            {confirmAction === 'cancel' && (
              <>
                <p>Вы уверены, что хотите отменить сделку?</p>
                <p className="dialog-detail">
                  При отмене сделки <strong>{getDealCost().toLocaleString('ru-RU')} ₽</strong> будут возвращены на баланс рекламодателя.
                </p>
              </>
            )}
            
            {confirmAction === 'complete' && (
              <>
                <p>Вы уверены, что хотите завершить сделку?</p>
                <p className="dialog-detail">
                  При завершении сделки <strong>{getDealCost().toLocaleString('ru-RU')} ₽</strong> будут переведены контент-мейкеру.
                </p>
              </>
            )}
            
            <div className="dialog-actions">
              <button 
                className="dialog-btn confirm-btn"
                onClick={handleConfirmAction}
                disabled={isProcessingDeal}
              >
                {isProcessingDeal ? 'Обработка...' : 'Подтвердить'}
              </button>
              <button 
                className="dialog-btn cancel-btn"
                onClick={closeConfirmationDialog}
                disabled={isProcessingDeal}
              >
                Отмена
              </button>
            </div>
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