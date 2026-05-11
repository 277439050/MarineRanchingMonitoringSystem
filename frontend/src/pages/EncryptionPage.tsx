import { useState } from 'react';
import { Shield, Lock, Unlock, Copy, Database, ArrowDown } from 'lucide-react';

const sensorOptions = [
  { did: 'SENSOR_001', name: '水质浮漂集成传感器' },
  { did: 'CTRL_001', name: '水质联动控制柜' },
];

const metricOptions = [
  { key: 'ph', label: 'pH值' },
  { key: 'salt', label: '盐度' },
  { key: 'o2', label: '溶解氧' },
  { key: 'nh3', label: '氨氮' },
  { key: 'health', label: '健康指数' },
];

const mockSensorData: Record<string, Record<string, string>> = {
  SENSOR_001: { ph: '7.91', salt: '18330.50‰', o2: '7.7mg/L', nh3: '1.859mg/L', health: '--%' },
  CTRL_001: { ph: '--', salt: '--', o2: '--', nh3: '--', health: '100.0%' },
};

export default function EncryptionPage() {
  const [selectedSensor, setSelectedSensor] = useState(sensorOptions[0].did);
  const [selectedMetric, setSelectedMetric] = useState(metricOptions[0].key);
  const [sensorValue, setSensorValue] = useState('');
  const [plaintext, setPlaintext] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [result, setResult] = useState('');

  const fetchLatest = () => {
    const data = mockSensorData[selectedSensor]?.[selectedMetric] ?? '--';
    setSensorValue(data);
  };

  const useSensorData = () => {
    if (sensorValue && sensorValue !== '--') {
      setPlaintext(`${selectedMetric}: ${sensorValue} [${new Date().toISOString()}]`);
    }
  };

  const handleEncrypt = () => {
    if (!plaintext.trim()) return;
    const encoded = btoa(unescape(encodeURIComponent(plaintext)));
    const iv = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setCiphertext(encoded);
    setResult(`IV: ${iv}\n密文: ${encoded}`);
  };

  const handleDecrypt = () => {
    if (!ciphertext.trim()) return;
    try {
      const decoded = decodeURIComponent(escape(atob(ciphertext)));
      setResult(`明文: ${decoded}`);
    } catch {
      setResult('解密失败：无效的密文格式');
    }
  };

  const copyResult = () => {
    if (result) navigator.clipboard.writeText(result);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-[var(--cyan-glow)]" />
        <h1 className="text-xl font-semibold text-[var(--cyan-glow)]">数据加密</h1>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[var(--ocean-blue)]" />
          <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">传感器数据</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={selectedSensor}
            onChange={(e) => setSelectedSensor(e.target.value)}
            className="bg-[var(--ocean-deep)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] outline-none focus:border-[var(--cyan-glow)]"
          >
            {sensorOptions.map((s) => (
              <option key={s.did} value={s.did}>{s.name}</option>
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
          <button
            onClick={fetchLatest}
            className="bg-[var(--ocean-surface)] hover:bg-[var(--ocean-surface)]/80 text-[var(--ocean-blue)] rounded-lg px-4 py-2 text-sm transition-colors"
          >
            获取最新数据
          </button>
        </div>
        {sensorValue && (
          <div className="bg-[var(--ocean-deep)] rounded-lg px-4 py-3 text-sm font-mono text-[var(--cyan-glow)]">
            {metricOptions.find((m) => m.key === selectedMetric)?.label}: {sensorValue}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--cyan-glow)]" />
            <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">加密</h2>
          </div>
          <textarea
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
            placeholder="输入明文..."
            rows={4}
            className="w-full bg-[var(--ocean-deep)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] font-mono outline-none focus:border-[var(--cyan-glow)] resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={useSensorData}
              className="bg-[var(--ocean-surface)] hover:bg-[var(--ocean-surface)]/80 text-[var(--ocean-blue)] rounded-lg px-4 py-2 text-sm transition-colors"
            >
              使用传感器数据
            </button>
            <button
              onClick={handleEncrypt}
              className="bg-[var(--cyan-glow)] hover:bg-[var(--cyan-glow)]/90 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
            >
              加密
            </button>
          </div>
        </div>

        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Unlock className="w-4 h-4 text-[var(--ocean-blue)]" />
            <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">解密</h2>
          </div>
          <textarea
            value={ciphertext}
            onChange={(e) => setCiphertext(e.target.value)}
            placeholder="输入密文..."
            rows={4}
            className="w-full bg-[var(--ocean-deep)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--ocean-blue)] font-mono outline-none focus:border-[var(--ocean-blue)] resize-none"
          />
          <button
            onClick={handleDecrypt}
            className="bg-[var(--ocean-blue)] hover:bg-[var(--ocean-blue)]/90 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          >
            解密
          </button>
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDown className="w-4 h-4 text-[var(--cyan-glow)]" />
            <h2 className="text-sm font-semibold text-[var(--ocean-blue)]">结果</h2>
          </div>
          <span className="text-xs text-[var(--ocean-blue)]/50 bg-[var(--ocean-surface)] px-2 py-1 rounded">AES-256-CBC</span>
        </div>
        <textarea
          value={result}
          readOnly
          placeholder="加密/解密结果将显示在此处"
          rows={4}
          className="w-full bg-[var(--ocean-deep)] border border-[var(--ocean-surface)] rounded-lg px-3 py-2 text-sm text-[var(--cyan-glow)] font-mono outline-none resize-none"
        />
        <button
          onClick={copyResult}
          disabled={!result}
          className="flex items-center gap-2 bg-[var(--ocean-surface)] hover:bg-[var(--ocean-surface)]/80 text-[var(--ocean-blue)] rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-40"
        >
          <Copy className="w-3.5 h-3.5" />
          复制结果
        </button>
      </div>
    </div>
  );
}
