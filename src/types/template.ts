// Template types for WhatsApp message templates
export interface TemplateVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'time' | 'email' | 'phone';
  required: boolean;
  defaultValue?: string;
  example?: string;
  regex?: string; // For validation
}

export interface TemplateButton {
  id: string;
  label: string;
  type: 'quick_reply' | 'call' | 'url' | 'copy_code';
  payload?: string; // For quick_reply
  phoneNumber?: string; // For call
  url?: string; // For url
  code?: string; // For copy_code
  displayText?: string;
}

export interface TemplateListSection {
  id: string;
  title: string;
  rows: TemplateListRow[];
}

export interface TemplateListRow {
  id: string;
  title: string;
  description?: string;
  rowId?: string; // Used for callbacks
}

export interface TemplateMediaContent {
  type: 'image' | 'video' | 'document';
  url: string;
  mediaId?: string;
  caption?: string;
}

export type TemplateType = 'text' | 'button' | 'list' | 'media' | 'carousel';

export interface MessageTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  merchantId: string;
  channel: 'whatsapp';
  type: TemplateType;
  language: 'en' | 'pt' | 'es' | 'fr' | 'de' | 'it' | 'ja' | 'zh' | 'ar' | 'hi';
  
  // Content
  body: string; // Main message text
  header?: string; // Optional header
  footer?: string; // Optional footer
  
  // Variables for dynamic content
  variables?: TemplateVariable[];
  
  // Type-specific content
  buttons?: TemplateButton[];
  listSections?: TemplateListSection[];
  media?: TemplateMediaContent[];
  carouselItems?: CarouselItem[];
  
  // Metadata
  tags?: string[];
  status: 'draft' | 'approved' | 'rejected' | 'active';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  
  // Usage tracking
  sendCount: number;
  lastSentAt?: Date;
  
  // Settings
  allowPreview: boolean;
  allowBroadcast: boolean;
  broadcastLimit?: number; // Max per day
}

export interface CarouselItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  buttons?: TemplateButton[];
}

export interface TemplatePreviewRequest {
  templateId: string;
  variables?: Record<string, string>;
  recipientPhone?: string; // For test send
}

export interface TemplatePreview {
  id: string;
  renderedBody: string;
  renderedHeader?: string;
  renderedFooter?: string;
  buttons?: TemplateButton[];
  mediaPreview?: TemplateMediaContent;
  validationErrors?: string[];
}

export interface BroadcastMessage {
  id: string;
  templateId: string;
  merchantId: string;
  recipientPhones: string[];
  variables?: Record<string, Record<string, string>>; // Per-recipient variables
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  sentAt?: Date;
  failedPhones?: string[];
  createdAt: Date;
}

export interface QuickReply {
  id: string;
  name: string;
  merchantId: string;
  buttons: TemplateButton[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaCarousel {
  id: string;
  name: string;
  merchantId: string;
  items: CarouselItem[];
  createdAt: Date;
  updatedAt: Date;
}
