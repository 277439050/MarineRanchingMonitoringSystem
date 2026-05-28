import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, ChevronDown, AlertTriangle, AlertCircle, Info, ExternalLink, CheckCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAlertStore } from '@/stores/alertStore';

const levelConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  I:   { label: 'I级',  color: '#ef4444', bg: '#fef2f2', icon: AlertTriangle },
  II:  { label: 'II级', color: '#f59e0b', bg: '#fffbeb', icon: AlertCircle },
  III: { label: 'III级', color: '#3b82f6', bg: '#eff6ff', icon: Info },
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return `${Math.floor(diff / 86400000)}天前`;
}

export default function Header() {
  const { user, logout } = useAuthStore();
  const { alerts, fetchAlerts } = useAlertStore();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const prevActiveIdsRef = useRef<Set<number>>(new Set());

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const unreadCount = activeAlerts.filter((a) => !readIds.has(a.id)).length;

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const currentIds = new Set(activeAlerts.map((a) => a.id));
    const newIds = [...currentIds].filter((id) => !prevActiveIdsRef.current.has(id));
    if (newIds.length > 0) {
      setReadIds((prev) => {
        const next = new Set(prev);
        for (const id of newIds) next.delete(id);
        return next;
      });
    }
    prevActiveIdsRef.current = currentIds;
  }, [activeAlerts]);

  const handleOpenNotif = useCallback(() => {
    setNotifOpen((prev) => {
      if (!prev && unreadCount > 0) {
        setReadIds((prevSet) => {
          const next = new Set(prevSet);
          for (const a of activeAlerts) next.add(a.id);
          return next;
        });
      }
      return true;
    });
    setUserOpen(false);
  }, [unreadCount, activeAlerts]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayAlerts = alerts.slice(0, 8);

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-[var(--ocean-surface)] bg-white/80 backdrop-blur-md relative z-30">
      <h1 className="text-base font-semibold tracking-wide text-[var(--ocean-blue)]">
        海洋智能牧场监测预测系统
      </h1>

      <div className="flex items-center gap-4">
        {/* 通知铃铛 */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleOpenNotif}
            className="relative p-2 rounded-lg text-[var(--ocean-blue)]/60 hover:bg-[var(--ocean-surface)]/60 hover:text-[var(--cyan-glow)] transition-all"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--coral-red)] text-white text-[10px] font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-[380px] rounded-xl bg-white border border-[var(--ocean-surface)] shadow-xl shadow-black/10 z-50 overflow-hidden">
              {/* 头部 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ocean-surface)]">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-[var(--cyan-glow)]" />
                  <span className="text-sm font-semibold text-[var(--ocean-blue)]">系统通知</span>
                  {unreadCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--coral-red)]/10 text-[var(--coral-red)] text-xs font-medium">
                      {unreadCount} 条未读
                    </span>
                  )}
                </div>
                <button
                  onClick={() => navigate('/alerts')}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--cyan-glow)] hover:bg-[var(--cyan-glow)]/8 rounded-md transition-colors"
                >
                  查看全部
                  <ExternalLink size={12} />
                </button>
              </div>

              {/* 列表 */}
              <div className="max-h-[340px] overflow-y-auto">
                {displayAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-[var(--ocean-blue)]/40">
                    <CheckCheck size={32} strokeWidth={1.5} />
                    <p className="mt-2 text-sm">暂无告警通知</p>
                    <p className="text-xs mt-0.5">系统运行正常</p>
                  </div>
                ) : (
                  displayAlerts.map((alert) => {
                    const isUnread = alert.status === 'active' && !readIds.has(alert.id);
                    const cfg = levelConfig[alert.level] || levelConfig.III;
                    const Icon = cfg.icon;

                    return (
                      <div
                        key={alert.id}
                        onClick={() => navigate(`/alerts`)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-[var(--ocean-surface)]/60 last:border-b-0 ${
                          isUnread ? 'bg-[#fef2f2]/70 hover:bg-[#fef2f2]' : 'bg-white hover:bg-[var(--ocean-surface)]/40'
                        }`}
                      >
                        {/* 级别图标 */}
                        <div
                          className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: cfg.bg }}
                        >
                          <Icon size={15} style={{ color: cfg.color }} />
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--ocean-blue)] truncate">{alert.message}</span>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-[var(--coral-red)] shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-medium"
                              style={{ backgroundColor: cfg.bg, color: cfg.color }}
                            >
                              {cfg.label}
                            </span>
                            <span className="text-xs text-[var(--ocean-blue)]/45">
                              当前值 {alert.value} · 阈值 {alert.threshold}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--ocean-blue)]/35 mt-1">{timeAgo(alert.created_at)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 底部状态栏 */}
              <div className="px-4 py-2.5 border-t border-[var(--ocean-surface)] bg-[var(--ocean-deep)]/30 flex items-center justify-between">
                <span className="text-xs text-[var(--ocean-blue)]/45">
                  共 {alerts.length} 条告警 · {unreadCount} 条未读
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setReadIds(new Set(alerts.map(a => a.id))); }}
                  className="text-xs text-[var(--cyan-glow)] hover:text-[var(--cyan-glow)]/80 transition-colors"
                >
                  全部标为已读
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 用户下拉 */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[var(--ocean-blue)] hover:bg-[var(--ocean-surface)]/60 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--cyan-glow)]/10 flex items-center justify-center">
              <User size={14} className="text-[var(--cyan-glow)]" />
            </div>
            <span className="max-w-[100px] truncate">{user?.username ?? '用户'}</span>
            <ChevronDown size={14} className={`transition-transform ${userOpen ? 'rotate-180' : ''}`} />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 py-1 rounded-lg bg-white border border-[var(--ocean-surface)] shadow-lg shadow-black/8 z-50">
              <div className="px-3 py-2 border-b border-[var(--ocean-surface)]">
                <p className="text-sm text-[var(--ocean-blue)]">{user?.username}</p>
                <p className="text-xs text-[var(--ocean-blue)]/50">
                  {user?.role === 'admin' ? '管理员' : user?.role === 'operator' ? '操作员' : '观察者'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--coral-red)] hover:bg-[var(--ocean-surface)]/60 transition-colors"
              >
                <LogOut size={14} />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
