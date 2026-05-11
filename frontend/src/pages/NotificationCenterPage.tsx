import { useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, Settings, Trash2, Filter, Clock, ChevronDown } from 'lucide-react';
import { formatDateTime } from '@/utils/format';

type NotificationType = 'all' | 'alert' | 'system' | 'tip';
type NotificationPriority = 'high' | 'medium' | 'low';

interface Notification {
  id: string;
  type: 'alert' | 'system' | 'tip';
  priority: NotificationPriority;
  title: string;
  content: string;
  timestamp: string;
  read: boolean;
  device?: string;
  action?: string;
}

const mockNotifications: Notification[] = [
  { id: '1', type: 'alert', priority: 'high', title: '溶解氧预警', content: '水质浮漂传感器检测到溶解氧低于阈值，当前值4.2mg/L，低于设定值5.0mg/L', timestamp: '2026-05-07T14:30:00Z', read: false, device: 'SENSOR_001', action: '查看详情' },
  { id: '2', type: 'alert', priority: 'high', title: '氨氮浓度异常', content: '氨氮浓度达到2.8mg/L，超过安全阈值2.0mg/L，建议立即换水', timestamp: '2026-05-07T13:15:00Z', read: false, device: 'SENSOR_001', action: '查看详情' },
  { id: '3', type: 'system', priority: 'medium', title: '设备维护提醒', content: '水下摄像系统密封件使用超过90天，建议进行维护检查', timestamp: '2026-05-07T10:00:00Z', read: false, device: 'CAM_001', action: '查看详情' },
  { id: '4', type: 'tip', priority: 'low', title: '养殖小贴士', content: '当前水温较高，溶解氧容易下降，建议增加增氧设备运行时间', timestamp: '2026-05-07T08:00:00Z', read: true, action: '查看详情' },
  { id: '5', type: 'system', priority: 'medium', title: '数据备份完成', content: '系统已完成今日数据自动备份，共备份记录3280条', timestamp: '2026-05-06T23:00:00Z', read: true },
  { id: '6', type: 'alert', priority: 'low', title: 'pH值波动提醒', content: 'pH值在过去2小时内波动超过0.5，建议检查是否异常', timestamp: '2026-05-06T18:30:00Z', read: true, device: 'SENSOR_001', action: '查看详情' },
  { id: '7', type: 'tip', priority: 'low', title: '投喂建议', content: '根据溶解氧和氨氮数据，今日投喂量建议减少10%，以降低水质负担', timestamp: '2026-05-06T08:00:00Z', read: true, action: '查看详情' },
  { id: '8', type: 'system', priority: 'low', title: '固件更新可用', content: '水质联动控制箱有新版本固件v2.3.1可用，包含性能优化', timestamp: '2026-05-05T16:00:00Z', read: true, device: 'CTRL_001', action: '立即更新' },
];

export default function NotificationCenter() {
  const [filterType, setFilterType] = useState<NotificationType>('all');
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    enableSound: true,
    enableDesktop: true,
    alertThresholds: { high: true, medium: true, low: true },
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
  });

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      case 'system': return <Info className="w-4 h-4" />;
      case 'tip': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert': return 'text-red-500';
      case 'system': return 'text-blue-500';
      case 'tip': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    const colors = {
      high: 'bg-red-500/20 text-red-500',
      medium: 'bg-orange-500/20 text-orange-500',
      low: 'bg-gray-500/20 text-gray-500',
    };
    const labels = { high: '紧急', medium: '重要', low: '一般' };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[priority]}`}>
        {labels[priority]}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-[var(--cyan-glow)]" />
          <h1 className="text-xl font-semibold text-[var(--cyan-glow)]">通知中心</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold">
              {unreadCount}条未读
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="px-4 py-2 rounded-lg bg-[var(--ocean-surface)] text-[var(--ocean-blue)] text-sm hover:bg-[var(--ocean-surface)]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            全部标为已读
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
              showSettings ? 'bg-[var(--cyan-glow)] text-white' : 'bg-[var(--ocean-surface)] text-[var(--ocean-blue)] hover:bg-[var(--ocean-surface)]/80'
            }`}
          >
            <Settings className="w-4 h-4" />
            设置
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">通知设置</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-[var(--ocean-deep)] rounded-lg px-4 py-3">
                <div>
                  <div className="text-sm text-[var(--ocean-blue)]">声音提醒</div>
                  <div className="text-xs text-[var(--ocean-blue)]/50">收到通知时播放提示音</div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, enableSound: !settings.enableSound })}
                  className={`w-12 h-6 rounded-full transition-all ${settings.enableSound ? 'bg-[var(--cyan-glow)]' : 'bg-[var(--ocean-surface)]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-all ${settings.enableSound ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between bg-[var(--ocean-deep)] rounded-lg px-4 py-3">
                <div>
                  <div className="text-sm text-[var(--ocean-blue)]">桌面通知</div>
                  <div className="text-xs text-[var(--ocean-blue)]/50">在浏览器中显示桌面通知</div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, enableDesktop: !settings.enableDesktop })}
                  className={`w-12 h-6 rounded-full transition-all ${settings.enableDesktop ? 'bg-[var(--cyan-glow)]' : 'bg-[var(--ocean-surface)]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-all ${settings.enableDesktop ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-[var(--ocean-blue)]/50 mb-2">接收通知类型</div>
              {([
                { key: 'high' as const, label: '紧急预警' },
                { key: 'medium' as const, label: '重要通知' },
                { key: 'low' as const, label: '一般消息' },
              ]).map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between bg-[var(--ocean-deep)] rounded-lg px-4 py-2">
                  <span className="text-sm text-[var(--ocean-blue)]">{label}</span>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      alertThresholds: { ...settings.alertThresholds, [key]: !settings.alertThresholds[key] }
                    })}
                    className={`w-10 h-5 rounded-full transition-all ${settings.alertThresholds[key] ? 'bg-[var(--cyan-glow)]' : 'bg-[var(--ocean-surface)]'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-all ${settings.alertThresholds[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {([
          { key: 'all' as NotificationType, label: '全部', count: notifications.length },
          { key: 'alert' as NotificationType, label: '预警', count: notifications.filter((n) => n.type === 'alert').length },
          { key: 'system' as NotificationType, label: '系统', count: notifications.filter((n) => n.type === 'system').length },
          { key: 'tip' as NotificationType, label: '小贴士', count: notifications.filter((n) => n.type === 'tip').length },
        ]).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              filterType === key
                ? 'bg-[var(--cyan-glow)] text-white glow-cyan'
                : 'bg-[var(--ocean-surface)] text-[var(--ocean-blue)] hover:bg-[var(--ocean-surface)]/80'
            }`}
          >
            {label} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
          </button>
        ))}
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bell className="w-12 h-12 text-[var(--ocean-blue)]/30 mx-auto mb-3" />
          <p className="text-[var(--ocean-blue)]/50">暂无通知</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`glass-card p-4 transition-all ${
                notification.read ? 'opacity-75' : 'border-l-2 border-l-[var(--cyan-glow)]'
              } hover:opacity-100`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${getTypeColor(notification.type)}`}>
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--ocean-blue)]">{notification.title}</h3>
                      {getPriorityBadge(notification.priority)}
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-[var(--cyan-glow)]" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--ocean-blue)]/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(notification.timestamp)}
                      </span>
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="text-[var(--ocean-blue)]/30 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--ocean-blue)]/70 leading-relaxed">{notification.content}</p>
                  {notification.device && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--ocean-blue)]/50">设备:</span>
                      <span className="text-xs text-[var(--ocean-blue)] font-mono">{notification.device}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs text-[var(--cyan-glow)] hover:underline"
                      >
                        标为已读
                      </button>
                    )}
                    {notification.action && (
                      <button className="text-xs text-[var(--cyan-glow)] hover:underline">
                        {notification.action}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {notifications.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={handleClearAll}
            className="px-6 py-2 rounded-lg bg-[var(--ocean-surface)] text-[var(--ocean-blue)]/70 text-sm hover:bg-[var(--ocean-surface)]/80 transition-all"
          >
            清空所有通知
          </button>
        </div>
      )}
    </div>
  );
}
