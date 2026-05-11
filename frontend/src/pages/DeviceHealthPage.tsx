import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Heart, Activity, AlertTriangle, Wrench, Clock, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { formatDateTime } from '@/utils/format';

type HealthLevel = 'excellent' | 'good' | 'fair' | 'poor';

interface DeviceHealth {
  id: string;
  name: string;
  type: string;
  health: number;
  uptime: number;
  lastMaintenance: string;
  nextMaintenance: string;
  status: 'normal' | 'warning' | 'error';
  components: {
    name: string;
    health: number;
    status: HealthLevel;
    description: string;
  }[];
}

const mockDevices: DeviceHealth[] = [
  {
    id: 'SENSOR_001',
    name: '水质浮漂集成传感器',
    type: 'sensor',
    health: 92.5,
    uptime: 2160,
    lastMaintenance: '2026-04-15',
    nextMaintenance: '2026-05-15',
    status: 'normal',
    components: [
      { name: 'pH传感器', health: 95, status: 'excellent', description: '响应时间快，精度高' },
      { name: '溶解氧传感器', health: 88, status: 'good', description: '性能稳定，偶有零点漂移' },
      { name: '盐度传感器', health: 94, status: 'excellent', description: '测量准确，无异常' },
      { name: '氨氮传感器', health: 91, status: 'good', description: '线性度良好' },
      { name: '通信模块', health: 98, status: 'excellent', description: '信号强度优' },
    ],
  },
  {
    id: 'CTRL_001',
    name: '水质联动控制箱',
    type: 'controller',
    health: 85.3,
    uptime: 3120,
    lastMaintenance: '2026-03-20',
    nextMaintenance: '2026-04-20',
    status: 'warning',
    components: [
      { name: '增氧泵控制器', health: 82, status: 'good', description: '响应正常' },
      { name: '喂食器控制器', health: 87, status: 'good', description: '定时准确' },
      { name: '继电器模组', health: 78, status: 'fair', description: '部分触点老化' },
      { name: '电源模块', health: 91, status: 'excellent', description: '输出稳定' },
      { name: '通信模块', health: 89, status: 'good', description: '连接稳定' },
    ],
  },
  {
    id: 'CAM_001',
    name: '水下摄像系统',
    type: 'camera',
    health: 76.8,
    uptime: 4320,
    lastMaintenance: '2026-02-10',
    nextMaintenance: '2026-03-10',
    status: 'error',
    components: [
      { name: '摄像头', health: 72, status: 'fair', description: '画面清晰度下降' },
      { name: '照明灯', health: 81, status: 'good', description: '亮度正常' },
      { name: '线缆', health: 85, status: 'good', description: '无破损' },
      { name: '密封件', health: 68, status: 'poor', description: '建议更换' },
      { name: '录像存储', health: 95, status: 'excellent', description: '存储正常' },
    ],
  },
];

const maintenanceRecommendations = [
  { device: '水下摄像系统', priority: 'high', action: '更换摄像头密封件', reason: '防水密封件老化，可能导致漏水' },
  { device: '水质联动控制箱', priority: 'medium', action: '检查继电器触点', reason: '部分继电器触点老化，建议清洁或更换' },
  { device: '水质浮漂集成传感器', priority: 'low', action: '定期校准', reason: '建议每月进行一次零点校准' },
];

export default function DeviceHealthPage() {
  const [selectedDevice, setSelectedDevice] = useState(mockDevices[0]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const getHealthColor = (health: number): string => {
    if (health >= 90) return 'var(--sea-green)';
    if (health >= 80) return 'var(--cyan-glow)';
    if (health >= 70) return 'var(--amber)';
    return 'var(--coral-red)';
  };

  const getHealthLevel = (health: number): HealthLevel => {
    if (health >= 90) return 'excellent';
    if (health >= 80) return 'good';
    if (health >= 70) return 'fair';
    return 'poor';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const healthTrendData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const base = selectedDevice.health;
    return {
      dates: Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - i - 1));
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }),
      values: Array.from({ length: days }, (_, i) => {
        const trend = -0.05 * i;
        const noise = (Math.random() - 0.5) * 3;
        return Math.max(60, Math.min(100, base + trend * days + noise));
      }),
    };
  }, [selectedDevice, timeRange]);

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(0,0,0,0.1)',
      textStyle: { color: '#334155' },
      formatter: (params: any) => {
        const data = params[0];
        return `${data.axisValue}<br/>健康度: ${data.value.toFixed(1)}%`;
      },
    },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: healthTrendData.dates,
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } },
      axisLabel: { color: '#64748b', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      min: 60,
      max: 100,
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
      axisLabel: { color: '#64748b', formatter: '{value}%' },
    },
    series: [
      {
        type: 'line',
        data: healthTrendData.values.map((v) => +v.toFixed(1)),
        smooth: true,
        lineStyle: { color: getHealthColor(selectedDevice.health), width: 2 },
        itemStyle: { color: getHealthColor(selectedDevice.health) },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${getHealthColor(selectedDevice.health)}30` },
              { offset: 1, color: `${getHealthColor(selectedDevice.health)}05` },
            ],
          },
        },
        markLine: {
          silent: true,
          lineStyle: { color: '#ef4444', type: 'dashed' },
          data: [
            { yAxis: 70, name: '警告线' },
            { yAxis: 60, name: '危险线' },
          ],
          label: { formatter: '{b}', color: '#64748b' },
        },
      },
    ],
  };

  const componentChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(0,0,0,0.1)',
      textStyle: { color: '#334155' },
    },
    grid: { left: 120, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
      axisLabel: { color: '#64748b', formatter: '{value}%' },
    },
    yAxis: {
      type: 'category',
      data: selectedDevice.components.map((c) => c.name),
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      {
        type: 'bar',
        data: selectedDevice.components.map((c) => ({
          value: c.health,
          itemStyle: { color: getHealthColor(c.health) },
        })),
        barWidth: '50%',
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          color: '#64748b',
        },
      },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="w-5 h-5 text-[var(--cyan-glow)]" />
        <h1 className="text-xl font-semibold text-[var(--cyan-glow)]">设备健康诊断</h1>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {mockDevices.map((device) => (
          <button
            key={device.id}
            onClick={() => setSelectedDevice(device)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              selectedDevice.id === device.id
                ? 'bg-[var(--cyan-glow)] text-white glow-cyan'
                : 'bg-[var(--ocean-surface)] text-[var(--ocean-blue)] hover:bg-[var(--ocean-surface)]/80'
            }`}
          >
            {getStatusIcon(device.status)}
            {device.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">整体健康评分</h2>
            {getStatusIcon(selectedDevice.status)}
          </div>
          <div className="flex flex-col items-center">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center relative"
              style={{
                background: `conic-gradient(${getHealthColor(selectedDevice.health)} ${selectedDevice.health}%, var(--ocean-surface) 0%)`,
              }}
            >
              <div className="w-24 h-24 rounded-full bg-[var(--ocean-dark)] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: getHealthColor(selectedDevice.health) }}>
                    {selectedDevice.health.toFixed(1)}
                  </div>
                  <div className="text-xs text-[var(--ocean-blue)]/50">健康度%</div>
                </div>
              </div>
            </div>
            <div className="mt-3 text-center">
              <div className="text-sm font-semibold text-[var(--ocean-blue)]">
                {getHealthLevel(selectedDevice.health) === 'excellent' ? '优秀' :
                 getHealthLevel(selectedDevice.health) === 'good' ? '良好' :
                 getHealthLevel(selectedDevice.health) === 'fair' ? '一般' : '较差'}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">运行信息</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--ocean-blue)]/60">设备ID:</span>
              <span className="text-[var(--ocean-blue)] font-mono">{selectedDevice.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ocean-blue)]/60">设备类型:</span>
              <span className="text-[var(--ocean-blue)]">{selectedDevice.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ocean-blue)]/60">运行时长:</span>
              <span className="text-[var(--ocean-blue)]">{(selectedDevice.uptime / 24).toFixed(0)}天</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ocean-blue)]/60">最后维护:</span>
              <span className="text-[var(--ocean-blue)]">{selectedDevice.lastMaintenance}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ocean-blue)]/60">下次维护:</span>
              <span className="text-[var(--cyan-glow)]">{selectedDevice.nextMaintenance}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">维护建议</h2>
          <div className="space-y-2">
            {maintenanceRecommendations
              .filter((r) => r.device === selectedDevice.name)
              .map((rec, index) => (
                <div key={index} className="bg-[var(--ocean-deep)] rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      rec.priority === 'high' ? 'bg-red-500' :
                      rec.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                    }`} />
                    <span className="text-xs font-semibold text-[var(--ocean-blue)]">{rec.action}</span>
                  </div>
                  <p className="text-xs text-[var(--ocean-blue)]/60">{rec.reason}</p>
                </div>
              ))}
            {maintenanceRecommendations.filter((r) => r.device === selectedDevice.name).length === 0 && (
              <div className="text-sm text-[var(--ocean-blue)]/50 text-center py-4">
                暂无维护建议
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)] flex items-center gap-2">
            <Activity className="w-4 h-4" />
            健康趋势
          </h2>
          <div className="flex gap-1">
            {([
              { key: '7d' as const, label: '7天' },
              { key: '30d' as const, label: '30天' },
              { key: '90d' as const, label: '90天' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimeRange(key)}
                className={`px-3 py-1 rounded text-xs transition-all ${
                  timeRange === key
                    ? 'bg-[var(--cyan-glow)] text-white'
                    : 'bg-[var(--ocean-surface)] text-[var(--ocean-blue)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <ReactECharts option={chartOption} style={{ height: 250 }} />
      </div>

      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--ocean-blue)] flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          部件健康详情
        </h2>
        <ReactECharts option={componentChartOption} style={{ height: 280 }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {selectedDevice.components.map((component) => (
            <div key={component.name} className="bg-[var(--ocean-deep)] rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--ocean-blue)]">{component.name}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: `${getHealthColor(component.health)}20`,
                    color: getHealthColor(component.health),
                  }}
                >
                  {component.health}%
                </span>
              </div>
              <p className="text-xs text-[var(--ocean-blue)]/60">{component.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--ocean-blue)] flex items-center gap-2">
          <Clock className="w-4 h-4" />
          维护历史
        </h2>
        <div className="space-y-2">
          {[
            { date: '2026-04-15', action: '传感器校准', operator: '技术员张工', result: '成功' },
            { date: '2026-03-20', action: '继电器检查', operator: '技术员李工', result: '需关注' },
            { date: '2026-02-10', action: '密封件更换', operator: '技术员王工', result: '成功' },
            { date: '2026-01-05', action: '固件升级', operator: '系统自动', result: '成功' },
          ].map((record, index) => (
            <div key={index} className="flex items-center justify-between bg-[var(--ocean-deep)] rounded-lg px-4 py-2">
              <div className="flex items-center gap-4">
                <span className="text-xs text-[var(--ocean-blue)]/50">{record.date}</span>
                <span className="text-sm text-[var(--ocean-blue)]">{record.action}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-[var(--ocean-blue)]/50">{record.operator}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  record.result === '成功' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'
                }`}>
                  {record.result}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
