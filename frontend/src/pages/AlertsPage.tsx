import { useState } from 'react';
import type { Alert, AlertRule } from '@/types';
import { formatDateTime } from '@/utils/format';
import { Bell, Plus, X } from 'lucide-react';

const mockAlerts: Alert[] = [
  { id: 1, did: 'SENSOR_001', level: 'I', metric: 'o2', value: 3.2, threshold: 5.0, message: '溶解氧严重偏低，低于I级阈值', status: 'active', created_at: '2026-05-06T06:00:00Z', resolved_at: null },
  { id: 2, did: 'SENSOR_001', level: 'II', metric: 'nh3', value: 2.8, threshold: 2.0, message: '氨氮浓度偏高，超过II级阈值', status: 'active', created_at: '2026-05-06T07:30:00Z', resolved_at: null },
  { id: 3, did: 'SENSOR_001', level: 'III', metric: 'ph', value: 8.7, threshold: 8.5, message: 'pH值偏高，超过III级阈值', status: 'active', created_at: '2026-05-06T09:00:00Z', resolved_at: null },
  { id: 4, did: 'SENSOR_001', level: 'II', metric: 'o2', value: 4.5, threshold: 5.0, message: '溶解氧偏低，低于II级阈值', status: 'resolved', created_at: '2026-05-05T14:00:00Z', resolved_at: '2026-05-05T16:00:00Z' },
  { id: 5, did: 'SENSOR_001', level: 'III', metric: 'salt', value: 36.5, threshold: 35.0, message: '盐度偏高，超过III级阈值', status: 'resolved', created_at: '2026-05-04T10:00:00Z', resolved_at: '2026-05-04T12:30:00Z' },
];

const mockRules: AlertRule[] = [
  { id: 1, metric: 'o2', level: 'I', operator: '<', threshold: 3.5, auto_action: '开启增氧泵' },
  { id: 2, metric: 'o2', level: 'II', operator: '<', threshold: 5.0, auto_action: '发送通知' },
  { id: 3, metric: 'nh3', level: 'II', operator: '>', threshold: 2.0, auto_action: '发送通知' },
  { id: 4, metric: 'ph', level: 'III', operator: '>', threshold: 8.5, auto_action: null },
];

const metricLabels: Record<string, string> = { ph: 'pH值', salt: '盐度', o2: '溶解氧', nh3: '氨氮', health: '健康指数' };
const levelColors: Record<string, string> = { I: 'bg-[var(--coral-red)]/20 text-[var(--coral-red)]', II: 'bg-[var(--amber)]/20 text-[var(--amber)]', III: 'bg-orange-400/20 text-orange-400' };
const operatorLabels: Record<string, string> = { '>': '大于', '<': '小于', '>=': '大于等于', '<=': '小于等于' };

export default function AlertsPage() {
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [levelFilter, setLevelFilter] = useState('all');
  const [metricFilter, setMetricFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alerts, setAlerts] = useState(mockAlerts);
  const [rules, setRules] = useState(mockRules);
  const [showModal, setShowModal] = useState(false);
  const [newRule, setNewRule] = useState({ metric: 'o2', level: 'II' as 'I' | 'II' | 'III', operator: '>' as '>' | '<' | '>=' | '<=', threshold: 5.0, auto_action: '' });

  const filtered = alerts.filter((a) => {
    if (tab === 'active' && a.status !== 'active' && a.status !== 'acknowledged') return false;
    if (tab === 'history' && a.status !== 'resolved') return false;
    if (levelFilter !== 'all' && a.level !== levelFilter) return false;
    if (metricFilter !== 'all' && a.metric !== metricFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const acknowledge = (id: number) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: 'acknowledged' as const } : a));
  };

  const addRule = () => {
    const rule: AlertRule = { id: Date.now(), ...newRule, auto_action: newRule.auto_action || null };
    setRules((prev) => [...prev, rule]);
    setShowModal(false);
    setNewRule({ metric: 'o2', level: 'II', operator: '>', threshold: 5.0, auto_action: '' });
  };

  const deleteRule = (id: number) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5 text-[var(--cyan-glow)]" />
        <h1 className="text-xl font-semibold text-[var(--cyan-glow)]">预警中心</h1>
      </div>

      <div className="flex gap-2">
        {(['active', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-[var(--cyan-glow)] text-white' : 'bg-[var(--ocean-surface)] text-[var(--ocean-blue)]'
            }`}
          >
            {t === 'active' ? '活跃预警' : '历史预警'}
          </button>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="bg-[var(--ocean-deep)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none">
          <option value="all">全部级别</option>
          <option value="I">I级</option>
          <option value="II">II级</option>
          <option value="III">III级</option>
        </select>
        <select value={metricFilter} onChange={(e) => setMetricFilter(e.target.value)} className="bg-[var(--ocean-deep)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none">
          <option value="all">全部指标</option>
          {Object.entries(metricLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[var(--ocean-deep)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none">
          <option value="all">全部状态</option>
          <option value="active">活跃</option>
          <option value="acknowledged">已确认</option>
          <option value="resolved">已解决</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--ocean-blue)]/60 text-xs border-b border-[var(--ocean-surface)]">
                <th className="text-left py-3 px-3">级别</th>
                <th className="text-left py-3 px-3">指标</th>
                <th className="text-left py-3 px-3">当前值</th>
                <th className="text-left py-3 px-3">阈值</th>
                <th className="text-left py-3 px-3">消息</th>
                <th className="text-left py-3 px-3">状态</th>
                <th className="text-left py-3 px-3">时间</th>
                <th className="text-left py-3 px-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-[var(--ocean-surface)]/30">
                  <td className="py-2.5 px-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[a.level]}`}>{a.level}级</span></td>
                  <td className="py-2.5 px-3 text-[var(--ocean-blue)]">{metricLabels[a.metric] ?? a.metric}</td>
                  <td className="py-2.5 px-3 text-[var(--coral-red)] font-mono">{a.value}</td>
                  <td className="py-2.5 px-3 text-[var(--ocean-blue)]/70 font-mono">{a.threshold}</td>
                  <td className="py-2.5 px-3 text-[var(--ocean-blue)]/80 max-w-[200px] truncate">{a.message}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      a.status === 'active' ? 'bg-[var(--coral-red)]/20 text-[var(--coral-red)]' :
                      a.status === 'acknowledged' ? 'bg-[var(--amber)]/20 text-[var(--amber)]' :
                      'bg-[var(--sea-green)]/20 text-[var(--sea-green)]'
                    }`}>
                      {a.status === 'active' ? '活跃' : a.status === 'acknowledged' ? '已确认' : '已解决'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[var(--ocean-blue)]/60 text-xs whitespace-nowrap">
                    {a.status === 'resolved' && a.resolved_at ? formatDateTime(a.resolved_at) : formatDateTime(a.created_at)}
                  </td>
                  <td className="py-2.5 px-3">
                    {(a.status === 'active') && (
                      <button onClick={() => acknowledge(a.id)} className="text-xs text-[var(--cyan-glow)] hover:underline">确认</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">预警规则</h2>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1 bg-[var(--cyan-glow)] text-white rounded-lg px-3 py-1.5 text-xs font-semibold">
            <Plus className="w-3.5 h-3.5" /> 添加规则
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--ocean-blue)]/60 text-xs border-b border-[var(--ocean-surface)]">
              <th className="text-left py-2 px-3">指标</th>
              <th className="text-left py-2 px-3">级别</th>
              <th className="text-left py-2 px-3">条件</th>
              <th className="text-left py-2 px-3">阈值</th>
              <th className="text-left py-2 px-3">自动动作</th>
              <th className="text-left py-2 px-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-b border-[var(--ocean-surface)]/30">
                <td className="py-2 px-3 text-[var(--ocean-blue)]">{metricLabels[r.metric] ?? r.metric}</td>
                <td className="py-2 px-3"><span className={`text-xs px-2 py-0.5 rounded-full ${levelColors[r.level]}`}>{r.level}级</span></td>
                <td className="py-2 px-3 text-[var(--ocean-blue)]/70">{operatorLabels[r.operator]}</td>
                <td className="py-2 px-3 text-[var(--ocean-blue)] font-mono">{r.threshold}</td>
                <td className="py-2 px-3 text-[var(--ocean-blue)]/60">{r.auto_action ?? '无'}</td>
                <td className="py-2 px-3 flex gap-2">
                  <button className="text-xs text-[var(--ocean-blue)] hover:text-[var(--cyan-glow)]">编辑</button>
                  <button onClick={() => deleteRule(r.id)} className="text-xs text-[var(--coral-red)] hover:underline">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--cyan-glow)]">添加预警规则</h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-[var(--ocean-blue)]" /></button>
            </div>
            <div className="space-y-3">
              <select value={newRule.metric} onChange={(e) => setNewRule((p) => ({ ...p, metric: e.target.value }))} className="w-full bg-[var(--ocean-deep)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none">
                {Object.entries(metricLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={newRule.level} onChange={(e) => setNewRule((p) => ({ ...p, level: e.target.value as 'I' | 'II' | 'III' }))} className="w-full bg-[var(--ocean-deep)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none">
                <option value="I">I级</option><option value="II">II级</option><option value="III">III级</option>
              </select>
              <select value={newRule.operator} onChange={(e) => setNewRule((p) => ({ ...p, operator: e.target.value as '>' | '<' | '>=' | '<=' }))} className="w-full bg-[var(--ocean-deep)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none">
                <option value=">">大于</option><option value="<">小于</option><option value=">=">大于等于</option><option value="<=">小于等于</option>
              </select>
              <input type="number" step="0.1" value={newRule.threshold} onChange={(e) => setNewRule((p) => ({ ...p, threshold: Number(e.target.value) }))} className="w-full bg-[var(--ocean-deep)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none" placeholder="阈值" />
              <input value={newRule.auto_action} onChange={(e) => setNewRule((p) => ({ ...p, auto_action: e.target.value }))} className="w-full bg-[var(--ocean-deep)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none" placeholder="自动动作（可选）" />
            </div>
            <button onClick={addRule} className="w-full bg-[var(--cyan-glow)] text-white rounded-lg py-2 text-sm font-semibold">确认添加</button>
          </div>
        </div>
      )}
    </div>
  );
}
