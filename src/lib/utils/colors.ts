import type { PSColorConfig } from '@/types';

export function getPSColor(ps: number): PSColorConfig {
  if (ps < 0) {
    return {
      background: '#DC2626',
      border: '#B91C1C',
      text: '#FFFFFF',
      pulse: true,
      opacity: 1,
    };
  } else if (ps < 80) {
    return {
      background: '#EA580C',
      border: '#C2410C',
      text: '#000000',
      pulse: true,
      opacity: 1,
    };
  } else if (ps < 150) {
    return {
      background: '#CA8A04',
      border: '#A16207',
      text: '#FFFFFF',
      pulse: false,
      opacity: 1,
    };
  } else {
    return {
      background: '#0891B2',
      border: '#0E7490',
      text: '#FFFFFF',
      pulse: false,
      opacity: 1,
    };
  }
}

export function getPSColorWithFocus(ps: number, isFocusMode: boolean): PSColorConfig {
  const config = getPSColor(ps);

  if (isFocusMode && ps >= 80) {
    return {
      ...config,
      background: '#6B7280',
      border: '#4B5563',
      text: '#9CA3AF',
      pulse: false,
      opacity: 0.4,
    };
  }

  return config;
}

export function getPSLabel(ps: number): string {
  if (ps < 0) {
    return '极度薄弱';
  } else if (ps < 80) {
    return '薄弱';
  } else if (ps < 150) {
    return '掌握中';
  } else {
    return '熟练';
  }
}

export function getPSProgress(ps: number): number {
  return Math.max(0, Math.min(100, (ps / 200) * 100));
}

export const PS_CSS_VARS = {
  '--ps-critical': '#DC2626',
  '--ps-weak': '#EA580C',
  '--ps-learning': '#CA8A04',
  '--ps-mastered': '#0891B2',
} as const;
