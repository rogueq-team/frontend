import * as signalR from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.hubUrl = 'http://localhost:5050/chatHub'; // URL вашего хаба
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3 секунды
  }

  // Инициализация подключения
  async startConnection(authToken) {
    if (this.isConnecting || (this.connection && this.connection.state === signalR.HubConnectionState.Connected)) {
      console.log('Connection already exists or is connecting');
      return this.connection;
    }

    this.isConnecting = true;
    
    try {
      console.log('🚀 Starting SignalR connection...');
      
      // Создаем подключение
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(this.hubUrl, {
          accessTokenFactory: () => authToken,
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
            if (retryContext.elapsedMilliseconds < 10000) {
              return 2000; // 2 секунды для первых 10 секунд
            } else {
              return 5000; // 5 секунд после 10 секунд
            }
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Регистрируем обработчики событий
      this.registerHandlers();

      // Начинаем подключение
      await this.connection.start();
      console.log('✅ SignalR Connected! Connection ID:', this.connection.connectionId);
      
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      
      return this.connection;
      
    } catch (error) {
      console.error('❌ Error starting SignalR connection:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  // Регистрация обработчиков
  registerHandlers() {
    if (!this.connection) return;

    // Обработка получения сообщения
    this.connection.on('GetMessage', (message) => {
      console.log('📨 Received message:', message);
      this.onMessageReceived && this.onMessageReceived(message);
    });

    // Обработка истории сообщений
    this.connection.on('MessageHistory', (history) => {
      console.log('📜 Received message history:', history);
      this.onMessageHistoryReceived && this.onMessageHistoryReceived(history);
    });

    // Обработка ошибок
    this.connection.on('Error', (error) => {
      console.error('❌ Hub Error:', error);
      this.onError && this.onError(error);
    });

    // События подключения
    this.connection.onreconnecting((error) => {
      console.log('🔄 SignalR reconnecting due to error:', error);
      this.onReconnecting && this.onReconnecting(error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log('✅ SignalR reconnected. Connection ID:', connectionId);
      this.onReconnected && this.onReconnected(connectionId);
    });

    this.connection.onclose((error) => {
      console.log('🔌 SignalR connection closed:', error);
      this.onClose && this.onClose(error);
    });
  }

  // Отправка сообщения
  async sendMessage(messageDto) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Connection not established');
    }

    try {
      console.log('📤 Sending message:', messageDto);
      await this.connection.invoke('SendTo', messageDto);
      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  // Получение истории сообщений
  async getMessageHistory(dealId, page = 1, pageSize = 50) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Connection not established');
    }

    try {
      console.log('📜 Requesting message history for deal:', dealId);
      await this.connection.invoke('GetMessageHistory', dealId, page, pageSize);
    } catch (error) {
      console.error('❌ Error getting message history:', error);
      throw error;
    }
  }

  // Остановка подключения
  async stopConnection() {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('🛑 SignalR connection stopped');
      } catch (error) {
        console.error('Error stopping connection:', error);
      } finally {
        this.connection = null;
        this.isConnecting = false;
      }
    }
  }

  // Установка обработчиков
  setOnMessageReceived(handler) {
    this.onMessageReceived = handler;
  }

  setOnMessageHistoryReceived(handler) {
    this.onMessageHistoryReceived = handler;
  }

  setOnError(handler) {
    this.onError = handler;
  }

  setOnReconnecting(handler) {
    this.onReconnecting = handler;
  }

  setOnReconnected(handler) {
    this.onReconnected = handler;
  }

  setOnClose(handler) {
    this.onClose = handler;
  }

  // Проверка состояния подключения
  isConnected() {
    return this.connection && this.connection.state === signalR.HubConnectionState.Connected;
  }

  getConnectionState() {
    return this.connection ? this.connection.state : signalR.HubConnectionState.Disconnected;
  }
}

export default new SignalRService();