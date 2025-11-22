# Frontend Enhancement Implementation Guide

**Status**: Phase 1 Complete - Template Management & Core Services  
**Date**: November 22, 2025  
**Target**: Full-stack WhatsApp Smart Marketplace UI

---

## Phase 1: Core Infrastructure ✅ COMPLETE

### What Was Built

#### 1. **Type Definitions** (`src/types/template.ts`)
- Complete TypeScript interfaces for templates, messages, broadcasts
- Support for text, button, list, media, and carousel types
- Variable system for dynamic content
- Button types: quick_reply, call, url, copy_code
- Language support: EN, PT, ES, FR, DE, IT, JA, ZH, AR, HI

#### 2. **Services Layer**

**templateService.ts** - Backend API integration
```typescript
- createTemplate() - Create new templates
- updateTemplate() - Update existing templates
- deleteTemplate() - Remove templates
- listTemplates() - Fetch merchant's templates with filters
- previewTemplate() - Generate preview with variable substitution
- sendTestPreview() - Send test message to phone
- validateTemplate() - Validate template structure
- Broadcast operations: createBroadcast, sendBroadcast, scheduleBroadcast
- Quick replies management
- Media carousel management
- Approval workflow (admin)
```

**imageUploadService.ts** - Image handling with compression
```typescript
- validateFile() - Check format and size (<5MB)
- getImageMetadata() - Get dimensions and size
- compressImage() - Canvas-based compression (WebP, JPEG, PNG)
- generateThumbnail() - Quick 200x200px thumbnail
- uploadImage() - Single file upload to Supabase
- uploadMultipleImages() - Batch upload
- deleteImage() - Remove from storage
- getCompressionPreview() - Show compression stats before upload
- validateImageBatch() - Enforce 4-image minimum
- validateDimensions() - Check min 400x400px
```

**websocketService.ts** - Real-time order updates
```typescript
- connect() - Establish WebSocket connection
- disconnect() - Clean close
- send() - Send message to server
- on() - Subscribe to message types
- onConnectionChange() - Monitor connection state
- subscribeToOrders() - Order update stream
- subscribeToNewOrders() - Real-time new orders
- subscribeToNotifications() - Push notifications
- Automatic reconnection (5 attempts, 3s delay)
- Message queuing while disconnected
- Ping interval (30s) to keep connection alive
```

#### 3. **Custom Hooks**

**useWebSocket.ts** - WebSocket connection management
```typescript
- useWebSocket() - Main connection hook with reconnect
- useOrderUpdates() - Subscribe to order changes
- useNewOrders() - Real-time new order notifications
- useNotifications() - System notifications stream
- useWebSocketMessage() - Manual message sending
```

**useImageUpload.ts** - Image upload workflow
```typescript
- useImageUpload() - Complete upload lifecycle
  - State: files[], uploading, error, progress
  - Actions: addFiles, removeFile, clearFiles
  - Validation: validateFiles()
  - Upload: uploadFiles() → returns URLs
  - Preview: getCompressionPreview()
- useImageMetadata() - Get image dimensions/size
- useImageValidation() - 4-image minimum check with detailed errors
```

**useTemplate.ts** - Template management
```typescript
- useTemplate() - CRUD operations
  - State: templates[], loading, error
  - Actions: fetchTemplates, createTemplate, updateTemplate, deleteTemplate
  - Preview: previewTemplate()
  - Test: sendTestPreview()
- useBroadcast() - Broadcast management
  - State: broadcasts[], loading, error
  - Actions: fetchBroadcasts, createBroadcast, sendBroadcast
```

#### 4. **UI Components**

**TemplateManager.tsx** - Main template management page
- List templates with search/filter (type, language)
- CRUD operations: Create, Read, Update, Delete
- Quick duplicate functionality
- Live preview modal
- Organize quick replies and media carousels
- Tag system for organization
- Status badges (draft, approved, active)

**TemplateForm.tsx** - Template creation/editing modal
- Dynamic type selection (text → carousel)
- Language selector (10 languages)
- Header/Body/Footer support
- Variable system with validation
- Button builder (quick reply, URL, call, copy code)
- Tag management
- Settings: preview allowed, broadcast allowed
- Inline validation with error messages

**TemplatePreview.tsx** - WhatsApp-like preview
- Two tabs: Preview & Send Test
- Variable substitution with examples
- WhatsApp bubble UI simulation
- Media preview (images)
- Button rendering
- Test send with phone number validation
- Validation error display

**QuickReplyBuilder.tsx** - Fast button set creation
- Name and description
- Drag-to-reorder buttons
- Max 20 char labels
- Real-time preview
- Save as template

**MediaCarouselBuilder.tsx** - Carousel creation UI
- Image upload with compression preview
- Title (max 25 chars) and description (max 125 chars)
- Up to 2 buttons per item
- Support 2-10 items
- Visual carousel preview
- Drag-to-edit items
- Save as template

---

## Phase 2: Product Management Enhancements (NEXT)

### What Needs to Be Built

#### ImageGallery Component
```typescript
- Display 4+ images in gallery
- Thumbnail strip with first 4 visible
- Drag-to-reorder images
- Remove individual images
- Show compression savings
- Lazy loading with blur placeholder
```

#### Enhanced ProductForm
- Multiple image upload (enforced 4 minimum)
- Drag-drop file area
- Before/after compression preview
- Validation with friendly UI
- Bulk edit mode

#### ProductManagement Updates
- Gallery preview in product card
- Quick actions: Publish, Unpublish, Duplicate, Delete
- Bulk CSV upload with image mapping
- Image compression recommendations

---

## Phase 3: Real-Time Orders & WebSocket (THEN)

### What Needs to Be Built

#### Enhanced OrderManagement
- Live order count badge
- Real-time status updates
- Quick action buttons:
  - Accept / Reject
  - Mark Preparing / Ready
  - Assign Driver
  - Send Message
- Order timeline view
- Customer communication UI

#### StoreSettings Component
- Delivery radius map selector
- Opening hours editor (repeat schedule)
- Delivery fee configuration
- Broadcast settings & limits

#### Analytics Mini-Widgets
- Daily sales (text format for WhatsApp)
- Top product metric
- Low stock alert
- Revenue forecast

#### OrderTracking (Customer)
- Live status with timestamps
- Delivery map (if enabled)
- Order history
- Support contact button

---

## Phase 4: Customer Experience

### Homepage & Discovery
- Featured stores carousel
- Category navigation
- "Open now" filter
- "Near me" geolocation

### Store Listings
- Distance filter
- Rating filter
- Open now indicator
- Delivery fee display

### Product Page
- Swipeable 4-image gallery
- Variant selector
- Delivery/Pickup options
- Share to WhatsApp button

### Cart & Checkout
- Multiple saved addresses
- Payment method selector (cash default)
- Order preview using template
- Confirmation screen

---

## Integration Points

### Backend APIs Required

```javascript
// Templates
POST   /api/templates/create
PUT    /api/templates/:id
DELETE /api/templates/:id
GET    /api/templates (list)
POST   /api/templates/:id/preview
POST   /api/templates/:id/send-test
POST   /api/templates/:id/approve (admin)

// Products
POST   /api/products/bulk-upload
POST   /api/products/:id/images (upload multiple)
DELETE /api/products/:id/images/:imageId
POST   /api/products/:id/images/reorder

// Orders (WebSocket)
WS     /ws (merchant authentication)
Message: order_update, new_order, notification

// Broadcasting
POST   /api/broadcasts/create
POST   /api/broadcasts/:id/send
POST   /api/broadcasts/:id/schedule

// Merchants
POST   /api/merchants/:id/approve
POST   /api/merchants/:id/reject
PUT    /api/merchants/:id/settings
```

### Environment Setup

```bash
# .env.local additions needed
VITE_WS_URL=localhost:4001    # WebSocket server
VITE_SUPABASE_URL=...          # Already configured
VITE_SUPABASE_ANON_KEY=...     # Already configured
```

---

## Database Schema Additions

### Templates Table
```sql
CREATE TABLE message_templates (
  id UUID PRIMARY KEY,
  merchant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  language VARCHAR(10) NOT NULL,
  body TEXT NOT NULL,
  buttons JSONB,
  variables JSONB,
  status VARCHAR(50) DEFAULT 'draft',
  send_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX ON message_templates(merchant_id, status);
```

### Media Table
```sql
CREATE TABLE media (
  id UUID PRIMARY KEY,
  merchant_id UUID NOT NULL,
  url VARCHAR(2048) NOT NULL,
  type VARCHAR(50),
  size INTEGER,
  width INTEGER,
  height INTEGER,
  compressed_url VARCHAR(2048),
  upload_date TIMESTAMP
);
```

---

## Testing Checklist

- [ ] Template CRUD operations
- [ ] Variable substitution in preview
- [ ] Test send to phone number
- [ ] Image upload with 4-image validation
- [ ] Image compression (check file sizes)
- [ ] WebSocket connection/reconnection
- [ ] Real-time order updates
- [ ] Order quick actions
- [ ] Broadcast creation and sending
- [ ] Quick reply builder save
- [ ] Media carousel builder save
- [ ] Mobile responsiveness
- [ ] Accessibility (keyboard nav)
- [ ] Error handling and user feedback

---

## File Structure Summary

```
src/
  types/
    template.ts ✅
  services/
    templateService.ts ✅
    imageUploadService.ts ✅
    websocketService.ts ✅
  hooks/
    useWebSocket.ts ✅
    useImageUpload.ts ✅
    useTemplate.ts ✅
  components/
    merchant/
      TemplateManager.tsx ✅
      TemplateForm.tsx ✅
      TemplatePreview.tsx ✅
      QuickReplyBuilder.tsx ✅
      MediaCarouselBuilder.tsx ✅
      ImageGallery.tsx (NEXT)
      ImageUploader.tsx (NEXT)
      OrderQuickActions.tsx (NEXT)
      StoreSettings.tsx (NEXT)
      DeliveryMap.tsx (NEXT)
```

---

## Next Steps

1. **Integration**: Add TemplateManager to MerchantDashboard navigation
2. **Testing**: Test template creation and preview workflow
3. **Backend**: Create Supabase functions for bot-templates endpoint
4. **Phase 2**: Build product image management enhancements
5. **Phase 3**: Implement WebSocket orders and real-time updates

---

## Performance Optimizations

- ✅ Image compression before upload (WebP format, 80% quality)
- ✅ Canvas-based compression (client-side, no server load)
- ✅ Thumbnail generation (lazy loaded)
- ✅ WebSocket reconnection with exponential backoff
- ✅ Message queuing while offline
- ✅ Ping-pong keepalive (30s interval)
- Template caching with stale-while-revalidate
- Virtual scrolling for large template lists
- Code splitting for modal components

---

## Security Considerations

- ✅ Client-side file validation (type + size)
- Image dimension validation (min 400x400px)
- Variable regex validation
- Template sanitization before preview
- Merchant ID verification in all requests
- Role-based access (merchants vs admins)
- XSS prevention in template body
- CSRF tokens in form submissions

---

## Accessibility

- Semantic HTML throughout
- ARIA labels on buttons and inputs
- Keyboard navigation support
- Focus management in modals
- Color contrast compliance
- Image alt text for galleries
- Screen reader announcements for errors

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

---

Generated: 2025-11-22  
Phase Status: **Phase 1 ✅ Complete** → Ready for Phase 2
