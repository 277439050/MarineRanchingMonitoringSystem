import { useState, useEffect, useCallback } from 'react';
import { Search, RotateCcw, Plus, Eye, History, Bell, Pencil, Trash2 } from 'lucide-react';
import { useDeviceStore } from '@/stores/deviceStore';
import type { Device } from '@/types';

const TYPE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'sensor', label: '传感器' },
  { value: 'camera', label: '摄像头' },
  { value: 'controller', label: '控制器' },
  { value: 'weather', label: '气象站' },
];

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'online', label: '在线' },
  { value: 'offline', label: '离线' },
];

const TYPE_LABELS: Record<string, string> = {
  sensor: '传感器',
  camera: '摄像头',
  controller: '控制器',
  weather: '气象站',
};

const MOCK_DEVICES: Device[] = [
  { id: 1, name: '水质浮漂集成传感器', did: 'DID-SEN-001', type: 'sensor', sim_imei: '89860123456789012345', sim_date: '2026-12-31', status: 'online', created_at: '2025-01-15', updated_at: '2026-05-01' },
  { id: 2, name: '水质联动控制箱', did: 'DID-CTL-001', type: 'controller', sim_imei: '89860123456789012346', sim_date: '2026-10-15', status: 'online', created_at: '2025-02-10', updated_at: '2026-04-28' },
  { id: 3, name: '牧场1号摄像头', did: 'DID-CAM-001', type: 'camera', sim_imei: '89860123456789012347', sim_date: '2026-08-20', status: 'offline', created_at: '2025-03-05', updated_at: '2026-03-15' },
  { id: 4, name: '气象监测站', did: 'DID-WTH-001', type: 'weather', sim_imei: '89860123456789012348', sim_date: '2027-01-10', status: 'online', created_at: '2025-04-20', updated_at: '2026-05-05' },
];

const PAGE_SIZE = 10;

export default function DevicesPage() {
  const { devices, fetchDevices, addDevice, deleteDevice } = useDeviceStore();
  const [filterType, setFilterType] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterDid, setFilterDid] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', did: '', type: 'sensor' as Device['type'], sim_imei: '' });

  const loadDevices = useCallback(async () => {
    try {
      await fetchDevices({ type: filterType || undefined, status: filterStatus || undefined, page, pageSize: PAGE_SIZE });
    } catch {
      useDeviceStore.setState({ devices: MOCK_DEVICES });
    }
  }, [fetchDevices, filterType, filterStatus, page]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const displayDevices = devices.length > 0 ? devices : MOCK_DEVICES;

  const filtered = displayDevices.filter((d) => {
    if (filterName && !d.name.includes(filterName)) return false;
    if (filterDid && !d.did.includes(filterDid)) return false;
    if (filterType && d.type !== filterType) return false;
    if (filterStatus && d.status !== filterStatus) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleReset = () => {
    setFilterType('');
    setFilterName('');
    setFilterDid('');
    setFilterStatus('');
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
    if (selected.size === paged.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paged.map((d) => d.id)));
    }
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.did) return;
    try {
      await addDevice(addForm);
    } catch {
      const newDevice: Device = {
        id: Date.now(),
        ...addForm,
        sim_date: '2027-06-30',
        status: 'online',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      useDeviceStore.setState((s) => ({ devices: [...s.devices, newDevice] }));
    }
    setShowAdd(false);
    setAddForm({ name: '', did: '', type: 'sensor', sim_imei: '' });
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDevice(id);
    } catch {
      useDeviceStore.setState((s) => ({ devices: s.devices.filter((d) => d.id !== id) }));
    }
  };

  const renderPagination = () => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return (
      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-[var(--ocean-blue)]/50">共{totalPages}页，累计{filtered.length}条</span>
        <div className="flex gap-1">
          {[
            { label: '首页', disabled: page <= 1, onClick: () => setPage(1) },
            { label: '上一页', disabled: page <= 1, onClick: () => setPage(page - 1) },
          ].map((b) => (
            <button
              key={b.label}
              disabled={b.disabled}
              onClick={b.onClick}
              className="px-3 py-1 rounded bg-[var(--ocean-dark)] text-[var(--ocean-blue)]/50 disabled:opacity-30 hover:bg-[var(--ocean-surface)] transition"
            >
              {b.label}
            </button>
          ))}
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded transition ${
                p === page
                  ? 'bg-[var(--cyan-glow)] text-white font-bold'
                  : 'bg-[var(--ocean-dark)] text-[var(--ocean-blue)]/50 hover:bg-[var(--ocean-surface)]'
              }`}
            >
              {p}
            </button>
          ))}
          {[
            { label: '下一页', disabled: page >= totalPages, onClick: () => setPage(page + 1) },
            { label: '尾页', disabled: page >= totalPages, onClick: () => setPage(totalPages) },
          ].map((b) => (
            <button
              key={b.label}
              disabled={b.disabled}
              onClick={b.onClick}
              className="px-3 py-1 rounded bg-[var(--ocean-dark)] text-[var(--ocean-blue)]/50 disabled:opacity-30 hover:bg-[var(--ocean-surface)] transition"
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--ocean-blue)]/50">设备类型</label>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded px-3 py-1.5 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
            >
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--ocean-blue)]/50">设备名称</label>
            <input
              value={filterName}
              onChange={(e) => { setFilterName(e.target.value); setPage(1); }}
              placeholder="请输入设备名称"
              className="bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded px-3 py-1.5 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)] w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--ocean-blue)]/50">设备编号</label>
            <input
              value={filterDid}
              onChange={(e) => { setFilterDid(e.target.value); setPage(1); }}
              placeholder="请输入设备编号"
              className="bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded px-3 py-1.5 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)] w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--ocean-blue)]/50">状态</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded px-3 py-1.5 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
            >
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button
            onClick={loadDevices}
            className="flex items-center gap-1 px-4 py-1.5 rounded bg-[var(--cyan-glow)] text-white text-sm font-medium hover:brightness-110 transition"
          >
            <Search size={14} /> 搜索
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-4 py-1.5 rounded bg-[var(--ocean-surface)] text-[var(--ocean-blue)] text-sm hover:bg-[var(--ocean-surface)]/80 transition"
          >
            <RotateCcw size={14} /> 重置
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 px-4 py-1.5 rounded bg-[var(--sea-green)] text-white text-sm font-medium hover:brightness-110 transition ml-auto"
          >
            <Plus size={14} /> 添加设备
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--ocean-surface)]">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && selected.size === paged.length}
                  onChange={toggleAll}
                  className="accent-[var(--cyan-glow)]"
                />
              </th>
              <th className="px-4 py-3 text-left text-[var(--ocean-blue)]/50 font-normal">设备类型</th>
              <th className="px-4 py-3 text-left text-[var(--ocean-blue)]/50 font-normal">设备名称</th>
              <th className="px-4 py-3 text-left text-[var(--ocean-blue)]/50 font-normal">设备编号</th>
              <th className="px-4 py-3 text-left text-[var(--ocean-blue)]/50 font-normal">流量卡号</th>
              <th className="px-4 py-3 text-left text-[var(--ocean-blue)]/50 font-normal">流量到期时间</th>
              <th className="px-4 py-3 text-left text-[var(--ocean-blue)]/50 font-normal">状态</th>
              <th className="px-4 py-3 text-left text-[var(--ocean-blue)]/50 font-normal">操作</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((d) => (
              <tr key={d.id} className="border-b border-[var(--ocean-surface)]/50 hover:bg-[var(--ocean-deep)]/60 transition">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(d.id)}
                    onChange={() => toggleSelect(d.id)}
                    className="accent-[var(--cyan-glow)]"
                  />
                </td>
                <td className="px-4 py-3 text-[var(--ocean-blue)]/70">{TYPE_LABELS[d.type] || d.type}</td>
                <td className="px-4 py-3 text-[var(--ocean-blue)]">{d.name}</td>
                <td className="px-4 py-3 text-[var(--ocean-blue)]/60 font-mono text-xs">{d.did}</td>
                <td className="px-4 py-3 text-[var(--ocean-blue)]/60 font-mono text-xs">{d.sim_imei}</td>
                <td className="px-4 py-3 text-[var(--ocean-blue)]/60">{d.sim_date}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    d.status === 'online'
                      ? 'bg-[var(--sea-green)]/15 text-[var(--sea-green)]'
                      : 'bg-[var(--coral-red)]/15 text-[var(--coral-red)]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'online' ? 'bg-[var(--sea-green)]' : 'bg-[var(--coral-red)]'}`} />
                    {d.status === 'online' ? '在线' : '离线'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    <button className="flex items-center gap-1 text-xs text-[var(--cyan-glow)] hover:underline"><Eye size={12} /> 查看数据</button>
                    <button className="flex items-center gap-1 text-xs text-[var(--ocean-blue)]/60 hover:underline"><History size={12} /> 历史记录</button>
                    <button className="flex items-center gap-1 text-xs text-[var(--amber)] hover:underline"><Bell size={12} /> 报警参数</button>
                    <button className="flex items-center gap-1 text-xs text-[var(--ocean-blue)]/60 hover:underline"><Pencil size={12} /> 修改</button>
                    <button onClick={() => handleDelete(d.id)} className="flex items-center gap-1 text-xs text-[var(--coral-red)] hover:underline"><Trash2 size={12} /> 删除</button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[var(--ocean-blue)]/30">暂无设备数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {renderPagination()}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowAdd(false)}>
          <div className="glass-card p-6 w-96 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[var(--cyan-glow)] font-medium text-base">添加设备</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--ocean-blue)]/50">设备名称</label>
                <input
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full mt-1 bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded px-3 py-1.5 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--ocean-blue)]/50">设备编号</label>
                <input
                  value={addForm.did}
                  onChange={(e) => setAddForm({ ...addForm, did: e.target.value })}
                  className="w-full mt-1 bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded px-3 py-1.5 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--ocean-blue)]/50">设备类型</label>
                <select
                  value={addForm.type}
                  onChange={(e) => setAddForm({ ...addForm, type: e.target.value as Device['type'] })}
                  className="w-full mt-1 bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded px-3 py-1.5 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
                >
                  {TYPE_OPTIONS.filter((o) => o.value).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--ocean-blue)]/50">流量卡号</label>
                <input
                  value={addForm.sim_imei}
                  onChange={(e) => setAddForm({ ...addForm, sim_imei: e.target.value })}
                  className="w-full mt-1 bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded px-3 py-1.5 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
                />
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
