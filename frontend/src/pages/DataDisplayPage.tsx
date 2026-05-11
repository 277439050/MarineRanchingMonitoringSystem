import { useEffect } from 'react';
import type { SensorData } from '@/types';
import { useSensorStore } from '@/stores/sensorStore';
import { formatMetric, getMetricColor, getMetricUnit, getMetricLabel } from '@/utils/format';
import { Activity } from 'lucide-react';

interface MetricItem {
  key: string;
  value: number | null;
}

interface DeviceCard {
  name: string;
  did: string;
  metrics: MetricItem[];
}

const devices: DeviceCard[] = [
  {
    name: '水质浮漂集成传感器',
    did: 'SENSOR_001',
    metrics: [
      { key: 'ph', value: 7.91 },
      { key: 'salt', value: 18330.50 },
      { key: 'o2', value: 7.7 },
      { key: 'nh3', value: 1.859 },
      { key: 'health', value: null },
    ],
  },
  {
    name: '水质联动控制柜',
    did: 'CTRL_001',
    metrics: [
      { key: 'health', value: 100.0 },
    ],
  },
];

function getDisplayValue(key: string, value: number | null): string {
  if (value === null) return '--%';
  return `${formatMetric(key, value)}${getMetricUnit(key)}`;
}

function getValueColor(key: string, value: number | null): string {
  if (value === null) return 'var(--ocean-blue)';
  return getMetricColor(key, value);
}

export default function DataDisplayPage() {
  const { realtimeData, fetchRealtime } = useSensorStore();

  useEffect(() => {
    fetchRealtime();
  }, [fetchRealtime]);

  const mergedDevices = devices.map((d) => {
    const live = realtimeData.find((r) => r.did === d.did);
    if (!live) return d;
    return {
      ...d,
      metrics: d.metrics.map((m) => ({
        ...m,
        value: m.value !== null ? m.value : (live[m.key as keyof SensorData] as number ?? m.value),
      })),
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="w-5 h-5 text-[var(--cyan-glow)]" />
        <h1 className="text-xl font-semibold text-[var(--cyan-glow)]">数据展示</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mergedDevices.map((device) => (
          <div key={device.did} className="glass-card overflow-hidden">
            <div className="bg-[var(--cyan-glow)] px-4 py-2.5 flex items-center justify-between">
              <span className="text-white font-semibold text-sm">{device.name}</span>
              <span className="text-white/70 text-xs">{device.metrics.length} 项指标</span>
            </div>
            <div className="p-4 space-y-3">
              {device.metrics.map((m) => (
                <div key={m.key} className="flex items-center justify-between py-1.5 border-b border-[var(--ocean-surface)]/40 last:border-0">
                  <span className="text-sm text-[var(--ocean-blue)]/70">{getMetricLabel(m.key)}</span>
                  <span
                    className="text-sm font-mono font-semibold"
                    style={{ color: getValueColor(m.key, m.value) }}
                  >
                    {getDisplayValue(m.key, m.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
