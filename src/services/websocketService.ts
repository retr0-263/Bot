// WebSocket service for real-time order updates and notifications
// Supports multiple event types and rooms with automatic reconnection

type MessageHandler = (data: any) => void;
type ConnectionHandler = (connected: boolean) => void;

export interface WebSocketMessage {
  type: string;
  data?: any;
  room?: string;
  clientId?: string;
  messageHistory?: any[];
  timestamp: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private connectionHandlers: ConnectionHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private isManuallyDisconnected = false;
  private currentMerchantId: string = '';
  private currentToken: string = '';
  private userId: string = '';
  private userRole: string = 'customer';
  private connectedAt: Date | null = null;

  constructor() {
    // Get WebSocket URL from environment or construct from current URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_URL || window.location.host;
    this.url = `${protocol}//${host}/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(merchantId: string, token: string, userId?: string, role?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.ws?.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }

        this.isManuallyDisconnected = false;
        this.currentMerchantId = merchantId;
        this.currentToken = token;
        this.userId = userId || '';
        this.userRole = role || 'customer';

        const params = new URLSearchParams();
        if (merchantId) params.append('merchant_id', merchantId);
        if (userId) params.append('user_id', userId);
        if (token) params.append('token', token);
        if (role) params.append('role', role);

        const wsUrl = params.toString() ? `${this.url}?${params.toString()}` : this.url;

        console.log(`[WS] Connecting to ${wsUrl}`);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[WS] Connected successfully');
          this.connectedAt = new Date();
          this.reconnectAttempts = 0;
          this.setupPingInterval();
          this.flushMessageQueue();
          this.notifyConnectionHandlers(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WS] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WS] Disconnected');
          this.notifyConnectionHandlers(false);
          this.clearPingInterval();
          this.clearPongTimeout();

          if (!this.isManuallyDisconnected && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[WS] Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
              this.connect(this.currentMerchantId, this.currentToken, this.userId, this.userRole).catch((error) => {
                console.error('[WS] Reconnection failed:', error);
              });
            }, this.reconnectDelay * this.reconnectAttempts); // Exponential backoff
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.isManuallyDisconnected = true;
    this.clearPingInterval();
    this.clearPongTimeout();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send message to server
   */
  send(type: string, data?: any, room?: string): void {
    const message: WebSocketMessage = {
      type,
      data,
      room,
      timestamp: new Date().toISOString(),
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  /**
   * Subscribe to room
   */
  subscribeToRoom(room: string): void {
    this.send('subscribe', { room });
  }

  /**
   * Unsubscribe from room
   */
  unsubscribeFromRoom(room: string): void {
    this.send('unsubscribe', { room });
  }

  /**
   * Subscribe to message type
   */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);

    // Return unsubscribe function
    return () => this.off(type, handler);
  }

  /**
   * Unsubscribe from message type
   */
  off(type: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(type);
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index >= 0) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index >= 0) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection info
   */
  getConnectionInfo() {
    return {
      connected: this.isConnected(),
      connectedAt: this.connectedAt,
      merchantId: this.currentMerchantId,
      userId: this.userId,
      role: this.userRole,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Subscribe to order updates
   */
  subscribeToOrders(merchantId: string, handler: (order: any) => void): () => void {
    return this.on('order_status_changed', (data) => {
      handler(data);
    });
  }

  /**
   * Subscribe to new orders
   */
  subscribeToNewOrders(handler: (order: any) => void): () => void {
    return this.on('new_order', handler);
  }

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(handler: (notification: any) => void): () => void {
    return this.on('merchant_notification', handler);
  }

  /**
   * Subscribe to bot status
   */
  subscribeToBotStatus(handler: (status: any) => void): () => void {
    return this.on('bot_status', handler);
  }

  /**
   * Subscribe to bot messages
   */
  subscribeToBotMessages(handler: (message: any) => void): () => void {
    return this.on('bot_message', handler);
  }

  /**
   * Subscribe to user activity
   */
  subscribeToUserActivity(handler: (activity: any) => void): () => void {
    return this.on('user_activity', handler);
  }

  /**
   * Update order status via WebSocket
   */
  updateOrderStatus(orderId: string, status: string, details?: any): void {
    this.send('order_status_update', {
      orderId,
      status,
      details,
    });
  }

  /**
   * Send merchant notification
   */
  sendMerchantNotification(merchantId: string, notification: string, level?: string): void {
    this.send('merchant_notification', {
      merchantId,
      notification,
      level: level || 'info',
    });
  }

  /**
   * Track user activity
   */
  trackUserActivity(action: string, details?: any): void {
    this.send('user_activity', {
      action,
      details,
    });
  }

  /**
   * Request bot status
   */
  requestBotStatus(): void {
    this.send('bot_status_request');
  }

  /**
   * Private: Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    // Log the message
    console.log(`[WS] Received ${message.type}:`, message.data);

    // Special handling for connection established
    if (message.type === 'connection_established') {
      console.log('[WS] Connection established with clientId:', message.clientId);
      if (message.messageHistory) {
        console.log('[WS] Loaded message history:', message.messageHistory.length, 'messages');
      }
    }

    // Route to appropriate handlers
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message.data);
        } catch (error) {
          console.error(`[WS] Error in handler for ${message.type}:`, error);
        }
      });
    } else if (message.type !== 'pong') {
      console.warn(`[WS] No handler registered for message type: ${message.type}`);
    }
  }

  /**
   * Private: Notify connection state change
   */
  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (error) {
        console.error('[WS] Error in connection handler:', error);
      }
    });
  }

  /**
   * Private: Setup ping interval to keep connection alive
   */
  private setupPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping');
        
        // Setup pong timeout
        this.pongTimeout = setTimeout(() => {
          console.warn('[WS] Pong timeout - connection may be dead');
          this.ws?.close();
        }, 5000);
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Private: Clear ping interval
   */
  private clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Private: Clear pong timeout
   */
  private clearPongTimeout(): void {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  /**
   * Private: Flush queued messages
   */
  private flushMessageQueue(): void {
    console.log(`[WS] Flushing ${this.messageQueue.length} queued messages`);
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }
}

export const websocketService = new WebSocketService();
