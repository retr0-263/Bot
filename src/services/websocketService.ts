// WebSocket service for real-time order updates and notifications
type MessageHandler = (data: any) => void;
type ConnectionHandler = (connected: boolean) => void;

export interface WebSocketMessage {
  type: 'order_update' | 'new_order' | 'broadcast_update' | 'notification' | 'ping';
  data: any;
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
  private messageQueue: WebSocketMessage[] = [];
  private isManuallyDisconnected = false;

  constructor() {
    // Get WebSocket URL from environment or construct from current URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_URL || window.location.host;
    this.url = `${protocol}//${host}/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(merchantId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.ws?.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }

        this.isManuallyDisconnected = false;
        const wsUrl = `${this.url}?merchant_id=${merchantId}&token=${token}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
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
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.notifyConnectionHandlers(false);
          this.clearPingInterval();

          if (!this.isManuallyDisconnected && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
              this.connect(merchantId, token).catch((error) => {
                console.error('Reconnection failed:', error);
              });
            }, this.reconnectDelay);
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send message to server
   */
  send(type: string, data: any): void {
    const message: WebSocketMessage = {
      type: type as any,
      data,
      timestamp: new Date().toISOString(),
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
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
   * Subscribe to order updates
   */
  subscribeToOrders(merchantId: string, handler: (order: any) => void): () => void {
    return this.on('order_update', (data) => {
      if (data.merchant_id === merchantId) {
        handler(data);
      }
    });
  }

  /**
   * Subscribe to new orders
   */
  subscribeToNewOrders(merchantId: string, handler: (order: any) => void): () => void {
    return this.on('new_order', (data) => {
      if (data.merchant_id === merchantId) {
        handler(data);
      }
    });
  }

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(handler: (notification: any) => void): () => void {
    return this.on('notification', handler);
  }

  /**
   * Request order updates (pull model)
   */
  requestOrderUpdates(orderId: string): void {
    this.send('request_order_update', { order_id: orderId });
  }

  /**
   * Update order status via WebSocket
   */
  updateOrderStatus(orderId: string, status: string): void {
    this.send('update_order_status', {
      order_id: orderId,
      status,
    });
  }

  /**
   * Private: Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message.data);
        } catch (error) {
          console.error(`Error in message handler for ${message.type}:`, error);
        }
      });
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
        console.error('Error in connection handler:', error);
      }
    });
  }

  /**
   * Private: Setup ping interval to keep connection alive
   */
  private setupPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', {});
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
   * Private: Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }
}

export const websocketService = new WebSocketService();
