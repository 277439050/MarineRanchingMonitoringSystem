import { useState, useEffect, useRef, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { Activity, Droplets, Wind, Fish, Heart, Settings, X, Power, Thermometer, CloudSun, Waves, ShieldAlert, ChevronRight } from 'lucide-react';
import type { Device, SensorData } from '@/types';
import { formatMetric, getMetricUnit, getMetricLabel, getO2Level } from '@/utils/format';

const MOCK_DEVICES: Device[] = [
  { id: 1, name: '水质浮漂传感器A', did: 'DID-SEN-001', type: 'sensor', sim_imei: '89860123456789012345', sim_date: '2026-12-31', status: 'online', created_at: '2025-01-15', updated_at: '2026-05-01' },
  { id: 2, name: '水质浮漂传感器B', did: 'DID-SEN-002', type: 'sensor', sim_imei: '89860123456789012346', sim_date: '2026-11-30', status: 'online', created_at: '2025-02-20', updated_at: '2026-04-28' },
  { id: 3, name: '水质联动控制箱', did: 'DID-CTL-001', type: 'controller', sim_imei: '89860123456789012347', sim_date: '2026-10-15', status: 'online', created_at: '2025-03-10', updated_at: '2026-04-15' },
  { id: 4, name: '深水探测器', did: 'DID-SEN-003', type: 'sensor', sim_imei: '89860123456789012348', sim_date: '2026-09-20', status: 'online', created_at: '2025-04-05', updated_at: '2026-05-01' },
];

const genSensorData = (): SensorData[] => [
  { did: 'DID-SEN-001', ph: 7.2 + Math.random() * 0.8, salt: 22 + Math.random() * 6, o2: 4 + Math.random() * 4, nh3: 0.1 + Math.random() * 0.5, health: 60 + Math.random() * 35, timestamp: new Date().toISOString() },
  { did: 'DID-SEN-002', ph: 7.0 + Math.random() * 1.0, salt: 20 + Math.random() * 8, o2: 5 + Math.random() * 3, nh3: 0.05 + Math.random() * 0.4, health: 70 + Math.random() * 25, timestamp: new Date().toISOString() },
  { did: 'DID-SEN-003', ph: 7.4 + Math.random() * 0.6, salt: 25 + Math.random() * 5, o2: 3 + Math.random() * 3, nh3: 0.2 + Math.random() * 0.6, health: 55 + Math.random() * 30, timestamp: new Date().toISOString() },
];

const METRICS = ['ph', 'salt', 'o2', 'nh3', 'health'] as const;

const METRIC_ICONS: Record<string, React.ReactNode> = {
  ph: <Droplets size={16} />,
  salt: <Wind size={16} />,
  o2: <Activity size={16} />,
  nh3: <Fish size={16} />,
  health: <Heart size={16} />,
};

const METRIC_COLORS: Record<string, string> = {
  ph: 'var(--coral-red)',
  salt: 'var(--amber)',
  o2: 'var(--sea-green)',
  nh3: 'var(--ocean-blue)',
  health: 'var(--sea-green)',
};

const METRIC_SPARK_COLORS: Record<string, string> = {
  ph: '#ef4444',
  salt: '#f59e0b',
  o2: '#10b981',
  nh3: '#334155',
  health: '#10b981',
};

const METRIC_MAX: Record<string, number> = {
  ph: 10,
  salt: 40,
  o2: 10,
  nh3: 2,
  health: 100,
};

const ANOMALY_LIST = [
  { time: '14:32', desc: '溶解氧短暂波动', level: '低' },
  { time: '13:15', desc: 'pH值轻微偏移', level: '低' },
  { time: '11:48', desc: '氨氮浓度上升', level: '中' },
];

export default function RealtimePage() {
  const [selectedId, setSelectedId] = useState(1);
  const [sensorData, setSensorData] = useState<SensorData[]>(genSensorData());
  const [historyPoints, setHistoryPoints] = useState<Record<string, number[]>>(() => {
    const pts: Record<string, number[]> = {};
    METRICS.forEach((m) => { pts[m] = Array.from({ length: 20 }, () => m === 'ph' ? 7.2 + Math.random() * 0.8 : m === 'salt' ? 22 + Math.random() * 6 : m === 'o2' ? 4 + Math.random() * 4 : m === 'nh3' ? 0.1 + Math.random() * 0.5 : 60 + Math.random() * 35); });
    return pts;
  });
  const [timeLabels, setTimeLabels] = useState<string[]>(() => {
    const now = Date.now();
    return Array.from({ length: 20 }, (_, i) => new Date(now - (19 - i) * 60000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
  });
  const [controlOpen, setControlOpen] = useState(false);
  const [o2Warning, setO2Warning] = useState(false);
  const [pumpOpen, setPumpOpen] = useState(false);
  const [feederOpen, setFeederOpen] = useState(false);
  const [healthHistory, setHealthHistory] = useState<number[]>(() => Array.from({ length: 20 }, () => 60 + Math.random() * 35));
  const [anomalyScore, setAnomalyScore] = useState(12.5);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const selectedDevice = MOCK_DEVICES.find((d) => d.id === selectedId)!;
  const currentSensor = sensorData.find((s) => s.did === selectedDevice.did);

  const refreshData = useCallback(() => {
    const newData = genSensorData();
    setSensorData(newData);
    const now = new Date();
    setTimeLabels((prev) => [...prev.slice(1), now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })]);
    setHistoryPoints((prev) => {
      const next: Record<string, number[]> = {};
      METRICS.forEach((m) => {
        const val = newData[0][m as keyof SensorData] as number;
        next[m] = [...prev[m].slice(1), val];
      });
      return next;
    });
    setHealthHistory((prev) => [...prev.slice(1), newData[0].health]);
    setAnomalyScore(8 + Math.random() * 15);
    const o2Val = newData[0].o2;
    if (o2Val < 4.5) setO2Warning(true);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(refreshData, 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refreshData]);

  const getChartOption = () => {
    const series = METRICS.map((m) => ({
      name: getMetricLabel(m),
      type: 'line' as const,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2 },
      itemStyle: { color: METRIC_COLORS[m] === 'var(--sea-green)' && m === 'o2' ? (currentSensor && getO2Level(currentSensor.o2) !== 'normal' ? 'var(--coral-red)' : '#10b981') : METRIC_COLORS[m] },
      data: historyPoints[m],
    }));
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: 'rgba(0,0,0,0.1)', textStyle: { color: '#334155', fontSize: 12 } },
      legend: { data: METRICS.map(getMetricLabel), textStyle: { color: '#64748b', fontSize: 11 }, top: 0 },
      grid: { left: 50, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: timeLabels, axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } }, axisLabel: { color: '#64748b', fontSize: 10 } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } }, axisLabel: { color: '#64748b', fontSize: 10 } },
      series,
    };
  };

  const getHealthChartOption = () => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: 'rgba(0,0,0,0.1)', textStyle: { color: '#334155', fontSize: 12 } },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: timeLabels, axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } }, axisLabel: { color: '#64748b', fontSize: 10 } },
    yAxis: { type: 'value', min: 0, max: 100, splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } }, axisLabel: { color: '#64748b', fontSize: 10 } },
    series: [{ type: 'line', smooth: true, symbol: 'none', lineStyle: { width: 2, color: '#10b981' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16,185,129,0.25)' }, { offset: 1, color: 'rgba(16,185,129,0)' }] } }, data: healthHistory }],
  });

  const getRadarOption = () => {
    if (!currentSensor) return {};
    const indicators = METRICS.map((m) => ({
      name: getMetricLabel(m),
      max: METRIC_MAX[m],
    }));
    const values = METRICS.map((m) => currentSensor[m as keyof SensorData] as number);
    return {
      backgroundColor: 'transparent',
      tooltip: { backgroundColor: 'rgba(255,255,255,0.95)', borderColor: 'rgba(0,0,0,0.1)', textStyle: { color: '#334155', fontSize: 12 } },
      radar: {
        indicator: indicators,
        shape: 'polygon' as const,
        splitNumber: 4,
        axisName: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
        splitArea: { areaStyle: { color: ['rgba(8,145,178,0.02)', 'rgba(8,145,178,0.04)', 'rgba(8,145,178,0.02)', 'rgba(8,145,178,0.04)'] } },
        axisLine: { lineStyle: { color: 'rgba(0,0,0,0.1)' } },
      },
      series: [{
        type: 'radar',
        data: [{
          value: values,
          name: '当前水质',
          lineStyle: { color: '#0891b2', width: 2 },
          itemStyle: { color: '#0891b2' },
          areaStyle: { color: 'rgba(8,145,178,0.15)' },
        }],
      }],
    };
  };

  const getO2BadgeColor = (o2: number) => {
    const level = getO2Level(o2);
    if (level === 'red') return 'bg-[var(--coral-red)]/20 text-[var(--coral-red)] border-[var(--coral-red)]/30';
    if (level === 'yellow') return 'bg-[var(--amber)]/20 text-[var(--amber)] border-[var(--amber)]/30';
    return 'bg-[var(--sea-green)]/20 text-[var(--sea-green)] border-[var(--sea-green)]/30';
  };

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-7rem)]">
      <div className="glass-card px-4 py-2.5 flex items-center gap-5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-4 h-4 text-[var(--coral-red)]" />
          <span className="text-xs text-[var(--ocean-blue)]/60">水温</span>
          <span className="text-sm font-bold text-[var(--ocean-blue)]">24.5°C</span>
        </div>
        <div className="w-px h-4 bg-[var(--ocean-surface)]" />
        <div className="flex items-center gap-1.5">
          <CloudSun className="w-4 h-4 text-[var(--amber)]" />
          <span className="text-xs text-[var(--ocean-blue)]/60">气温</span>
          <span className="text-sm font-bold text-[var(--ocean-blue)]">28.3°C</span>
        </div>
        <div className="w-px h-4 bg-[var(--ocean-surface)]" />
        <div className="flex items-center gap-1.5">
          <Wind className="w-4 h-4 text-[var(--cyan-glow)]" />
          <span className="text-xs text-[var(--ocean-blue)]/60">风速</span>
          <span className="text-sm font-bold text-[var(--ocean-blue)]">3.2m/s</span>
        </div>
        <div className="w-px h-4 bg-[var(--ocean-surface)]" />
        <div className="flex items-center gap-1.5">
          <Waves className="w-4 h-4 text-[var(--ocean-blue)]/60" />
          <span className="text-xs text-[var(--ocean-blue)]/60">潮汐</span>
          <span className="text-sm font-bold text-[var(--ocean-blue)]">大潮</span>
        </div>
        <div className="w-px h-4 bg-[var(--ocean-surface)]" />
        <div className="flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-[var(--sea-green)]" />
          <span className="text-xs text-[var(--ocean-blue)]/60">海况</span>
          <span className="text-sm font-bold text-[var(--sea-green)]">良好</span>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="w-56 flex-shrink-0 space-y-3 overflow-y-auto">
          {MOCK_DEVICES.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              className={`glass-card p-3 cursor-pointer transition-all ${
                selectedId === d.id ? 'border-[var(--cyan-glow)] glow-cyan' : 'hover:border-[var(--ocean-blue)]/30'
              }`}
            >
              <div className="text-sm text-[var(--ocean-blue)] font-medium truncate">{d.name}</div>
              <div className="text-xs text-[var(--ocean-blue)]/50 font-mono mt-1">{d.did}</div>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  d.status === 'online' ? 'bg-[var(--sea-green)]/20 text-[var(--sea-green)]' : 'bg-[var(--coral-red)]/20 text-[var(--coral-red)]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'online' ? 'bg-[var(--sea-green)]' : 'bg-[var(--coral-red)]'}`} />
                  {d.status === 'online' ? '在线' : '离线'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto">
          <div className="glass-card p-4 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-[var(--ocean-blue)]/15 text-[var(--ocean-blue)] border border-[var(--ocean-blue)]/20">
              设备编号：<span className="font-mono">{selectedDevice.did}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-[var(--sea-green)]/15 text-[var(--sea-green)] border border-[var(--sea-green)]/20">
              数据更新：{new Date().toLocaleTimeString('zh-CN')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-[var(--ocean-blue)]/10 text-[var(--ocean-blue)]/70 border border-[var(--ocean-surface)]">
              流量卡号：<span className="font-mono">{selectedDevice.sim_imei}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-[var(--ocean-blue)]/10 text-[var(--ocean-blue)]/70 border border-[var(--ocean-surface)]">
              流量到期：{selectedDevice.sim_date}
            </span>
          </div>

          {selectedDevice.type === 'sensor' && currentSensor && (
            <>
              <div className="grid grid-cols-5 gap-3">
                {METRICS.map((m) => {
                  const val = currentSensor[m as keyof SensorData] as number;
                  const color = m === 'o2' ? getO2BadgeColor(val) : m === 'ph' ? 'bg-[var(--coral-red)]/15 text-[var(--coral-red)] border-[var(--coral-red)]/20' : m === 'salt' ? 'bg-[var(--amber)]/15 text-[var(--amber)] border-[var(--amber)]/20' : m === 'nh3' ? 'bg-[var(--ocean-blue)]/15 text-[var(--ocean-blue)] border-[var(--ocean-blue)]/20' : 'bg-[var(--sea-green)]/15 text-[var(--sea-green)] border-[var(--sea-green)]/20';
                  const pct = Math.min(100, (val / METRIC_MAX[m]) * 100);
                  return (
                    <div key={m} className={`glass-card p-3 border ${color}`}>
                      <div className="flex items-center gap-2 text-xs opacity-80">{METRIC_ICONS[m]}{getMetricLabel(m)}</div>
                      <div className="text-2xl font-bold mt-1">{formatMetric(m, val)}<span className="text-xs ml-1 font-normal opacity-60">{getMetricUnit(m)}</span></div>
                      <div className="mt-2 w-full h-1.5 bg-[var(--ocean-deep)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: METRIC_SPARK_COLORS[m] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="glass-card p-4 col-span-2 min-h-[280px]">
                  <ReactECharts option={getChartOption()} style={{ height: '100%' }} />
                </div>
                <div className="glass-card p-4 flex flex-col">
                  <h3 className="text-sm text-[var(--cyan-glow)] font-medium mb-2">水质综合评估</h3>
                  <div className="flex-1 min-h-0">
                    <ReactECharts option={getRadarOption()} style={{ height: '100%' }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-4 h-4 text-[var(--cyan-glow)]" />
                    <h3 className="text-sm text-[var(--ocean-blue)] font-medium">AI异常检测</h3>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-14 h-14">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--ocean-surface)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#0891b2" strokeWidth="3" strokeDasharray={`${anomalyScore} ${100 - anomalyScore}`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-[var(--cyan-glow)]">{anomalyScore.toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ocean-blue)]/60">异常评分</div>
                      <div className="text-xs text-[var(--sea-green)] font-medium">正常范围</div>
                      <div className="text-[10px] text-[var(--ocean-blue)]/40">越低越好 / 100</div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {ANOMALY_LIST.map((a, i) => (
                      <div key={i} className="flex items-center justify-between bg-[var(--ocean-deep)] rounded-md px-2.5 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--ocean-blue)]/40">{a.time}</span>
                          <span className="text-[11px] text-[var(--ocean-blue)]/80">{a.desc}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          a.level === '低' ? 'bg-[var(--sea-green)]/15 text-[var(--sea-green)]' : 'bg-[var(--amber)]/15 text-[var(--amber)]'
                        }`}>
                          {a.level}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-2.5 flex items-center justify-center gap-1 text-xs text-[var(--cyan-glow)] hover:text-[var(--cyan-glow)]/80 transition py-1">
                    查看详情 <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="glass-card p-4 col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm text-[var(--cyan-glow)] font-medium">告警设置</h3>
                    <button className="flex items-center gap-1 text-xs text-[var(--ocean-blue)] hover:text-[var(--cyan-glow)] transition"><Settings size={12} /> 配置</button>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {METRICS.map((m) => (
                      <div key={m} className="bg-[var(--ocean-deep)] rounded-lg p-2 text-center">
                        <div className="text-[var(--ocean-blue)]/60">{getMetricLabel(m)}</div>
                        <div className="text-[var(--ocean-blue)] mt-1">阈值: {m === 'ph' ? '6.5-9.0' : m === 'salt' ? '10-35‰' : m === 'o2' ? '>4.5mg/L' : m === 'nh3' ? '<2.0mg/L' : '>60%'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedDevice.type === 'controller' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-6 flex flex-col items-center justify-center">
                  <div className="text-xs text-[var(--ocean-blue)]/60 mb-2">健康指数</div>
                  <div className="text-5xl font-bold text-[var(--sea-green)]">{(healthHistory[healthHistory.length - 1] ?? 80).toFixed(1)}%</div>
                  <div className="w-full mt-4 h-2 bg-[var(--ocean-deep)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--sea-green)] rounded-full transition-all" style={{ width: `${healthHistory[healthHistory.length - 1] ?? 80}%` }} />
                  </div>
                </div>
                <div className="glass-card p-4">
                  <h3 className="text-sm text-[var(--cyan-glow)] font-medium mb-2">健康趋势</h3>
                  <ReactECharts option={getHealthChartOption()} style={{ height: 'calc(100% - 28px)' }} />
                </div>
              </div>
              <div className="glass-card p-6 flex flex-col items-center">
                <button
                  onClick={() => setControlOpen(true)}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-[var(--cyan-glow)] to-[var(--ocean-blue)] text-[var(--ocean-deep)] font-bold text-base hover:brightness-110 transition glow-cyan"
                >
                  <Power size={18} className="inline mr-2 -mt-0.5" />
                  点击我开始控制设备
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {controlOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-80 glass-card p-5 glow-cyan animate-[slideIn_0.3s_ease]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[var(--cyan-glow)] font-medium">设备控制</h3>
            <button onClick={() => setControlOpen(false)} className="text-[var(--ocean-blue)]/50 hover:text-[var(--ocean-blue)]"><X size={16} /></button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-[var(--ocean-deep)] rounded-lg p-3">
              <span className="text-sm text-[var(--ocean-blue)]">增氧泵</span>
              <button
                onClick={() => setPumpOpen(!pumpOpen)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  pumpOpen ? 'bg-[var(--sea-green)]/20 text-[var(--sea-green)] border border-[var(--sea-green)]/30' : 'bg-[var(--coral-red)]/20 text-[var(--coral-red)] border border-[var(--coral-red)]/30'
                }`}
              >
                {pumpOpen ? '开启' : '关闭'}
              </button>
            </div>
            <div className="flex items-center justify-between bg-[var(--ocean-deep)] rounded-lg p-3">
              <span className="text-sm text-[var(--ocean-blue)]">喂食机</span>
              <button
                onClick={() => setFeederOpen(!feederOpen)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  feederOpen ? 'bg-[var(--sea-green)]/20 text-[var(--sea-green)] border border-[var(--sea-green)]/30' : 'bg-[var(--coral-red)]/20 text-[var(--coral-red)] border border-[var(--coral-red)]/30'
                }`}
              >
                {feederOpen ? '开启' : '关闭'}
              </button>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setPumpOpen(false); setFeederOpen(false); }} className="flex-1 py-2 rounded-lg bg-[var(--ocean-surface)] text-[var(--ocean-blue)] text-sm hover:bg-[var(--ocean-dark)] transition">全部关闭</button>
              <button onClick={() => { setPumpOpen(true); setFeederOpen(true); }} className="flex-1 py-2 rounded-lg bg-[var(--cyan-glow)] text-[var(--ocean-deep)] text-sm font-medium hover:brightness-110 transition">全部开启</button>
            </div>
          </div>
        </div>
      )}

      {o2Warning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setO2Warning(false)}>
          <div className="glass-card p-6 w-96 border-[var(--coral-red)]/50 glow-red animate-pulse-alert" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--coral-red)]/20 flex items-center justify-center">
                <Activity size={20} className="text-[var(--coral-red)]" />
              </div>
              <div>
                <h3 className="text-[var(--coral-red)] font-bold">溶解氧预警</h3>
                <p className="text-xs text-[var(--coral-red)]/70">Ⅲ级预警：溶氧降低建议立即启动增氧</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setO2Warning(false)} className="px-4 py-1.5 rounded bg-[var(--ocean-surface)] text-[var(--ocean-blue)] text-sm">忽略</button>
              <button onClick={() => { setO2Warning(false); setSelectedId(3); setControlOpen(true); setPumpOpen(true); }} className="px-4 py-1.5 rounded bg-[var(--coral-red)] text-white text-sm font-medium hover:brightness-110 transition">启动增氧</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
