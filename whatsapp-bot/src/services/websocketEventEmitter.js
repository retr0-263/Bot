/**
 * WebSocket Event Emitter for Bot
 * Handles communication between bot and real-time dashboard
 */

const EventEmitter = require('events');
const chalk = require('chalk');
const axios = require('axios');

class WebSocketEventEmitter extends EventEmitter {
  constructor(apiBaseUrl = 'http://localhost:5174') {
    super();
    this.apiBaseUrl = apiBaseUrl;
    this.enabled = true;
    this.queue = [];
    this.isConnected = false;
  }

  /**
   * Emit bot connected event
   */
  botConnected(phoneNumber, deviceInfo = {}) {
    const event = {
      type: 'bot_status',
      event: 'connected',
      phoneNumber,
      deviceInfo,
      timestamp: new Date().toISOString(),
    };

    this.broadcast(event);
    console.log(chalk.green('📡 Bot connected event broadcast'));
  }

  /**
   * Emit bot disconnected event
   */
  botDisconnected(reason = 'unknown') {
    const event = {
      type: 'bot_status',
      event: 'disconnected',
      reason,
      timestamp: new Date().toISOString(),
    };

    this.broadcast(event);
    console.log(chalk.yellow('📡 Bot disconnected event broadcast'));
  }

  /**
   * Emit message received event
   */
  messageReceived(from, text, hasMedia = false) {
    const event = {
      type: 'bot_message',
      from,
      text,
      hasMedia,
      timestamp: new Date().toISOString(),
    };

    this.broadcast(event);
    console.log(chalk.blue(`📬 Message from ${from}: broadcast`));
  }

  /**
   * Emit message sent event
   */
  messageSent(to, text, messageId) {
    const event = {
      type: 'bot_message_sent',
      to,
      text,
      messageId,
      timestamp: new Date().toISOString(),
    };

    this.broadcast(event);
  }

  /**
   * Emit command executed event
   */
  commandExecuted(from, command, args = [], status = 'success') {
    const event = {
      type: 'command_executed',
      from,
      command,
      args,
      status,
      timestamp: new Date().toISOString(),
    };

    this.broadcast(event);
    console.log(chalk.cyan(`⚡ Command ${command} executed by ${from}`));
  }

  /**
   * Emit order created event
   */
  orderCreated(order) {
    const event = {
      type: 'new_order',
      order,
      timestamp: new Date().toISOString(),
    };

    this.broadcast(event);
    console.log(chalk.green(`📦 New order created: ${order.id}`));
  }

  /**
   * Emit order status changed event
   */
  orderStatusChanged(orderId, oldStatus, newStatus, details = {}) {
    const event = {
      type: 'order_status_changed',
      orderId,
      oldStatus,
      newStatus,
      details,
      timestamp: new Date().toISOString(),
    };

    this.broadcast(event);
    console.log(chalk.blue(`📦 Order ${orderId}: ${oldStatus} → ${newStatus}`));
  }

  /**
   * Emit user activity event
   */
  userActivity(userId, action, details = {}) {
    const event = {
      type: 'user_activity',
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    };

    this.broadcast(event);
  }

  /**
   * Emit merchant notification
   */
  merchantNotification(merchantId, notification, level = 'info') {
    const event = {
      type: 'merchant_notification',
      merchantId,
      notification,
      level,
      timestamp: new Date().toISOString(),
    };

    this.broadcast(event);
    console.log(chalk.yellow(`📢 Merchant ${merchantId} notification: ${notification}`));
  }

  /**
   * Emit product inventory updated event
   */
  inventoryUpdated(productId, oldQuantity, newQuantity) {
    const event = {
      type: 'inventory_updated',
      productId,
      oldQuantity,
      newQuantity,
      timestamp: new Date().toISOString(),
    };

    this.broadcast(event);
    console.log(chalk.cyan(`📊 Inventory updated: ${productId}`));
  }

  /**
   * Emit error event
   */
  errorOccurred(context, error) {
    const event = {
      type: 'error',
      context,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };

    this.broadcast(event);
    console.log(chalk.red(`❌ Error in ${context}: ${error.message}`));
  }

  /**
   * Broadcast event to WebSocket server
   */
  broadcast(event) {
    if (!this.enabled) return;

    // Add to queue if not connected
    if (!this.isConnected) {
      this.queue.push(event);
      if (this.queue.length > 100) {
        this.queue.shift(); // Keep queue size limited
      }
      return;
    }

    // Send to WebSocket server via HTTP endpoint
    this.sendToServer(event);
  }

  /**
   * Send event to server
   */
  async sendToServer(event) {
    try {
      await axios.post(`${this.apiBaseUrl}/api/ws-event`, event, {
        timeout: 5000,
      });
    } catch (error) {
      console.error(chalk.red(`Failed to send event to server: ${error.message}`));
      // Re-queue the event
      if (this.queue.length < 100) {
        this.queue.push(event);
      }
    }
  }

  /**
   * Flush queued events
   */
  async flushQueue() {
    console.log(chalk.blue(`📡 Flushing ${this.queue.length} queued events`));
    const events = [...this.queue];
    this.queue = [];

    for (const event of events) {
      await this.sendToServer(event);
    }
  }

  /**
   * Set connection status
   */
  setConnected(connected) {
    this.isConnected = connected;
    if (connected) {
      this.flushQueue();
    }
  }

  /**
   * Enable/disable event emission
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      enabled: this.enabled,
      connected: this.isConnected,
      queuedEvents: this.queue.length,
    };
  }
}

module.exports = new WebSocketEventEmitter();
