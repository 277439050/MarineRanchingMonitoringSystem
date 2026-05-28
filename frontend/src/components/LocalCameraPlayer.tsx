import { useState, useEffect, useRef, useCallback } from 'react';
import { Video, Play, Pause, Camera, CameraOff, Scan, Maximize2, Volume2, VolumeX, RefreshCw, AlertCircle } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

interface Detection {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

interface LocalCameraPlayerProps {
  isActive?: boolean;
  onDetection?: (detections: Detection[]) => void;
  autoStart?: boolean;
}

const COLORS = [
  '#00ff88', '#00d4ff', '#ff6b6b', '#ffd93d', '#6bcb77',
  '#4d96ff', '#ff6f91', '#845ec2', '#ffc75f', '#c34a36',
];

export default function LocalCameraPlayer({ isActive, onDetection, autoStart = true }: LocalCameraPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const animFrameRef = useRef<number>(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [modelLoading, setModelLoading] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [fps, setFps] = useState(0);
  const fpsRef = useRef({ count: 0, lastTime: performance.now() });
  const facingModeRef = useRef<'user' | 'environment'>('environment');
  const hasAttemptedStart = useRef(false);

  const startCamera = useCallback(async () => {
    if (hasAttemptedStart.current && isStreaming) return;
    hasAttemptedStart.current = true;
    
    try {
      setIsLoading(true);
      setError(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      console.log('正在请求摄像头权限...');

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingModeRef.current,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 60 }
          },
          audio: false
        });
      } catch (primaryError) {
        console.log('理想配置失败，尝试简化配置...', primaryError);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      console.log('摄像头获取成功:', stream.getVideoTracks()[0]?.label || '未知设备');
      
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        try {
          await videoRef.current.play();
          console.log('视频播放成功');
          setIsStreaming(true);
          setIsLoading(false);
        } catch (playError) {
          console.error('视频播放失败:', playError);
          setError('视频播放失败，请刷新页面重试');
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error('摄像头启动失败:', err);
      setIsLoading(false);
      
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            setError('❌ 摄像头权限被拒绝\n\n请点击浏览器地址栏左侧的🔒图标 → 选择"允许"摄像头访问\n然后点击下方"重新启动"按钮');
            break;
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            setError('❌ 未检测到摄像头\n\n请确认电脑已连接摄像头设备\n如果是笔记本，检查是否已开启内置摄像头');
            break;
          case 'NotReadableError':
          case 'TrackStartError':
            setError('❌ 摄像头被占用\n\n其他程序可能正在使用摄像头\n请关闭视频会议/其他应用后重试');
            break;
          case 'OverconstrainedError':
            setError('❌ 摄像头不支持请求的配置\n\n将尝试使用默认配置');
            break;
          default:
            setError(`❌ 摄像头错误: ${err.message || err.name}\n\n请确保:\n1. 使用 HTTPS 或 localhost 访问\n2. 浏览器已授权摄像头权限`);
        }
      } else if (err instanceof TypeError && err.message.includes('getUserMedia is not a function')) {
        setError('❌ 您的浏览器不支持摄像头\n\n请使用 Chrome、Edge 或 Firefox 浏览器');
      } else {
        setError(`❌ 无法启动摄像头\n\n错误信息: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }, [isStreaming]);

  useEffect(() => {
    if (autoStart && !hasAttemptedStart.current) {
      const timer = setTimeout(() => {
        startCamera();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, startCamera]);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    hasAttemptedStart.current = false;
    setDetections([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const loadModel = useCallback(async () => {
    if (modelRef.current) return;
    
    try {
      setModelLoading(true);
      console.log('正在加载AI模型...');
      await tf.ready();
      console.log('TensorFlow.js 就绪');
      
      const model = await cocoSsd.load({
        base: 'lite_mobilenet_v2'
      });
      modelRef.current = model;
      setModelLoading(false);
      console.log('COCO-SSD 模型加载完成');
    } catch (err) {
      console.error('模型加载失败:', err);
      setModelLoading(false);
      setAiEnabled(false);
      setError(prev => prev ? prev : '\n⚠️ AI模型加载失败，仅显示摄像头画面');
    }
  }, []);

  const detectObjects = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const model = modelRef.current;

    if (!video || !canvas || !model || video.readyState !== 4 || !aiEnabled) {
      if (isStreaming && aiEnabled) {
        animFrameRef.current = requestAnimationFrame(detectObjects);
      }
      return;
    }

    try {
      const predictions = await model.detect(video);
      
      const detections: Detection[] = predictions.map(pred => ({
        bbox: pred.bbox as [number, number, number, number],
        class: pred.class,
        score: pred.score
      }));

      setDetections(detections);
      onDetection?.(detections);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        predictions.forEach((pred, idx) => {
          const [x, y, width, height] = pred.bbox;
          const color = COLORS[idx % COLORS.length];
          
          const flippedX = canvas.width - x - width;
          
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(3, Math.min(canvas.width, canvas.height) * 0.003);
          ctx.strokeRect(flippedX, y, width, height);
          
          const label = `${pred.class} ${Math.round(pred.score * 100)}%`;
          const fontSize = Math.max(14, Math.min(canvas.width, canvas.height) * 0.02);
          ctx.font = `bold ${fontSize}px sans-serif`;
          const textWidth = ctx.measureText(label).width;
          const textHeight = fontSize + 8;
          
          ctx.fillStyle = color;
          ctx.fillRect(flippedX, y - textHeight - 4, textWidth + 10, textHeight + 4);
          
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, flippedX + 5, y - 6);
        });
      }

      fpsRef.current.count++;
      const now = performance.now();
      if (now - fpsRef.current.lastTime >= 1000) {
        setFps(fpsRef.current.count);
        fpsRef.current.count = 0;
        fpsRef.current.lastTime = now;
      }
    } catch (err) {
      console.error('检测错误:', err);
    }

    if (isStreaming && aiEnabled) {
      animFrameRef.current = requestAnimationFrame(detectObjects);
    }
  }, [isStreaming, aiEnabled, onDetection]);

  useEffect(() => {
    if (isStreaming && aiEnabled) {
      loadModel().then(() => {
        animFrameRef.current = requestAnimationFrame(detectObjects);
      });
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isStreaming, aiEnabled, loadModel, detectObjects]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const toggleCamera = () => {
    if (isStreaming) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const switchCamera = async () => {
    facingModeRef.current = facingModeRef.current === 'user' ? 'environment' : 'user';
    if (isStreaming) {
      stopCamera();
      setTimeout(() => startCamera(), 300);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen?.();
    }
  };

  return (
    <div className={`rounded-lg relative overflow-hidden transition-all ${
      isActive ? 'border-2 border-[var(--cyan-glow)] glow-cyan' : 'border border-[var(--ocean-surface)]'
    } bg-black`}>
      <div className="relative w-full h-full aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted={muted}
          playsInline
          autoPlay
          style={{ transform: 'scaleX(-1)' }}
        />
        
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />

        {!isStreaming && !isLoading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[var(--ocean-deep)] to-black p-8">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-[var(--cyan-glow)]/20 flex items-center justify-center animate-pulse">
                <Camera size={48} className="text-[var(--cyan-glow)]" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[var(--sea-green)] flex items-center justify-center">
                <Video size={12} className="text-white" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">本地摄像头</h3>
            <p className="text-sm text-white/60 mb-1">实时视频流 + AI物体识别</p>
            <p className="text-xs text-white/40 mb-8 text-center max-w-xs">
              基于 TensorFlow.js COCO-SSD 模型<br/>支持80类物体智能检测
            </p>
            
            <button
              onClick={toggleCamera}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[var(--cyan-glow)] to-[#00d4ff] text-white font-semibold hover:shadow-2xl hover:shadow-[var(--cyan-glow)]/30 transition-all transform hover:scale-105"
            >
              <Play size={20} className="group-hover:scale-110 transition-transform" />
              <span>启动摄像头</span>
            </button>

            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-white/5">
                <Scan size={20} className="text-[var(--cyan-glow)] mx-auto mb-1" />
                <div className="text-[10px] text-white/50">AI识别</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <RefreshCw size={20} className="text-[var(--sea-green)] mx-auto mb-1" />
                <div className="text-[10px] text-white/50">前后切换</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <Maximize2 size={20} className="text-[var(--amber)] mx-auto mb-1" />
                <div className="text-[10px] text-white/50">全屏显示</div>
              </div>
            </div>

            <div className="mt-6 p-3 rounded-lg bg-[var(--amber)]/10 border border-[var(--amber)]/20 max-w-md">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="text-[var(--amber)] mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-[var(--amber)]/80 leading-relaxed">
                  首次使用需允许浏览器摄像头权限。如遇问题，请检查：<br/>
                  1. 地址栏左侧是否有🔒图标（点击允许）<br/>
                  2. 摄像头是否被其他程序占用<br/>
                  3. 是否使用 Chrome/Edge/Firefox 浏览器
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full border-4 border-[var(--cyan-glow)]/20 border-t-[var(--cyan-glow)] animate-spin" />
              <Camera size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--cyan-glow)]" />
            </div>
            <p className="text-sm text-white/80 font-medium mb-1">正在连接摄像头...</p>
            <p className="text-xs text-white/50">请在浏览器弹窗中点击"允许"</p>
            
            <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5">
              <div className="w-2 h-2 rounded-full bg-[var(--sea-green)] animate-pulse" />
              <span className="text-xs text-white/60">等待用户响应...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-6">
            <div className="w-16 h-16 rounded-full bg-[var(--coral-red)]/20 flex items-center justify-center mb-4">
              <CameraOff size={32} className="text-[var(--coral-red)]" />
            </div>
            
            <div className="bg-[var(--ocean-deep)] rounded-xl p-4 max-w-md mb-6">
              <pre className="text-sm text-[var(--coral-red)]/90 whitespace-pre-wrap leading-relaxed font-sans">
                {error}
              </pre>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setError(null); hasAttemptedStart.current = false; startCamera(); }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--cyan-glow)] text-white font-medium hover:brightness-110 transition"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                重新启动
              </button>
              
              <button
                onClick={() => setError(null)}
                className="px-6 py-3 rounded-xl bg-white/10 text-white/70 font-medium hover:bg-white/20 transition"
              >
                关闭提示
              </button>
            </div>

            <button
              onClick={() => {
                window.open('https://www.baidu.com/s?wd=浏览器允许摄像头权限+' + navigator.userAgent.split(' ')[0], '_blank');
              }}
              className="mt-4 text-xs text-[var(--cyan-glow)] hover:underline flex items-center gap-1"
            >
              🔗 查看如何开启摄像头权限
            </button>
          </div>
        )}

        {isStreaming && (
          <>
            <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
              <span className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs">
                <span className="w-2 h-2 rounded-full bg-[var(--sea-green)] animate-pulse" />
                <span className="text-white/90 font-medium">● 实时</span>
              </span>
              
              {aiEnabled ? (
                !modelLoading ? (
                  <span className="flex items-center gap-1.5 bg-[var(--cyan-glow)]/20 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs">
                    <Scan size={12} className="text-[var(--cyan-glow)] animate-pulse" />
                    <span className="text-[var(--cyan-glow)] font-medium">AI识别中</span>
                    {fps > 0 && <span className="text-[var(--cyan-glow)]/60">{fps}FPS</span>}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-[var(--amber)]/20 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs">
                    <RefreshCw size={10} className="text-[var(--amber)] animate-spin" />
                    <span className="text-[var(--amber)]">加载AI模型...</span>
                  </span>
                )
              ) : (
                <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs text-white/50">
                  AI已关闭
                </span>
              )}
            </div>

            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
              {detections.length > 0 && (
                <span className="bg-[var(--cyan-glow)]/20 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs text-[var(--cyan-glow)] font-bold">
                  🎯 {detections.length}个目标
                </span>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); switchCamera(); }}
                    className="p-2.5 rounded-xl bg-black/50 backdrop-blur-sm hover:bg-black/70 transition group"
                    title="切换前后摄像头"
                  >
                    <Camera size={18} className="text-white/80 group-hover:text-[var(--cyan-glow)] transition-colors" />
                  </button>
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); setAiEnabled(!aiEnabled); }}
                    className={`p-2.5 rounded-xl backdrop-blur-sm transition ${
                      aiEnabled ? 'bg-[var(--cyan-glow)]/20 hover:bg-[var(--cyan-glow)]/30' : 'bg-black/50 hover:bg-black/70'
                    }`}
                    title={aiEnabled ? '关闭AI识别' : '开启AI识别'}
                  >
                    <Scan size={18} className={aiEnabled ? 'text-[var(--cyan-glow)]' : 'text-white/50'} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                    className="p-2.5 rounded-xl bg-black/50 backdrop-blur-sm hover:bg-black/70 transition"
                  >
                    {muted ? <VolumeX size={18} className="text-white/80" /> : <Volume2 size={18} className="text-white/80" />}
                  </button>
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                    className="p-2.5 rounded-xl bg-black/50 backdrop-blur-sm hover:bg-black/70 transition"
                  >
                    <Maximize2 size={18} className="text-white/80" />
                  </button>
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); stopCamera(); }}
                    className="p-2.5 rounded-xl bg-[var(--coral-red)]/20 backdrop-blur-sm hover:bg-[var(--coral-red)]/30 transition"
                    title="关闭摄像头"
                  >
                    <CameraOff size={18} className="text-[var(--coral-red)]" />
                  </button>
                </div>
              </div>
            </div>

            {detections.length > 0 && (
              <div className="absolute bottom-16 left-2 right-2 z-10">
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto scrollbar-thin">
                  {detections.map((det, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md shadow-lg"
                      style={{
                        backgroundColor: COLORS[idx % COLORS.length] + '40',
                        color: COLORS[idx % COLORS.length],
                        border: `1.5px solid ${COLORS[idx % COLORS.length]}80`
                      }}
                    >
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                      />
                      {det.class.replace(/_/g, ' ')}
                      <span className="opacity-75">{(det.score * 100).toFixed(0)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}