export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${min}:${s}`;
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

export function formatMetric(metric: string, value: number): string {
  if (value == null || isNaN(value)) return '--';
  const decimals: Record<string, number> = {
    ph: 2,
    salt: 2,
    o2: 2,
    nh3: 3,
    health: 1,
  };
  const d = decimals[metric] ?? 2;
  return value.toFixed(d);
}

export function getO2Level(o2: number): 'red' | 'yellow' | 'normal' {
  if (o2 < 3.5) return 'red';
  if (o2 < 5.0) return 'yellow';
  return 'normal';
}

export function getMetricColor(metric: string, value: number): string {
  switch (metric) {
    case 'o2': {
      const level = getO2Level(value);
      if (level === 'red') return 'var(--coral-red)';
      if (level === 'yellow') return 'var(--amber)';
      return 'var(--cyan-glow)';
    }
    case 'ph':
      if (value < 6.5 || value > 9.0) return 'var(--coral-red)';
      if (value < 7.0 || value > 8.5) return 'var(--amber)';
      return 'var(--cyan-glow)';
    case 'nh3':
      if (value > 5.0) return 'var(--coral-red)';
      if (value > 2.0) return 'var(--amber)';
      return 'var(--cyan-glow)';
    case 'salt':
      if (value < 10 || value > 35) return 'var(--coral-red)';
      return 'var(--cyan-glow)';
    case 'health':
      if (value < 40) return 'var(--coral-red)';
      if (value < 70) return 'var(--amber)';
      return 'var(--sea-green)';
    default:
      return 'var(--cyan-glow)';
  }
}

export function getMetricUnit(metric: string): string {
  const units: Record<string, string> = {
    ph: '',
    salt: '‰',
    o2: 'mg/L',
    nh3: 'mg/L',
    health: '%',
  };
  return units[metric] ?? '';
}

export function getMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    ph: 'pH值',
    salt: '盐度',
    o2: '溶解氧',
    nh3: '氨氮',
    health: '健康指数',
  };
  return labels[metric] ?? metric;
}
