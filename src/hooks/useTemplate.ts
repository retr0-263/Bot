import { useState, useCallback } from 'react';
import { templateService } from '../services/templateService';
import { MessageTemplate, TemplatePreview } from '../types/template';

/**
 * Hook for template management
 */
export function useTemplate(merchantId: string) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(
    async (filters?: any) => {
      try {
        setLoading(true);
        const result = await templateService.listTemplates(merchantId, filters);
        setTemplates(result.templates || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch templates');
      } finally {
        setLoading(false);
      }
    },
    [merchantId]
  );

  const createTemplate = useCallback(
    async (template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt' | 'sendCount'>) => {
      try {
        setError(null);
        const result = await templateService.createTemplate({
          ...template,
          merchantId,
        });
        setTemplates((prev) => [...prev, result]);
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create template';
        setError(errorMsg);
        throw err;
      }
    },
    [merchantId]
  );

  const updateTemplate = useCallback(
    async (templateId: string, updates: Partial<MessageTemplate>) => {
      try {
        setError(null);
        await templateService.updateTemplate(templateId, updates);
        setTemplates((prev) =>
          prev.map((t) => (t.id === templateId ? { ...t, ...updates } : t))
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update template';
        setError(errorMsg);
        throw err;
      }
    },
    []
  );

  const deleteTemplate = useCallback(
    async (templateId: string) => {
      try {
        setError(null);
        await templateService.deleteTemplate(templateId);
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete template';
        setError(errorMsg);
        throw err;
      }
    },
    []
  );

  const previewTemplate = useCallback(
    async (templateId: string, variables?: Record<string, string>): Promise<TemplatePreview | null> => {
      try {
        const preview = await templateService.previewTemplate(templateId, variables);
        return preview;
      } catch (err) {
        console.error('Preview error:', err);
        return null;
      }
    },
    []
  );

  const sendTestPreview = useCallback(
    async (templateId: string, phoneNumber: string, variables?: Record<string, string>) => {
      try {
        setError(null);
        await templateService.sendTestPreview(templateId, phoneNumber, variables);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to send test';
        setError(errorMsg);
        throw err;
      }
    },
    []
  );

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    previewTemplate,
    sendTestPreview,
  };
}

/**
 * Hook for broadcast management
 */
export function useBroadcast(merchantId: string) {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBroadcasts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await templateService.listBroadcasts(merchantId);
      setBroadcasts(result.broadcasts || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch broadcasts');
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  const createBroadcast = useCallback(
    async (broadcast: any) => {
      try {
        setError(null);
        const result = await templateService.createBroadcast({
          ...broadcast,
          merchantId,
        });
        setBroadcasts((prev) => [...prev, result]);
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create broadcast';
        setError(errorMsg);
        throw err;
      }
    },
    [merchantId]
  );

  const sendBroadcast = useCallback(async (broadcastId: string) => {
    try {
      setError(null);
      await templateService.sendBroadcastNow(broadcastId);
      setBroadcasts((prev) =>
        prev.map((b) =>
          b.id === broadcastId ? { ...b, status: 'sending' } : b
        )
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send broadcast';
      setError(errorMsg);
      throw err;
    }
  }, []);

  return {
    broadcasts,
    loading,
    error,
    fetchBroadcasts,
    createBroadcast,
    sendBroadcast,
  };
}
