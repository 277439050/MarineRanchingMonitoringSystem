import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAlertStore } from '@/stores/alertStore';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { alerts, fetchAlerts } = useAlertStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeAlerts = alerts.filter((a) => a.status === 'active').length;

  useEffect(() => {
    fetchAlerts({ status: 'active' });
  }, [fetchAlerts]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-[var(--ocean-surface)] bg-white/80 backdrop-blur-md relative z-30">
      <h1 className="text-base font-semibold tracking-wide text-[var(--ocean-blue)]">
        海洋智能牧场监测预测系统
      </h1>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-lg text-[var(--ocean-blue)]/60 hover:bg-[var(--ocean-surface)]/60 hover:text-[var(--cyan-glow)] transition-all"
        >
          <Bell size={18} />
          {activeAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--coral-red)] text-white text-[10px] font-bold animate-pulse-alert">
              {activeAlerts > 99 ? '99+' : activeAlerts}
            </span>
          )}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[var(--ocean-blue)] hover:bg-[var(--ocean-surface)]/60 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--cyan-glow)]/10 flex items-center justify-center">
              <User size={14} className="text-[var(--cyan-glow)]" />
            </div>
            <span className="max-w-[100px] truncate">{user?.username ?? '用户'}</span>
            <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
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
