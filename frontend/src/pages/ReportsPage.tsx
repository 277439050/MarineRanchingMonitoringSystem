import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { FileText, Calendar, Download, TrendingUp, AlertCircle, CheckCircle, Activity, Droplets, Thermometer, Wind } from 'lucide-react';
import { formatDate, formatMetric, getMetricColor, getMetricUnit, getMetricLabel } from '@/utils/format';

interface ReportConfig {
  type: 'daily' | 'weekly' | 'monthly';
  dateRange: { start: string; end: string };
  includeSections: {
    overview: boolean;
    alerts: boolean;
    recommendations: boolean;
    trends: boolean;
  };
}

const generateMockStats = (type: string) => {
  const days = type === 'daily' ? 1 : type === 'weekly' ? 7 : 30;
  return {
    avgPh: +(7.2 + Math.random() * 1.2).toFixed(2),
    avgSalt: +(25 + Math.random() * 5).toFixed(2),
    avgO2: +(5 + Math.random() * 3).toFixed(2),
    avgNh3: +(Math.random() * 1.5).toFixed(3),
    avgHealth: +(70 + Math.random() * 28).toFixed(1),
    alertCount: Math.floor(Math.random() * 15),
    criticalAlerts: Math.floor(Math.random() * 5),
    normalDays: days - Math.floor(Math.random() * 3),
    equipmentUptime: +(95 + Math.random() * 5).toFixed(1),
    dataCompleteness: +(97 + Math.random() * 3).toFixed(1),
  };
};

const generateAlertDetails = () => [
  { metric: '溶解氧', count: Math.floor(Math.random() * 5), severity: 'medium' },
  { metric: '氨氮', count: Math.floor(Math.random() * 3), severity: 'low' },
  { metric: 'pH值', count: Math.floor(Math.random() * 2), severity: 'low' },
  { metric: '设备健康', count: Math.floor(Math.random() * 2), severity: 'high' },
];

const recommendations = [
  '继续保持当前的水质监测频率，建议每日至少2次全面检测',
  '溶解氧水平整体稳定，但在午后可能出现短暂下降，建议增设增氧设备',
  '氨氮含量保持在安全范围内，但需要注意投喂量的控制，避免过量',
  '建议对使用超过6个月的水质传感器进行校准，以确保数据准确性',
  '近期天气多变，建议加强雨季防洪准备，检查排水系统',
];

export default function ReportsPage() {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'daily',
    dateRange: {
      start: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    includeSections: {
      overview: true,
      alerts: true,
      recommendations: true,
      trends: true,
    },
  });

  const [generating, setGenerating] = useState(false);
  const stats = generateMockStats(reportConfig.type);
  const alertDetails = generateAlertDetails();

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1500);
  };

  const handleExport = () => {
    const content = `海洋牧场环境监测报告\n${'='.repeat(50)}\n报告类型: ${reportConfig.type === 'daily' ? '日报' : reportConfig.type === 'weekly' ? '周报' : '月报'}\n生成时间: ${new Date().toLocaleString('zh-CN')}\n时间范围: ${reportConfig.dateRange.start} 至 ${reportConfig.dateRange.end}\n\n一、监测概况\n${'─'.repeat(30)}\n水质pH值: ${stats.avgPh} ${getMetricUnit('ph')}\n盐度: ${stats.avgSalt} ${getMetricUnit('salt')}\n溶解氧: ${stats.avgO2} ${getMetricUnit('o2')}\n氨氮: ${stats.avgNh3} ${getMetricUnit('nh3')}\n设备健康度: ${stats.avgHealth}%\n\n二、预警统计\n${'─'.repeat(30)}\n预警总数: ${stats.alertCount}次\n严重预警: ${stats.criticalAlerts}次\n正常运行天数: ${stats.normalDays}天\n设备可用率: ${stats.equipmentUptime}%\n数据完整率: ${stats.dataCompleteness}%\n\n三、建议措施\n${'─'.repeat(30)}\n${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `海洋牧场${reportConfig.type === 'daily' ? '日报' : reportConfig.type === 'weekly' ? '周报' : '月报'}_${reportConfig.dateRange.start}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const trendChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(0,0,0,0.1)',
      textStyle: { color: '#334155' },
    },
    legend: {
      data: ['溶解氧', 'pH值', '氨氮'],
      textStyle: { color: '#64748b' },
      top: 0,
    },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: reportConfig.type === 'daily' ? 24 : reportConfig.type === 'weekly' ? 7 : 30 }, (_, i) =>
        reportConfig.type === 'daily' ? `${String(i).padStart(2, '0')}:00` :
        reportConfig.type === 'weekly' ? `周${['一', '二', '三', '四', '五', '六', '日'][i]}` :
        `${i + 1}日`
      ),
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
        name: '溶解氧',
        type: 'line',
        smooth: true,
        data: Array.from({ length: reportConfig.type === 'daily' ? 24 : reportConfig.type === 'weekly' ? 7 : 30 }, () => +(4 + Math.random() * 4).toFixed(2)),
        lineStyle: { color: '#3b82f6', width: 2 },
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59,130,246,0.2)' },
              { offset: 1, color: 'rgba(59,130,246,0)' },
            ],
          },
        },
      },
      {
        name: 'pH值',
        type: 'line',
        smooth: true,
        data: Array.from({ length: reportConfig.type === 'daily' ? 24 : reportConfig.type === 'weekly' ? 7 : 30 }, () => +(7 + Math.random() * 1.5).toFixed(2)),
        lineStyle: { color: '#0891b2', width: 2 },
        itemStyle: { color: '#0891b2' },
      },
      {
        name: '氨氮',
        type: 'line',
        smooth: true,
        data: Array.from({ length: reportConfig.type === 'daily' ? 24 : reportConfig.type === 'weekly' ? 7 : 30 }, () => +(Math.random() * 2).toFixed(3)),
        lineStyle: { color: '#10b981', width: 2 },
        itemStyle: { color: '#10b981' },
      },
    ],
  };

  const alertChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(0,0,0,0.1)',
      textStyle: { color: '#334155' },
    },
    legend: {
      data: ['溶解氧', '氨氮', 'pH值', '设备健康'],
      textStyle: { color: '#64748b' },
      bottom: 0,
    },
    series: [
      {
        name: '预警分布',
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
        },
        data: alertDetails.map((d) => ({
          value: d.count,
          name: d.metric,
          itemStyle: {
            color: d.severity === 'high' ? '#ef4444' : d.severity === 'medium' ? '#f59e0b' : '#10b981',
          },
        })),
      },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-[var(--cyan-glow)]" />
        <h1 className="text-xl font-semibold text-[var(--cyan-glow)]">环境综合报告</h1>
      </div>

      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--ocean-blue)] flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          报告配置
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-[var(--ocean-blue)]/50">报告类型</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setReportConfig({ ...reportConfig, type })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    reportConfig.type === type
                      ? 'bg-[var(--cyan-glow)] text-white glow-cyan'
                      : 'bg-[var(--ocean-surface)] text-[var(--ocean-blue)] hover:bg-[var(--ocean-surface)]/80'
                  }`}
                >
                  {type === 'daily' ? '日报' : type === 'weekly' ? '周报' : '月报'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--ocean-blue)]/50">开始日期</label>
            <input
              type="date"
              value={reportConfig.dateRange.start}
              onChange={(e) => setReportConfig({ ...reportConfig, dateRange: { ...reportConfig.dateRange, start: e.target.value } })}
              className="w-full bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--ocean-blue)]/50">结束日期</label>
            <input
              type="date"
              value={reportConfig.dateRange.end}
              onChange={(e) => setReportConfig({ ...reportConfig, dateRange: { ...reportConfig.dateRange, end: e.target.value } })}
              className="w-full bg-[var(--ocean-dark)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                generating ? 'bg-gray-500/50 cursor-not-allowed' : 'bg-[var(--cyan-glow)] hover:opacity-90 glow-cyan'
              } text-white`}
            >
              {generating ? '生成中...' : '生成报告'}
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-lg bg-[var(--ocean-surface)] text-[var(--ocean-blue)] hover:bg-[var(--ocean-surface)]/80 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {reportConfig.includeSections.overview && (
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)] flex items-center gap-2">
            <Activity className="w-4 h-4" />
            监测概况
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: Droplets, label: '水质pH', value: stats.avgPh, unit: '', color: 'cyan' },
              { icon: Wind, label: '溶解氧', value: stats.avgO2, unit: 'mg/L', color: 'blue' },
              { icon: Droplets, label: '盐度', value: stats.avgSalt, unit: 'ppt', color: 'teal' },
              { icon: AlertCircle, label: '氨氮', value: stats.avgNh3, unit: 'mg/L', color: 'green' },
              { icon: CheckCircle, label: '正常运行', value: `${stats.normalDays}天`, unit: '', color: 'green' },
              { icon: Activity, label: '设备可用', value: `${stats.equipmentUptime}%`, unit: '', color: 'emerald' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[var(--ocean-deep)] rounded-lg p-3 text-center">
                <stat.icon className={`w-5 h-5 mx-auto mb-2 text-${stat.color}-500`} />
                <div className="text-lg font-bold text-[var(--ocean-blue)]">{stat.value}</div>
                <div className="text-xs text-[var(--ocean-blue)]/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportConfig.includeSections.trends && (
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            指标趋势
          </h2>
          <ReactECharts option={trendChartOption} style={{ height: 300 }} />
        </div>
      )}

      {reportConfig.includeSections.alerts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--ocean-blue)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              预警统计
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-500">{stats.alertCount}</div>
                <div className="text-xs text-[var(--ocean-blue)]/50">预警总数</div>
              </div>
              <div className="bg-orange-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-500">{stats.criticalAlerts}</div>
                <div className="text-xs text-[var(--ocean-blue)]/50">严重预警</div>
              </div>
            </div>
            <ReactECharts option={alertChartOption} style={{ height: 250 }} />
          </div>

          <div className="glass-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--ocean-blue)] flex items-center gap-2">
              <Activity className="w-4 h-4" />
              预警明细
            </h2>
            <div className="space-y-2">
              {alertDetails.map((alert) => (
                <div key={alert.metric} className="flex items-center justify-between bg-[var(--ocean-deep)] rounded-lg px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      alert.severity === 'high' ? 'bg-red-500' :
                      alert.severity === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                    }`} />
                    <span className="text-sm text-[var(--ocean-blue)]">{alert.metric}</span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--ocean-blue)]">{alert.count}次</span>
                </div>
              ))}
            </div>
            <div className="bg-[var(--ocean-deep)] rounded-lg p-3">
              <div className="text-xs text-[var(--ocean-blue)]/50 mb-1">数据完整率</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[var(--ocean-surface)] rounded-full h-2">
                  <div
                    className="bg-[var(--sea-green)] h-2 rounded-full transition-all"
                    style={{ width: `${stats.dataCompleteness}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-[var(--sea-green)]">{stats.dataCompleteness}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportConfig.includeSections.recommendations && (
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)] flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            养殖建议
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="bg-[var(--ocean-deep)] rounded-lg p-4 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--cyan-glow)]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-[var(--cyan-glow)]">{index + 1}</span>
                </div>
                <p className="text-sm text-[var(--ocean-blue)]/80 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
