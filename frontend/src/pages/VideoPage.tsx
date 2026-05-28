import { useState, useEffect, useRef, useCallback } from 'react';
import { Video, Play, AlertTriangle, Info, X, Cpu, Eye, Shield, HardDrive, Wifi, Activity, Volume2, VolumeX, Maximize2, RefreshCw, CameraOff, Camera, Scan, MonitorSmartphone } from 'lucide-react';
import Hls from 'hls.js';
import LocalCameraPlayer from '@/components/LocalCameraPlayer';

const MEDIA_SERVER = import.meta.env.VITE_MEDIA_SERVER || 'http://localhost:8888';

const CAMERAS = [
  {
    id: 1,
    name: '水下高清摄像头',
    location: 'A区-深海',
    density: '中等',
    status: '正常',
    confidence: 96.8,
    streamPath: 'cam1',
    rtspHint: 'rtsp://admin:password@192.168.1.100:554/live/main',
  },
  {
    id: 2,
    name: '牧场1号',
    location: 'B区-浅海',
    density: '偏高',
    status: '活跃',
    confidence: 94.2,
    streamPath: 'cam2',
    rtspHint: 'rtsp://admin:password@192.168.1.101:554/live/main',
  },
  {
    id: 3,
    name: '牧场2号',
    location: 'C区-中层',
    density: '低',
    status: '正常',
    confidence: 97.5,
    streamPath: 'cam3',
    rtspHint: 'rtsp://admin:password@192.168.1.102:554/live/main',
  },
  {
    id: 4,
    name: '气象站全景',
    location: 'D区-水面',
    density: '--',
    status: '正常',
    confidence: 99.1,
    streamPath: 'cam4',
    rtspHint: 'rtsp://admin:password@192.168.1.103:554/live/main',
  },
  {
    id: 5,
    name: '深水区探测器',
    location: 'E区-深水',
    density: '中等',
    status: '缓慢',
    confidence: 91.3,
    streamPath: 'cam5',
    rtspHint: 'rtsp://admin:password@192.168.1.104:554/live/main',
  },
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

interface AIDetectionResult {
  class: string;
  score: number;
  time: string;
}

function VideoPlayer({ camera, isActive, onStreamError }: {
  camera: typeof CAMERAS[0];
  isActive: boolean;
  onStreamError?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retries, setRetries] = useState(0);

  const streamUrl = `${MEDIA_SERVER}/${camera.streamPath}/index.m3u8`;

  const initPlayer = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        setError(null);
        video.play().catch(() => {});
        setPlaying(true);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setLoading(false);
          setError('连接失败');
          setPlaying(false);
          onStreamError?.();
          hls.destroy();
          hlsRef.current = null;
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        setError(null);
        video.play().catch(() => {});
        setPlaying(true);
      });
      video.addEventListener('error', () => {
        setLoading(false);
        setError('连接失败');
        setPlaying(false);
        onStreamError?.();
      });
    }
  }, [streamUrl, onStreamError]);

  useEffect(() => {
    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initPlayer]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetries((r) => r + 1);
    initPlayer();
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div className={`rounded-lg relative cursor-pointer transition-all overflow-hidden group ${
      isActive ? 'border-2 border-[var(--cyan-glow)] glow-cyan' : 'border border-[var(--ocean-surface)]'
    } bg-black`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted={muted}
        playsInline
        autoPlay
      />

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
          <RefreshCw size={24} className="text-white/60 animate-spin mb-2" />
          <span className="text-xs text-white/50">正在连接视频流...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <CameraOff size={28} className="text-white/40 mb-2" />
          <span className="text-xs text-white/50 mb-1">{error}</span>
          <span className="text-[10px] text-white/30 mb-3 max-w-[180px] text-center break-all">{streamUrl}</span>
          <button
            onClick={(e) => { e.stopPropagation(); handleRetry(); }}
            className="px-3 py-1 rounded-md bg-[var(--cyan-glow)]/20 text-[var(--cyan-glow)] text-xs hover:bg-[var(--cyan-glow)]/30 transition"
          >
            重试连接 ({retries})
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="w-2 h-2 rounded-full bg-[var(--sea-green)] animate-pulse" />
            <span className="text-[10px] font-medium text-white/90">AI检测中</span>
          </div>

          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-medium text-[var(--cyan-glow)]">置信度: {camera.confidence}%</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-white/70">鱼群密度: <span className="font-medium text-white">{camera.density}</span></span>
                <span className="text-[10px] text-white/70">活动状态: <span className={`font-medium ${camera.status === '正常' ? 'text-[var(--sea-green)]' : camera.status === '活跃' ? 'text-[var(--cyan-glow)]' : 'text-[var(--amber)]'}`}>{camera.status}</span></span>
              </div>
              <Eye size={12} className="text-white/40" />
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="pointer-events-auto w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition"
            >
              {playing ? (
                <PauseIcon size={16} className="text-white" />
              ) : (
                <Play size={16} className="text-white ml-0.5" />
              )}
            </button>
          </div>

          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
              className="p-1 rounded bg-black/50 backdrop-blur-sm hover:bg-black/70 transition"
            >
              {muted ? <VolumeX size={12} className="text-white/80" /> : <Volume2 size={12} className="text-white/80" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (videoRef.current) videoRef.current.requestFullscreen(); }}
              className="p-1 rounded bg-black/50 backdrop-blur-sm hover:bg-black/70 transition"
            >
              <Maximize2 size={12} className="text-white/80" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function PauseIcon({ size = 16, className, ...rest }: { size?: number; className?: string } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className} {...rest}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

export default function VideoPage() {
  const [modeIdx, setModeIdx] = useState(1);
  const [activeCam, setActiveCam] = useState(1);
  const [activeCell, setActiveCell] = useState(0);
  const [fishDiseaseModal, setFishDiseaseModal] = useState(false);
  const [feedModal, setFeedModal] = useState(false);
  const [fps, setFps] = useState(30);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);

  const [aiDetections, setAiDetections] = useState<AIDetectionResult[]>([]);
  const mode = GRID_MODES[modeIdx];

  useEffect(() => {
    const t = setInterval(() => {
      setFps(28 + Math.floor(Math.random() * 5));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch(`${MEDIA_SERVER}/`, { mode: 'no-cors' })
      .then(() => setServerOnline(true))
      .catch(() => setServerOnline(false));
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

  const handleAIDetection = useCallback((detections: Array<{ bbox: number[]; class: string; score: number }>) => {
    const results: AIDetectionResult[] = detections.map(det => ({
      class: det.class,
      score: det.score,
      time: new Date().toLocaleTimeString(),
    }));
    
    setAiDetections(prev => {
      const combined = [...results, ...prev].slice(0, 20);
      return combined;
    });
  }, []);

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--cyan-glow)] glow-text">视频监控</h1>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${
            serverOnline ? 'bg-[var(--sea-green)]/15 text-[var(--sea-green)]' : 'bg-[var(--coral-red)]/15 text-[var(--coral-red)]'
          }`}>
            <Wifi size={12} />
            <span>流媒体服务 {serverOnline ? '在线' : '离线'}</span>
          </div>

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
          
          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              showConfigPanel
                ? 'bg-[var(--amber)] text-[var(--ocean-deep)]'
                : 'bg-[var(--ocean-dark)] text-[var(--ocean-blue)]/70 hover:bg-[var(--ocean-surface)]'
            }`}
          >
            ⚙️ 流配置
          </button>
        </div>
      </div>

      <div className="glass-card px-4 py-2.5 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-[var(--sea-green)]" />
          <span className="text-xs text-[var(--ocean-blue)]/60">在线摄像头</span>
          <span className="text-sm font-bold text-[var(--sea-green)]">{CAMERAS.length}/{CAMERAS.length}</span>
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
        
        {aiDetections.length > 0 && (
          <>
            <div className="w-px h-4 bg-[var(--ocean-surface)]" />
            <div className="flex items-center gap-2">
              <Scan className="w-4 h-4 text-[var(--cyan-glow)]" />
              <span className="text-xs text-[var(--ocean-blue)]/60">已识别目标</span>
              <span className="text-sm font-bold text-[var(--cyan-glow)]">{aiDetections.length}个</span>
            </div>
          </>
        )}
      </div>

      {showConfigPanel && (
        <div className="glass-card p-4 border-l-4 border-l-[var(--amber)]">
          <h3 className="text-sm font-semibold text-[var(--ocean-blue)] mb-3 flex items-center gap-2">
            📡 视频流地址配置
            <span className="text-[10px] font-normal text-[var(--ocean-blue)]/50">(修改后需重启 MediaMTX 服务)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {CAMERAS.map((cam) => (
              <div key={cam.id} className="bg-[var(--ocean-deep)] rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--cyan-glow)]">{cam.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--cyan-glow)]/10 text-[var(--cyan-glow)]">{cam.streamPath}</span>
                </div>
                <code className="block text-[10px] text-[var(--ocean-blue)]/50 bg-black/20 rounded px-2 py-1.5 break-all font-mono">
                  RTSP: {cam.rtspHint}
                </code>
                <code className="block text-[10px] text-[var(--sea-green)]/60 bg-black/20 rounded px-2 py-1.5 font-mono">
                  HLS: {`${MEDIA_SERVER}/${cam.streamPath}/index.m3u8`}
                </code>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-[var(--amber)]/8 border border-[var(--amber)]/20">
            <p className="text-xs text-[var(--ocean-blue)]/70">
              <strong>接入步骤：</strong><br />
              ① 将 WST-3600 摄像头网线连入路由器 → 接通 DC12V 电源<br />
              ② 登录路由器获取摄像头 IP，或用 VAA9 APP 扫码发现设备<br />
              ③ 编辑 <code className="bg-black/20 px-1 rounded">backend/mediamtx.yml</code> 中的 RTSP 地址为实际值<br />
              ④ 启动 MediaMTX：<code className="bg-black/20 px-1 rounded">双击 backend/mediamtx.exe</code> 或使用 start.bat<br />
              ⑤ 刷新本页面即可看到实时画面
            </p>
          </div>
        </div>
      )}

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
              if (i === 0) {
                return (
                  <div key={i} onClick={() => setActiveCell(0)}>
                    <LocalCameraPlayer 
                      isActive={activeCell === i}
                      onDetection={handleAIDetection}
                      autoStart={true}
                    />
                  </div>
                );
              }
              
              const cam = CAMERAS[i % CAMERAS.length];
              return (
                <div
                  key={i}
                  onClick={() => { setActiveCell(i); setActiveCam(cam.id); }}
                >
                  <VideoPlayer
                    camera={cam}
                    isActive={activeCell === i}
                    onStreamError={() => {}}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-60 flex flex-col gap-3">
          <div className="glass-card p-4 flex flex-col flex-1">
            <h3 className="text-sm font-semibold text-[var(--ocean-blue)] mb-3">
              📷 视频源信息
            </h3>
            
            <div className="space-y-3">
              <div className="bg-[var(--cyan-glow)]/10 rounded-lg p-3 border border-[var(--cyan-glow)]/20">
                <div className="flex items-center gap-2 mb-2">
                  <MonitorSmartphone className="w-4 h-4 text-[var(--cyan-glow)]" />
                  <span className="text-xs font-semibold text-[var(--cyan-glow)]">区域 1 (主画面)</span>
                </div>
                <div className="text-sm font-medium text-[var(--ocean-blue)]">📹 本地摄像头</div>
                <div className="flex items-center gap-2 mt-2 text-xs text-[var(--ocean-blue)]/70">
                  <Scan size={12} className="text-[var(--cyan-glow)]" />
                  <span>AI物体识别：已启用</span>
                </div>
                {aiDetections.length > 0 && (
                  <div className="mt-2 text-[10px] text-[var(--sea-green)]">
                    ● 实时检测中 · 已识别 {aiDetections.length} 个目标
                  </div>
                )}
              </div>
              
              {mode.count > 1 && (
                <>
                  <div className="text-[10px] text-[var(--ocean-blue)]/40 uppercase tracking-wider">其他视频源</div>
                  
                  {Array.from({ length: Math.min(mode.count - 1, CAMERAS.length) }).map((_, i) => {
                    const cam = CAMERAS[(i + 1) % CAMERAS.length];
                    return (
                      <div
                        key={cam.id}
                        onClick={() => { setActiveCam(cam.id); setActiveCell(i + 1); }}
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
                        <span className={`w-1.5 h-1.5 rounded-full ${serverOnline ? 'bg-[var(--sea-green)]' : 'bg-[var(--coral-red)] animate-pulse'}`} />
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[var(--cyan-glow)]" />
              <h3 className="text-sm font-semibold text-[var(--ocean-blue)]">
                🎯 AI识别记录
              </h3>
            </div>
            
            <div className="space-y-2 flex-1 overflow-y-auto">
              {aiDetections.length > 0 ? (
                aiDetections.slice(0, 15).map((det, idx) => (
                  <div key={`${idx}-${det.time}`} className="bg-[var(--ocean-deep)] rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[var(--ocean-blue)] capitalize">{det.class.replace(/_/g, ' ')}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        det.score > 0.7 ? 'bg-[var(--sea-green)]/15 text-[var(--sea-green)]' :
                        det.score > 0.5 ? 'bg-[var(--amber)]/15 text-[var(--amber)]' :
                        'bg-[var(--coral-red)]/15 text-[var(--coral-red)]'
                      }`}>
                        {(det.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--ocean-blue)]/50">{det.time}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-[var(--ocean-blue)]/40">
                  等待摄像头启动...
                </div>
              )}
            </div>
            
            <button className="w-full mt-3 py-2 rounded-lg bg-[var(--cyan-glow)]/10 text-[var(--cyan-glow)] text-xs font-medium hover:bg-[var(--cyan-glow)]/20 transition border border-[var(--cyan-glow)]/20">
              <Activity className="w-3 h-3 inline mr-1 -mt-0.5" />
              导出记录
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
              <div className="flex justify-between text-sm"><span className="text-[var(--ocean-blue)]/60">检测鱼种</span><span className="text-[var(--ocean-blue)] font-medium">大黄鱼</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--ocean-blue)]/60">疑似病症</span><span className="text-[var(--coral-red)] font-medium">弧菌病</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--ocean-blue)]/60">检测置信度</span><span className="text-[var(--amber)] font-medium">98.0%</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--ocean-blue)]/60">影响区域</span><span className="text-[var(--ocean-blue)] font-medium">B区-浅海</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--ocean-blue)]/60">建议措施</span><span className="text-[var(--sea-green)] font-medium">隔离观察 + 药浴处理</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setFishDiseaseModal(false)} className="flex-1 py-2.5 rounded-lg bg-[var(--ocean-surface)] text-[var(--ocean-blue)] font-medium hover:bg-[var(--ocean-dark)] transition text-sm">稍后处理</button>
              <button onClick={() => setFishDiseaseModal(false)} className="flex-1 py-2.5 rounded-lg bg-[var(--amber)] text-[var(--ocean-deep)] font-semibold hover:opacity-90 transition-opacity text-sm">立即处理</button>
            </div>
          </div>
        </div>
      )}

      {feedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="glass-card glow-cyan p-6 w-[480px] relative shadow-black/8">
            <button onClick={() => setFeedModal(false)} className="absolute top-4 right-4 text-[var(--ocean-blue)]/50 hover:text-[var(--ocean-blue)]"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--cyan-glow)]/20 flex items-center justify-center"><Info className="w-5 h-5 text-[var(--cyan-glow)]" /></div>
              <div>
                <h2 className="text-lg font-bold text-[var(--cyan-glow)]">智能饲喂提示</h2>
                <p className="text-xs text-[var(--ocean-blue)]/50">基于AI鱼群行为分析</p>
              </div>
            </div>
            <div className="bg-[var(--ocean-deep)] rounded-lg p-4 mb-4 space-y-2.5">
              <div className="flex justify-between text-sm"><span className="text-[var(--ocean-blue)]/60">鱼群密度</span><span className="text-[var(--amber)] font-medium">偏高</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--ocean-blue)]/60">摄食意愿</span><span className="text-[var(--sea-green)] font-medium">强</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--ocean-blue)]/60">水体状态</span><span className="text-[var(--sea-green)] font-medium">绿区（正常）</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--ocean-blue)]/60">建议投喂量</span><span className="text-[var(--cyan-glow)] font-medium">3.5 kg</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--ocean-blue)]/60">推荐饲料</span><span className="text-[var(--ocean-blue)] font-medium">高蛋白配合饲料</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setFeedModal(false)} className="flex-1 py-2.5 rounded-lg bg-[var(--ocean-surface)] text-[var(--ocean-blue)] font-medium hover:bg-[var(--ocean-dark)] transition text-sm">暂不投喂</button>
              <button onClick={() => setFeedModal(false)} className="flex-1 py-2.5 rounded-lg bg-[var(--cyan-glow)] text-[var(--ocean-deep)] font-semibold hover:opacity-90 transition-opacity text-sm">立即投喂</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}