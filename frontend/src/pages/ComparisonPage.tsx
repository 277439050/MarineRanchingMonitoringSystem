import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { GitCompare, TrendingUp, Calendar, ArrowRight, Activity, BarChart3 } from 'lucide-react';
import { formatDate, getMetricUnit, getMetricLabel } from '@/utils/format';

type ComparisonMode = 'time' | 'device';
type Metric = 'ph' | 'o2' | 'salt' | 'nh3' | 'health';

const DEVICES = [
  { id: 'SENSOR_001', name: '水质浮漂传感器A', location: '养殖区1号' },
  { id: 'SENSOR_002', name: '水质浮漂传感器B', location: '养殖区2号' },
  { id: 'SENSOR_003', name: '水质浮漂传感器C', location: '养殖区3号' },
];

const generateMockData = (startDate: string, days: number) => {
  const data = [];
  const base = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const date = new Date(base.getTime() + i * 86400000);
    data.push({
      date: date.toISOString().split('T')[0],
      ph: +(7 + Math.random() * 1.5).toFixed(2),
      o2: +(4 + Math.random() * 4).toFixed(2),
      salt: +(24 + Math.random() * 8).toFixed(2),
      nh3: +(Math.random() * 2).toFixed(3),
      health: +(70 + Math.random() * 28).toFixed(1),
    });
  }
  return data;
};

export default function ComparisonPage() {
  const [mode, setMode] = useState<ComparisonMode>('time');
  const [selectedMetric, setSelectedMetric] = useState<Metric>('o2');
  const [timeRange1, setTimeRange1] = useState({
    start: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    end: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
  });
  const [timeRange2, setTimeRange2] = useState({
    start: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    end: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
  });
  const [selectedDevice1, setSelectedDevice1] = useState(DEVICES[0]);
  const [selectedDevice2, setSelectedDevice2] = useState(DEVICES[1]);

  const data1 = useMemo(() => generateMockData(timeRange1.start, 7), [timeRange1]);
  const data2 = useMemo(() => generateMockData(timeRange2.start, 7), [timeRange2]);

  const calculateStats = (data: any[], metric: Metric) => {
    const values = data.map((d) => d[metric]);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const stdDev = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length);
    return { avg: +avg.toFixed(2), max: +max.toFixed(2), min: +min.toFixed(2), stdDev: +stdDev.toFixed(3) };
  };

  const stats1 = calculateStats(data1, selectedMetric);
  const stats2 = calculateStats(data2, selectedMetric);
  const diff = {
    avg: stats1.avg - stats2.avg,
    max: stats1.max - stats2.max,
    min: stats1.min - stats2.min,
  };

  const comparisonChartOption = useMemo(() => {
    if (mode === 'time') {
      return {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: 'rgba(0,0,0,0.1)',
          textStyle: { color: '#334155' },
        },
        legend: {
          data: [`时段1 (${timeRange1.start} ~ ${timeRange1.end})`, `时段2 (${timeRange2.start} ~ ${timeRange2.end})`],
          textStyle: { color: '#64748b' },
          top: 0,
        },
        grid: { left: 50, right: 20, top: 50, bottom: 30 },
        xAxis: {
          type: 'category',
          data: data1.map((d) => formatDate(d.date)),
          axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } },
          axisLabel: { color: '#64748b', fontSize: 11 },
        },
        yAxis: {
          type: 'value',
          name: getMetricUnit(selectedMetric),
          nameTextStyle: { color: '#64748b' },
          splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
          axisLabel: { color: '#64748b' },
        },
        series: [
          {
            name: `时段1 (${timeRange1.start} ~ ${timeRange1.end})`,
            type: 'line',
            data: data1.map((d) => d[selectedMetric]),
            lineStyle: { color: '#0891b2', width: 2 },
            itemStyle: { color: '#0891b2' },
            smooth: true,
          },
          {
            name: `时段2 (${timeRange2.start} ~ ${timeRange2.end})`,
            type: 'line',
            data: data2.map((d) => d[selectedMetric]),
            lineStyle: { color: '#64748b', width: 2, type: 'dashed' },
            itemStyle: { color: '#64748b' },
            smooth: true,
          },
        ],
      };
    } else {
      const metricLabels = ['ph', 'o2', 'salt', 'nh3', 'health'] as Metric[];
      return {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: 'rgba(0,0,0,0.1)',
          textStyle: { color: '#334155' },
        },
        legend: {
          data: [selectedDevice1.name, selectedDevice2.name],
          textStyle: { color: '#64748b' },
          top: 0,
        },
        grid: { left: 50, right: 20, top: 50, bottom: 30 },
        xAxis: {
          type: 'category',
          data: metricLabels.map((m) => getMetricLabel(m)),
          axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } },
          axisLabel: { color: '#64748b', fontSize: 11 },
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
          axisLabel: { color: '#64748b' },
        },
        series: [
          {
            name: selectedDevice1.name,
            type: 'bar',
            data: metricLabels.map((m) => {
              const stats = calculateStats(data1, m);
              return m === 'health' ? stats.avg : stats.avg;
            }),
            itemStyle: { color: '#0891b2' },
            barWidth: '35%',
          },
          {
            name: selectedDevice2.name,
            type: 'bar',
            data: metricLabels.map((m) => {
              const stats = calculateStats(data2, m);
              return m === 'health' ? stats.avg : stats.avg;
            }),
            itemStyle: { color: '#64748b' },
            barWidth: '35%',
          },
        ],
      };
    }
  }, [mode, selectedMetric, data1, data2, timeRange1, timeRange2, selectedDevice1, selectedDevice2]);

  const radarChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(0,0,0,0.1)',
      textStyle: { color: '#334155' },
    },
    legend: {
      data: [mode === 'time' ? '时段1' : selectedDevice1.name, mode === 'time' ? '时段2' : selectedDevice2.name],
      textStyle: { color: '#64748b' },
      bottom: 0,
    },
    radar: {
      indicator: [
        { name: 'pH值', max: 10 },
        { name: '溶解氧', max: 10 },
        { name: '盐度', max: 35 },
        { name: '氨氮', max: 3 },
        { name: '健康度', max: 100 },
      ],
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.1)' } },
      splitArea: { areaStyle: { color: ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.05)'] } },
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [stats1.avg, stats1.avg * 1.2, 26, stats1.avg * 0.3, 85],
            name: mode === 'time' ? '时段1' : selectedDevice1.name,
            lineStyle: { color: '#0891b2' },
            areaStyle: { color: 'rgba(8,145,178,0.2)' },
          },
          {
            value: [stats2.avg, stats2.avg * 1.2, 26, stats2.avg * 0.3, 85],
            name: mode === 'time' ? '时段2' : selectedDevice2.name,
            lineStyle: { color: '#64748b' },
            areaStyle: { color: 'rgba(100,116,139,0.2)' },
          },
        ],
      },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <GitCompare className="w-5 h-5 text-[var(--cyan-glow)]" />
        <h1 className="text-xl font-semibold text-[var(--cyan-glow)]">数据对比分析</h1>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex gap-2">
          {([
            { key: 'time' as ComparisonMode, label: '时间段对比', icon: Calendar },
            { key: 'device' as ComparisonMode, label: '设备对比', icon: BarChart3 },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                mode === key
                  ? 'bg-[var(--cyan-glow)] text-white glow-cyan'
                  : 'bg-[var(--ocean-surface)] text-[var(--ocean-blue)] hover:bg-[var(--ocean-surface)]/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {mode === 'time' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ocean-blue)]">
                <Activity className="w-4 h-4" />
                时段1
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-[var(--ocean-blue)]/50">开始日期</label>
                  <input
                    type="date"
                    value={timeRange1.start}
                    onChange={(e) => setTimeRange1({ ...timeRange1, start: e.target.value })}
                    className="w-full bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[var(--ocean-blue)]/50">结束日期</label>
                  <input
                    type="date"
                    value={timeRange1.end}
                    onChange={(e) => setTimeRange1({ ...timeRange1, end: e.target.value })}
                    className="w-full bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ocean-blue)]">
                <Activity className="w-4 h-4" />
                时段2
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-[var(--ocean-blue)]/50">开始日期</label>
                  <input
                    type="date"
                    value={timeRange2.start}
                    onChange={(e) => setTimeRange2({ ...timeRange2, start: e.target.value })}
                    className="w-full bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[var(--ocean-blue)]/50">结束日期</label>
                  <input
                    type="date"
                    value={timeRange2.end}
                    onChange={(e) => setTimeRange2({ ...timeRange2, end: e.target.value })}
                    className="w-full bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-[var(--ocean-blue)]/50">设备1</label>
              <select
                value={selectedDevice1.id}
                onChange={(e) => setSelectedDevice1(DEVICES.find((d) => d.id === e.target.value) || DEVICES[0])}
                className="w-full bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
              >
                {DEVICES.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name} - {dev.location}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[var(--ocean-blue)]/50">设备2</label>
              <select
                value={selectedDevice2.id}
                onChange={(e) => setSelectedDevice2(DEVICES.find((d) => d.id === e.target.value) || DEVICES[1])}
                className="w-full bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
              >
                {DEVICES.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name} - {dev.location}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {([
            { key: 'ph' as Metric, label: '水质pH' },
            { key: 'o2' as Metric, label: '溶解氧' },
            { key: 'salt' as Metric, label: '盐度' },
            { key: 'nh3' as Metric, label: '氨氮' },
            { key: 'health' as Metric, label: '健康度' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedMetric(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedMetric === key
                  ? 'bg-[var(--cyan-glow)] text-white glow-cyan'
                  : 'bg-[var(--ocean-surface)] text-[var(--ocean-blue)] hover:bg-[var(--ocean-surface)]/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--ocean-blue)] flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          统计对比
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="bg-[var(--ocean-deep)] rounded-lg p-3 text-center">
            <div className="text-xs text-[var(--ocean-blue)]/50 mb-1">指标</div>
            <div className="text-sm font-semibold text-[var(--ocean-blue)]">{getMetricLabel(selectedMetric)}</div>
          </div>
          {[
            { label: '时段1/设备1平均值', value: stats1.avg, unit: getMetricUnit(selectedMetric) },
            { label: '时段2/设备2平均值', value: stats2.avg, unit: getMetricUnit(selectedMetric) },
            { label: '变化值', value: diff.avg, unit: getMetricUnit(selectedMetric), showArrow: true },
            { label: '时段1/设备1最大值', value: stats1.max, unit: getMetricUnit(selectedMetric) },
            { label: '时段1/设备1最小值', value: stats1.min, unit: getMetricUnit(selectedMetric) },
          ].map((item) => (
            <div key={item.label} className="bg-[var(--ocean-deep)] rounded-lg p-3 text-center">
              <div className="text-xs text-[var(--ocean-blue)]/50 mb-1">{item.label}</div>
              <div className={`text-sm font-semibold ${item.showArrow ? (item.value >= 0 ? 'text-green-500' : 'text-red-500') : 'text-[var(--ocean-blue)]'}`}>
                {item.showArrow && (item.value >= 0 ? '↑' : '↓')} {Math.abs(item.value as number).toFixed(2)}{item.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">
            {mode === 'time' ? '时间段对比趋势' : '多指标对比'}
          </h2>
          <ReactECharts option={comparisonChartOption} style={{ height: 350 }} />
        </div>

        <div className="glass-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">综合指标雷达图</h2>
          <ReactECharts option={radarChartOption} style={{ height: 350 }} />
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">对比分析报告</h2>
        <div className="space-y-3">
          <div className="bg-[var(--ocean-deep)] rounded-lg p-4 space-y-2">
            <div className="text-sm font-semibold text-[var(--ocean-blue)] flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-[var(--cyan-glow)]" />
              主要发现
            </div>
            <div className="text-sm text-[var(--ocean-blue)]/80 space-y-1">
              <p>1. {getMetricLabel(selectedMetric)} {diff.avg >= 0 ? '呈上升趋势' : '呈下降趋势'}，变化幅度为 {Math.abs(diff.avg).toFixed(2)}{getMetricUnit(selectedMetric)}</p>
              <p>2. 时段1/设备1的平均值为 {stats1.avg}{getMetricUnit(selectedMetric)}，较时段2/设备2 {diff.avg >= 0 ? '高' : '低'} {Math.abs(diff.avg).toFixed(2)}{getMetricUnit(selectedMetric)}</p>
              <p>3. 数据显示整体水质状况 {diff.avg >= 0 ? '有所改善' : '需要关注'}</p>
            </div>
          </div>
          <div className="bg-[var(--ocean-deep)] rounded-lg p-4 space-y-2">
            <div className="text-sm font-semibold text-[var(--ocean-blue)] flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-[var(--cyan-glow)]" />
              建议措施
            </div>
            <div className="text-sm text-[var(--ocean-blue)]/80 space-y-1">
              <p>1. {diff.avg >= 0 ? '继续保持当前的水质管理措施' : '建议加强水质调控'}</p>
              <p>2. 注意监测{getMetricLabel(selectedMetric)}的波动范围，避免异常波动</p>
              <p>3. 建议定期进行设备校准和数据对比分析</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
