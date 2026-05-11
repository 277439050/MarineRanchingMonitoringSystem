import { useState } from 'react';
import type { ControlLog } from '@/types';
import { formatDateTime } from '@/utils/format';
import {
  Power,
  UtensilsCrossed,
  Bot,
  Clock,
  ToggleLeft,
  ToggleRight,
  Droplets,
  Sun,
  Zap,
  CalendarClock,
  ShieldAlert,
  Play,
  History,
} from 'lucide-react';

const controllers = ['水质联动控制箱'];

interface DeviceStatus {
  oxygen_pump: 'open' | 'close';
  feeder: 'open' | 'close';
  water_pump: 'open' | 'close';
  uv_lamp: 'open' | 'close';
}

const mockStatus: DeviceStatus = { oxygen_pump: 'close', feeder: 'close', water_pump: 'close', uv_lamp: 'close' };

const deviceList = [
  { key: 'oxygen_pump' as const, icon: Power, label: '增氧泵', color: 'orange' },
  { key: 'feeder' as const, icon: UtensilsCrossed, label: '喂食机', color: 'blue' },
  { key: 'water_pump' as const, icon: Droplets, label: '水循环泵', color: 'cyan' },
  { key: 'uv_lamp' as const, icon: Sun, label: 'UV杀菌灯', color: 'purple' },
];

const scenes = [
  {
    name: '日常模式',
    icon: Play,
    devices: { oxygen_pump: 'close' as const, feeder: 'close' as const, water_pump: 'open' as const, uv_lamp: 'close' as const },
    desc: '水循环泵开启，其余关闭',
  },
  {
    name: '增氧模式',
    icon: Zap,
    devices: { oxygen_pump: 'open' as const, feeder: 'close' as const, water_pump: 'open' as const, uv_lamp: 'close' as const },
    desc: '增氧泵+水循环泵开启',
  },
  {
    name: '投喂模式',
    icon: UtensilsCrossed,
    devices: { oxygen_pump: 'open' as const, feeder: 'open' as const, water_pump: 'close' as const, uv_lamp: 'close' as const },
    desc: '增氧泵+喂食机开启',
  },
  {
    name: '应急模式',
    icon: ShieldAlert,
    devices: { oxygen_pump: 'open' as const, feeder: 'close' as const, water_pump: 'open' as const, uv_lamp: 'open' as const },
    desc: '增氧泵+水循环泵+UV灯全开',
  },
];

const scheduledTasks = [
  { id: 1, time: '06:00', name: '自动增氧', target: 'oxygen_pump', action: 'open' as const, enabled: true },
  { id: 2, time: '08:00', name: '定时投喂', target: 'feeder', action: 'open' as const, enabled: true },
  { id: 3, time: '12:00', name: '水质检测', target: 'water_pump', action: 'open' as const, enabled: true },
  { id: 4, time: '18:00', name: '二次投喂', target: 'feeder', action: 'open' as const, enabled: false },
];

const mockLogs: ControlLog[] = [
  { id: 1, did: 'CTRL_001', action: 'open', target: 'oxygen_pump', result: 'success', operator: '系统自动', timestamp: '2026-05-06T06:00:00Z' },
  { id: 2, did: 'CTRL_001', action: 'close', target: 'oxygen_pump', result: 'success', operator: '系统自动', timestamp: '2026-05-06T07:30:00Z' },
  { id: 3, did: 'CTRL_001', action: 'open', target: 'feeder', result: 'success', operator: '定时任务', timestamp: '2026-05-06T08:00:00Z' },
  { id: 4, did: 'CTRL_001', action: 'close', target: 'feeder', result: 'success', operator: '定时任务', timestamp: '2026-05-06T08:15:00Z' },
  { id: 5, did: 'CTRL_001', action: 'open', target: 'water_pump', result: 'success', operator: '管理员', timestamp: '2026-05-06T09:00:00Z' },
  { id: 6, did: 'CTRL_001', action: 'open', target: 'uv_lamp', result: 'success', operator: '系统自动', timestamp: '2026-05-06T10:00:00Z' },
  { id: 7, did: 'CTRL_001', action: 'close', target: 'uv_lamp', result: 'failed', operator: '系统自动', timestamp: '2026-05-06T11:00:00Z' },
  { id: 8, did: 'CTRL_001', action: 'open', target: 'oxygen_pump', result: 'success', operator: '应急模式', timestamp: '2026-05-06T14:00:00Z' },
];

const remoteLogs = [
  { id: 1, time: '2026-05-06 14:32', operator: '管理员', action: '切换至应急模式', devices: '增氧泵 / 水循环泵 / UV杀菌灯', result: 'success' as const, ip: '192.168.1.105' },
  { id: 2, time: '2026-05-06 12:15', operator: '管理员', action: '关闭UV杀菌灯', devices: 'UV杀菌灯', result: 'failed' as const, ip: '192.168.1.105' },
  { id: 3, time: '2026-05-06 09:00', operator: '管理员', action: '开启水循环泵', devices: '水循环泵', result: 'success' as const, ip: '10.0.0.22' },
  { id: 4, time: '2026-05-05 18:30', operator: '运维人员', action: '切换至投喂模式', devices: '增氧泵 / 喂食机', result: 'success' as const, ip: '10.0.0.18' },
  { id: 5, time: '2026-05-05 08:00', operator: '管理员', action: '定时投喂启动', devices: '喂食机', result: 'success' as const, ip: '系统' },
];

const targetLabels: Record<string, string> = { oxygen_pump: '增氧泵', feeder: '喂食机', water_pump: '水循环泵', uv_lamp: 'UV杀菌灯' };
const actionLabels: Record<string, string> = { open: '开启', close: '关闭' };

export default function SmartControlPage() {
  const [selected, setSelected] = useState(controllers[0]);
  const [status, setStatus] = useState<DeviceStatus>({ ...mockStatus });
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [o2Threshold, setO2Threshold] = useState(5.0);
  const [nh3Threshold, setNh3Threshold] = useState(2.0);
  const [tempThreshold, setTempThreshold] = useState(28.0);
  const [duration, setDuration] = useState(30);
  const [tasks, setTasks] = useState(scheduledTasks.map((t) => ({ ...t })));

  const toggleDevice = (target: keyof DeviceStatus) => {
    setStatus((prev) => ({
      ...prev,
      [target]: prev[target] === 'open' ? 'close' : 'open',
    }));
  };

  const applyScene = (scene: typeof scenes[number]) => {
    setStatus({ ...scene.devices });
  };

  const toggleTask = (id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Power className="w-5 h-5 text-[var(--cyan-glow)]" />
        <h1 className="text-xl font-semibold text-[var(--cyan-glow)]">智能控制</h1>
      </div>

      <div className="flex gap-3 flex-wrap">
        {controllers.map((c) => (
          <button
            key={c}
            onClick={() => setSelected(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selected === c
                ? 'bg-[var(--cyan-glow)] text-white glow-cyan'
                : 'bg-[var(--ocean-surface)] text-[var(--ocean-blue)] hover:bg-[var(--ocean-surface)]/80'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="glass-card p-5 space-y-5">
        <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">设备控制 — {selected}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {deviceList.map(({ key, icon: Icon, label }) => (
            <div key={key} className="flex items-center justify-between bg-[var(--ocean-deep)] rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-[var(--ocean-blue)]" />
                <span className="text-sm text-[var(--ocean-blue)]">{label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    status[key] === 'open'
                      ? 'bg-orange-500/15 text-orange-500'
                      : 'bg-[var(--ocean-surface)] text-[var(--ocean-blue)]/40'
                  }`}
                >
                  {status[key] === 'open' ? '运行中' : '已关闭'}
                </span>
              </div>
              <button onClick={() => toggleDevice(key)} className="text-2xl">
                {status[key] === 'open' ? (
                  <ToggleRight className="w-8 h-8 text-orange-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-[var(--ocean-surface)]" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--cyan-glow)]" />
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">智能场景</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {scenes.map((scene) => {
            const Icon = scene.icon;
            const activeDevices = Object.entries(scene.devices)
              .filter(([, v]) => v === 'open')
              .map(([k]) => targetLabels[k])
              .join('、');
            return (
              <button
                key={scene.name}
                onClick={() => applyScene(scene)}
                className="bg-[var(--ocean-deep)] rounded-lg px-4 py-3 text-left hover:ring-2 hover:ring-[var(--cyan-glow)]/30 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-4 h-4 text-[var(--cyan-glow)] group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-[var(--ocean-blue)]">{scene.name}</span>
                </div>
                <div className="text-[10px] text-[var(--ocean-blue)]/50 leading-relaxed">{scene.desc}</div>
                <div className="text-[10px] text-[var(--sea-green)] mt-1">{activeDevices || '全部关闭'}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-[var(--cyan-glow)]" />
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">定时任务</h2>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between bg-[var(--ocean-deep)] rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--cyan-glow)]/10 flex items-center justify-center">
                  <span className="text-xs font-mono font-semibold text-[var(--cyan-glow)]">{task.time}</span>
                </div>
                <div>
                  <div className="text-sm text-[var(--ocean-blue)]">{task.name}</div>
                  <div className="text-[10px] text-[var(--ocean-blue)]/50">
                    {targetLabels[task.target]} · {actionLabels[task.action]}
                  </div>
                </div>
              </div>
              <button onClick={() => toggleTask(task.id)} className="text-2xl">
                {task.enabled ? (
                  <ToggleRight className="w-8 h-8 text-[var(--cyan-glow)]" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-[var(--ocean-surface)]" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[var(--cyan-glow)]" />
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">自动控制策略</h2>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[var(--ocean-surface)] text-[var(--ocean-blue)]/50">
            多参数联动
          </span>
        </div>
        <div className="flex items-center gap-4 bg-[var(--ocean-deep)] rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[var(--cyan-glow)]" />
            <span className="text-sm text-[var(--ocean-blue)]">启用自动控制策略</span>
          </div>
          <button onClick={() => setAutoEnabled(!autoEnabled)} className="ml-auto">
            {autoEnabled ? (
              <ToggleRight className="w-8 h-8 text-[var(--cyan-glow)]" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-[var(--ocean-surface)]" />
            )}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-[var(--ocean-blue)]/50">溶解氧阈值 (mg/L)</label>
            <input
              type="number"
              step="0.1"
              value={o2Threshold}
              onChange={(e) => setO2Threshold(Number(e.target.value))}
              className="w-full bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] focus:border-[var(--cyan-glow)] outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--ocean-blue)]/50">氨氮阈值 (mg/L)</label>
            <input
              type="number"
              step="0.1"
              value={nh3Threshold}
              onChange={(e) => setNh3Threshold(Number(e.target.value))}
              className="w-full bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] focus:border-[var(--cyan-glow)] outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--ocean-blue)]/50">温度阈值 (°C)</label>
            <input
              type="number"
              step="0.5"
              value={tempThreshold}
              onChange={(e) => setTempThreshold(Number(e.target.value))}
              className="w-full bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] focus:border-[var(--cyan-glow)] outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--ocean-blue)]/50">持续时间 (分钟)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] focus:border-[var(--cyan-glow)] outline-none"
            />
          </div>
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[var(--cyan-glow)]" />
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">远程控制日志</h2>
        </div>
        <div className="space-y-2">
          {remoteLogs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 bg-[var(--ocean-deep)] rounded-lg px-4 py-2.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: log.result === 'success' ? 'var(--sea-green)' : 'var(--coral-red)' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--ocean-blue)]">{log.action}</span>
                  <span className="text-[10px] text-[var(--ocean-blue)]/40">{log.devices}</span>
                </div>
                <div className="text-[10px] text-[var(--ocean-blue)]/40 mt-0.5">
                  {log.operator} · {log.ip}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-[var(--ocean-blue)]/50">{log.time}</div>
                <div className={`text-[10px] font-medium ${log.result === 'success' ? 'text-[var(--sea-green)]' : 'text-[var(--coral-red)]'}`}>
                  {log.result === 'success' ? '成功' : '失败'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--cyan-glow)]" />
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">控制日志</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--ocean-blue)]/50 text-xs border-b border-[var(--ocean-surface)]">
                <th className="text-left py-2 px-3">时间</th>
                <th className="text-left py-2 px-3">设备</th>
                <th className="text-left py-2 px-3">操作</th>
                <th className="text-left py-2 px-3">目标</th>
                <th className="text-left py-2 px-3">结果</th>
                <th className="text-left py-2 px-3">操作人</th>
              </tr>
            </thead>
            <tbody>
              {mockLogs.map((log) => (
                <tr key={log.id} className="border-b border-[var(--ocean-surface)]/30">
                  <td className="py-2 px-3 text-[var(--ocean-blue)]/70">{formatDateTime(log.timestamp)}</td>
                  <td className="py-2 px-3 text-[var(--ocean-blue)]">{log.did}</td>
                  <td className="py-2 px-3">
                    <span className={log.action === 'open' ? 'text-orange-500' : 'text-[var(--ocean-blue)]/50'}>
                      {actionLabels[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[var(--ocean-blue)]">{targetLabels[log.target] ?? log.target}</td>
                  <td className="py-2 px-3">
                    <span className={log.result === 'success' ? 'text-[var(--sea-green)]' : 'text-[var(--coral-red)]'}>
                      {log.result === 'success' ? '成功' : '失败'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[var(--ocean-blue)]/60">{log.operator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
