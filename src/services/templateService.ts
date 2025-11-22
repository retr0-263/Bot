import { MessageTemplate, TemplatePreview, BroadcastMessage, QuickReply, MediaCarousel } from '../types/template';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

class TemplateService {
  private baseUrl = `${SUPABASE_URL}/functions/v1`;

  private async request(endpoint: string, payload: Record<string, unknown>) {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'X-Client-Info': 'template-client/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Template API error on ${endpoint}:`, error);
      throw error;
    }
  }

  // Template CRUD operations
  async createTemplate(template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt' | 'sendCount'>) {
    return this.request('bot-templates', {
      action: 'create',
      template: {
        ...template,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        send_count: 0,
      },
    });
  }

  async updateTemplate(templateId: string, updates: Partial<MessageTemplate>) {
    return this.request('bot-templates', {
      action: 'update',
      template_id: templateId,
      updates: {
        ...updates,
        updated_at: new Date().toISOString(),
      },
    });
  }

  async deleteTemplate(templateId: string) {
    return this.request('bot-templates', {
      action: 'delete',
      template_id: templateId,
    });
  }

  async getTemplate(templateId: string) {
    return this.request('bot-templates', {
      action: 'get',
      template_id: templateId,
    });
  }

  async listTemplates(merchantId: string, filters?: { category?: string; status?: string; language?: string }) {
    return this.request('bot-templates', {
      action: 'list',
      merchant_id: merchantId,
      filters: filters || {},
    });
  }

  // Template preview and validation
  async previewTemplate(templateId: string, variables?: Record<string, string>) {
    return this.request('bot-templates', {
      action: 'preview',
      template_id: templateId,
      variables: variables || {},
    }) as Promise<TemplatePreview>;
  }

  async validateTemplate(template: Partial<MessageTemplate>) {
    return this.request('bot-templates', {
      action: 'validate',
      template,
    });
  }

  async previewTemplateWithVariables(
    templateId: string,
    variables: Record<string, string>
  ): Promise<TemplatePreview> {
    return this.previewTemplate(templateId, variables);
  }

  // Test send
  async sendTestPreview(templateId: string, phoneNumber: string, variables?: Record<string, string>) {
    return this.request('bot-templates', {
      action: 'send_test',
      template_id: templateId,
      phone_number: phoneNumber,
      variables: variables || {},
    });
  }

  // Broadcast operations
  async createBroadcast(broadcast: Omit<BroadcastMessage, 'id' | 'createdAt'>) {
    return this.request('bot-templates', {
      action: 'create_broadcast',
      broadcast: {
        ...broadcast,
        created_at: new Date().toISOString(),
      },
    });
  }

  async scheduleBroadcast(broadcastId: string, scheduledFor: Date) {
    return this.request('bot-templates', {
      action: 'schedule_broadcast',
      broadcast_id: broadcastId,
      scheduled_for: scheduledFor.toISOString(),
    });
  }

  async sendBroadcastNow(broadcastId: string) {
    return this.request('bot-templates', {
      action: 'send_broadcast',
      broadcast_id: broadcastId,
    });
  }

  async listBroadcasts(merchantId: string) {
    return this.request('bot-templates', {
      action: 'list_broadcasts',
      merchant_id: merchantId,
    });
  }

  async getBroadcast(broadcastId: string) {
    return this.request('bot-templates', {
      action: 'get_broadcast',
      broadcast_id: broadcastId,
    });
  }

  // Quick replies
  async createQuickReply(quickReply: Omit<QuickReply, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.request('bot-templates', {
      action: 'create_quick_reply',
      quick_reply: {
        ...quickReply,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }

  async updateQuickReply(quickReplyId: string, updates: Partial<QuickReply>) {
    return this.request('bot-templates', {
      action: 'update_quick_reply',
      quick_reply_id: quickReplyId,
      updates: {
        ...updates,
        updated_at: new Date().toISOString(),
      },
    });
  }

  async deleteQuickReply(quickReplyId: string) {
    return this.request('bot-templates', {
      action: 'delete_quick_reply',
      quick_reply_id: quickReplyId,
    });
  }

  async listQuickReplies(merchantId: string) {
    return this.request('bot-templates', {
      action: 'list_quick_replies',
      merchant_id: merchantId,
    });
  }

  // Media carousels
  async createMediaCarousel(carousel: Omit<MediaCarousel, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.request('bot-templates', {
      action: 'create_carousel',
      carousel: {
        ...carousel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }

  async updateMediaCarousel(carouselId: string, updates: Partial<MediaCarousel>) {
    return this.request('bot-templates', {
      action: 'update_carousel',
      carousel_id: carouselId,
      updates: {
        ...updates,
        updated_at: new Date().toISOString(),
      },
    });
  }

  async deleteMediaCarousel(carouselId: string) {
    return this.request('bot-templates', {
      action: 'delete_carousel',
      carousel_id: carouselId,
    });
  }

  async listMediaCarousels(merchantId: string) {
    return this.request('bot-templates', {
      action: 'list_carousels',
      merchant_id: merchantId,
    });
  }

  // Approval operations (admin only)
  async approveTemplate(templateId: string) {
    return this.request('bot-templates', {
      action: 'approve',
      template_id: templateId,
    });
  }

  async rejectTemplate(templateId: string, reason: string) {
    return this.request('bot-templates', {
      action: 'reject',
      template_id: templateId,
      rejection_reason: reason,
    });
  }

  async listPendingApprovals() {
    return this.request('bot-templates', {
      action: 'list_pending_approvals',
    });
  }
}

export const templateService = new TemplateService();
