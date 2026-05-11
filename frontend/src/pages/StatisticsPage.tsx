import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { BarChart3, TrendingUp, Activity, Database, Target, PieChart, ScatterChart } from 'lucide-react';
import { formatMetric, getMetricUnit, getMetricLabel, getMetricColor } from '@/utils/format';

type AnalysisType = 'overview' | 'correlation' | 'distribution' | 'comparison';

const DEVICES = [
  { id: 'SENSOR_001', name: '水质浮漂集成传感器', type: 'sensor' },
  { id: 'CTRL_001', name: '水质联动控制箱', type: 'controller' },
];

export default function StatisticsPage() {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('overview');
  const [selectedDevice, setSelectedDevice] = useState(DEVICES[0].id);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const mockData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return {
      dates: Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - i - 1));
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }),
      ph: Array.from({ length: days }, () => +(7 + Math.random() * 1.5).toFixed(2)),
      o2: Array.from({ length: days }, () => +(4 + Math.random() * 4).toFixed(2)),
      salt: Array.from({ length: days }, () => +(24 + Math.random() * 8).toFixed(2)),
      nh3: Array.from({ length: days }, () => +(Math.random() * 2).toFixed(3)),
      health: Array.from({ length: days }, () => +(70 + Math.random() * 28).toFixed(1)),
    };
  }, [timeRange]);

  const stats = useMemo(() => {
    const calcStats = (arr: number[]) => {
      const sum = arr.reduce((a, b) => a + b, 0);
      const avg = sum / arr.length;
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const variance = arr.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / arr.length;
      const stdDev = Math.sqrt(variance);
      return { avg: +avg.toFixed(2), min: +min.toFixed(2), max: +max.toFixed(2), stdDev: +stdDev.toFixed(3) };
    };
    return {
      ph: calcStats(mockData.ph),
      o2: calcStats(mockData.o2),
      salt: calcStats(mockData.salt),
      nh3: calcStats(mockData.nh3),
      health: calcStats(mockData.health),
    };
  }, [mockData]);

  const overviewChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(0,0,0,0.1)',
      textStyle: { color: '#334155' },
    },
    legend: {
      data: ['pH值', '溶解氧', '氨氮', '盐度'],
      textStyle: { color: '#64748b' },
      top: 0,
    },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: mockData.dates,
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } },
      axisLabel: { color: '#64748b', fontSize: 11 },
    },
    yAxis: [
      {
        type: 'value',
        name: 'pH/DO',
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
        axisLabel: { color: '#64748b' },
      },
      {
        type: 'value',
        name: 'NH3/盐度',
        splitLine: { show: false },
        axisLabel: { color: '#64748b' },
      },
    ],
    series: [
      { name: 'pH值', type: 'line', data: mockData.ph, lineStyle: { color: '#0891b2', width: 2 }, itemStyle: { color: '#0891b2' }, smooth: true },
      { name: '溶解氧', type: 'line', yAxisIndex: 0, data: mockData.o2, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, smooth: true },
      { name: '氨氮', type: 'line', yAxisIndex: 1, data: mockData.nh3, lineStyle: { color: '#10b981', width: 2 }, itemStyle: { color: '#10b981' }, smooth: true },
      { name: '盐度', type: 'line', yAxisIndex: 1, data: mockData.salt, lineStyle: { color: '#f59e0b', width: 2 }, itemStyle: { color: '#f59e0b' }, smooth: true },
    ],
  };

  const correlationData = useMemo(() => {
    const points: [number, number][] = [];
    for (let i = 0; i < 100; i++) {
      const ph = 6.5 + Math.random() * 2;
      const o2 = 3 + Math.random() * 6 + (ph - 7.5) * 0.8 + (Math.random() - 0.5) * 1;
      points.push([+ph.toFixed(2), +Math.max(2, o2).toFixed(2)]);
    }
    return points;
  }, []);

  const correlationChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(0,0,0,0.1)',
      textStyle: { color: '#334155' },
      formatter: (params: any) => `pH值: ${params.value[0]}<br/>溶解氧: ${params.value[1]} mg/L`,
    },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'value',
      name: 'pH值',
      nameTextStyle: { color: '#64748b' },
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } },
      axisLabel: { color: '#64748b' },
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
    },
    yAxis: {
      type: 'value',
      name: '溶解氧 (mg/L)',
      nameTextStyle: { color: '#64748b' },
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } },
      axisLabel: { color: '#64748b' },
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
    },
    series: [
      {
        type: 'scatter',
        symbolSize: 10,
        data: correlationData,
        itemStyle: {
          color: '#0891b2',
          opacity: 0.6,
        },
        markLine: {
          silent: true,
          lineStyle: { color: '#ef4444', type: 'dashed', width: 2 },
          data: [
            { yAxis: 4.5, name: '溶解氧下限' },
            { yAxis: 8.0, name: '溶解氧上限' },
          ],
          label: { formatter: '{b}', color: '#64748b' },
        },
      },
    ],
  };

  const distributionChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(0,0,0,0.1)',
      textStyle: { color: '#334155' },
    },
    legend: {
      data: ['pH值分布', '溶解氧分布', '盐度分布'],
      textStyle: { color: '#64748b' },
      top: 0,
    },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: ['<6.5', '6.5-7.0', '7.0-7.5', '7.5-8.0', '8.0-8.5', '>8.5'],
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      { name: 'pH值分布', type: 'bar', data: [12, 28, 45, 38, 22, 8], itemStyle: { color: '#0891b2' }, barWidth: '30%' },
    ],
  };

  const healthDistributionOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(0,0,0,0.1)',
      textStyle: { color: '#334155' },
    },
    legend: {
      data: ['健康度分布'],
      textStyle: { color: '#64748b' },
      bottom: 0,
    },
    series: [
      {
        name: '健康度分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: 'var(--ocean-dark)',
          borderWidth: 2,
        },
        label: {
          show: true,
          color: '#64748b',
          formatter: '{b}: {d}%',
        },
        data: [
          { value: 15, name: '优秀 (>90%)', itemStyle: { color: '#10b981' } },
          { value: 35, name: '良好 (80-90%)', itemStyle: { color: '#3b82f6' } },
          { value: 30, name: '一般 (60-80%)', itemStyle: { color: '#f59e0b' } },
          { value: 20, name: '较差 (<60%)', itemStyle: { color: '#ef4444' } },
        ],
      },
    ],
  };

  const comparisonChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(0,0,0,0.1)',
      textStyle: { color: '#334155' },
    },
    legend: {
      data: ['本周', '上周'],
      textStyle: { color: '#64748b' },
      top: 0,
    },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      {
        name: '本周',
        type: 'bar',
        data: [6.2, 6.5, 6.8, 6.6, 6.9, 7.0, 6.7],
        itemStyle: { color: '#0891b2' },
        barWidth: '35%',
      },
      {
        name: '上周',
        type: 'bar',
        data: [6.0, 6.3, 6.5, 6.4, 6.7, 6.8, 6.5],
        itemStyle: { color: '#64748b' },
        barWidth: '35%',
      },
    ],
  };

  const metricCards = [
    { key: 'ph', label: '水质pH', icon: Activity, stats: stats.ph, color: 'cyan' },
    { key: 'o2', label: '溶解氧', icon: Activity, stats: stats.o2, unit: 'mg/L', color: 'blue' },
    { key: 'salt', label: '盐度', icon: Activity, stats: stats.salt, unit: 'ppt', color: 'teal' },
    { key: 'nh3', label: '氨氮', icon: Activity, stats: stats.nh3, unit: 'mg/L', color: 'green' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-5 h-5 text-[var(--cyan-glow)]" />
        <h1 className="text-xl font-semibold text-[var(--cyan-glow)]">统计分析中心</h1>
      </div>

      <div className="flex gap-3 flex-wrap">
        {([
          { key: 'overview' as AnalysisType, label: '综合概览', icon: BarChart3 },
          { key: 'correlation' as AnalysisType, label: '相关性分析', icon: ScatterChart },
          { key: 'distribution' as AnalysisType, label: '分布分析', icon: PieChart },
          { key: 'comparison' as AnalysisType, label: '对比分析', icon: Target },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setAnalysisType(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              analysisType === key
                ? 'bg-[var(--cyan-glow)] text-white glow-cyan'
                : 'bg-[var(--ocean-surface)] text-[var(--ocean-blue)] hover:bg-[var(--ocean-surface)]/80'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex gap-2">
            {DEVICES.map((dev) => (
              <button
                key={dev.id}
                onClick={() => setSelectedDevice(dev.id)}
                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                  selectedDevice === dev.id
                    ? 'bg-[var(--cyan-glow)] text-white'
                    : 'bg-[var(--ocean-surface)] text-[var(--ocean-blue)]'
                }`}
              >
                {dev.name}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {([
              { key: '7d' as const, label: '7天' },
              { key: '30d' as const, label: '30天' },
              { key: '90d' as const, label: '90天' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimeRange(key)}
                className={`px-3 py-1 rounded text-sm transition-all ${
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

        {analysisType === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {metricCards.map((card) => (
                <div key={card.key} className="bg-[var(--ocean-deep)] rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <card.icon className={`w-4 h-4 text-${card.color}-500`} />
                    <span className="text-sm font-semibold text-[var(--ocean-blue)]">{card.label}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--ocean-blue)]/50">平均值:</span>
                      <span className="text-[var(--ocean-blue)] font-mono">{card.stats.avg}{card.unit || ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--ocean-blue)]/50">最大值:</span>
                      <span className="text-[var(--ocean-blue)] font-mono">{card.stats.max}{card.unit || ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--ocean-blue)]/50">最小值:</span>
                      <span className="text-[var(--ocean-blue)] font-mono">{card.stats.min}{card.unit || ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--ocean-blue)]/50">标准差:</span>
                      <span className="text-[var(--ocean-blue)] font-mono">{card.stats.stdDev}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <ReactECharts option={overviewChartOption} style={{ height: 350 }} />
          </>
        )}

        {analysisType === 'correlation' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-[var(--ocean-deep)] rounded-lg p-4">
                <div className="text-sm font-semibold text-[var(--ocean-blue)] mb-2">pH值 vs 溶解氧</div>
                <div className="text-xs text-[var(--ocean-blue)]/60 space-y-1">
                  <div className="flex justify-between"><span>相关系数:</span><span className="font-mono text-[var(--cyan-glow)]">r = 0.78</span></div>
                  <div className="flex justify-between"><span>关系强度:</span><span className="text-green-500">强正相关</span></div>
                  <div className="flex justify-between"><span>显著性:</span><span className="text-[var(--ocean-blue)]">p &lt; 0.01</span></div>
                </div>
              </div>
              <div className="bg-[var(--ocean-deep)] rounded-lg p-4">
                <div className="text-sm font-semibold text-[var(--ocean-blue)] mb-2">pH值 vs 氨氮</div>
                <div className="text-xs text-[var(--ocean-blue)]/60 space-y-1">
                  <div className="flex justify-between"><span>相关系数:</span><span className="font-mono text-[var(--cyan-glow)]">r = -0.45</span></div>
                  <div className="flex justify-between"><span>关系强度:</span><span className="text-orange-500">中等负相关</span></div>
                  <div className="flex justify-between"><span>显著性:</span><span className="text-[var(--ocean-blue)]">p &lt; 0.05</span></div>
                </div>
              </div>
              <div className="bg-[var(--ocean-deep)] rounded-lg p-4">
                <div className="text-sm font-semibold text-[var(--ocean-blue)] mb-2">盐度 vs 溶解氧</div>
                <div className="text-xs text-[var(--ocean-blue)]/60 space-y-1">
                  <div className="flex justify-between"><span>相关系数:</span><span className="font-mono text-[var(--cyan-glow)]">r = 0.62</span></div>
                  <div className="flex justify-between"><span>关系强度:</span><span className="text-blue-500">中等正相关</span></div>
                  <div className="flex justify-between"><span>显著性:</span><span className="text-[var(--ocean-blue)]">p &lt; 0.01</span></div>
                </div>
              </div>
            </div>
            <ReactECharts option={correlationChartOption} style={{ height: 350 }} />
          </div>
        )}

        {analysisType === 'distribution' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="bg-[var(--ocean-deep)] rounded-lg p-4">
                <div className="text-sm font-semibold text-[var(--ocean-blue)] mb-3">指标正常范围</div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-[var(--ocean-surface)]/30 rounded p-2">
                    <span className="text-[var(--ocean-blue)]">pH值</span>
                    <span className="text-[var(--ocean-blue)] font-mono">6.5 - 8.5</span>
                    <span className="text-green-500">✓ 正常</span>
                  </div>
                  <div className="flex items-center justify-between bg-[var(--ocean-surface)]/30 rounded p-2">
                    <span className="text-[var(--ocean-blue)]">溶解氧</span>
                    <span className="text-[var(--ocean-blue)] font-mono">4.0 - 8.0 mg/L</span>
                    <span className="text-green-500">✓ 正常</span>
                  </div>
                  <div className="flex items-center justify-between bg-[var(--ocean-surface)]/30 rounded p-2">
                    <span className="text-[var(--ocean-blue)]">氨氮</span>
                    <span className="text-[var(--ocean-blue)] font-mono">&lt; 2.0 mg/L</span>
                    <span className="text-green-500">✓ 正常</span>
                  </div>
                  <div className="flex items-center justify-between bg-[var(--ocean-surface)]/30 rounded p-2">
                    <span className="text-[var(--ocean-blue)]">盐度</span>
                    <span className="text-[var(--ocean-blue)] font-mono">20 - 35 ppt</span>
                    <span className="text-green-500">✓ 正常</span>
                  </div>
                </div>
              </div>
              <ReactECharts option={distributionChartOption} style={{ height: 300 }} />
            </div>
            <div className="space-y-4">
              <div className="bg-[var(--ocean-deep)] rounded-lg p-4">
                <div className="text-sm font-semibold text-[var(--ocean-blue)] mb-3">统计洞察</div>
                <div className="space-y-2 text-xs text-[var(--ocean-blue)]/80">
                  <div className="flex items-start gap-2">
                    <span className="text-[var(--cyan-glow)]">•</span>
                    <span>pH值呈现明显日波动，午后略有上升趋势</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[var(--cyan-glow)]">•</span>
                    <span>溶解氧与水温呈负相关，高温时段需特别注意</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[var(--cyan-glow)]">•</span>
                    <span>氨氮水平整体稳定，偶发峰值与投喂相关</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[var(--cyan-glow)]">•</span>
                    <span>设备健康度与使用时长呈轻度负相关</span>
                  </div>
                </div>
              </div>
              <ReactECharts option={healthDistributionOption} style={{ height: 300 }} />
            </div>
          </div>
        )}

        {analysisType === 'comparison' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '本周平均pH', thisWeek: 6.7, lastWeek: 6.5, unit: '' },
                { label: '本周平均溶解氧', thisWeek: 6.2, lastWeek: 5.8, unit: 'mg/L' },
                { label: '本周预警次数', thisWeek: 12, lastWeek: 18, unit: '次', inverse: true },
                { label: '设备健康度变化', thisWeek: 85.2, lastWeek: 83.5, unit: '%' },
              ].map((item) => (
                <div key={item.label} className="bg-[var(--ocean-deep)] rounded-lg p-3 text-center">
                  <div className="text-xs text-[var(--ocean-blue)]/50 mb-1">{item.label}</div>
                  <div className="text-lg font-bold text-[var(--ocean-blue)]">{item.thisWeek}{item.unit}</div>
                  <div className={`text-xs ${item.thisWeek > item.lastWeek ? (item.inverse ? 'text-red-500' : 'text-green-500') : (item.inverse ? 'text-green-500' : 'text-red-500')}`}>
                    {item.thisWeek > item.lastWeek ? '↑' : '↓'} {Math.abs(item.thisWeek - item.lastWeek).toFixed(1)}{item.unit}
                  </div>
                </div>
              ))}
            </div>
            <ReactECharts option={comparisonChartOption} style={{ height: 300 }} />
          </div>
        )}
      </div>
    </div>
  );
}
