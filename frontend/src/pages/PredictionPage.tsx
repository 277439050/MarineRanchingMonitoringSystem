import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { PredictionPoint } from '@/types';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  LineChart,
  Cpu,
  Database,
  Clock,
  Target,
  Activity,
  AlertTriangle,
  Zap,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const deviceOptions = [
  { did: 'SENSOR_001', name: '水质浮漂集成传感器' },
];

const metricOptions = [
  { key: 'ph', label: '水质PH' },
  { key: 'o2', label: '溶解氧' },
  { key: 'nh3', label: '氨氮' },
  { key: 'salt', label: '盐度' },
  { key: 'temperature', label: '水温' },
];

const horizonOptions = [6, 12, 24, 48];

const modelInfo = {
  name: 'DeepOcean-LSTM v3.2',
  trainingData: '1.2M 条历史数据',
  lastTrained: '2026-05-06 08:00',
  accuracy: '97.3%',
};

const modelComparison = [
  { name: 'LSTM', accuracy: '97.3%', mae: '0.042', responseTime: '120ms', status: 'active' as const },
  { name: 'Transformer', accuracy: '96.8%', mae: '0.051', responseTime: '85ms', status: 'standby' as const },
  { name: 'XGBoost', accuracy: '94.5%', mae: '0.089', responseTime: '15ms', status: 'standby' as const },
];

function generateData(metric: string, hours: number) {
  const now = new Date();
  const historical: PredictionPoint[] = [];
  const predicted: PredictionPoint[] = [];
  const baseValues: Record<string, number> = { ph: 7.9, o2: 7.5, nh3: 1.8, salt: 25.3, temperature: 22.5 };
  const trends: Record<string, number> = { ph: -0.02, o2: -0.08, nh3: 0.03, salt: 0.01, temperature: -0.05 };
  const volatilities: Record<string, number> = { ph: 0.1, o2: 0.3, nh3: 0.05, salt: 0.2, temperature: 0.15 };
  const base = baseValues[metric] ?? 7;
  const trend = trends[metric] ?? 0;
  const vol = volatilities[metric] ?? 0.1;

  for (let i = 24; i >= 1; i--) {
    const t = new Date(now.getTime() - i * 3600000);
    const v = base + trend * (24 - i) + (Math.random() - 0.5) * vol;
    historical.push({ timestamp: t.toISOString(), value: Number(v.toFixed(3)), lower_bound: v, upper_bound: v });
  }

  const lastVal = historical[historical.length - 1].value;
  for (let i = 1; i <= hours; i++) {
    const t = new Date(now.getTime() + i * 3600000);
    const v = lastVal + trend * i + (Math.random() - 0.5) * vol * 0.5;
    const spread = vol * (1 + i * 0.1);
    predicted.push({
      timestamp: t.toISOString(),
      value: Number(v.toFixed(3)),
      lower_bound: Number((v - spread).toFixed(3)),
      upper_bound: Number((v + spread).toFixed(3)),
    });
  }

  return { historical, predicted };
}

export default function PredictionPage() {
  const [selectedDevice, setSelectedDevice] = useState(deviceOptions[0].did);
  const [selectedMetric, setSelectedMetric] = useState(metricOptions[0].key);
  const [horizon, setHorizon] = useState(24);

  const { historical, predicted } = useMemo(() => generateData(selectedMetric, horizon), [selectedMetric, horizon]);

  const lastPredicted = predicted[predicted.length - 1];
  const trendDiff = lastPredicted.value - historical[historical.length - 1].value;
  const trendDir = Math.abs(trendDiff) < 0.05 ? 'stable' : trendDiff > 0 ? 'up' : 'down';
  const avgSpread = predicted.reduce((s, p) => s + (p.upper_bound - p.lower_bound), 0) / predicted.length;
  const confidence = Math.max(50, Math.min(98, 98 - avgSpread * 20));
  const volatility = (avgSpread / (historical[historical.length - 1].value || 1) * 100).toFixed(1);
  const anomalyProb = Math.max(2, Math.min(35, 5 + (1 - confidence / 100) * 50 + (trendDir !== 'stable' ? 8 : 0))).toFixed(1);

  const metricUnits: Record<string, string> = { ph: '', o2: 'mg/L', nh3: 'mg/L', salt: '‰', temperature: '°C' };

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(0,0,0,0.1)',
      textStyle: { color: '#334155', fontSize: 12 },
    },
    legend: {
      data: ['历史数据', '预测数据', '置信区间上界', '置信区间下界'],
      textStyle: { color: '#64748b' },
      top: 0,
    },
    grid: { left: 50, right: 20, top: 50, bottom: 30 },
    xAxis: {
      type: 'category',
      data: [...historical, ...predicted].map((p) => {
        const d = new Date(p.timestamp);
        return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`;
      }),
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.15)' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
    },
    series: [
      {
        name: '置信区间上界',
        type: 'line',
        data: [...Array(historical.length).fill(null), ...predicted.map((p) => p.upper_bound)],
        lineStyle: { color: 'rgba(8,145,178,0.3)', width: 1, type: 'dashed' },
        itemStyle: { color: 'rgba(8,145,178,0.3)' },
        symbol: 'none',
        areaStyle: null,
      },
      {
        name: '置信区间下界',
        type: 'line',
        data: [...Array(historical.length).fill(null), ...predicted.map((p) => p.lower_bound)],
        lineStyle: { color: 'rgba(8,145,178,0.3)', width: 1, type: 'dashed' },
        itemStyle: { color: 'rgba(8,145,178,0.3)' },
        symbol: 'none',
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(8,145,178,0.12)' },
              { offset: 1, color: 'rgba(8,145,178,0.02)' },
            ],
          },
          origin: 'auto',
        },
      },
      {
        name: '历史数据',
        type: 'line',
        data: historical.map((p) => p.value),
        lineStyle: { color: '#0891b2', width: 2.5 },
        itemStyle: { color: '#0891b2' },
        symbol: 'circle',
        symbolSize: 5,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(8,145,178,0.15)' },
              { offset: 1, color: 'rgba(8,145,178,0)' },
            ],
          },
        },
      },
      {
        name: '预测数据',
        type: 'line',
        data: [...Array(historical.length).fill(null), ...predicted.map((p) => p.value)],
        lineStyle: { color: '#3b82f6', width: 2.5, type: 'dashed' },
        itemStyle: { color: '#3b82f6' },
        symbol: 'diamond',
        symbolSize: 6,
      },
    ],
  };

  const recommendations: Record<string, { summary: string; actions: string[] }> = {
    o2: trendDir === 'down'
      ? {
          summary: '预计未来溶解氧将持续下降，存在养殖生物缺氧风险。',
          actions: [
            '提前启动增氧设备，维持溶解氧在 5.0 mg/L 以上',
            '减少投喂量，降低水体有机物耗氧',
            '开启水循环泵，增加水体溶氧交换效率',
          ],
        }
      : trendDir === 'up'
      ? {
          summary: '溶解氧呈上升趋势，当前无需额外操作。',
          actions: [
            '持续监测溶解氧变化趋势',
            '如超过 12 mg/L 需警惕过饱和气泡病',
            '保持当前增氧设备运行状态',
          ],
        }
      : {
          summary: '溶解氧预计保持稳定，维持当前养殖环境即可。',
          actions: [
            '按常规频率监测水质指标',
            '确保增氧设备处于待命状态',
            '记录当前参数作为基线参考',
          ],
        },
    ph: trendDir === 'down'
      ? {
          summary: 'pH值呈下降趋势，水体可能偏酸。',
          actions: [
            '检查水体酸碱度调节系统运行状态',
            '必要时投放石灰调节pH至7.5-8.5',
            '排查是否有异常排污源影响水质',
          ],
        }
      : trendDir === 'up'
      ? {
          summary: 'pH值呈上升趋势，注意监测是否超过安全范围。',
          actions: [
            '密切监测pH值变化速率',
            '如超过9.0需立即进行水质调节',
            '检查藻类繁殖情况，防止过度光合作用',
          ],
        }
      : {
          summary: 'pH值预计保持稳定，水质酸碱度正常。',
          actions: [
            '维持当前水质管理方案',
            '定期校准pH传感器确保数据准确',
            '关注天气变化对水体的潜在影响',
          ],
        },
    nh3: trendDir === 'up'
      ? {
          summary: '氨氮浓度呈上升趋势，存在氨氮中毒风险。',
          actions: [
            '增加换水频率，降低氨氮浓度',
            '减少投喂量20%-30%，降低氨氮来源',
            '投放硝化菌剂，增强生物降解能力',
          ],
        }
      : trendDir === 'down'
      ? {
          summary: '氨氮浓度呈下降趋势，当前水质改善中。',
          actions: [
            '继续维持现有管理措施',
            '监测硝化系统运行效率',
            '逐步恢复正常投喂量',
          ],
        }
      : {
          summary: '氨氮浓度预计保持稳定，当前处于安全范围。',
          actions: [
            '保持当前投喂和换水策略',
            '定期检测氨氮指标变化',
            '确保生物过滤系统正常运行',
          ],
        },
    salt: trendDir === 'up'
      ? {
          summary: '盐度呈上升趋势，需关注渗透压变化。',
          actions: [
            '适当补充淡水，维持盐度在15-30‰范围',
            '监测养殖生物渗透压适应情况',
            '检查蒸发量是否异常增大',
          ],
        }
      : trendDir === 'down'
      ? {
          summary: '盐度呈下降趋势，可能受降雨或淡水注入影响。',
          actions: [
            '检查是否有异常淡水注入',
            '监测降雨量对盐度的影响',
            '必要时补充海盐调节盐度',
          ],
        }
      : {
          summary: '盐度预计保持稳定，当前处于适宜范围。',
          actions: [
            '维持当前水体管理策略',
            '关注天气预报中降雨预警',
            '定期校准盐度传感器',
          ],
        },
    temperature: trendDir === 'up'
      ? {
          summary: '水温呈上升趋势，需关注热应激风险。',
          actions: [
            '增加水循环频率，促进水体散热',
            '减少正午时段投喂，降低代谢负担',
            '监测养殖生物行为变化',
          ],
        }
      : trendDir === 'down'
      ? {
          summary: '水温呈下降趋势，需关注低温应激。',
          actions: [
            '适当减少投喂量，降低代谢需求',
            '监测养殖生物活动频率变化',
            '如持续下降考虑启动加热系统',
          ],
        }
      : {
          summary: '水温预计保持稳定，当前处于适宜范围。',
          actions: [
            '维持当前养殖管理方案',
            '关注季节性温度变化趋势',
            '确保温度传感器数据准确',
          ],
        },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <LineChart className="w-5 h-5 text-[var(--cyan-glow)]" />
        <h1 className="text-xl font-semibold text-[var(--cyan-glow)]">预测分析</h1>
      </div>

      <div className="glass-card p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--cyan-glow)]/5 to-transparent rounded-bl-full" />
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-[var(--cyan-glow)]" />
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">模型信息</h2>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[var(--sea-green)]/10 text-[var(--sea-green)] font-medium">运行中</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--cyan-glow)]/10 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-[var(--cyan-glow)]" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--ocean-blue)]/50">模型名称</div>
              <div className="text-xs font-semibold text-[var(--ocean-blue)] font-mono">{modelInfo.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--cyan-glow)]/10 flex items-center justify-center">
              <Database className="w-4 h-4 text-[var(--cyan-glow)]" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--ocean-blue)]/50">训练数据</div>
              <div className="text-xs font-semibold text-[var(--ocean-blue)] font-mono">{modelInfo.trainingData}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--cyan-glow)]/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[var(--cyan-glow)]" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--ocean-blue)]/50">最近训练</div>
              <div className="text-xs font-semibold text-[var(--ocean-blue)] font-mono">{modelInfo.lastTrained}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--sea-green)]/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-[var(--sea-green)]" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--ocean-blue)]/50">模型精度</div>
              <div className="text-xs font-semibold text-[var(--sea-green)] font-mono">{modelInfo.accuracy}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <select
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          className="bg-[var(--ocean-deep)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
        >
          {deviceOptions.map((d) => (
            <option key={d.did} value={d.did}>{d.name}</option>
          ))}
        </select>
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="bg-[var(--ocean-deep)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
        >
          {metricOptions.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
        <div className="flex gap-1">
          {horizonOptions.map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                horizon === h
                  ? 'bg-[var(--cyan-glow)] text-white font-semibold shadow-[0_0_12px_rgba(8,145,178,0.3)]'
                  : 'bg-[var(--ocean-surface)] text-[var(--ocean-blue)] hover:bg-[var(--ocean-surface)]/80'
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-4">
        <ReactECharts option={chartOption} style={{ height: 380 }} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="glass-card p-4 text-center space-y-1 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--cyan-glow)] to-[#3b82f6]" />
          <div className="text-[10px] text-[var(--ocean-blue)]/50 uppercase tracking-wider">预测终值</div>
          <div className="text-lg font-mono font-semibold text-[var(--cyan-glow)]">
            {lastPredicted.value}<span className="text-xs ml-0.5 text-[var(--ocean-blue)]/40">{metricUnits[selectedMetric]}</span>
          </div>
        </div>
        <div className="glass-card p-4 text-center space-y-1 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--coral-red)] to-[var(--amber)]" />
          <div className="text-[10px] text-[var(--ocean-blue)]/50 uppercase tracking-wider">趋势方向</div>
          <div className="flex items-center justify-center gap-1 text-lg font-semibold">
            {trendDir === 'up' && (
              <>
                <TrendingUp className="w-5 h-5 text-[var(--coral-red)]" />
                <span className="text-[var(--coral-red)]">上升</span>
              </>
            )}
            {trendDir === 'down' && (
              <>
                <TrendingDown className="w-5 h-5 text-[var(--cyan-glow)]" />
                <span className="text-[var(--cyan-glow)]">下降</span>
              </>
            )}
            {trendDir === 'stable' && (
              <>
                <Minus className="w-5 h-5 text-[var(--amber)]" />
                <span className="text-[var(--amber)]">稳定</span>
              </>
            )}
          </div>
        </div>
        <div className="glass-card p-4 text-center space-y-1 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--sea-green)] to-[#34d399]" />
          <div className="text-[10px] text-[var(--ocean-blue)]/50 uppercase tracking-wider">置信度</div>
          <div className="text-lg font-mono font-semibold text-[var(--sea-green)]">{confidence.toFixed(0)}%</div>
        </div>
        <div className="glass-card p-4 text-center space-y-1 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--amber)] to-[#fbbf24]" />
          <div className="text-[10px] text-[var(--ocean-blue)]/50 uppercase tracking-wider">预测波动率</div>
          <div className="text-lg font-mono font-semibold text-[var(--amber)]">{volatility}%</div>
        </div>
        <div className="glass-card p-4 text-center space-y-1 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--coral-red)] to-[#f87171]" />
          <div className="text-[10px] text-[var(--ocean-blue)]/50 uppercase tracking-wider">异常概率</div>
          <div className="text-lg font-mono font-semibold text-[var(--coral-red)]">{anomalyProb}%</div>
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[var(--cyan-glow)]" />
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">多模型对比</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--ocean-blue)]/50 text-xs border-b border-[var(--ocean-surface)]">
                <th className="text-left py-2.5 px-3">模型</th>
                <th className="text-left py-2.5 px-3">准确率</th>
                <th className="text-left py-2.5 px-3">MAE</th>
                <th className="text-left py-2.5 px-3">响应时间</th>
                <th className="text-left py-2.5 px-3">状态</th>
              </tr>
            </thead>
            <tbody>
              {modelComparison.map((m) => (
                <tr key={m.name} className="border-b border-[var(--ocean-surface)]/30">
                  <td className="py-2.5 px-3 font-mono font-semibold text-[var(--ocean-blue)]">{m.name}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-[var(--sea-green)]">{m.accuracy}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[var(--ocean-blue)]/70">{m.mae}</td>
                  <td className="py-2.5 px-3 font-mono text-[var(--ocean-blue)]/70">{m.responseTime}</td>
                  <td className="py-2.5 px-3">
                    {m.status === 'active' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--sea-green)]/10 text-[var(--sea-green)] font-medium">
                        ● 当前使用
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--ocean-surface)] text-[var(--ocean-blue)]/50">
                        ○ 备用
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[var(--cyan-glow)]" />
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">AI养殖建议</h2>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[var(--cyan-glow)]/10 text-[var(--cyan-glow)] font-medium">
            <Zap className="w-3 h-3 inline mr-0.5" />
            AI生成
          </span>
        </div>
        <p className="text-sm text-[var(--ocean-blue)]/80 leading-relaxed">{recommendations[selectedMetric].summary}</p>
        <div className="space-y-2.5">
          {recommendations[selectedMetric].actions.map((action, i) => (
            <div key={i} className="flex items-start gap-2.5 bg-[var(--ocean-deep)] rounded-lg px-3.5 py-2.5">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-[var(--cyan-glow)]/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 text-[var(--cyan-glow)]" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-[var(--ocean-blue)]/50 mb-0.5">建议操作 {i + 1}</div>
                <div className="text-sm text-[var(--ocean-blue)]">{action}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--ocean-blue)]/30 mt-1 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
