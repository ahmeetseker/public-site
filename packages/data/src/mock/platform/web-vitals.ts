// Web Vitals — Faz 9.19 (Agent-A60)
//
// Cross-tenant samples used by the super-admin /web-vitals dashboard as a
// fallback when the dev localStorage buffer is empty. ~120 samples spread
// across 4 production URLs and all 5 Core Web Vital metric names with
// realistic-ish distributions (most "good", some "needs-improvement", a
// minority "poor"). Will be replaced by the real RUM endpoint later.

export type WebVitalMetricName = 'CLS' | 'INP' | 'LCP' | 'FCP' | 'TTFB'
export type WebVitalRating = 'good' | 'needs-improvement' | 'poor'

export interface WebVitalSample {
  name: WebVitalMetricName
  value: number
  rating: WebVitalRating
  url: string
  timestamp: string
}

// Google's Core Web Vitals thresholds (units: ms except CLS which is unitless).
// Kept here so the dashboard and seed share one source of truth.
export const WEB_VITAL_THRESHOLDS: Record<
  WebVitalMetricName,
  { good: number; poor: number; unit: 'ms' | 'score' }
> = {
  CLS: { good: 0.1, poor: 0.25, unit: 'score' },
  INP: { good: 200, poor: 500, unit: 'ms' },
  LCP: { good: 2500, poor: 4000, unit: 'ms' },
  FCP: { good: 1800, poor: 3000, unit: 'ms' },
  TTFB: { good: 800, poor: 1800, unit: 'ms' },
}

export function rateWebVital(
  name: WebVitalMetricName,
  value: number,
): WebVitalRating {
  const t = WEB_VITAL_THRESHOLDS[name]
  if (value <= t.good) return 'good'
  if (value <= t.poor) return 'needs-improvement'
  return 'poor'
}

const URLS = [
  '/',
  '/parsel-arama',
  '/ilan/[id]',
  '/hesabim',
] as const

// Deterministic-ish factory so the file is reproducible.
function s(
  name: WebVitalMetricName,
  value: number,
  url: string,
  hoursAgo: number,
): WebVitalSample {
  const ts = new Date('2026-05-11T12:00:00Z').getTime() - hoursAgo * 3600_000
  return {
    name,
    value,
    rating: rateWebVital(name, value),
    url,
    timestamp: new Date(ts).toISOString(),
  }
}

// 120 samples — ~24 per metric across 4 URLs.
export const MOCK_WEB_VITALS: readonly WebVitalSample[] = [
  // CLS — mostly good (< 0.1), some borderline, two poor outliers.
  s('CLS', 0.02, URLS[0], 1),
  s('CLS', 0.04, URLS[0], 3),
  s('CLS', 0.08, URLS[0], 5),
  s('CLS', 0.12, URLS[0], 8),
  s('CLS', 0.06, URLS[1], 2),
  s('CLS', 0.03, URLS[1], 4),
  s('CLS', 0.18, URLS[1], 6),
  s('CLS', 0.09, URLS[1], 9),
  s('CLS', 0.07, URLS[2], 1),
  s('CLS', 0.11, URLS[2], 3),
  s('CLS', 0.05, URLS[2], 5),
  s('CLS', 0.28, URLS[2], 7),
  s('CLS', 0.32, URLS[2], 10),
  s('CLS', 0.04, URLS[3], 2),
  s('CLS', 0.06, URLS[3], 4),
  s('CLS', 0.09, URLS[3], 6),
  s('CLS', 0.13, URLS[3], 8),
  s('CLS', 0.05, URLS[0], 12),
  s('CLS', 0.08, URLS[1], 14),
  s('CLS', 0.07, URLS[2], 16),
  s('CLS', 0.04, URLS[3], 18),
  s('CLS', 0.06, URLS[0], 20),
  s('CLS', 0.11, URLS[1], 22),
  s('CLS', 0.09, URLS[2], 24),

  // INP — mostly good (< 200ms).
  s('INP', 84, URLS[0], 1),
  s('INP', 96, URLS[0], 3),
  s('INP', 128, URLS[0], 5),
  s('INP', 184, URLS[0], 8),
  s('INP', 152, URLS[1], 2),
  s('INP', 218, URLS[1], 4),
  s('INP', 168, URLS[1], 6),
  s('INP', 244, URLS[1], 9),
  s('INP', 192, URLS[2], 1),
  s('INP', 284, URLS[2], 3),
  s('INP', 364, URLS[2], 5),
  s('INP', 528, URLS[2], 7),
  s('INP', 612, URLS[2], 10),
  s('INP', 112, URLS[3], 2),
  s('INP', 148, URLS[3], 4),
  s('INP', 188, URLS[3], 6),
  s('INP', 224, URLS[3], 8),
  s('INP', 132, URLS[0], 12),
  s('INP', 172, URLS[1], 14),
  s('INP', 208, URLS[2], 16),
  s('INP', 144, URLS[3], 18),
  s('INP', 96, URLS[0], 20),
  s('INP', 188, URLS[1], 22),
  s('INP', 264, URLS[2], 24),

  // LCP — most under 2500ms, a few stretched.
  s('LCP', 1480, URLS[0], 1),
  s('LCP', 1820, URLS[0], 3),
  s('LCP', 2180, URLS[0], 5),
  s('LCP', 2640, URLS[0], 8),
  s('LCP', 1980, URLS[1], 2),
  s('LCP', 2240, URLS[1], 4),
  s('LCP', 2820, URLS[1], 6),
  s('LCP', 3120, URLS[1], 9),
  s('LCP', 2480, URLS[2], 1),
  s('LCP', 3280, URLS[2], 3),
  s('LCP', 3820, URLS[2], 5),
  s('LCP', 4240, URLS[2], 7),
  s('LCP', 4820, URLS[2], 10),
  s('LCP', 1620, URLS[3], 2),
  s('LCP', 1880, URLS[3], 4),
  s('LCP', 2120, URLS[3], 6),
  s('LCP', 2480, URLS[3], 8),
  s('LCP', 1740, URLS[0], 12),
  s('LCP', 2060, URLS[1], 14),
  s('LCP', 2380, URLS[2], 16),
  s('LCP', 1920, URLS[3], 18),
  s('LCP', 1580, URLS[0], 20),
  s('LCP', 2240, URLS[1], 22),
  s('LCP', 3140, URLS[2], 24),

  // FCP — generally healthy.
  s('FCP', 880, URLS[0], 1),
  s('FCP', 1080, URLS[0], 3),
  s('FCP', 1280, URLS[0], 5),
  s('FCP', 1680, URLS[0], 8),
  s('FCP', 1120, URLS[1], 2),
  s('FCP', 1480, URLS[1], 4),
  s('FCP', 1880, URLS[1], 6),
  s('FCP', 2140, URLS[1], 9),
  s('FCP', 1380, URLS[2], 1),
  s('FCP', 1880, URLS[2], 3),
  s('FCP', 2380, URLS[2], 5),
  s('FCP', 3140, URLS[2], 7),
  s('FCP', 3620, URLS[2], 10),
  s('FCP', 920, URLS[3], 2),
  s('FCP', 1140, URLS[3], 4),
  s('FCP', 1480, URLS[3], 6),
  s('FCP', 1820, URLS[3], 8),
  s('FCP', 1080, URLS[0], 12),
  s('FCP', 1280, URLS[1], 14),
  s('FCP', 1620, URLS[2], 16),
  s('FCP', 1140, URLS[3], 18),
  s('FCP', 980, URLS[0], 20),
  s('FCP', 1380, URLS[1], 22),
  s('FCP', 2080, URLS[2], 24),

  // TTFB — server side, mostly fast.
  s('TTFB', 280, URLS[0], 1),
  s('TTFB', 420, URLS[0], 3),
  s('TTFB', 580, URLS[0], 5),
  s('TTFB', 780, URLS[0], 8),
  s('TTFB', 420, URLS[1], 2),
  s('TTFB', 640, URLS[1], 4),
  s('TTFB', 880, URLS[1], 6),
  s('TTFB', 1120, URLS[1], 9),
  s('TTFB', 540, URLS[2], 1),
  s('TTFB', 820, URLS[2], 3),
  s('TTFB', 1240, URLS[2], 5),
  s('TTFB', 1680, URLS[2], 7),
  s('TTFB', 1940, URLS[2], 10),
  s('TTFB', 320, URLS[3], 2),
  s('TTFB', 480, URLS[3], 4),
  s('TTFB', 640, URLS[3], 6),
  s('TTFB', 820, URLS[3], 8),
  s('TTFB', 380, URLS[0], 12),
  s('TTFB', 520, URLS[1], 14),
  s('TTFB', 720, URLS[2], 16),
  s('TTFB', 460, URLS[3], 18),
  s('TTFB', 340, URLS[0], 20),
  s('TTFB', 580, URLS[1], 22),
  s('TTFB', 940, URLS[2], 24),
]
