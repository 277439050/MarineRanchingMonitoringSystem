import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import {
  Cloud, Droplets, Video, Wifi, AlertTriangle, HeartPulse,
  FlaskConical, Waves, Wind, Atom, Activity, Camera,
  Brain, Shield, Sparkles, TrendingUp, TrendingDown, Cpu,
  MapPin, Thermometer, Eye, Zap,
} from 'lucide-react';
import { useDeviceStore } from '@/stores/deviceStore';
import { useSensorStore } from '@/stores/sensorStore';
import { useAlertStore } from '@/stores/alertStore';
import { formatMetric, getMetricColor, getMetricUnit, getMetricLabel, formatDateTime } from '@/utils/format';
import type { SensorData, Alert } from '@/types';

const MOCK_SENSOR: SensorData = {
  did: 'MOCK-001', ph: 7.82, salt: 25.6, o2: 6.4, nh3: 0.15, health: 92.5,
  timestamp: new Date().toISOString(),
};

const MOCK_ALERTS: Alert[] = [
  { id: 1, did: 'D001', level: 'I', metric: 'o2', value: 3.2, threshold: 4.5, message: '溶解氧过低', status: 'active', created_at: new Date(Date.now() - 3600000).toISOString(), resolved_at: null },
  { id: 2, did: 'D002', level: 'II', metric: 'nh3', value: 2.8, threshold: 2.0, message: '氨氮偏高', status: 'active', created_at: new Date(Date.now() - 7200000).toISOString(), resolved_at: null },
  { id: 3, did: 'D003', level: 'III', metric: 'ph', value: 9.1, threshold: 8.5, message: 'pH值偏高', status: 'active', created_at: new Date(Date.now() - 10800000).toISOString(), resolved_at: null },
  { id: 4, did: 'D001', level: 'II', metric: 'o2', value: 4.2, threshold: 5.0, message: '溶解氧偏低', status: 'acknowledged', created_at: new Date(Date.now() - 14400000).toISOString(), resolved_at: null },
  { id: 5, did: 'D004', level: 'I', metric: 'health', value: 35, threshold: 40, message: '设备健康度低', status: 'active', created_at: new Date(Date.now() - 18000000).toISOString(), resolved_at: null },
];

const LEVEL_CFG: Record<string, { label: string; color: string }> = {
  I: { label: 'I级', color: 'var(--coral-red)' },
  II: { label: 'II级', color: 'var(--amber)' },
  III: { label: 'III级', color: '#fb923c' },
};

const METRIC_KEYS = ['ph', 'salt', 'o2', 'nh3', 'health'] as const;
const METRIC_ICONS = { ph: FlaskConical, salt: Waves, o2: Wind, nh3: Atom, health: Activity };

const ZONE_DATA = [
  { id: 'A', name: 'A区 · 深海养殖区', status: 'normal' as const, temp: 18.6, ph: 7.82, o2: 6.4, health: 94, species: '大西洋鲑', density: '12.5 尾/m³' },
  { id: 'B', name: 'B区 · 浅海培育区', status: 'normal' as const, temp: 20.3, ph: 7.65, o2: 5.8, health: 89, species: '鲍鱼', density: '8.2 尾/m³' },
  { id: 'C', name: 'C区 · 生态修复区', status: 'warning' as const, temp: 22.1, ph: 8.12, o2: 4.6, health: 72, species: '海参', density: '6.8 尾/m³' },
  { id: 'D', name: 'D区 · 苗种繁育区', status: 'alert' as const, temp: 24.5, ph: 8.87, o2: 3.8, health: 58, species: '扇贝', density: '15.3 尾/m³' },
];

const ZONE_STATUS_CONFIG = {
  normal: { label: '运行正常', color: 'var(--sea-green)', borderColor: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  warning: { label: '需要关注', color: 'var(--amber)', borderColor: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  alert: { label: '异常告警', color: 'var(--coral-red)', borderColor: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
};

const ENV_INDICES = [
  { label: '水质指数', value: 92, max: 100, color: '#0891b2', icon: Droplets },
  { label: '生态指数', value: 85, max: 100, color: '#10b981', icon: Sparkles },
  { label: '养殖适宜度', value: 88, max: 100, color: '#3b82f6', icon: HeartPulse },
  { label: '风险指数', value: 15, max: 100, color: '#f59e0b', icon: Shield, invert: true },
];

function getO2DisplayColor(val: number): string {
  if (val < 4.5) return 'var(--coral-red)';
  if (val < 5.0) return 'var(--amber)';
  return 'var(--sea-green)';
}

function getDisplayColor(key: string, val: number): string {
  if (key === 'o2') return getO2DisplayColor(val);
  return getMetricColor(key, val);
}

function GaugeRing({ value, max, size, strokeWidth, color, children }: {
  value: number; max: number; size: number; strokeWidth: number; color: string; children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference * (1 - progress);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { devices, fetchDevices } = useDeviceStore();
  const { realtimeData, fetchRealtime } = useSensorStore();
  const { alerts, fetchAlerts } = useAlertStore();
  const [sensorData, setSensorData] = useState<SensorData[]>([MOCK_SENSOR]);
  const [alertList, setAlertList] = useState<Alert[]>(MOCK_ALERTS);

  useEffect(() => {
    fetchDevices().catch(() => {});
    fetchRealtime().catch(() => {});
    fetchAlerts({ status: 'active', pageSize: 5 }).catch(() => {});
  }, [fetchDevices, fetchRealtime, fetchAlerts]);

  useEffect(() => {
    if (realtimeData.length > 0) setSensorData(realtimeData);
  }, [realtimeData]);

  useEffect(() => {
    if (alerts.length > 0) setAlertList(alerts);
  }, [alerts]);

  const latest = sensorData[0] ?? MOCK_SENSOR;
  const weatherCount = devices.filter((d) => d.type === 'weather').length || 1;
  const waterCount = devices.filter((d) => d.type === 'sensor').length || 2;
  const cameraCount = devices.filter((d) => d.type === 'camera').length || 1;
  const onlineCount = devices.filter((d) => d.status === 'online').length || 3;
  const activeAlerts = alertList.filter((a) => a.status === 'active').length;
  const healthRate = devices.length > 0
    ? Math.round((devices.filter((d) => d.status === 'online').length / devices.length) * 100)
    : 92;

  const statCards = [
    { icon: Cloud, label: '气象站', value: `${weatherCount}台`, trend: '+1', up: true, gradient: 'from-blue-500/10 to-cyan-500/10' },
    { icon: Droplets, label: '水质监测', value: `${waterCount}台`, trend: '+2', up: true, gradient: 'from-cyan-500/10 to-teal-500/10' },
    { icon: Video, label: '视频监控', value: `${cameraCount}台`, trend: '0%', up: true, gradient: 'from-purple-500/10 to-blue-500/10' },
    { icon: Wifi, label: '在线设备', value: `${onlineCount}台`, trend: '98.5%', up: true, gradient: 'from-green-500/10 to-emerald-500/10' },
    { icon: AlertTriangle, label: '活跃预警', value: `${activeAlerts}条`, trend: '-2', up: false, gradient: 'from-red-500/10 to-orange-500/10' },
    { icon: HeartPulse, label: '设备健康率', value: `${healthRate}%`, trend: '+3.2%', up: true, gradient: 'from-emerald-500/10 to-green-500/10' },
    { icon: Cpu, label: 'AI模型精度', value: '97.3%', trend: '+1.8%', up: true, gradient: 'from-violet-500/10 to-purple-500/10' },
  ];

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(0,0,0,0.1)',
      textStyle: { color: '#334155' },
    },
    legend: {
      data: ['pH值', '溶解氧', '氨氮'],
      textStyle: { color: '#64748b' },
      top: 0,
    },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category' as const,
      data: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: {
      type: 'value' as const,
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      {
        name: 'pH值', type: 'line', smooth: true,
        data: Array.from({ length: 24 }, () => +(7 + Math.random() * 1.5).toFixed(2)),
        lineStyle: { color: '#0891b2', width: 2 }, itemStyle: { color: '#0891b2' },
        symbol: 'circle', symbolSize: 4,
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(8,145,178,0.25)' }, { offset: 1, color: 'rgba(8,145,178,0)' }] } },
      },
      {
        name: '溶解氧', type: 'line', smooth: true,
        data: Array.from({ length: 24 }, () => +(4 + Math.random() * 4).toFixed(2)),
        lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' },
        symbol: 'circle', symbolSize: 4,
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.25)' }, { offset: 1, color: 'rgba(59,130,246,0)' }] } },
      },
      {
        name: '氨氮', type: 'line', smooth: true,
        data: Array.from({ length: 24 }, () => +(Math.random() * 3).toFixed(3)),
        lineStyle: { color: '#10b981', width: 2 }, itemStyle: { color: '#10b981' },
        symbol: 'circle', symbolSize: 4,
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16,185,129,0.25)' }, { offset: 1, color: 'rgba(16,185,129,0)' }] } },
      },
    ],
  };

  const aiGaugeOption = {
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge' as const,
      startAngle: 220,
      endAngle: -40,
      min: 0,
      max: 100,
      radius: '90%',
      progress: { show: true, width: 10, itemStyle: { color: '#0891b2' } },
      axisLine: { lineStyle: { width: 10, color: [[1, 'rgba(0,0,0,0.06)']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      title: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 22,
        fontWeight: 700,
        color: '#0891b2',
        offsetCenter: [0, '10%'],
        formatter: '{value}',
      },
      data: [{ value: 92.5 }],
    }],
  };

  return (
    <div className="space-y-5">

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-4 lg:grid-cols-7 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className={`glass-card glass-card-hover p-4 flex flex-col justify-between bg-gradient-to-br ${card.gradient}`}
            style={{ minHeight: 100 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-[var(--ocean-surface)]/60 flex items-center justify-center">
                <card.icon className="w-4.5 h-4.5 text-[var(--cyan-glow)]" />
              </div>
              <span className={`text-xs font-medium flex items-center gap-0.5 ${card.up ? 'text-[var(--sea-green)]' : 'text-[var(--coral-red)]'}`}>
                {card.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {card.trend}
              </span>
            </div>
            <div>
              <div className="text-xl font-bold text-[var(--ocean-blue)] leading-tight">{card.value}</div>
              <div className="text-xs text-[var(--ocean-blue)]/45 mt-0.5">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── AI 智能洞察 + 牧场概览 ── */}
      <div className="grid grid-cols-12 gap-4">

        {/* AI 智能洞察 */}
        <div className="col-span-12 lg:col-span-5 glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0891b2, #3b82f6)' }}>
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--ocean-blue)]">AI 智能洞察</h3>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(8,145,178,0.1)', color: 'var(--cyan-glow)' }}>
              实时分析
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 水质评分 */}
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(8,145,178,0.04)', border: '1px solid rgba(8,145,178,0.1)' }}>
              <div className="text-[10px] text-[var(--ocean-blue)]/50 mb-1">水质综合评分</div>
              <ReactECharts option={aiGaugeOption} style={{ height: 100 }} />
              <div className="text-[10px] text-[var(--sea-green)] font-medium mt-0.5">优良</div>
            </div>

            {/* AI风险评估 */}
            <div className="rounded-xl p-3 flex flex-col items-center justify-center" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)' }}>
              <Shield className="w-5 h-5 text-[var(--sea-green)] mb-2" />
              <div className="text-[10px] text-[var(--ocean-blue)]/50 mb-1">AI 风险评估</div>
              <div className="text-2xl font-bold text-[var(--sea-green)]">96.8<span className="text-xs font-normal">%</span></div>
              <div className="text-[10px] text-[var(--sea-green)]/70 mt-0.5">置信度 · 安全</div>
              <div className="w-full mt-2 h-1.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)' }}>
                <div className="h-full rounded-full" style={{ width: '96.8%', background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
              </div>
            </div>

            {/* 智能推荐 */}
            <div className="col-span-2 rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#3b82f6]" />
                <span className="text-[10px] font-semibold text-[#3b82f6]">智能推荐</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { text: 'D区溶解氧持续偏低，建议立即增氧', level: 'high' },
                  { text: 'C区pH值呈上升趋势，建议持续监测', level: 'medium' },
                  { text: 'A区养殖环境稳定，建议维持当前策略', level: 'low' },
                ].map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-[var(--ocean-blue)]/70">
                    <Zap className="w-3 h-3 mt-0.5 flex-shrink-0"
                      style={{ color: rec.level === 'high' ? 'var(--coral-red)' : rec.level === 'medium' ? 'var(--amber)' : 'var(--sea-green)' }} />
                    <span>{rec.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 牧场概览 */}
        <div className="col-span-12 lg:col-span-7 glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #0891b2)' }}>
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--ocean-blue)]">牧场概览</h3>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--sea-green)' }}>
              4 个区域
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {ZONE_DATA.map((zone) => {
              const cfg = ZONE_STATUS_CONFIG[zone.status];
              return (
                <div key={zone.id} className="rounded-xl p-3.5 relative overflow-hidden"
                  style={{
                    background: cfg.bg,
                    borderLeft: `3px solid ${cfg.borderColor}`,
                    border: `1px solid rgba(0,0,0,0.05)`,
                    borderLeftWidth: 3,
                    borderLeftColor: cfg.borderColor,
                  }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[var(--ocean-blue)]">{zone.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: `color-mix(in srgb, ${cfg.color} 12%, transparent)`, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-[var(--ocean-blue)]/30" />
                      <span className="text-[11px] text-[var(--ocean-blue)]/60">{zone.temp}°C</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FlaskConical className="w-3 h-3 text-[var(--ocean-blue)]/30" />
                      <span className="text-[11px] text-[var(--ocean-blue)]/60">pH {zone.ph}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wind className="w-3 h-3 text-[var(--ocean-blue)]/30" />
                      <span className="text-[11px]" style={{ color: getO2DisplayColor(zone.o2) }}>{zone.o2} mg/L</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[var(--ocean-blue)]/40">
                    <span>{zone.species} · {zone.density}</span>
                    <span>健康 <b className="text-[11px]" style={{ color: zone.health >= 80 ? 'var(--sea-green)' : zone.health >= 60 ? 'var(--amber)' : 'var(--coral-red)' }}>{zone.health}%</b></span>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.05)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${zone.health}%`,
                        background: zone.health >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' : zone.health >= 60 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)',
                      }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 环境指数 ── */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #0891b2)' }}>
            <Eye className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--ocean-blue)]">环境指数</h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {ENV_INDICES.map((idx) => {
            const Icon = idx.icon;
            const pct = Math.round((idx.value / idx.max) * 100);
            const displayColor = idx.invert
              ? (idx.value <= 20 ? 'var(--sea-green)' : idx.value <= 50 ? 'var(--amber)' : 'var(--coral-red)')
              : (idx.value >= 80 ? idx.color : idx.value >= 60 ? 'var(--amber)' : 'var(--coral-red)');
            return (
              <div key={idx.label} className="flex items-center gap-3">
                <GaugeRing value={idx.value} max={idx.max} size={56} strokeWidth={5} color={displayColor as string}>
                  <span className="text-sm font-bold" style={{ color: displayColor }}>{idx.value}</span>
                </GaugeRing>
                <div>
                  <div className="text-xs font-medium text-[var(--ocean-blue)]">{idx.label}</div>
                  <div className="text-[10px] text-[var(--ocean-blue)]/40 mt-0.5">
                    {idx.invert ? '越低越好' : `满分 ${idx.max}`}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Icon className="w-3 h-3" style={{ color: displayColor }} />
                    <span className="text-[10px] font-medium" style={{ color: displayColor }}>
                      {idx.invert ? (idx.value <= 20 ? '低风险' : idx.value <= 50 ? '中等风险' : '高风险') : (idx.value >= 80 ? '优良' : idx.value >= 60 ? '一般' : '较差')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 实时指标 + 视频入口 ── */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-9 grid grid-cols-5 gap-3">
          {METRIC_KEYS.map((key) => {
            const Icon = METRIC_ICONS[key];
            const val = latest[key] as number;
            return (
              <div key={key} className="glass-card glass-card-hover p-4 text-center">
                <Icon className="w-5 h-5 mx-auto mb-2 text-[var(--ocean-blue)]/40" />
                <div className="text-xs text-[var(--ocean-blue)]/40 mb-1">{getMetricLabel(key)}</div>
                <div className="text-xl font-bold" style={{ color: getDisplayColor(key, val) }}>
                  {formatMetric(key, val)}
                  <span className="text-xs ml-1 opacity-60">{getMetricUnit(key)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div
          className="col-span-3 glass-card glass-card-hover p-4 flex flex-col items-center justify-center cursor-pointer group"
          onClick={() => navigate('/video')}
        >
          <Camera className="w-10 h-10 text-[var(--ocean-blue)]/30 mb-2 group-hover:text-[var(--cyan-glow)] transition-colors" />
          <div className="text-sm text-[var(--ocean-blue)]/40">视频监控</div>
          <div className="text-xs text-[var(--ocean-blue)]/25 mt-1">点击查看</div>
        </div>
      </div>

      {/* ── 24小时趋势 ── */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-[var(--cyan-glow)]" />
          <h3 className="text-sm font-semibold text-[var(--ocean-blue)]">24小时趋势</h3>
          <span className="ml-auto text-[10px] text-[var(--ocean-blue)]/30">数据更新于 {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <ReactECharts option={chartOption} style={{ height: 280 }} />
      </div>

      {/* ── 最新预警 ── */}
      <div className="glass-card p-5 cursor-pointer" onClick={() => navigate('/alerts')}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--amber)]" />
            <h3 className="text-sm font-semibold text-[var(--ocean-blue)]">最新预警</h3>
            {activeAlerts > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--coral-red)' }}>
                {activeAlerts} 条活跃
              </span>
            )}
          </div>
          <span className="text-xs text-[var(--cyan-glow)]">查看全部 →</span>
        </div>
        <div className="space-y-2">
          {alertList.slice(0, 5).map((alert) => {
            const cfg = LEVEL_CFG[alert.level] ?? LEVEL_CFG.III;
            return (
              <div key={alert.id} className="flex items-center justify-between py-2.5 px-3.5 rounded-lg bg-[var(--ocean-surface)]/50 hover:bg-[var(--ocean-surface)]/80 transition-colors">
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `color-mix(in srgb, ${cfg.color} 15%, transparent)`, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-sm text-[var(--ocean-blue)]">{getMetricLabel(alert.metric)}</span>
                  <span className="text-sm font-medium" style={{ color: getMetricColor(alert.metric, alert.value) }}>
                    {formatMetric(alert.metric, alert.value)}{getMetricUnit(alert.metric)}
                  </span>
                  <span className="text-xs text-[var(--ocean-blue)]/30">阈值 {alert.threshold}{getMetricUnit(alert.metric)}</span>
                </div>
                <span className="text-xs text-[var(--ocean-blue)]/30">{formatDateTime(alert.created_at)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
