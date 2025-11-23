/**
 * Interactive Message Builder
 * Builds structured interactive messages with buttons, lists, footers, and contact cards
 * Follows WhatsApp's interactive message format
 */

class InteractiveMessageBuilder {
  /**
   * Build button message
   * @param {string} header - Header text
   * @param {string} body - Body text
   * @param {array} buttons - Array of buttons
   * @param {string} footer - Footer text (optional)
   */
  static buttonMessage(header, body, buttons = [], footer = '') {
    return {
      type: 'button',
      header,
      body,
      buttons: buttons.map((btn, idx) => ({
        buttonId: btn.id || `btn_${idx}`,
        buttonText: { displayText: btn.text || btn.label || `Button ${idx + 1}` },
        type: 1
      })),
      footer: footer || '━━━━━━━━━━━━━━━'
    };
  }

  /**
   * Build list message
   * @param {string} header - Header text
   * @param {string} body - Body text
   * @param {array} sections - Array of sections with title and rows
   * @param {string} footer - Footer text (optional)
   */
  static listMessage(header, body, sections = [], footer = '') {
    return {
      type: 'list',
      header,
      body,
      footer: footer || '━━━━━━━━━━━━━━━',
      sections: sections.map(section => ({
        title: section.title || 'Options',
        rows: (section.rows || []).map((row, idx) => ({
          rowId: row.id || `row_${idx}`,
          title: row.title || `Option ${idx + 1}`,
          description: row.description || '',
          rowImage: row.image || null
        }))
      }))
    };
  }

  /**
   * Build template button message
   * @param {string} body - Body text
   * @param {array} buttons - Array of template buttons with action
   * @param {string} footer - Footer text (optional)
   */
  static templateButtonMessage(body, buttons = [], footer = '') {
    return {
      type: 'template',
      body,
      buttons: buttons.map((btn, idx) => ({
        buttonId: btn.id || `template_btn_${idx}`,
        buttonText: { displayText: btn.text || btn.label || `Action ${idx + 1}` },
        type: btn.type || 1
      })),
      footer: footer || ''
    };
  }

  /**
   * Build contact card
   * @param {object} contact - Contact object with name, phone, role, etc.
   */
  static contactCard(contact = {}) {
    return {
      type: 'contact',
      displayName: contact.name || 'Contact',
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:${contact.name || 'Contact'}
TEL:${contact.phone || ''}
ROLE:${contact.role || ''}
ORG:${contact.org || ''}
END:VCARD`
    };
  }

  /**
   * Build quick reply message with buttons
   * @param {string} text - Message text
   * @param {array} quickReplies - Array of quick reply buttons
   * @param {string} footer - Footer text (optional)
   */
  static quickReplyMessage(text, quickReplies = [], footer = '') {
    return {
      type: 'quickReply',
      text,
      quickReplyButtons: quickReplies.map((reply, idx) => ({
        buttonId: reply.id || `quick_${idx}`,
        buttonText: { displayText: reply.text || reply.label || `Reply ${idx + 1}` },
        type: 1
      })),
      footer: footer || ''
    };
  }

  /**
   * Build rich text message with formatting
   * @param {string} title - Title
   * @param {string} body - Rich body text
   * @param {string} image - Image URL (optional)
   * @param {array} buttons - Action buttons (optional)
   */
  static richTextMessage(title, body, image = null, buttons = []) {
    return {
      type: 'richText',
      title,
      body,
      image,
      buttons: buttons.map((btn, idx) => ({
        buttonId: btn.id || `rich_btn_${idx}`,
        buttonText: { displayText: btn.text || btn.label || `Action ${idx + 1}` },
        type: 1
      }))
    };
  }

  /**
   * Create a menu-style message
   */
  static createMenu(title, description, menuItems = [], footer = '') {
    return {
      type: 'list',
      header: `${title}`,
      body: description,
      footer: footer || 'Select an option below',
      sections: [{
        title: 'Options',
        rows: menuItems.map((item, idx) => ({
          rowId: item.id || `menu_${idx}`,
          title: `${item.emoji || '•'} ${item.title}`,
          description: item.description || item.subtitle || '',
          rowImage: item.image || null
        }))
      }]
    };
  }

  /**
   * Create a status/info card
   */
  static createStatusCard(title, items = [], actionButtons = [], footer = '') {
    let body = `*${title}*\n━━━━━━━━━━━━━━━\n\n`;
    items.forEach(item => {
      body += `${item.emoji || '•'} ${item.label}: ${item.value}\n`;
    });

    return {
      type: 'template',
      body: body.trim(),
      buttons: actionButtons.map((btn, idx) => ({
        buttonId: btn.id || `status_btn_${idx}`,
        buttonText: { displayText: btn.text || btn.label || `Action ${idx + 1}` },
        type: 1
      })),
      footer: footer || ''
    };
  }

  /**
   * Create a product card with quick actions
   */
  static createProductCard(product = {}) {
    const image = product.image || '📦';
    const rating = '⭐'.repeat(Math.floor(product.rating || 4));

    let body = `${image} *${product.name || 'Product'}*\n`;
    body += `💰 ZWL ${(product.price || 0).toFixed(2)}\n`;
    body += `${rating} (${product.reviews || 0} reviews)\n`;
    body += `🏪 ${product.merchant || 'Merchant'}\n\n`;
    body += product.description || '';

    return {
      type: 'template',
      body: body.trim(),
      buttons: [
        { buttonId: `add_${product.id}`, buttonText: { displayText: '🛒 Add to Cart' }, type: 1 },
        { buttonId: `view_${product.id}`, buttonText: { displayText: 'ℹ️ Details' }, type: 1 }
      ],
      footer: '━━━━━━━━━━━━━━━'
    };
  }

  /**
   * Create an order summary card
   */
  static createOrderSummary(order = {}) {
    let body = `📦 *Order ${order.id}*\n`;
    body += `━━━━━━━━━━━━━━━\n\n`;
    body += `🏪 ${order.merchant || 'Merchant'}\n`;
    body += `💰 Total: ZWL ${(order.total || 0).toFixed(2)}\n`;
    body += `📍 Status: ${order.status || 'Pending'}\n`;
    body += `⏰ Date: ${order.date || new Date().toLocaleDateString()}\n\n`;
    
    if (order.items && order.items.length > 0) {
      body += `📋 Items:\n`;
      order.items.slice(0, 3).forEach(item => {
        body += `  • ${item.name} x${item.quantity}\n`;
      });
      if (order.items.length > 3) {
        body += `  ... and ${order.items.length - 3} more\n`;
      }
    }

    return {
      type: 'template',
      body: body.trim(),
      buttons: [
        { buttonId: `track_${order.id}`, buttonText: { displayText: '📍 Track' }, type: 1 },
        { buttonId: `reorder_${order.id}`, buttonText: { displayText: '🔄 Reorder' }, type: 1 }
      ],
      footer: '━━━━━━━━━━━━━━━'
    };
  }

  /**
   * Create error message with recovery options
   */
  static createErrorCard(error = '', suggestions = []) {
    let body = `❌ *Error*\n━━━━━━━━━━━━━━━\n\n${error}\n\n`;

    if (suggestions.length > 0) {
      body += `💡 *Try:*\n`;
      suggestions.forEach(suggestion => {
        body += `  • ${suggestion}\n`;
      });
    }

    return {
      type: 'template',
      body: body.trim(),
      buttons: [
        { buttonId: 'help', buttonText: { displayText: '❓ Get Help' }, type: 1 },
        { buttonId: 'menu', buttonText: { displayText: '📋 Menu' }, type: 1 }
      ],
      footer: 'Contact support if issue persists'
    };
  }

  /**
   * Create success confirmation
   */
  static createSuccessCard(title = 'Success!', message = '', nextActions = []) {
    let body = `✅ *${title}*\n━━━━━━━━━━━━━━━\n\n${message}`;

    return {
      type: 'template',
      body: body.trim(),
      buttons: nextActions.map((action, idx) => ({
        buttonId: action.id || `action_${idx}`,
        buttonText: { displayText: action.text || action.label || `Action ${idx + 1}` },
        type: 1
      })),
      footer: 'Thank you!'
    };
  }
}

module.exports = InteractiveMessageBuilder;
