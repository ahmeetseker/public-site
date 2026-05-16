// Web Vitals client — Faz 9.19 (Agent-A60)
//
// Public surface: `initWebVitals()` — called from RootLayout.astro client-side.
// Contract with A56 (RootLayout owner): function name + module path are FIXED.
//
// Behavior:
// - Collects CLS, INP, LCP, FCP, TTFB via `web-vitals` package.
// - POSTs each metric to `/api/metrics` (best-effort — endpoint may not exist;
//   fetch errors swallowed so they never affect UX).
// - Mirrors the last 50 metrics into `localStorage['arsam.web-vitals.recent.v1']`
//   as a rolling buffer so the super-admin dashboard can read SOMETHING in dev.
// - Idempotent: a module-level boolean prevents double-registration.
// - SSR-safe: every browser API gated on `typeof window !== 'undefined'`.

export const WEB_VITALS_STORAGE_KEY = 'arsam.web-vitals.recent.v1'
export const WEB_VITALS_BUFFER_LIMIT = 50
export const WEB_VITALS_ENDPOINT = '/api/metrics'

export type WebVitalName = 'CLS' | 'INP' | 'LCP' | 'FCP' | 'TTFB'
export type WebVitalRating = 'good' | 'needs-improvement' | 'poor'

export interface WebVitalRecord {
  name: WebVitalName
  value: number
  rating: WebVitalRating
  url: string
  timestamp: string
}

let initialized = false

export function initWebVitals(): void {
  if (initialized) return
  if (typeof window === 'undefined') return
  initialized = true

  // Dynamic import keeps the package out of the initial Astro page bundle
  // and lets the Vite chunker emit a separate file for it.
  void import('web-vitals')
    .then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const handler = (metric: {
        name: string
        value: number
        rating: WebVitalRating
      }) => {
        const record: WebVitalRecord = {
          name: metric.name as WebVitalName,
          value: metric.value,
          rating: metric.rating,
          url: typeof location !== 'undefined' ? location.pathname : '/',
          timestamp: new Date().toISOString(),
        }
        appendToLocalBuffer(record)
        void postMetric(record)
      }
      onCLS(handler)
      onINP(handler)
      onLCP(handler)
      onFCP(handler)
      onTTFB(handler)
    })
    .catch(() => {
      // web-vitals failed to load (offline, blocked) — silently skip.
      initialized = false
    })
}

// Internal helpers — exported for the super-admin dashboard.

export function readLocalBuffer(): WebVitalRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(WEB_VITALS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    // Defensive: filter shape-checked entries.
    return parsed.filter(isWebVitalRecord)
  } catch {
    return []
  }
}

export function clearLocalBuffer(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(WEB_VITALS_STORAGE_KEY)
  } catch {
    // private mode / quota — no-op.
  }
}

function appendToLocalBuffer(record: WebVitalRecord): void {
  try {
    const current = readLocalBuffer()
    current.push(record)
    const trimmed =
      current.length > WEB_VITALS_BUFFER_LIMIT
        ? current.slice(current.length - WEB_VITALS_BUFFER_LIMIT)
        : current
    window.localStorage.setItem(WEB_VITALS_STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage may throw (quota / private mode). Best-effort only.
  }
}

async function postMetric(record: WebVitalRecord): Promise<void> {
  try {
    await fetch(WEB_VITALS_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(record),
      // Stay non-blocking and survive page-unload.
      keepalive: true,
    })
  } catch {
    // Endpoint may not exist in dev / production yet — discard silently.
  }
}

function isWebVitalRecord(value: unknown): value is WebVitalRecord {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.name === 'string' &&
    typeof v.value === 'number' &&
    typeof v.rating === 'string' &&
    typeof v.url === 'string' &&
    typeof v.timestamp === 'string'
  )
}
