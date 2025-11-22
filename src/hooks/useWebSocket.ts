import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketService } from '../services/websocketService';

/**
 * Hook for WebSocket connection management
 */
export function useWebSocket(merchantId: string, token: string, autoConnect = true) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!autoConnect) return;

    const connect = async () => {
      try {
        setIsConnecting(true);
        await websocketService.connect(merchantId, token);
        setIsConnecting(false);
      } catch (error) {
        setConnectionError(
          error instanceof Error ? error.message : 'Failed to connect'
        );
        setIsConnecting(false);
      }
    };

    connect();

    const unsubscribe = websocketService.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        setConnectionError(null);
      }
    });

    return () => {
      unsubscribe();
      // Only disconnect on unmount if explicitly requested
      // websocketService.disconnect();
    };
  }, [merchantId, token, autoConnect]);

  const reconnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      await websocketService.connect(merchantId, token);
      setIsConnecting(false);
    } catch (error) {
      setConnectionError(
        error instanceof Error ? error.message : 'Failed to reconnect'
      );
      setIsConnecting(false);
    }
  }, [merchantId, token]);

  return {
    isConnected,
    isConnecting,
    connectionError,
    reconnect,
  };
}

/**
 * Hook for subscribing to order updates
 */
export function useOrderUpdates(merchantId: string) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!websocketService.isConnected()) {
      setLoading(false);
      return;
    }

    unsubscribeRef.current = websocketService.subscribeToOrders(merchantId, (order) => {
      setOrders((prev) => {
        const index = prev.findIndex((o) => o.id === order.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...order };
          return updated;
        }
        return [...prev, order];
      });
      setLoading(false);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [merchantId]);

  return { orders, loading };
}

/**
 * Hook for subscribing to new orders
 */
export function useNewOrders(merchantId: string, onNewOrder?: (order: any) => void) {
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!websocketService.isConnected()) {
      return;
    }

    unsubscribeRef.current = websocketService.subscribeToNewOrders(
      merchantId,
      (order) => {
        setNewOrders((prev) => [...prev, order]);
        if (onNewOrder) {
          onNewOrder(order);
        }
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [merchantId, onNewOrder]);

  const clearNewOrders = useCallback(() => {
    setNewOrders([]);
  }, []);

  return { newOrders, clearNewOrders };
}

/**
 * Hook for subscribing to notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!websocketService.isConnected()) {
      return;
    }

    unsubscribeRef.current = websocketService.subscribeToNotifications((notification) => {
      setNotifications((prev) => {
        // Keep only last 50 notifications
        const updated = [...prev, notification];
        return updated.slice(-50);
      });
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return notifications;
}

/**
 * Hook for manual message sending
 */
export function useWebSocketMessage() {
  const send = useCallback((type: string, data: any) => {
    websocketService.send(type, data);
  }, []);

  return { send };
}
