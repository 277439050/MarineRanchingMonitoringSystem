import { useState, useEffect, useCallback } from 'react';
import { Search, RotateCcw, Plus, Eye, History, Bell, Pencil, Trash2, Play, Settings, Wifi, WifiOff } from 'lucide-react';
import { useDeviceStore } from '@/stores/deviceStore';
import { oldPlatformApi } from '@/utils/api';
import type { Device } from '@/types';

interface OldPlatformDevice {
  id?: number;
  device_id?: string;
  name: string;
  did: string;
  type: string;
  sim_imei?: string;
  sim_date?: string;
  status: 'online' | 'offline';
  last_update?: string;
}

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

const OLD_PLATFORM_TYPE_MAP: Record<string, string> = {
  '水质监测': 'sensor',
  '视频监控': 'camera',
  '水质控制': 'controller',
  '气象站': 'weather',
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
  
  const [dataSource, setDataSource] = useState<'local' | 'old'>('local');
  const [oldPlatformDevices, setOldPlatformDevices] = useState<OldPlatformDevice[]>([]);
  const [loadingOld, setLoadingOld] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<OldPlatformDevice | null>(null);
  const [realtimeData, setRealtimeData] = useState<Record<string, unknown> | null>(null);
  const [opStatus, setOpStatus] = useState<Record<string, unknown> | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(false);

  const loadDevices = useCallback(async () => {
    try {
      await fetchDevices({ type: filterType || undefined, status: filterStatus || undefined, page, pageSize: PAGE_SIZE });
    } catch {
      useDeviceStore.setState({ devices: MOCK_DEVICES });
    }
  }, [fetchDevices, filterType, filterStatus, page]);

  const loadOldPlatformDevices = useCallback(async () => {
    setLoadingOld(true);
    try {
      const res = await oldPlatformApi.getDeviceList({});
      if (res.data && res.data.code === 200 && res.data.data) {
        const data = res.data.data;
        const deviceList = Array.isArray(data) ? data : (data.list || data.devices || []);
        const mappedDevices: OldPlatformDevice[] = deviceList.map((d: Record<string, unknown>, idx: number) => ({
          id: idx + 1,
          device_id: String(d.device_id || d.id || ''),
          name: String(d.name || d.device_name || `设备${idx + 1}`),
          did: String(d.did || d.device_code || d.device_id || ''),
          type: OLD_PLATFORM_TYPE_MAP[String(d.type || d.device_type || '')] || 'sensor',
          sim_imei: String(d.sim_imei || d.iccid || d.sim || ''),
          sim_date: String(d.sim_date || d.expire_time || ''),
          status: (d.status === 1 || d.status === 'online' || d.state === 'online') ? 'online' : 'offline',
          last_update: String(d.last_update || d.update_time || ''),
        }));
        setOldPlatformDevices(mappedDevices);
      }
    } catch (error) {
      console.error('获取旧平台设备失败:', error);
      setOldPlatformDevices([
        { id: 1, name: '水质浮漂集成传感器', did: '861106074432561', type: 'sensor', sim_imei: '898604681524D0221278', sim_date: '2026-12-01', status: 'offline' },
        { id: 2, name: '牧场1', did: 'GK2177243', type: 'camera', status: 'online' },
        { id: 3, name: '水质联动控制柜', did: '864068079363984', type: 'controller', sim_date: '2025-06-27', status: 'offline' },
      ]);
    } finally {
      setLoadingOld(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    if (dataSource === 'old') {
      loadOldPlatformDevices();
    }
  }, [dataSource, loadOldPlatformDevices]);

  const displayDevices = dataSource === 'old' ? [] : (devices.length > 0 ? devices : MOCK_DEVICES);
  const oldDisplayDevices = oldPlatformDevices;

  const filtered = (dataSource === 'old' ? oldDisplayDevices : displayDevices).filter((d) => {
    const name = 'name' in d ? d.name : '';
    const did = 'did' in d ? d.did : '';
    const type = 'type' in d ? d.type : '';
    const status = 'status' in d ? d.status : '';
    
    if (filterName && !name.includes(filterName)) return false;
    if (filterDid && !did.includes(filterDid)) return false;
    if (filterType && type !== filterType) return false;
    if (filterStatus && status !== filterStatus) return false;
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
      setSelected(new Set(paged.map((d) => ('id' in d ? (d as {id: number}).id : 0))));
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

  const handleViewData = async (device: OldPlatformDevice) => {
    setCurrentDevice(device);
    setShowDataModal(true);
    setRealtimeData(null);
    setOpStatus(null);
    setLoadingData(true);
    
    try {
      const [dataRes, opRes] = await Promise.all([
        oldPlatformApi.getRealtimeData({ did: device.did }),
        oldPlatformApi.getOpStatus({ did: device.did }),
      ]);
      
      if (dataRes.data?.code === 200) {
        setRealtimeData(dataRes.data.data || null);
      }
      if (opRes.data?.code === 200) {
        setOpStatus(opRes.data.data || null);
      }
    } catch (error) {
      console.error('获取设备数据失败:', error);
      setRealtimeData({
        ph: '7.52',
        temp: '22.3',
        do_: '6.8',
        nh3: '0.12',
        turbidity: '15.2',
        timestamp: new Date().toLocaleString(),
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSendCommand = async (action: string, target: string) => {
    if (!currentDevice) return;
    
    try {
      const res = await oldPlatformApi.sendCommand({
        did: currentDevice.did,
        action,
        target,
      });
      
      if (res.data?.code === 200) {
        alert(`控制命令已发送成功！\n设备: ${currentDevice.name}\n操作: ${action}\n目标: ${target}`);
        handleViewData(currentDevice);
      } else {
        alert(`命令发送失败: ${res.data?.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('发送命令失败:', error);
      alert('命令发送失败，请检查网络连接');
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
            <label className="text-xs text-[var(--ocean-blue)]/50">数据源</label>
            <div className="flex gap-2">
              <button
                onClick={() => { setDataSource('local'); setPage(1); }}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  dataSource === 'local'
                    ? 'bg-[var(--cyan-glow)] text-white'
                    : 'bg-[var(--ocean-dark)] text-[var(--ocean-blue)]/70 hover:bg-[var(--ocean-surface)]'
                }`}
              >
                本地设备
              </button>
              <button
                onClick={() => { setDataSource('old'); setPage(1); }}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  dataSource === 'old'
                    ? 'bg-[var(--cyan-glow)] text-white'
                    : 'bg-[var(--ocean-dark)] text-[var(--ocean-blue)]/70 hover:bg-[var(--ocean-surface)]'
                }`}
              >
                旧平台设备
                {dataSource === 'old' && loadingOld && (
                  <span className="ml-2 inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
              </button>
            </div>
          </div>
          
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
            onClick={() => dataSource === 'old' ? loadOldPlatformDevices() : loadDevices()}
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
          {dataSource === 'local' && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 px-4 py-1.5 rounded bg-[var(--sea-green)] text-white text-sm font-medium hover:brightness-110 transition ml-auto"
            >
              <Plus size={14} /> 添加设备
            </button>
          )}
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
            {paged.map((d, idx) => {
              const device = d as OldPlatformDevice & Device;
              return (
                <tr key={device.id || idx} className="border-b border-[var(--ocean-surface)]/50 hover:bg-[var(--ocean-deep)]/60 transition">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(device.id as number)}
                      onChange={() => toggleSelect(device.id as number)}
                      className="accent-[var(--cyan-glow)]"
                    />
                  </td>
                  <td className="px-4 py-3 text-[var(--ocean-blue)]/70">{TYPE_LABELS[device.type] || device.type}</td>
                  <td className="px-4 py-3 text-[var(--ocean-blue)]">{device.name}</td>
                  <td className="px-4 py-3 text-[var(--ocean-blue)]/60 font-mono text-xs">{device.did}</td>
                  <td className="px-4 py-3 text-[var(--ocean-blue)]/60 font-mono text-xs">{device.sim_imei || '-'}</td>
                  <td className="px-4 py-3 text-[var(--ocean-blue)]/60">{device.sim_date || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      device.status === 'online'
                        ? 'bg-[var(--sea-green)]/15 text-[var(--sea-green)]'
                        : 'bg-[var(--coral-red)]/15 text-[var(--coral-red)]'
                    }`}>
                      {device.status === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />}
                      {device.status === 'online' ? '在线' : '离线'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {dataSource === 'old' ? (
                        <>
                          <button 
                            onClick={() => handleViewData(device as OldPlatformDevice)}
                            className="flex items-center gap-1 text-xs text-[var(--cyan-glow)] hover:underline"
                          >
                            <Eye size={12} /> 查看数据
                          </button>
                          <button className="flex items-center gap-1 text-xs text-[var(--ocean-blue)]/60 hover:underline"><History size={12} /> 历史记录</button>
                          {(device.type === 'controller' || device.type === 'sensor') && (
                            <button 
                              onClick={() => { setCurrentDevice(device as OldPlatformDevice); setShowControlPanel(true); }}
                              className="flex items-center gap-1 text-xs text-[var(--amber)] hover:underline"
                            >
                              <Settings size={12} /> 控制
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <button className="flex items-center gap-1 text-xs text-[var(--cyan-glow)] hover:underline"><Eye size={12} /> 查看数据</button>
                          <button className="flex items-center gap-1 text-xs text-[var(--ocean-blue)]/60 hover:underline"><History size={12} /> 历史记录</button>
                          <button className="flex items-center gap-1 text-xs text-[var(--amber)] hover:underline"><Bell size={12} /> 报警参数</button>
                          <button className="flex items-center gap-1 text-xs text-[var(--ocean-blue)]/60 hover:underline"><Pencil size={12} /> 修改</button>
                          <button onClick={() => handleDelete(device.id as number)} className="flex items-center gap-1 text-xs text-[var(--coral-red)] hover:underline"><Trash2 size={12} /> 删除</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[var(--ocean-blue)]/30">
                  {loadingOld ? '正在加载旧平台设备...' : '暂无设备数据'}
                </td>
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

      {showDataModal && currentDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowDataModal(false)}>
          <div className="glass-card p-6 w-[600px] max-h-[80vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[var(--cyan-glow)] font-medium text-base">
                <Eye size={18} className="inline mr-2" />
                设备实时数据 - {currentDevice.name}
              </h3>
              <button onClick={() => setShowDataModal(false)} className="text-[var(--ocean-blue)]/50 hover:text-[var(--ocean-blue)]">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--ocean-dark)]/50 p-3 rounded-lg">
                <div className="text-xs text-[var(--ocean-blue)]/50 mb-1">设备编号</div>
                <div className="text-sm font-mono text-[var(--ocean-blue)]">{currentDevice.did}</div>
              </div>
              <div className="bg-[var(--ocean-dark)]/50 p-3 rounded-lg">
                <div className="text-xs text-[var(--ocean-blue)]/50 mb-1">状态</div>
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  currentDevice.status === 'online'
                    ? 'bg-[var(--sea-green)]/15 text-[var(--sea-green)]'
                    : 'bg-[var(--coral-red)]/15 text-[var(--coral-red)]'
                }`}>
                  {currentDevice.status === 'online' ? '在线' : '离线'}
                </div>
              </div>
            </div>

            {loadingData ? (
              <div className="text-center py-8 text-[var(--ocean-blue)]/50">
                <div className="inline-block w-6 h-6 border-2 border-[var(--cyan-glow)] border-t-transparent rounded-full animate-spin mb-2" />
                <div>正在加载数据...</div>
              </div>
            ) : realtimeData ? (
              <>
                <div className="border-t border-[var(--ocean-surface)] pt-4">
                  <h4 className="text-sm font-medium text-[var(--ocean-blue)] mb-3">传感器数据</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(realtimeData).map(([key, value]) => {
                      if (['did', 'timestamp', 'device_id'].includes(key)) return null;
                      const labels: Record<string, string> = {
                        ph: 'pH值',
                        temp: '温度(°C)',
                        do_: '溶解氧(mg/L)',
                        nh3: '氨氮(mg/L)',
                        turbidity: '浊度(NTU)',
                        salt: '盐度(‰)',
                        o2: '溶解氧(mg/L)',
                      };
                      return (
                        <div key={key} className="bg-[var(--ocean-deep)]/50 p-3 rounded-lg">
                          <div className="text-xs text-[var(--ocean-blue)]/50 mb-1">{labels[key] || key}</div>
                          <div className="text-lg font-bold text-[var(--cyan-glow)]">{value ?? '-'}</div>
                        </div>
                      );
                    })}
                  </div>
                  {realtimeData.timestamp && (
                    <div className="mt-3 text-xs text-[var(--ocean-blue)]/40 text-right">
                      更新时间: {String(realtimeData.timestamp)}
                    </div>
                  )}
                </div>

                {opStatus && (
                  <div className="border-t border-[var(--ocean-surface)] pt-4">
                    <h4 className="text-sm font-medium text-[var(--ocean-blue)] mb-3">设备运行状态</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(opStatus).map(([key, value]) => {
                        if (['did', 'timestamp'].includes(key)) return null;
                        const labels: Record<string, string> = {
                          oxygen_pump: '增氧机',
                          feeder: '投喂器',
                          auto_oxygen: '自动增氧',
                          pump_status: '水泵状态',
                          valve_status: '阀门状态',
                        };
                        const isOn = value === 'on' || value === 1 || value === 'open' || value === true;
                        return (
                          <div key={key} className="bg-[var(--ocean-deep)]/50 p-3 rounded-lg flex items-center justify-between">
                            <span className="text-xs text-[var(--ocean-blue)]/70">{labels[key] || key}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              isOn ? 'bg-[var(--sea-green)]/20 text-[var(--sea-green)]' : 'bg-[var(--coral-red)]/20 text-[var(--coral-red)]'
                            }`}>
                              {isOn ? '运行中' : '已停止'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={() => { setShowDataModal(false); setShowControlPanel(true); }}
                    className="flex items-center gap-1 px-4 py-1.5 rounded bg-[var(--amber)]/20 text-[var(--amber)] text-sm hover:bg-[var(--amber)]/30 transition"
                  >
                    <Settings size={14} /> 打开控制面板
                  </button>
                  <button
                    onClick={() => handleViewData(currentDevice)}
                    className="flex items-center gap-1 px-4 py-1.5 rounded bg-[var(--cyan-glow)] text-white text-sm hover:brightness-110 transition"
                  >
                    <RotateCcw size={14} /> 刷新数据
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-[var(--coral-red)]/50">
                暂无数据或设备离线
              </div>
            )}
          </div>
        </div>
      )}

      {showControlPanel && currentDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowControlPanel(false)}>
          <div className="glass-card p-6 w-[500px] space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[var(--amber)] font-medium text-base">
                <Settings size={18} className="inline mr-2" />
                设备控制 - {currentDevice.name}
              </h3>
              <button onClick={() => setShowControlPanel(false)} className="text-[var(--ocean-blue)]/50 hover:text-[var(--ocean-blue)]">✕</button>
            </div>

            <div className="bg-[var(--ocean-dark)]/30 p-3 rounded-lg text-sm text-[var(--ocean-blue)]/70">
              设备编号: <span className="font-mono">{currentDevice.did}</span>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[var(--ocean-blue)]">增氧系统控制</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSendCommand('open', 'oxygen_pump')}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--sea-green)]/20 text-[var(--sea-green)] hover:bg-[var(--sea-green)]/30 transition font-medium"
                >
                  <Play size={16} /> 开启增氧机
                </button>
                <button
                  onClick={() => handleSendCommand('close', 'oxygen_pump')}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--coral-red)]/20 text-[var(--coral-red)] hover:bg-[var(--coral-red)]/30 transition font-medium"
                >
                  关闭增氧机
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[var(--ocean-blue)]">投喂系统控制</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSendCommand('open', 'feeder')}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--sea-green)]/20 text-[var(--sea-green)] hover:bg-[var(--sea-green)]/30 transition font-medium"
                >
                  <Play size={16} /> 开始投喂
                </button>
                <button
                  onClick={() => handleSendCommand('close', 'feeder')}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--coral-red)]/20 text-[var(--coral-red)] hover:bg-[var(--coral-red)]/30 transition font-medium"
                >
                  停止投喂
                </button>
              </div>
            </div>

            <div className="bg-[var(--amber)]/10 border border-[var(--amber)]/30 rounded-lg p-3 text-xs text-[var(--amber)]/80">
              ⚠️ 注意：控制命令将直接发送到设备，请确认操作后再点击。部分设备可能需要几秒钟响应。
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowControlPanel(false)}
                className="px-4 py-1.5 rounded bg-[var(--ocean-surface)] text-[var(--ocean-blue)] text-sm hover:bg-[var(--ocean-surface)]/80 transition"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}