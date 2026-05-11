import { useState } from 'react';
import { Search, RotateCcw, Plus, Trash2 } from 'lucide-react';
import type { DeviceShare } from '@/types';

const PERMISSION_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'view', label: '可查看' },
  { value: 'view_and_control', label: '可查看和操作' },
];

const PERMISSION_LABELS: Record<string, string> = {
  view: '可查看',
  view_and_control: '可查看和操作',
};

const MOCK_SHARES: DeviceShare[] = [
  { id: 1, device_id: 1, user_id: 2, permission: 'view', shared_at: '2026-04-15 10:30:00' },
];

const DEVICE_OPTIONS = [
  { value: '', label: '全部设备' },
  { value: '1', label: '水质浮漂集成传感器' },
  { value: '2', label: '水质联动控制箱' },
];

const USER_OPTIONS = [
  { value: '2', label: '张三' },
  { value: '3', label: '李四' },
];

const PAGE_SIZE = 10;

export default function DeviceSharePage() {
  const [shares, setShares] = useState<DeviceShare[]>(MOCK_SHARES);
  const [filterDevice, setFilterDevice] = useState('');
  const [filterDid, setFilterDid] = useState('');
  const [filterPerm, setFilterPerm] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ device_id: '', user_id: '', permission: 'view' as DeviceShare['permission'] });

  const filtered = shares.filter((s) => {
    if (filterDevice && String(s.device_id) !== filterDevice) return false;
    if (filterPerm && s.permission !== filterPerm) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleReset = () => {
    setFilterDevice('');
    setFilterDid('');
    setFilterPerm('');
    setPage(1);
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((s) => s.id)));
  };

  const handleAdd = () => {
    if (!addForm.device_id || !addForm.user_id) return;
    const newShare: DeviceShare = {
      id: Date.now(),
      device_id: Number(addForm.device_id),
      user_id: Number(addForm.user_id),
      permission: addForm.permission,
      shared_at: new Date().toLocaleString('zh-CN'),
    };
    setShares((prev) => [...prev, newShare]);
    setShowAdd(false);
    setAddForm({ device_id: '', user_id: '', permission: 'view' });
  };

  const handleDelete = (id: number) => {
    setShares((prev) => prev.filter((s) => s.id !== id));
  };

  const getDeviceName = (deviceId: number) => {
    const found = DEVICE_OPTIONS.find((o) => o.value === String(deviceId));
    return found?.label ?? `设备${deviceId}`;
  };

  const getDeviceDid = (deviceId: number) => {
    const dids: Record<number, string> = { 1: 'DID-SEN-001', 2: 'DID-CTL-001' };
    return dids[deviceId] ?? '--';
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--ocean-blue)]/60">设备名称</label>
            <select
              value={filterDevice}
              onChange={(e) => { setFilterDevice(e.target.value); setPage(1); }}
              className="bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded px-3 py-1.5 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
            >
              {DEVICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--ocean-blue)]/60">设备编号</label>
            <input
              value={filterDid}
              onChange={(e) => { setFilterDid(e.target.value); setPage(1); }}
              placeholder="请输入设备编号"
              className="bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded px-3 py-1.5 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)] w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--ocean-blue)]/60">分享权限</label>
            <select
              value={filterPerm}
              onChange={(e) => { setFilterPerm(e.target.value); setPage(1); }}
              className="bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded px-3 py-1.5 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
            >
              {PERMISSION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button className="flex items-center gap-1 px-4 py-1.5 rounded bg-[var(--cyan-glow)] text-white text-sm font-medium hover:brightness-110 transition">
            <Search size={14} /> 查询
          </button>
          <button onClick={handleReset} className="flex items-center gap-1 px-4 py-1.5 rounded bg-[var(--ocean-surface)] text-[var(--ocean-blue)] text-sm hover:bg-[var(--ocean-surface)]/80 transition">
            <RotateCcw size={14} /> 重置
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-4 py-1.5 rounded bg-[var(--sea-green)] text-white text-sm font-medium hover:brightness-110 transition ml-auto">
            <Plus size={14} /> 新增分享
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--ocean-surface)]">
              <th className="px-4 py-3 text-left">
                <input type="checkbox" checked={paged.length > 0 && selected.size === paged.length} onChange={toggleAll} className="accent-[var(--cyan-glow)]" />
              </th>
              <th className="px-4 py-3 text-left text-[var(--ocean-blue)]/60 font-normal">设备名称</th>
              <th className="px-4 py-3 text-left text-[var(--ocean-blue)]/60 font-normal">设备编号</th>
              <th className="px-4 py-3 text-left text-[var(--ocean-blue)]/60 font-normal">分享权限</th>
              <th className="px-4 py-3 text-left text-[var(--ocean-blue)]/60 font-normal">分享时间</th>
              <th className="px-4 py-3 text-left text-[var(--ocean-blue)]/60 font-normal">操作</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((s) => (
              <tr key={s.id} className="border-b border-[var(--ocean-surface)]/50 hover:bg-[var(--ocean-deep)]/60 transition">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} className="accent-[var(--cyan-glow)]" />
                </td>
                <td className="px-4 py-3 text-[var(--ocean-blue)]">{getDeviceName(s.device_id)}</td>
                <td className="px-4 py-3 text-[var(--ocean-blue)]/70 font-mono text-xs">{getDeviceDid(s.device_id)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.permission === 'view_and_control'
                      ? 'bg-[var(--cyan-glow)]/20 text-[var(--cyan-glow)]'
                      : 'bg-[var(--ocean-blue)]/20 text-[var(--ocean-blue)]'
                  }`}>
                    {PERMISSION_LABELS[s.permission]}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--ocean-blue)]/70">{s.shared_at}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(s.id)} className="flex items-center gap-1 text-xs text-[var(--coral-red)] hover:underline">
                    <Trash2 size={12} /> 删除
                  </button>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-[var(--ocean-blue)]/40">暂无分享记录</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--ocean-blue)]/50">共{totalPages}页，累计{filtered.length}条</span>
        <div className="flex gap-1">
          <button disabled={page <= 1} onClick={() => setPage(1)} className="px-3 py-1 rounded bg-[var(--ocean-dark)] text-[var(--ocean-blue)]/50 disabled:opacity-30 hover:bg-[var(--ocean-surface)] transition">首页</button>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded bg-[var(--ocean-dark)] text-[var(--ocean-blue)]/50 disabled:opacity-30 hover:bg-[var(--ocean-surface)] transition">上一页</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded transition ${p === page ? 'bg-[var(--cyan-glow)] text-white font-bold' : 'bg-[var(--ocean-dark)] text-[var(--ocean-blue)]/50 hover:bg-[var(--ocean-surface)]'}`}>{p}</button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded bg-[var(--ocean-dark)] text-[var(--ocean-blue)]/50 disabled:opacity-30 hover:bg-[var(--ocean-surface)] transition">下一页</button>
          <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="px-3 py-1 rounded bg-[var(--ocean-dark)] text-[var(--ocean-blue)]/50 disabled:opacity-30 hover:bg-[var(--ocean-surface)] transition">尾页</button>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowAdd(false)}>
          <div className="glass-card p-6 w-96 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[var(--cyan-glow)] font-medium text-base">新增分享</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--ocean-blue)]/60">选择设备</label>
                <select value={addForm.device_id} onChange={(e) => setAddForm({ ...addForm, device_id: e.target.value })} className="w-full mt-1 bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded px-3 py-1.5 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]">
                  <option value="">请选择设备</option>
                  {DEVICE_OPTIONS.filter((o) => o.value).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--ocean-blue)]/60">选择用户</label>
                <select value={addForm.user_id} onChange={(e) => setAddForm({ ...addForm, user_id: e.target.value })} className="w-full mt-1 bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded px-3 py-1.5 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]">
                  <option value="">请选择用户</option>
                  {USER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--ocean-blue)]/60">分享权限</label>
                <select value={addForm.permission} onChange={(e) => setAddForm({ ...addForm, permission: e.target.value as DeviceShare['permission'] })} className="w-full mt-1 bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded px-3 py-1.5 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]">
                  <option value="view">可查看</option>
                  <option value="view_and_control">可查看和操作</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-1.5 rounded bg-[var(--ocean-surface)] text-[var(--ocean-blue)] text-sm hover:bg-[var(--ocean-surface)]/80 transition">取消</button>
              <button onClick={handleAdd} className="px-4 py-1.5 rounded bg-[var(--cyan-glow)] text-white text-sm font-medium hover:brightness-110 transition">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
