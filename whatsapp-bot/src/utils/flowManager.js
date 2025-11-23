/**
 * Interactive Flow Manager
 * Handles multi-step interactive flows with argument suggestions and state management
 */

const InteractiveMessageBuilder = require('./interactiveMessageBuilder');

class FlowManager {
  /**
   * Create an argument selector flow
   * Returns an interactive message prompting for argument selection
   */
  static argumentSelectorFlow(title, description, options = [], callback = null) {
    return {
      type: 'argumentFlow',
      title,
      description,
      options: options.map((opt, idx) => ({
        id: opt.id || `opt_${idx}`,
        text: opt.text || opt.label || `Option ${idx + 1}`,
        value: opt.value || opt.id || idx,
        description: opt.description || ''
      })),
      callback,
      interactive: InteractiveMessageBuilder.listMessage(
        title,
        description,
        [{
          title: 'Options',
          rows: options.map((opt, idx) => ({
            rowId: opt.id || `opt_${idx}`,
            title: opt.text || opt.label || `Option ${idx + 1}`,
            description: opt.description || ''
          }))
        }]
      )
    };
  }

  /**
   * Create a confirmation flow
   * User must confirm before proceeding
   */
  static confirmationFlow(title, message, actionButtons = []) {
    return InteractiveMessageBuilder.buttonMessage(
      title,
      message,
      [
        { id: 'confirm_yes', text: '✅ Yes, Proceed', label: 'Yes' },
        { id: 'confirm_no', text: '❌ Cancel', label: 'No' },
        ...actionButtons
      ],
      '━━━━━━━━━━━━━━━'
    );
  }

  /**
   * Create a multi-step flow with options
   * Returns list of steps to complete
   */
  static multiStepFlow(title, steps = []) {
    let body = `*${title}*\n━━━━━━━━━━━━━\n\n`;
    steps.forEach((step, idx) => {
      body += `${idx + 1}. ${step.title}\n`;
      if (step.description) {
        body += `   ${step.description}\n`;
      }
    });

    return {
      type: 'multiStep',
      title,
      steps,
      message: body.trim()
    };
  }

  /**
   * Create input prompt flow
   * For capturing text input in a structured way
   */
  static inputPromptFlow(title, placeholder = '', context = {}) {
    return {
      type: 'inputPrompt',
      title,
      placeholder,
      context,
      message: `*${title}*\n━━━━━━━━━━━━━\n\nPlease reply with your response.\n\n_${placeholder}_`
    };
  }

  /**
   * Create a date/time picker flow
   */
  static dateTimePickerFlow(title, options = {}) {
    const ranges = [
      { id: 'today', text: '📅 Today', value: 'today' },
      { id: 'week', text: '📆 This Week', value: 'week' },
      { id: 'month', text: '📊 This Month', value: 'month' },
      { id: 'custom', text: '🗓️ Custom Date', value: 'custom' }
    ];

    return this.argumentSelectorFlow(
      title,
      'Select a time period',
      ranges
    );
  }

  /**
   * Create a quantity selector flow
   */
  static quantitySelectorFlow(productName, maxQuantity = 10) {
    const quantities = [];
    for (let i = 1; i <= Math.min(maxQuantity, 10); i++) {
      quantities.push({
        id: `qty_${i}`,
        text: `${i}x ${productName}`,
        value: i,
        description: `Quantity: ${i}`
      });
    }

    return this.argumentSelectorFlow(
      `📦 SELECT QUANTITY`,
      `How many do you want?`,
      quantities
    );
  }

  /**
   * Create a status selector flow (for merchant order status updates)
   */
  static statusSelectorFlow(currentStatus = '') {
    const statuses = [
      { id: 'preparing', text: '👨‍🍳 Preparing', value: 'preparing', description: 'Order is being prepared' },
      { id: 'ready', text: '📦 Ready', value: 'ready', description: 'Ready for pickup/delivery' },
      { id: 'out_for_delivery', text: '🚚 Out for Delivery', value: 'out_for_delivery', description: 'On the way' },
      { id: 'delivered', text: '✅ Delivered', value: 'delivered', description: 'Successfully delivered' }
    ];

    return this.argumentSelectorFlow(
      '📊 UPDATE ORDER STATUS',
      `Current: ${currentStatus}`,
      statuses
    );
  }

  /**
   * Create approval flow with reason
   */
  static approvalFlow(itemName, itemType = 'Merchant') {
    return {
      type: 'approvalFlow',
      title: `Approve ${itemType}: ${itemName}`,
      steps: [
        { id: 'approve', text: '✅ Approve', action: 'approve', description: 'Grant access' },
        { id: 'reject', text: '❌ Reject', action: 'reject', description: 'Deny request' },
        { id: 'review', text: '🔍 Request Info', action: 'review', description: 'Ask for more info' }
      ],
      interactive: InteractiveMessageBuilder.buttonMessage(
        `${itemType}: ${itemName}`,
        'What would you like to do?',
        [
          { id: 'approve', text: '✅ Approve' },
          { id: 'reject', text: '❌ Reject' },
          { id: 'review', text: '🔍 Review' }
        ]
      )
    };
  }

  /**
   * Create a command with optional arguments as interactive options
   * If no args provided, show selector; if args provided, proceed with action
   */
  static commandWithOptionalArgs(command, requiredArgs = [], optionalArgs = []) {
    return {
      type: 'commandWithArgs',
      command,
      requiredArgs,
      optionalArgs,
      shouldShowSelector: true
    };
  }

  /**
   * Create a reason input flow
   * For capturing detailed reason/feedback
   */
  static reasonInputFlow(action = 'Action', defaultReasons = []) {
    const reasons = [
      { id: 'reason_quality', text: '⭐ Quality Issues', value: 'Quality issues with product' },
      { id: 'reason_delay', text: '⏱️ Delivery Delay', value: 'Delivery took too long' },
      { id: 'reason_incomplete', text: '📦 Incomplete Order', value: 'Order was incomplete' },
      { id: 'reason_wrong', text: '❌ Wrong Item', value: 'Received wrong item' },
      { id: 'reason_other', text: '💭 Other', value: 'Other reason' },
      ...defaultReasons
    ];

    return this.argumentSelectorFlow(
      `${action.toUpperCase()} - SELECT REASON`,
      'Why are you doing this?',
      reasons
    );
  }

  /**
   * Process a flow response and return appropriate action
   */
  static processFlowResponse(flowType, selectedValue) {
    return {
      flowType,
      selectedValue,
      timestamp: new Date().toISOString(),
      processed: true
    };
  }
}

module.exports = FlowManager;
