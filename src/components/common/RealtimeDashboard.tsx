import React, { useEffect, useState } from 'react';
import { websocketService } from '../services/websocketService';
import { AlertCircle, Wifi, WifiOff, Activity, Bell, Package, TrendingUp } from 'lucide-react';

interface DashboardStats {
  connectedClients: number;
  activeRooms: number;
  totalMessages: number;
  botStatus: 'connected' | 'disconnected' | 'connecting';
  lastUpdate: Date;
}

interface RecentEvent {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  level?: 'info' | 'warning' | 'error' | 'success';
}

interface BotStats {
  messagesReceived: number;
  commandsExecuted: number;
  ordersCreated: number;
  activeUsers: number;
}

export const RealtimeDashboard: React.FC = () => {
  const [wsConnected, setWsConnected] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    connectedClients: 0,
    activeRooms: 0,
    totalMessages: 0,
    botStatus: 'disconnected',
    lastUpdate: new Date(),
  });

  const [botStats, setBotStats] = useState<BotStats>({
    messagesReceived: 0,
    commandsExecuted: 0,
    ordersCreated: 0,
    activeUsers: 0,
  });

  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        // Get merchant ID from localStorage or context
        const merchantId = localStorage.getItem('merchantId') || 'admin';
        const token = localStorage.getItem('authToken') || 'demo-token';

        await websocketService.connect(merchantId, token, undefined, 'dashboard');

        // Subscribe to relevant events
        websocketService.subscribeToBotStatus((status) => {
          handleBotStatus(status);
        });

        websocketService.subscribeToNewOrders((order) => {
          addEvent({
            id: `order-${Date.now()}`,
            type: 'new_order',
            message: `New order #${order.id} from ${order.customer}`,
            timestamp: new Date(),
            level: 'success',
          });
          setBotStats((prev) => ({
            ...prev,
            ordersCreated: prev.ordersCreated + 1,
          }));
        });

        websocketService.subscribeToBotMessages((message) => {
          addEvent({
            id: `msg-${Date.now()}`,
            type: 'bot_message',
            message: `Message from ${message.from}: ${message.text?.substring(0, 50)}...`,
            timestamp: new Date(),
            level: 'info',
          });
          setBotStats((prev) => ({
            ...prev,
            messagesReceived: prev.messagesReceived + 1,
          }));
        });

        websocketService.on('command_executed', (data) => {
          addEvent({
            id: `cmd-${Date.now()}`,
            type: 'command_executed',
            message: `Command: ${data.command} (${data.status})`,
            timestamp: new Date(),
            level: data.status === 'success' ? 'success' : 'warning',
          });
          setBotStats((prev) => ({
            ...prev,
            commandsExecuted: prev.commandsExecuted + 1,
          }));
        });

        websocketService.on('merchant_notification', (data) => {
          addEvent({
            id: `notif-${Date.now()}`,
            type: 'merchant_notification',
            message: data.notification,
            timestamp: new Date(),
            level: (data.level as any) || 'info',
          });
        });

        websocketService.on('order_status_changed', (data) => {
          addEvent({
            id: `status-${Date.now()}`,
            type: 'order_status_changed',
            message: `Order #${data.orderId}: ${data.oldStatus} → ${data.newStatus}`,
            timestamp: new Date(),
            level: 'info',
          });
        });
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        addEvent({
          id: `error-${Date.now()}`,
          type: 'error',
          message: 'Failed to connect to real-time server',
          timestamp: new Date(),
          level: 'error',
        });
      }
    };

    // Subscribe to connection changes
    const unsubscribe = websocketService.onConnectionChange((connected) => {
      setWsConnected(connected);
      const connectionData = websocketService.getConnectionInfo();
      setConnectionInfo(connectionData);

      if (connected) {
        addEvent({
          id: `connected-${Date.now()}`,
          type: 'connection',
          message: 'Connected to real-time server',
          timestamp: new Date(),
          level: 'success',
        });
      } else {
        addEvent({
          id: `disconnected-${Date.now()}`,
          type: 'disconnection',
          message: 'Disconnected from real-time server',
          timestamp: new Date(),
          level: 'warning',
        });
      }
    });

    initializeWebSocket();

    // Fetch stats periodically
    const statsInterval = setInterval(fetchStats, 10000);

    return () => {
      unsubscribe();
      clearInterval(statsInterval);
    };
  }, []);

  const handleBotStatus = (status: any) => {
    setStats((prev) => ({
      ...prev,
      botStatus: status.connected ? 'connected' : 'disconnected',
      connectedClients: status.connectedClients || 0,
      activeRooms: status.activeRooms || 0,
      lastUpdate: new Date(),
    }));
  };

  const addEvent = (event: RecentEvent) => {
    setRecentEvents((prev) => [event, ...prev].slice(0, 20)); // Keep last 20 events
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ws-stats');
      const data = await response.json();
      if (data.success) {
        setStats((prev) => ({
          ...prev,
          connectedClients: data.data.connectedClients,
          activeRooms: data.data.activeRooms,
          lastUpdate: new Date(),
        }));
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen text-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Real-Time Dashboard</h1>
            <p className="text-slate-400">Live bot and order monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            {wsConnected ? (
              <div className="flex items-center gap-2 bg-emerald-900/30 px-4 py-2 rounded-lg border border-emerald-500/30">
                <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-emerald-300 text-sm">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-red-900/30 px-4 py-2 rounded-lg border border-red-500/30">
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-red-300 text-sm">Disconnected</span>
              </div>
            )}
          </div>
        </div>

        {/* Connection Info */}
        {connectionInfo && (
          <div className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded border border-slate-700">
            <div className="grid grid-cols-4 gap-4">
              <div>Merchant: <span className="text-slate-200">{connectionInfo.merchantId || 'N/A'}</span></div>
              <div>Role: <span className="text-slate-200">{connectionInfo.role}</span></div>
              <div>Connected: <span className="text-slate-200">{connectionInfo.connected ? 'Yes' : 'No'}</span></div>
              <div>Attempts: <span className="text-slate-200">{connectionInfo.reconnectAttempts}/5</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Connected Clients */}
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-300 text-sm font-medium">Connected Clients</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-100">{stats.connectedClients}</div>
          <p className="text-xs text-blue-300/60 mt-1">Real-time users</p>
        </div>

        {/* Active Rooms */}
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-300 text-sm font-medium">Active Rooms</span>
            <Bell className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-100">{stats.activeRooms}</div>
          <p className="text-xs text-purple-300/60 mt-1">Subscribed channels</p>
        </div>

        {/* Orders Created */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-300 text-sm font-medium">Orders</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-100">{botStats.ordersCreated}</div>
          <p className="text-xs text-emerald-300/60 mt-1">This session</p>
        </div>

        {/* Bot Status */}
        <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 border border-orange-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-orange-300 text-sm font-medium">Bot Status</span>
            <TrendingUp className="w-4 h-4 text-orange-400" />
          </div>
          <div className={`text-3xl font-bold ${
            stats.botStatus === 'connected' ? 'text-emerald-100' : 'text-red-100'
          }`}>
            {stats.botStatus.toUpperCase()}
          </div>
          <p className="text-xs text-orange-300/60 mt-1">WhatsApp connection</p>
        </div>
      </div>

      {/* Bot Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Message & Command Stats */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-100">Bot Activity</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Messages Received</span>
              <span className="text-xl font-bold text-blue-300">{botStats.messagesReceived}</span>
            </div>
            <div className="h-px bg-slate-700" />
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Commands Executed</span>
              <span className="text-xl font-bold text-purple-300">{botStats.commandsExecuted}</span>
            </div>
          </div>
        </div>

        {/* Connection Info */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-100">Connection Health</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400 text-sm">Uptime</span>
                <span className="text-slate-300 text-sm">Stable</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '95%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400 text-sm">Response Time</span>
                <span className="text-slate-300 text-sm">Fast</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events Feed */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-100">Recent Events</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No events yet</p>
            </div>
          ) : (
            recentEvents.map((event) => (
              <div
                key={event.id}
                className={`flex items-start gap-3 p-3 rounded border text-sm ${
                  event.level === 'success'
                    ? 'bg-emerald-900/20 border-emerald-500/20 text-emerald-300'
                    : event.level === 'error'
                    ? 'bg-red-900/20 border-red-500/20 text-red-300'
                    : event.level === 'warning'
                    ? 'bg-yellow-900/20 border-yellow-500/20 text-yellow-300'
                    : 'bg-blue-900/20 border-blue-500/20 text-blue-300'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  event.level === 'success'
                    ? 'bg-emerald-400'
                    : event.level === 'error'
                    ? 'bg-red-400'
                    : event.level === 'warning'
                    ? 'bg-yellow-400'
                    : 'bg-blue-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="break-words">{event.message}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {event.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-500">
        <p>Last updated: {stats.lastUpdate.toLocaleTimeString()}</p>
        <p>Real-time WebSocket connection active</p>
      </div>
    </div>
  );
};

export default RealtimeDashboard;
