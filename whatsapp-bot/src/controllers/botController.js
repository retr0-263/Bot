/**
 * Main Bot Controller
 * Orchestrates message handling, routing to handlers, and response delivery
 */

const { getContentType } = require('@whiskeysockets/baileys');
const commandParser = require('../utils/commandParser');
const MessageFormatter = require('../utils/messageFormatter');
const authMiddleware = require('../middlewares/auth');
const rateLimiter = require('../middlewares/rateLimiter');
const connectionHandler = require('../middlewares/connectionHandler');
const cache = require('../database/cache');

const authHandler = require('../handlers/authHandler');
const adminHandler = require('../handlers/adminHandler');
const merchantHandler = require('../handlers/merchantHandler');
const customerHandler = require('../handlers/customerHandler');

const Logger = require('../config/logger');
const constants = require('../config/constants');

const logger = new Logger('BotController');

class BotController {
  /**
   * Main message handler
   */
  async handleMessage(message, sock) {
    try {
      // Validate message
      const validation = connectionHandler.validateMessage(message);
      if (!validation.valid) {
        return;
      }

      // Extract message data
      const messageType = getContentType(message.message);
      if (messageType !== 'conversation' && messageType !== 'extendedTextMessage') {
        return;
      }

      const text = message.message.conversation || 
                   message.message.extendedTextMessage?.text || '';
      const from = message.key.remoteJid;
      const phoneNumber = from.replace('@s.whatsapp.net', '').replace('@g.us', '');

      // Check rate limits
      if (!await rateLimiter.checkMessageLimit(phoneNumber)) {
        await this.sendMessage(sock, from, '🚫 Please slow down. Max 5 messages per minute.');
        return;
      }

      // Process message
      await this.processMessage(text, from, phoneNumber, sock);

    } catch (error) {
      logger.error('Message handling error', error);
    }
  }

  /**
   * Route message to appropriate handler
   */
  async processMessage(text, from, phoneNumber, sock) {
    try {
      const trimmed = text.trim();

      if (!trimmed || trimmed.length < 1) {
        return;
      }

      // Command-based routing
      if (commandParser.isCommand(trimmed)) {
        return await this.handleCommand(trimmed, from, phoneNumber, sock);
      }

      // Natural language intent detection
      const intent = commandParser.detectIntent(trimmed);
      if (intent) {
        return await this.handleNaturalLanguage(trimmed, intent, from, phoneNumber, sock);
      }

    } catch (error) {
      logger.error('Message processing error', error);
      await this.sendMessage(sock, from, '❌ Error processing message');
    }
  }

  /**
   * Handle commands (!command)
   */
  async handleCommand(text, from, phoneNumber, sock) {
    const parsed = commandParser.parseCommand(text);
    if (!parsed) {
      return;
    }

    const { command, args } = parsed;

    try {
      // Check command rate limit
      if (!await rateLimiter.checkCommandLimit(phoneNumber, command)) {
        await this.sendMessage(sock, from, '⏱️ Please wait before using this command again.');
        return;
      }

      let result = null;

      // Route to appropriate handler
      if (['register', 'login', 'logout', 'verify', 'profile', 'help', 'owner', 'about', 'feedback', 'stats'].includes(command)) {
        result = await authHandler.handleAuthCommand(command, args, from, phoneNumber);
      }
      
      else if (['admin', 'merchants', 'approve', 'reject', 'suspend', 'sales', 'logs', 'broadcast', 'stats', 'alerts'].includes(command)) {
        try {
          await authMiddleware.requireAdmin(phoneNumber);
          result = await adminHandler.handleAdminCommand(command, args, from, phoneNumber);
        } catch (error) {
          result = { error: error.message };
        }
      }
      
      else if (['merchant', 'orders', 'products', 'store', 'analytics', 'dashboard', 'add-product', 'edit-product', 
                'delete-product', 'accept', 'reject', 'update-status', 'store-status', 'store-hours', 
                'store-profile', 'settings', 'performance', 'customers', 'feedback', 'boost', 'tips'].includes(command)) {
        try {
          await authMiddleware.requireMerchant(phoneNumber);
          result = await merchantHandler.handleMerchantCommand(command, args, from, phoneNumber);
        } catch (error) {
          result = { error: error.message };
        }
      }
      
      else if (['menu', 'm', 'search', 'categories', 'nearby', 'store', 'add', 'cart', 'c', 'remove',
                'clear', 'checkout', 'pay', 'orders', 'reorder', 'track', 'status', 'rate', 'favorites',
                'addresses', 'deals', 'trending', 'promo', 'featured'].includes(command)) {
        result = await customerHandler.handleCustomerCommand(command, args, from, phoneNumber);
      }
      
      else {
        result = { error: 'Unknown command. Type !help' };
      }

      // Send result
      if (result) {
        await this.sendCommandResponse(sock, from, result);
      }

    } catch (error) {
      logger.error('Command handler error', error);
      await this.sendMessage(sock, from, '❌ Error processing command');
    }
  }

  /**
   * Handle natural language intent
   */
  async handleNaturalLanguage(text, intent, from, phoneNumber, sock) {
    logger.debug(`Natural language intent: ${intent}`);

    try {
      let response = null;

      switch (intent) {
        case 'greet':
          response = MessageFormatter.formatSuccess(`Hello! Type !help to see what I can do`);
          break;

        case 'help':
          response = MessageFormatter.formatMenu('customer');
          break;

        case 'browse':
          // Trigger menu command
          response = (await customerHandler.handleCustomerCommand('menu', [], from, phoneNumber)).message;
          break;

        case 'order':
          response = `What would you like to order?\n\n!search <item_name> to find products\nExample: !search pizza`;
          break;

        case 'add_to_cart':
          response = `To add items: !add <product_id> <quantity>\n\nFirst, find products with !menu or !search`;
          break;

        case 'checkout':
          response = (await customerHandler.handleCustomerCommand('checkout', [], from, phoneNumber)).message;
          break;

        case 'track':
          response = `To track order: !track <order_id>\n\nView orders with !orders`;
          break;

        case 'profile':
          response = (await authHandler.handleAuthCommand('profile', [], from, phoneNumber)).message;
          break;

        default:
          response = `I didn't understand that. Type !help for commands.`;
      }

      await this.sendMessage(sock, from, response);

    } catch (error) {
      logger.error('Natural language handling error', error);
      await this.sendMessage(sock, from, constants.MESSAGES.ERROR);
    }
  }

  /**
   * Send command response
   */
  async sendCommandResponse(sock, to, result) {
    if (result.error) {
      await this.sendMessage(sock, to, `❌ ${result.error}`);
      return;
    }

    if (result.message) {
      await this.sendMessage(sock, to, result.message);
    }

    if (result.buttons) {
      await sock.sendMessage(to, { 
        text: result.message || 'Choose an option:',
        buttons: result.buttons,
      });
    }

    if (result.notifyUser) {
      const userPhone = `${result.notifyUser.phone}@s.whatsapp.net`;
      await this.sendMessage(sock, userPhone, result.notifyUser.message);
    }
  }

  /**
   * Send message to user
   */
  async sendMessage(sock, to, message, options = {}) {
    try {
      if (!message || !message.toString().trim()) {
        return;
      }

      const msgOptions = {
        text: message.toString(),
        ...options,
      };

      await sock.sendMessage(to, msgOptions);

    } catch (error) {
      logger.error(`Failed to send message to ${to}`, error);
      await cache.addToRetryQueue({
        type: 'message',
        to,
        message,
      });
    }
  }

  /**
   * Process retry queue for failed messages
   */
  async processRetryQueue(sock) {
    try {
      const queue = await cache.getRetryQueue();
      
      for (let i = queue.length - 1; i >= 0; i--) {
        const item = queue[i];
        
        // Skip if too many attempts
        if (item.attempts >= 3) {
          await cache.removeFromRetryQueue(i);
          continue;
        }

        // Try again
        try {
          if (item.type === 'message') {
            await this.sendMessage(sock, item.to, item.message, item.options);
            await cache.removeFromRetryQueue(i);
            logger.success(`Retry queue: Message successfully sent to ${item.to}`);
          }
        } catch (error) {
          item.attempts++;
          logger.warn(`Retry queue: Retry ${item.attempts} failed for ${item.to}`);
        }
      }
    } catch (error) {
      logger.error('Retry queue processing error', error);
    }
  }

  /**
   * Display help menu
   */
  displayHelp(role = 'customer') {
    return MessageFormatter.formatMenu(role);
  }
}

module.exports = new BotController();
