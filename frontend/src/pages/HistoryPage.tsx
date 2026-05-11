import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Download, Search } from 'lucide-react';
import type { SensorData } from '@/types';
import { formatDate, formatMetric, getMetricColor, getMetricUnit } from '@/utils/format';

const MODULE_TABS = ['全部', '气象站', '土壤墒情', '水质监测', '配电柜', '虫情监测'];

const DEVICES = [
  { id: 'sensor-01', name: '水质浮漂集成传感器', type: 'sensor' as const },
  { id: 'ctrl-01', name: '水质联动控制箱', type: 'controller' as const },
];

const METRIC_TABS = [
  { key: 'ph', label: '水质PH' },
  { key: 'salt', label: '盐度' },
  { key: 'o2', label: '水质溶解氧' },
  { key: 'nh3', label: '水质氨氮' },
  { key: 'health', label: '设备健康度' },
];

function generateMockData(): SensorData[] {
  const rows: SensorData[] = [];
  const base = new Date('2025-04-20T08:00:00');
  for (let i = 0; i < 15; i++) {
    const t = new Date(base.getTime() + i * 3600_000);
    rows.push({
      did: 'sensor-01',
      ph: +(7.2 + Math.random() * 1.2).toFixed(2),
      salt: +(25 + Math.random() * 5).toFixed(2),
      o2: +(5 + Math.random() * 3).toFixed(2),
      nh3: +(Math.random() * 1.5).toFixed(3),
      health: +(70 + Math.random() * 28).toFixed(1),
      timestamp: t.toISOString(),
    });
  }
  return rows;
}

const MOCK_DATA = generateMockData();

const PAGE_SIZE = 5;

export default function HistoryPage() {
  const [moduleTab, setModuleTab] = useState('水质监测');
  const [selectedDevice, setSelectedDevice] = useState(DEVICES[0]);
  const [startDate, setStartDate] = useState('2025-04-20');
  const [endDate, setEndDate] = useState('2025-04-21');
  const [metricKey, setMetricKey] = useState('ph');
  const [page, setPage] = useState(1);

  const isSensor = selectedDevice.type === 'sensor';

  const chartOption = useMemo(() => {
    const times = MOCK_DATA.map((d) => {
      const dt = new Date(d.timestamp);
      return `${dt.getMonth() + 1}/${dt.getDate()} ${dt.getHours()}:00`;
    });
    const values = MOCK_DATA.map((d) => d[metricKey as keyof SensorData] as number);
    const unit = getMetricUnit(metricKey);
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: 'rgba(0,0,0,0.1)',
        textStyle: { color: '#334155' },
      },
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: unit,
        nameTextStyle: { color: '#64748b' },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
        axisLabel: { color: '#64748b' },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#0891b2', width: 2 },
          itemStyle: { color: '#0891b2' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(8,145,178,0.3)' },
                { offset: 1, color: 'rgba(8,145,178,0.02)' },
              ],
            },
          },
          data: values,
        },
      ],
    };
  }, [metricKey]);

  const healthChartOption = useMemo(() => {
    const times = MOCK_DATA.map((d) => {
      const dt = new Date(d.timestamp);
      return `${dt.getMonth() + 1}/${dt.getDate()} ${dt.getHours()}:00`;
    });
    const values = MOCK_DATA.map((d) => d.health);
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: 'rgba(0,0,0,0.1)',
        textStyle: { color: '#334155' },
      },
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        max: 100,
        name: '%',
        nameTextStyle: { color: '#64748b' },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
        axisLabel: { color: '#64748b' },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#10b981', width: 2 },
          itemStyle: { color: '#10b981' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16,185,129,0.3)' },
                { offset: 1, color: 'rgba(16,185,129,0.02)' },
              ],
            },
          },
          data: values,
        },
      ],
    };
  }, []);

  const totalPages = Math.ceil(MOCK_DATA.length / PAGE_SIZE);
  const pagedData = MOCK_DATA.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const avgHealth = (MOCK_DATA.reduce((s, d) => s + d.health, 0) / MOCK_DATA.length).toFixed(1);

  const handleExport = () => {
    const header = '序号,水质PH,盐度,溶解氧,氨氮,健康度,记录时间';
    const rows = MOCK_DATA.map((d, i) =>
      `${i + 1},${d.ph},${d.salt},${d.o2},${d.nh3},${d.health},${formatDate(d.timestamp)}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '历史数据.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MODULE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setModuleTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              moduleTab === tab
                ? 'bg-[var(--cyan-glow)] text-white glow-cyan'
                : 'bg-[var(--ocean-dark)] text-[var(--ocean-blue)]/70 hover:bg-[var(--ocean-surface)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="w-52 glass-card p-4 flex flex-col">
          <h3 className="text-sm font-semibold text-[var(--ocean-blue)] mb-3">设备列表</h3>
          <div className="flex flex-col gap-2">
            {DEVICES.map((dev) => (
              <div
                key={dev.id}
                onClick={() => { setSelectedDevice(dev); setPage(1); }}
                className={`p-3 rounded-lg cursor-pointer transition-all text-sm ${
                  selectedDevice.id === dev.id
                    ? 'border-l-2 border-l-[var(--cyan-glow)] bg-[var(--ocean-surface)]/50 text-[var(--cyan-glow)]'
                    : 'border-l-2 border-l-transparent hover:bg-[var(--ocean-deep)]/60 text-[var(--ocean-blue)]/80'
                }`}
              >
                {dev.name}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto">
          {isSensor ? (
            <>
              <div className="glass-card p-4 flex items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[var(--ocean-blue)]/60">开始日期</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded-lg px-3 py-1.5 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[var(--ocean-blue)]/60">结束日期</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded-lg px-3 py-1.5 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
                  />
                </div>
                <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--cyan-glow)] text-white text-sm font-medium hover:opacity-90 transition-opacity">
                  <Search className="w-4 h-4" />
                  查询
                </button>
              </div>

              <div className="flex gap-2">
                {METRIC_TABS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMetricKey(m.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      metricKey === m.key
                        ? 'bg-[var(--cyan-glow)] text-white glow-cyan'
                        : 'bg-[var(--ocean-dark)] text-[var(--ocean-blue)]/70 hover:bg-[var(--ocean-surface)]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="glass-card p-4" style={{ minHeight: 300 }}>
                <ReactECharts option={chartOption} style={{ height: 280 }} />
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--ocean-blue)]">数据记录</h3>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--ocean-surface)] text-[var(--ocean-blue)]/80 text-sm hover:bg-[var(--cyan-glow)]/20 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    导出CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--ocean-surface)]">
                        <th className="py-2 px-3 text-left text-[var(--ocean-blue)]/60 font-medium">序号</th>
                        <th className="py-2 px-3 text-left text-[var(--ocean-blue)]/60 font-medium">水质PH</th>
                        <th className="py-2 px-3 text-left text-[var(--ocean-blue)]/60 font-medium">盐度</th>
                        <th className="py-2 px-3 text-left text-[var(--ocean-blue)]/60 font-medium">溶解氧</th>
                        <th className="py-2 px-3 text-left text-[var(--ocean-blue)]/60 font-medium">氨氮</th>
                        <th className="py-2 px-3 text-left text-[var(--ocean-blue)]/60 font-medium">健康度</th>
                        <th className="py-2 px-3 text-left text-[var(--ocean-blue)]/60 font-medium">记录时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedData.map((d, i) => (
                        <tr key={i} className="border-b border-[var(--ocean-surface)]/50 hover:bg-[var(--ocean-deep)]/60">
                          <td className="py-2 px-3 text-[var(--ocean-blue)]/60">{(page - 1) * PAGE_SIZE + i + 1}</td>
                          <td className="py-2 px-3" style={{ color: getMetricColor('ph', d.ph) }}>{formatMetric('ph', d.ph)}</td>
                          <td className="py-2 px-3" style={{ color: getMetricColor('salt', d.salt) }}>{formatMetric('salt', d.salt)}</td>
                          <td className="py-2 px-3" style={{ color: getMetricColor('o2', d.o2) }}>{formatMetric('o2', d.o2)}</td>
                          <td className="py-2 px-3" style={{ color: getMetricColor('nh3', d.nh3) }}>{formatMetric('nh3', d.nh3)}</td>
                          <td className="py-2 px-3" style={{ color: getMetricColor('health', d.health) }}>{formatMetric('health', d.health)}</td>
                          <td className="py-2 px-3 text-[var(--ocean-blue)]/60">{formatDate(d.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-[var(--ocean-blue)]/50">
                    共 {MOCK_DATA.length} 条，第 {page}/{totalPages} 页
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="px-3 py-1 rounded text-xs bg-[var(--ocean-dark)] text-[var(--ocean-blue)]/70 disabled:opacity-30 hover:bg-[var(--ocean-surface)]"
                    >
                      上一页
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                      className="px-3 py-1 rounded text-xs bg-[var(--ocean-dark)] text-[var(--ocean-blue)]/70 disabled:opacity-30 hover:bg-[var(--ocean-surface)]"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="glass-card p-6 flex items-center gap-6">
                <div className="w-28 h-28 rounded-full border-4 border-[var(--sea-green)] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--sea-green)]">{avgHealth}</div>
                    <div className="text-xs text-[var(--ocean-blue)]/60">健康度%</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ocean-blue)]">{selectedDevice.name}</h3>
                  <p className="text-sm text-[var(--ocean-blue)]/60 mt-1">设备运行状态正常，各项指标均在安全范围内</p>
                </div>
              </div>
              <div className="glass-card p-4" style={{ minHeight: 300 }}>
                <h3 className="text-sm font-semibold text-[var(--ocean-blue)] mb-2">健康趋势</h3>
                <ReactECharts option={healthChartOption} style={{ height: 280 }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
