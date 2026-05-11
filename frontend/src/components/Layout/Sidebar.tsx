import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Monitor,
  Activity,
  Video,
  Clock,
  BarChart3,
  Gamepad2,
  Lock,
  AlertTriangle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  BellRing,
  Heart,
  GitCompare,
  Share2,
  PieChart,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: '监控中心',
    items: [
      { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
      { path: '/realtime', label: '实时监控', icon: Activity },
      { path: '/video', label: '视频监控', icon: Video },
    ],
  },
  {
    title: '设备管理',
    items: [
      { path: '/devices', label: '设备管理', icon: Monitor },
      { path: '/devices/share', label: '设备分享', icon: Share2 },
      { path: '/device-health', label: '设备健康', icon: Heart },
    ],
  },
  {
    title: '数据分析',
    items: [
      { path: '/history', label: '历史数据', icon: Clock },
      { path: '/data-display', label: '数据展示', icon: BarChart3 },
      { path: '/comparison', label: '数据对比', icon: GitCompare },
      { path: '/statistics', label: '统计分析', icon: PieChart },
      { path: '/reports', label: '综合报告', icon: FileText },
    ],
  },
  {
    title: '智能决策',
    items: [
      { path: '/smart-control', label: '智能控制', icon: Gamepad2 },
      { path: '/prediction', label: '预测分析', icon: TrendingUp },
      { path: '/encryption', label: '数据加密', icon: Lock },
    ],
  },
  {
    title: '安全中心',
    items: [
      { path: '/alerts', label: '预警中心', icon: AlertTriangle },
      { path: '/notification', label: '通知中心', icon: BellRing },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`h-screen flex flex-col transition-all duration-300 border-r border-[var(--ocean-surface)] bg-white ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex items-center justify-between h-14 px-3 border-b border-[var(--ocean-surface)]">
        {!collapsed && (
          <span className="text-sm font-bold tracking-wide text-[var(--cyan-glow)] whitespace-nowrap">
            🌊 海洋牧场
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-[var(--ocean-blue)]/60 hover:bg-[var(--ocean-surface)] hover:text-[var(--cyan-glow)] transition-all"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.title} className="mb-1">
            {!collapsed && (
              <div className="px-5 py-1.5 text-[10px] font-medium text-[var(--ocean-blue)]/30 uppercase tracking-widest">
                {section.title}
              </div>
            )}
            {collapsed && <div className="my-1 mx-3 border-t border-[var(--ocean-surface)]/50" />}
            {section.items.map(({ path, label, icon: Icon }) => {
              const isActive =
                location.pathname === path || location.pathname.startsWith(path + '/');
              return (
                <NavLink
                  key={path}
                  to={path}
                  className={`flex items-center gap-3 mx-2 my-0.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                    isActive
                      ? 'bg-[var(--cyan-glow)]/10 text-[var(--cyan-glow)] shadow-[0_0_12px_rgba(8,145,178,0.1)]'
                      : 'text-[var(--ocean-blue)]/70 hover:bg-[var(--ocean-surface)]/60 hover:text-[var(--cyan-glow)]'
                  }`}
                >
                  <Icon
                    size={18}
                    className={`shrink-0 transition-all ${
                      isActive
                        ? 'text-[var(--cyan-glow)]'
                        : 'group-hover:text-[var(--cyan-glow)]'
                    }`}
                  />
                  {!collapsed && <span className="whitespace-nowrap">{label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-[var(--ocean-surface)]">
        {!collapsed && (
          <p className="text-[10px] text-[var(--ocean-blue)]/30 text-center">
            海洋智能牧场 v1.0
          </p>
        )}
      </div>
    </aside>
  );
}
