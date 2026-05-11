import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch {
      setError('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#e0f2fe] via-[#f0f5fa] to-[#ecfdf5] flex items-center justify-center">
      <style>{`
        @keyframes waveSlide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes floatBlob {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-30px) scale(1.1); opacity: 0.3; }
        }
        @keyframes particleRise {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }
      `}</style>

      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'rgba(8,145,178,0.08)', animation: 'floatBlob 8s ease-in-out infinite' }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl"
        style={{ background: 'rgba(59,130,246,0.06)', animation: 'floatBlob 10s ease-in-out infinite 2s' }}
      />
      <div
        className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-3xl"
        style={{ background: 'rgba(16,185,129,0.06)', animation: 'floatBlob 12s ease-in-out infinite 4s' }}
      />

      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: 'rgba(8,145,178,0.3)',
            left: `${(i * 5.3) % 100}%`,
            bottom: `${(i * 3.7) % 30}%`,
            animation: `particleRise ${8 + (i % 7) * 2}s linear infinite ${i * 0.8}s`,
          }}
        />
      ))}

      <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none" style={{ height: '35%' }}>
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="absolute bottom-0 h-full"
          style={{ width: '200%', animation: 'waveSlide 12s linear infinite' }}
        >
          <path
            fill="rgba(8,145,178,0.06)"
            d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,218.7C672,213,768,171,864,165.3C960,160,1056,192,1152,197.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L0,320Z"
          />
        </svg>
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="absolute bottom-0 h-full"
          style={{ width: '200%', animation: 'waveSlide 8s linear infinite reverse' }}
        >
          <path
            fill="rgba(59,130,246,0.04)"
            d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L0,320Z"
          />
        </svg>
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="absolute bottom-0 h-full"
          style={{ width: '200%', animation: 'waveSlide 15s linear infinite' }}
        >
          <path
            fill="rgba(16,185,129,0.04)"
            d="M0,256L48,261.3C96,267,192,277,288,272C384,267,480,245,576,234.7C672,224,768,224,864,229.3C960,235,1056,245,1152,250.7C1248,256,1344,256,1392,256L1440,256L1440,320L0,320Z"
          />
        </svg>
      </div>

      <div className="relative z-10 glass-card w-[420px] p-8 animate-glow-breathe">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--ocean-blue)] font-mono tracking-wider mb-2">
            海洋智能牧场监测预测系统
          </h1>
          <p className="text-sm text-[var(--ocean-blue)]/50 tracking-widest">
            智慧海洋 · 精准养殖
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名"
              className="w-full px-4 py-3 rounded-lg bg-[var(--ocean-deep)] border border-[var(--ocean-surface)] text-[var(--ocean-blue)] placeholder-[var(--ocean-blue)]/30 focus:outline-none focus:border-[var(--cyan-glow)] focus:ring-1 focus:ring-[var(--cyan-glow)]/20 transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              className="w-full px-4 py-3 rounded-lg bg-[var(--ocean-deep)] border border-[var(--ocean-surface)] text-[var(--ocean-blue)] placeholder-[var(--ocean-blue)]/30 focus:outline-none focus:border-[var(--cyan-glow)] focus:ring-1 focus:ring-[var(--cyan-glow)]/20 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--ocean-surface)] accent-[var(--cyan-glow)]"
            />
            <label htmlFor="remember" className="text-sm text-[var(--ocean-blue)]/50 cursor-pointer">
              记住账号
            </label>
          </div>

          {error && (
            <div className="text-sm text-[var(--coral-red)] text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--cyan-glow)] text-white font-semibold hover:shadow-[0_4px_20px_rgba(8,145,178,0.3)] active:shadow-[0_4px_30px_rgba(8,145,178,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
      </div>
    </div>
  );
}
