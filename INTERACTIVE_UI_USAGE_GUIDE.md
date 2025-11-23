# Interactive UI Implementation Guide

## 🎯 Quick Reference

### How It Works

**Before**: Users had to type exact syntax
```
User: !remove 1
Bot: Item removed
```

**After**: Bot shows options, users select
```
User: !remove
Bot: [List of items] ← Select an item
User: [Taps item]
Bot: [Success confirmation]
```

---

## 📚 Builder Utilities

### 1. InteractiveMessageBuilder

**Location**: `/whatsapp-bot/src/utils/interactiveMessageBuilder.js`

#### Creating Button Messages
```javascript
const response = InteractiveMessageBuilder.buttonMessage(
  'Order Placed! 🎉',
  'What would you like to do next?',
  [
    { id: 'track', text: '📦 Track Order' },
    { id: 'menu', text: '🏪 Continue Shopping' },
    { id: 'support', text: '💬 Contact Support' }
  ]
);
```

#### Creating List Messages
```javascript
const response = InteractiveMessageBuilder.listMessage(
  'Our Stores',
  'Select a store to browse',
  [{
    title: 'Available Stores',
    rows: [
      { id: 'store_1', text: '🏪 Supa Stores', description: 'Groceries' },
      { id: 'store_2', text: '🏬 Quick Mart', description: 'General items' }
    ]
  }]
);
```

#### Creating Status Cards
```javascript
const response = InteractiveMessageBuilder.createStatusCard(
  '📊 Dashboard',
  [
    { label: 'Pending Orders', value: '5', emoji: '⏳' },
    { label: 'Revenue Today', value: 'ZWL 2,450', emoji: '💰' },
    { label: 'Satisfaction', value: '4.8★', emoji: '⭐' }
  ],
  [
    { text: 'View Orders', id: 'orders' },
    { text: 'Settings', id: 'settings' }
  ]
);
```

#### Creating Success Cards
```javascript
const response = InteractiveMessageBuilder.createSuccessCard(
  'Order Placed!',
  'Your order #12345 has been confirmed. Estimated delivery: 45 min',
  [
    { text: '📦 Track Order', id: 'track_order' },
    { text: '📞 Contact Driver', id: 'contact_driver' }
  ]
);
```

#### Creating Error Cards
```javascript
const response = InteractiveMessageBuilder.createErrorCard(
  'Payment Failed',
  ['Your card was declined. Please try another payment method.', 'Error code: PY001']
);
```

#### Creating Contact Cards
```javascript
const response = InteractiveMessageBuilder.contactCard(
  'John Smith',
  '+263123456789',
  'john@example.com',
  [
    { text: '💾 Save Contact', id: 'save' },
    { text: '💬 Message', id: 'message' },
    { text: '☎️ Call', id: 'call' }
  ]
);
```

---

### 2. FlowManager

**Location**: `/whatsapp-bot/src/utils/flowManager.js`

FlowManager creates multi-step flows that guide users through selections.

#### Argument Selector Flow
**When to use**: Command has optional argument, but user didn't provide it

```javascript
// In !customer remove command
if (!index) {
  const items = cart.map(item => ({
    id: `remove_${item.id}`,
    text: `${item.name} x${item.qty}`,
    description: `ZWL ${item.price * item.qty}`
  }));

  return FlowManager.argumentSelectorFlow(
    '🛒 Remove from Cart',
    'Select an item to remove:',
    items
  ).interactive;
}
```

**User sees**: Interactive list of items to pick from

#### DateTime Picker Flow
**When to use**: Command needs date/time range selection

```javascript
// In !admin sales command
if (!timeframe) {
  return FlowManager.dateTimePickerFlow(
    '📊 Sales Report',
    'Select time period:',
    ['today', 'week', 'month', 'custom']
  ).interactive;
}
```

**User sees**: Buttons for time period selection

#### Status Selector Flow
**When to use**: Changing order/item status

```javascript
// In !merchant update-status command
if (!status) {
  return FlowManager.statusSelectorFlow('Pending').interactive;
}
```

**User sees**: Status options buttons (Preparing → Ready → Out for Delivery → Delivered)

#### Quantity Selector Flow
**When to use**: User needs to select quantity

```javascript
const flow = FlowManager.quantitySelectorFlow(
  'Select Quantity',
  'How many items?',
  10  // max quantity
);
```

**User sees**: Buttons numbered 1-10

#### Confirmation Flow
**When to use**: Action needs user confirmation

```javascript
const flow = FlowManager.confirmationFlow(
  'Clear Cart?',
  'This will remove all items from your cart'
);
```

**User sees**: [Yes] [No] [Cancel] buttons

#### Approval Flow
**When to use**: Admin needs to approve/reject something

```javascript
const flow = FlowManager.approvalFlow(
  'Review Merchant Registration',
  'Merchant: Quick Foods\nCategory: Restaurant\nLocation: CBD'
);
```

**User sees**: [Approve] [Reject] [Review] buttons

#### Reason Input Flow
**When to use**: Getting reason for action

```javascript
const flow = FlowManager.reasonInputFlow(
  'Why are you rejecting?',
  [
    'Incomplete documents',
    'Location not covered',
    'Duplicate account',
    'Other'
  ]
);
```

**User sees**: Reason buttons + "Other" option

---

## 🔧 Implementation Patterns

### Pattern 1: Show Selector if No Args

```javascript
async handleMyCommand(args, phoneNumber, from) {
  const action = args[0]?.toLowerCase();

  // If no action, show selector
  if (!action) {
    return FlowManager.argumentSelectorFlow(
      'My Command',
      'What would you like?',
      [
        { id: 'option1', text: 'Option 1', description: 'Description' },
        { id: 'option2', text: 'Option 2', description: 'Description' }
      ]
    ).interactive;
  }

  // Otherwise process action
  return InteractiveMessageBuilder.createSuccessCard(...);
}
```

### Pattern 2: Show List on Selection

```javascript
if (action === 'list') {
  const items = await fetchItems();
  
  return InteractiveMessageBuilder.listMessage(
    'Your Items',
    'Tap to select',
    [{
      title: 'Items',
      rows: items.map(item => ({
        id: `item_${item.id}`,
        text: item.name,
        description: item.description
      }))
    }]
  );
}
```

### Pattern 3: Success with Follow-up Actions

```javascript
return InteractiveMessageBuilder.createSuccessCard(
  'Item Added to Cart!',
  `${item.name} x${qty} added - ZWL ${item.price * qty}`,
  [
    { text: '🛒 Continue Shopping', id: 'menu' },
    { text: '🛒 View Cart', id: 'cart' },
    { text: '💳 Checkout', id: 'checkout' }
  ]
);
```

### Pattern 4: Error with Recovery Options

```javascript
return InteractiveMessageBuilder.createErrorCard(
  'Order Not Found',
  ['Order #54321 does not exist in our system']
);
// User can then type !help or try another order
```

---

## 📝 Command Examples

### Customer: Rating with Selector

**Old**:
```
User: !rate 123
Bot: Usage: !rate <order_id> <rating_1_to_5>

User: !rate 123 5
Bot: Thanks for your 5 star rating!
```

**New**:
```
User: !rate 123
Bot: ⭐ RATE ORDER
     How would you rate order #123?
     [Button: ⭐⭐⭐⭐⭐ Excellent!]
     [Button: ⭐⭐⭐⭐ Good]
     [Button: ⭐⭐⭐ Okay]
     [Button: ⭐⭐ Not great]
     [Button: ⭐ Poor]

User: [Taps 5-star button]
Bot: ✅ Thanks for Rating!
     You rated order #123 with ⭐⭐⭐⭐⭐
     [Button: View Orders] [Button: Menu]
```

---

### Customer: Favorites with Action Selector

**Old**:
```
User: !favorites
Bot: ❤️ Your Favorite Stores
     1. Supa Stores
     2. Quick Mart
     3. Local Bakery
     
     To add: !favorites add <store_id>
     To remove: !favorites remove <store_id>
```

**New**:
```
User: !favorites
Bot: ❤️ MY FAVORITES
     What would you like to do?
     [Button: View Favorites]
     [Button: Add Store]
     [Button: Remove Store]

User: [Taps "View Favorites"]
Bot: ❤️ Your Favorite Stores
     [List: 🏪 Supa Stores - Grocery & household items]
     [List: 🏬 Quick Mart - General merchandise]
     [List: 🥖 Local Bakery - Fresh baked goods]
```

---

### Admin: Sales with DateTime Picker

**Old**:
```
User: !admin sales
Bot: Usage: !admin sales [today|week|month]

User: !admin sales week
Bot: Weekly Sales Report
     Total: ZWL 15,450
     ...
```

**New**:
```
User: !admin sales
Bot: 📊 SALES REPORT
     Select time period:
     [Button: Today]
     [Button: This Week]
     [Button: This Month]
     [Button: Custom]

User: [Taps "This Week"]
Bot: 📊 Weekly Sales Report
     [Status Card with metrics]
     [Button: Download] [Button: More Options]
```

---

### Merchant: Update Status with Selector

**Old**:
```
User: !merchant update-status 123
Bot: Usage: !merchant update-status <order_id> <status>

User: !merchant update-status 123 ready
Bot: Order status updated to ready
```

**New**:
```
User: !merchant update-status 123
Bot: 📦 UPDATE ORDER STATUS
     Order #123 current status: Preparing
     Change to:
     [Button: Preparing]
     [Button: Ready]
     [Button: Out for Delivery]
     [Button: Delivered]

User: [Taps "Ready"]
Bot: ✅ Order Updated!
     Order #123 is now READY
     Customer has been notified
     [Button: View Orders] [Button: Dashboard]
```

---

### Auth: Owner Contact Card

**Old**:
```
User: !owner
Bot: Owner Contact Info
     Name: John Smith
     Phone: +263123456789
     Email: john@example.com
     Website: www.example.com
     Bio: Fast delivery service
```

**New**:
```
User: !owner
Bot: [CONTACT CARD]
     John Smith
     +263123456789
     john@example.com
     
     Website: www.example.com
     Services: 24/7 Delivery, Bulk Orders
     Availability: Always Online
     Bio: Zimbabwe's fastest delivery service
     
     [Button: 💾 Save Contact]
     [Button: 💬 Message]
     [Button: ☎️ Call]

(Contact saved to device for future reference)
```

---

## 🎨 Visual Components

### Button Message
```
┌─────────────────────────┐
│   Order Placed! 🎉      │
│                         │
│  What next?            │
│ ┌─────────────────────┐ │
│ │  📦 Track Order     │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 🏪 Continue Shop    │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 💬 Contact Support  │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### List Message
```
┌─────────────────────────┐
│   Our Stores            │
│   [Scroll ↓]            │
├─────────────────────────┤
│ 🏪 Supa Stores          │
│    Groceries        ➜   │
├─────────────────────────┤
│ 🏬 Quick Mart           │
│    General items    ➜   │
├─────────────────────────┤
│ 🥖 Local Bakery         │
│    Fresh baked      ➜   │
└─────────────────────────┘
```

### Status Card
```
┌─────────────────────────┐
│ 📊 Dashboard            │
├─────────────────────────┤
│ ⏳ Pending Orders   5   │
│ 💰 Revenue Today  Z2450 │
│ ⭐ Satisfaction   4.8   │
├─────────────────────────┤
│ [View Orders] [Settings]│
└─────────────────────────┘
```

---

## ✅ Best Practices

1. **Always provide a fallback**: If no args, show selector
2. **Use clear labels**: Button text should be action-oriented
3. **Include emojis**: Visual indicators help quickly scan options
4. **Keep lists short**: Max 5-10 items per list
5. **Provide context**: Tell user what they're selecting
6. **Confirm actions**: Show success card after important actions
7. **Enable undo**: Provide options to go back or cancel

---

## 🔍 Debugging

### Check if imports are correct
```javascript
// Should be at top of handler file
const InteractiveMessageBuilder = require('../utils/interactiveMessageBuilder');
const FlowManager = require('../utils/flowManager');
```

### Verify message format
All interactive messages must return `.interactive` property:
```javascript
// ✅ Correct
return FlowManager.argumentSelectorFlow(...).interactive;

// ❌ Wrong (will send plain text)
return FlowManager.argumentSelectorFlow(...);
```

### Test button/list rendering
Use WhatsApp's native app to test:
1. Send command that should show buttons/list
2. Verify visual rendering
3. Tap buttons and confirm action execution
4. Check success message

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Buttons not showing | Verify `.interactive` property in return |
| List not scrolling | Ensure rows array has multiple items |
| Command fails silently | Check console for import errors |
| Contact card not saving | Verify `cache.setOwnerContact()` call |
| Flow doesn't respond to selection | Check if handler processes the selected ID |

---

## 🚀 Next Steps

1. **Deploy to production** - Run bot and test with real WhatsApp
2. **Monitor usage** - Track which flows users interact with
3. **Gather feedback** - Ask users what could be improved
4. **Iterate** - Add more selectors based on user preferences
5. **Scale** - Apply same patterns to new commands

---

**Documentation Version**: 1.0
**Last Updated**: 2024
**Status**: Complete and ready for use
