import { useState, useEffect } from 'react';
import { Video, Play, AlertTriangle, Info, X, Cpu, Eye, Shield, HardDrive, Wifi, Activity } from 'lucide-react';

const CAMERAS = [
  { id: 1, name: '水下高清摄像头', location: 'A区-深海', density: '中等', status: '正常', confidence: 96.8 },
  { id: 2, name: '牧场1号', location: 'B区-浅海', density: '偏高', status: '活跃', confidence: 94.2 },
  { id: 3, name: '牧场2号', location: 'C区-中层', density: '低', status: '正常', confidence: 97.5 },
  { id: 4, name: '气象站全景', location: 'D区-水面', density: '--', status: '正常', confidence: 99.1 },
  { id: 5, name: '深水区探测器', location: 'E区-深水', density: '中等', status: '缓慢', confidence: 91.3 },
];

const GRID_MODES = [
  { label: '1×1', cols: 1, count: 1 },
  { label: '2×2', cols: 2, count: 4 },
  { label: '3×3', cols: 3, count: 9 },
];

const AI_DETECTIONS = [
  { species: '大黄鱼', health: '健康', confidence: 96.8, time: '14:32:05' },
  { species: '鲈鱼', health: '疑似异常', confidence: 78.4, time: '14:28:17' },
  { species: '黑鲷', health: '健康', confidence: 93.1, time: '14:15:42' },
];

export default function VideoPage() {
  const [modeIdx, setModeIdx] = useState(1);
  const [activeCam, setActiveCam] = useState(1);
  const [activeCell, setActiveCell] = useState(0);
  const [fishDiseaseModal, setFishDiseaseModal] = useState(false);
  const [feedModal, setFeedModal] = useState(false);
  const [fps, setFps] = useState(30);

  const mode = GRID_MODES[modeIdx];

  useEffect(() => {
    const t = setInterval(() => {
      setFps(28 + Math.floor(Math.random() * 5));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (modeIdx === 0) {
      const t = setTimeout(() => setFishDiseaseModal(true), 5000);
      return () => clearTimeout(t);
    }
  }, [modeIdx]);

  useEffect(() => {
    if (modeIdx === 1) {
      const t = setTimeout(() => setFeedModal(true), 5000);
      return () => clearTimeout(t);
    }
  }, [modeIdx]);

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--cyan-glow)] glow-text">视频监控</h1>
        <div className="flex gap-2">
          {GRID_MODES.map((m, i) => (
            <button
              key={m.label}
              onClick={() => setModeIdx(i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                modeIdx === i
                  ? 'bg-[var(--cyan-glow)] text-[var(--ocean-deep)] glow-cyan'
                  : 'bg-[var(--ocean-dark)] text-[var(--ocean-blue)]/70 hover:bg-[var(--ocean-surface)]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card px-4 py-2.5 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-[var(--sea-green)]" />
          <span className="text-xs text-[var(--ocean-blue)]/60">在线摄像头</span>
          <span className="text-sm font-bold text-[var(--sea-green)]">5/5</span>
        </div>
        <div className="w-px h-4 bg-[var(--ocean-surface)]" />
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[var(--cyan-glow)]" />
          <span className="text-xs text-[var(--ocean-blue)]/60">AI检测帧率</span>
          <span className="text-sm font-bold text-[var(--cyan-glow)]">{fps}fps</span>
        </div>
        <div className="w-px h-4 bg-[var(--ocean-surface)]" />
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--amber)]" />
          <span className="text-xs text-[var(--ocean-blue)]/60">今日告警</span>
          <span className="text-sm font-bold text-[var(--amber)]">2条</span>
        </div>
        <div className="w-px h-4 bg-[var(--ocean-surface)]" />
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[var(--ocean-blue)]/60" />
          <span className="text-xs text-[var(--ocean-blue)]/60">存储容量</span>
          <span className="text-sm font-bold text-[var(--ocean-blue)]">68.5%</span>
          <div className="w-20 h-1.5 bg-[var(--ocean-surface)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--cyan-glow)] rounded-full" style={{ width: '68.5%' }} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 glass-card p-3">
          <div
            className="grid gap-2 h-full"
            style={{
              gridTemplateColumns: `repeat(${mode.cols}, 1fr)`,
              gridTemplateRows: `repeat(${mode.cols}, 1fr)`,
            }}
          >
            {Array.from({ length: mode.count }).map((_, i) => {
              const cam = CAMERAS[i % CAMERAS.length];
              return (
                <div
                  key={i}
                  onClick={() => { setActiveCell(i); setActiveCam(cam.id); }}
                  className={`rounded-lg relative cursor-pointer transition-all overflow-hidden ${
                    activeCell === i
                      ? 'border-2 border-[var(--cyan-glow)] glow-cyan'
                      : 'border border-[var(--ocean-surface)]'
                  } bg-gradient-to-br from-slate-100 to-slate-200`}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Video className="w-8 h-8 text-[var(--ocean-blue)]/30 mb-2" />
                    <span className="text-sm text-[var(--ocean-blue)]/40">{cam.name}</span>
                  </div>

                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-[var(--sea-green)] animate-pulse" />
                    <span className="text-[10px] font-medium text-[var(--sea-green)]">AI检测中</span>
                  </div>

                  <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md">
                    <span className="text-[10px] font-medium text-[var(--cyan-glow)]">置信度: {cam.confidence}%</span>
                  </div>

                  <div className="absolute bottom-2 left-2 right-2 bg-white/70 backdrop-blur-sm rounded-md px-2 py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[var(--ocean-blue)]/70">鱼群密度: <span className="font-medium text-[var(--ocean-blue)]">{cam.density}</span></span>
                      <span className="text-[10px] text-[var(--ocean-blue)]/70">活动状态: <span className={`font-medium ${cam.status === '正常' ? 'text-[var(--sea-green)]' : cam.status === '活跃' ? 'text-[var(--cyan-glow)]' : 'text-[var(--amber)]'}`}>{cam.status}</span></span>
                    </div>
                    <Eye className="w-3 h-3 text-[var(--ocean-blue)]/40" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-60 flex flex-col gap-3">
          <div className="glass-card p-4 flex flex-col flex-1">
            <h3 className="text-sm font-semibold text-[var(--ocean-blue)] mb-3">摄像头列表</h3>
            <div className="flex flex-col gap-1.5 flex-1">
              {CAMERAS.map((cam) => (
                <div
                  key={cam.id}
                  onClick={() => { setActiveCam(cam.id); }}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all ${
                    activeCam === cam.id
                      ? 'border-l-2 border-l-[var(--cyan-glow)] bg-[var(--ocean-surface)]/50'
                      : 'border-l-2 border-l-transparent hover:bg-[var(--ocean-dark)]/50'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${activeCam === cam.id ? 'text-[var(--cyan-glow)]' : 'text-[var(--ocean-blue)]/50'}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${activeCam === cam.id ? 'text-[var(--cyan-glow)]' : 'text-[var(--ocean-blue)]/80'}`}>{cam.name}</div>
                    <div className="text-[10px] text-[var(--ocean-blue)]/40">{cam.location}</div>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--sea-green)]" />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[var(--cyan-glow)]" />
              <h3 className="text-sm font-semibold text-[var(--ocean-blue)]">AI鱼病检测</h3>
            </div>
            <div className="space-y-2">
              {AI_DETECTIONS.map((det, i) => (
                <div key={i} className="bg-[var(--ocean-deep)] rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[var(--ocean-blue)]">{det.species}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      det.health === '健康'
                        ? 'bg-[var(--sea-green)]/15 text-[var(--sea-green)]'
                        : 'bg-[var(--amber)]/15 text-[var(--amber)]'
                    }`}>
                      {det.health}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--ocean-blue)]/50">{det.time}</span>
                    <span className="text-[10px] text-[var(--cyan-glow)] font-medium">置信度 {det.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-3 py-2 rounded-lg bg-[var(--cyan-glow)]/10 text-[var(--cyan-glow)] text-xs font-medium hover:bg-[var(--cyan-glow)]/20 transition border border-[var(--cyan-glow)]/20">
              <Activity className="w-3 h-3 inline mr-1 -mt-0.5" />
              深度分析
            </button>
          </div>
        </div>
      </div>

      {fishDiseaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="glass-card glow-amber p-6 w-[480px] relative shadow-black/8">
            <button
              onClick={() => setFishDiseaseModal(false)}
              className="absolute top-4 right-4 text-[var(--ocean-blue)]/50 hover:text-[var(--ocean-blue)]"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--amber)]/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[var(--amber)]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--amber)]">鱼病检测警报</h2>
                <p className="text-xs text-[var(--ocean-blue)]/50">由AI视觉模型自动识别</p>
              </div>
            </div>
            <div className="bg-[var(--ocean-deep)] rounded-lg p-4 mb-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--ocean-blue)]/60">检测鱼种</span>
                <span className="text-[var(--ocean-blue)] font-medium">大黄鱼</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--ocean-blue)]/60">疑似病症</span>
                <span className="text-[var(--coral-red)] font-medium">弧菌病</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--ocean-blue)]/60">检测置信度</span>
                <span className="text-[var(--amber)] font-medium">98.0%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--ocean-blue)]/60">影响区域</span>
                <span className="text-[var(--ocean-blue)] font-medium">B区-浅海</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--ocean-blue)]/60">建议措施</span>
                <span className="text-[var(--sea-green)] font-medium">隔离观察 + 药浴处理</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setFishDiseaseModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-[var(--ocean-surface)] text-[var(--ocean-blue)] font-medium hover:bg-[var(--ocean-dark)] transition text-sm"
              >
                稍后处理
              </button>
              <button
                onClick={() => setFishDiseaseModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-[var(--amber)] text-[var(--ocean-deep)] font-semibold hover:opacity-90 transition-opacity text-sm"
              >
                立即处理
              </button>
            </div>
          </div>
        </div>
      )}

      {feedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="glass-card glow-cyan p-6 w-[480px] relative shadow-black/8">
            <button
              onClick={() => setFeedModal(false)}
              className="absolute top-4 right-4 text-[var(--ocean-blue)]/50 hover:text-[var(--ocean-blue)]"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--cyan-glow)]/20 flex items-center justify-center">
                <Info className="w-5 h-5 text-[var(--cyan-glow)]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--cyan-glow)]">智能饲喂提示</h2>
                <p className="text-xs text-[var(--ocean-blue)]/50">基于AI鱼群行为分析</p>
              </div>
            </div>
            <div className="bg-[var(--ocean-deep)] rounded-lg p-4 mb-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--ocean-blue)]/60">鱼群密度</span>
                <span className="text-[var(--amber)] font-medium">偏高</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--ocean-blue)]/60">摄食意愿</span>
                <span className="text-[var(--sea-green)] font-medium">强</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--ocean-blue)]/60">水体状态</span>
                <span className="text-[var(--sea-green)] font-medium">绿区（正常）</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--ocean-blue)]/60">建议投喂量</span>
                <span className="text-[var(--cyan-glow)] font-medium">3.5 kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--ocean-blue)]/60">推荐饲料</span>
                <span className="text-[var(--ocean-blue)] font-medium">高蛋白配合饲料</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setFeedModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-[var(--ocean-surface)] text-[var(--ocean-blue)] font-medium hover:bg-[var(--ocean-dark)] transition text-sm"
              >
                暂不投喂
              </button>
              <button
                onClick={() => setFeedModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-[var(--cyan-glow)] text-[var(--ocean-deep)] font-semibold hover:opacity-90 transition-opacity text-sm"
              >
                立即投喂
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
