/**
 * WebSocket Server for Real-Time Communication
 * Handles bot events, order updates, merchant notifications, and live dashboard updates
 */

const WebSocket = require('ws');
const url = require('url');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class WebSocketServer {
  constructor(httpServer) {
    this.wss = new WebSocket.Server({ server: httpServer });
    this.clients = new Map(); // Map<clientId, clientData>
    this.rooms = new Map(); // Map<roomName, Set<clientIds>>
    this.messageHistory = []; // Store last 100 messages for new connections
    this.maxHistorySize = 100;

    this.setupEventHandlers();
    this.startHealthCheck();
    
    console.log(chalk.blue('✅ WebSocket Server initialized'));
  }

  setupEventHandlers() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      const queryParams = url.parse(req.url, true).query;
      const { merchant_id, user_id, token, role = 'customer' } = queryParams;

      // Create client data
      const clientData = {
        id: clientId,
        ws,
        merchantId: merchant_id,
        userId: user_id,
        token,
        role,
        connectedAt: new Date(),
        subscriptions: new Set(),
        isAlive: true,
      };

      this.clients.set(clientId, clientData);

      console.log(chalk.green(`[WS] Client connected: ${clientId} (${role} - ${merchant_id || user_id})`));

      // Send welcome message with connection history
      this.sendToClient(clientId, {
        type: 'connection_established',
        clientId,
        timestamp: new Date().toISOString(),
        messageHistory: this.messageHistory.slice(-10), // Last 10 messages
      });

      // Setup client event handlers
      ws.on('message', (data) => this.handleMessage(clientId, data));
      ws.on('pong', () => this.handlePong(clientId));
      ws.on('close', () => this.handleDisconnect(clientId));
      ws.on('error', (error) => this.handleError(clientId, error));
    });

    console.log(chalk.blue('📡 WebSocket event handlers configured'));
  }

  /**
   * Handle incoming messages from clients
   */
  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data.toString());
      const clientData = this.clients.get(clientId);

      if (!clientData) return;

      // Handle different message types
      switch (message.type) {
        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() });
          break;

        case 'subscribe':
          this.handleSubscribe(clientId, message);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(clientId, message);
          break;

        case 'bot_status_request':
          this.broadcastBotStatus();
          break;

        case 'order_status_update':
          this.handleOrderStatusUpdate(clientId, message);
          break;

        case 'merchant_notification':
          this.handleMerchantNotification(clientId, message);
          break;

        case 'user_activity':
          this.handleUserActivity(clientId, message);
          break;

        default:
          console.log(chalk.yellow(`Unknown message type: ${message.type}`));
      }
    } catch (error) {
      console.error(chalk.red(`Error handling message: ${error.message}`));
    }
  }

  /**
   * Handle client subscription to rooms
   */
  handleSubscribe(clientId, message) {
    const { room } = message;
    const clientData = this.clients.get(clientId);

    if (!clientData || !room) return;

    // Add client to room
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room).add(clientId);
    clientData.subscriptions.add(room);

    console.log(chalk.cyan(`[WS] Client ${clientId} subscribed to ${room}`));

    // Send confirmation
    this.sendToClient(clientId, {
      type: 'subscription_confirmed',
      room,
      timestamp: new Date().toISOString(),
    });

    // Notify others in room
    this.broadcastToRoom(room, {
      type: 'user_joined',
      clientId,
      roomSize: this.rooms.get(room).size,
      timestamp: new Date().toISOString(),
    }, clientId); // Exclude sender
  }

  /**
   * Handle client unsubscription from rooms
   */
  handleUnsubscribe(clientId, message) {
    const { room } = message;
    const clientData = this.clients.get(clientId);

    if (!clientData || !room) return;

    // Remove client from room
    if (this.rooms.has(room)) {
      this.rooms.get(room).delete(clientId);
      if (this.rooms.get(room).size === 0) {
        this.rooms.delete(room);
      }
    }
    clientData.subscriptions.delete(room);

    console.log(chalk.cyan(`[WS] Client ${clientId} unsubscribed from ${room}`));

    this.sendToClient(clientId, {
      type: 'unsubscription_confirmed',
      room,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle order status updates
   */
  handleOrderStatusUpdate(clientId, message) {
    const { orderId, status, details } = message;
    const clientData = this.clients.get(clientId);

    if (!clientData) return;

    const updateMessage = {
      type: 'order_status_changed',
      orderId,
      status,
      details,
      updatedBy: clientData.role,
      timestamp: new Date().toISOString(),
    };

    // Store in history
    this.addToHistory(updateMessage);

    // Broadcast to relevant subscribers
    const merchantRoom = `merchant_${clientData.merchantId}`;
    const orderRoom = `order_${orderId}`;

    this.broadcastToRoom(merchantRoom, updateMessage);
    this.broadcastToRoom(orderRoom, updateMessage);

    console.log(chalk.green(`✅ Order ${orderId} updated to ${status}`));
  }

  /**
   * Handle merchant notifications
   */
  handleMerchantNotification(clientId, message) {
    const { merchantId, notification, level = 'info' } = message;
    const clientData = this.clients.get(clientId);

    if (!clientData) return;

    const notificationMessage = {
      type: 'merchant_notification',
      merchantId,
      notification,
      level,
      sentBy: clientData.role,
      timestamp: new Date().toISOString(),
    };

    this.addToHistory(notificationMessage);

    // Broadcast to merchant's dashboard
    const room = `merchant_${merchantId}`;
    this.broadcastToRoom(room, notificationMessage);

    console.log(chalk.blue(`📢 Merchant ${merchantId} notification: ${notification}`));
  }

  /**
   * Handle user activity tracking
   */
  handleUserActivity(clientId, message) {
    const { action, details } = message;
    const clientData = this.clients.get(clientId);

    if (!clientData) return;

    const activityMessage = {
      type: 'user_activity',
      userId: clientData.userId,
      action,
      details,
      role: clientData.role,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to admin dashboard
    this.broadcastToRoom('admin_dashboard', activityMessage);
  }

  /**
   * Handle pong message (keep-alive)
   */
  handlePong(clientId) {
    const clientData = this.clients.get(clientId);
    if (clientData) {
      clientData.isAlive = true;
    }
  }

  /**
   * Handle client disconnect
   */
  handleDisconnect(clientId) {
    const clientData = this.clients.get(clientId);

    // Remove client from all rooms
    if (clientData) {
      for (const room of clientData.subscriptions) {
        if (this.rooms.has(room)) {
          this.rooms.get(room).delete(clientId);
          if (this.rooms.get(room).size === 0) {
            this.rooms.delete(room);
          }
        }
      }
    }

    this.clients.delete(clientId);
    console.log(chalk.yellow(`[WS] Client disconnected: ${clientId}`));
  }

  /**
   * Handle WebSocket errors
   */
  handleError(clientId, error) {
    console.error(chalk.red(`[WS] Error for client ${clientId}: ${error.message}`));
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId, message) {
    const clientData = this.clients.get(clientId);
    if (clientData && clientData.ws.readyState === WebSocket.OPEN) {
      clientData.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all clients in a room
   */
  broadcastToRoom(room, message, excludeClientId = null) {
    if (!this.rooms.has(room)) return;

    const clients = this.rooms.get(room);
    clients.forEach((clientId) => {
      if (excludeClientId && clientId === excludeClientId) return;
      this.sendToClient(clientId, message);
    });
  }

  /**
   * Broadcast to all connected clients
   */
  broadcastAll(message, excludeClientId = null) {
    this.clients.forEach((clientData, clientId) => {
      if (excludeClientId && clientId === excludeClientId) return;
      if (clientData.ws.readyState === WebSocket.OPEN) {
        clientData.ws.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Broadcast bot status to dashboard
   */
  broadcastBotStatus() {
    const status = {
      type: 'bot_status',
      connected: true,
      connectedClients: this.clients.size,
      activeRooms: this.rooms.size,
      timestamp: new Date().toISOString(),
    };

    this.addToHistory(status);
    this.broadcastAll(status);
  }

  /**
   * Broadcast new order to dashboard
   */
  broadcastNewOrder(order) {
    const message = {
      type: 'new_order',
      order,
      timestamp: new Date().toISOString(),
    };

    this.addToHistory(message);

    // Broadcast to merchant dashboard
    if (order.merchant_id) {
      this.broadcastToRoom(`merchant_${order.merchant_id}`, message);
    }

    // Broadcast to admin dashboard
    this.broadcastToRoom('admin_dashboard', message);
  }

  /**
   * Broadcast bot message to dashboard
   */
  broadcastBotMessage(message) {
    const wsMessage = {
      type: 'bot_message',
      from: message.from,
      text: message.text,
      timestamp: new Date().toISOString(),
    };

    this.addToHistory(wsMessage);
    this.broadcastAll(wsMessage);
  }

  /**
   * Add message to history
   */
  addToHistory(message) {
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift();
    }
  }

  /**
   * Start health check (ping all clients)
   */
  startHealthCheck() {
    setInterval(() => {
      this.clients.forEach((clientData, clientId) => {
        if (!clientData.isAlive) {
          console.log(chalk.yellow(`[WS] Terminating unresponsive client: ${clientId}`));
          clientData.ws.terminate();
          this.handleDisconnect(clientId);
          return;
        }

        clientData.isAlive = false;
        clientData.ws.ping();
      });
    }, 30000); // Check every 30 seconds
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get server statistics
   */
  getStats() {
    return {
      connectedClients: this.clients.size,
      activeRooms: this.rooms.size,
      messageHistorySize: this.messageHistory.length,
      clients: Array.from(this.clients.values()).map((c) => ({
        id: c.id,
        role: c.role,
        merchantId: c.merchantId,
        userId: c.userId,
        connectedAt: c.connectedAt,
        subscriptions: Array.from(c.subscriptions),
      })),
    };
  }
}

module.exports = WebSocketServer;
