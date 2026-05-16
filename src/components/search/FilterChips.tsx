/**
 * FilterChips — active filter chips row above results (React island, client:idle).
 *
 * Faz 10.F2 / Wave-F2 / Agent-F2D.
 *
 * Reads URL params (?q, ?tip, ?il, ?priceMax) and renders a removable chip per
 * active filter. Clicking the ✕ rebuilds URLSearchParams without that key and
 * navigates. "Tümünü temizle" routes to the base /ara path.
 *
 * No client store — URL is the single source of truth. We re-read params on
 * mount so the chips match the SSR'd grid, then never re-render in place
 * (navigation is a full document reload).
 */
import { useEffect, useState } from 'react'

type Active = {
  key: string
  label: string
}

function priceLabel(raw: string): string {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return raw
  if (n >= 1_000_000) {
    // 2.000.000 → "₺2M"
    const m = n / 1_000_000
    const trimmed = m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)
    return `₺${trimmed}M`
  }
  if (n >= 1_000) {
    const k = n / 1_000
    const trimmed = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)
    return `₺${trimmed}K`
  }
  return `₺${n}`
}

function readActive(search: string): Active[] {
  const params = new URLSearchParams(search)
  const out: Active[] = []
  const q = params.get('q')?.trim()
  if (q) out.push({ key: 'q', label: `Anahtar: ${q}` })
  const tip = params.get('tip')
  if (tip && tip !== 'Tümü') out.push({ key: 'tip', label: `Tip: ${tip}` })
  const il = params.get('il')
  if (il && il !== 'Tümü') out.push({ key: 'il', label: `Şehir: ${il}` })
  const priceMax = params.get('priceMax')
  if (priceMax) out.push({ key: 'priceMax', label: `Max fiyat: ${priceLabel(priceMax)}` })
  return out
}

function removeKey(key: string): string {
  const next = new URLSearchParams(window.location.search)
  next.delete(key)
  const qs = next.toString()
  return qs ? `${window.location.pathname}?${qs}` : window.location.pathname
}

function clearAllHref(): string {
  // Preserve only the locale prefix: /ara or /en/ara.
  return window.location.pathname
}

export default function FilterChips() {
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState<Active[]>([])

  useEffect(() => {
    setActive(readActive(window.location.search))
    setMounted(true)
  }, [])

  // SSR / pre-hydration → render nothing (mirrors CompareDock pattern).
  if (!mounted || active.length === 0) return null

  return (
    <div
      role="region"
      aria-label="Aktif filtreler"
      data-filter-chips=""
      className="mb-4 flex flex-wrap items-center gap-2"
    >
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Aktif filtreler
      </span>
      {active.map((a) => (
        <a
          key={a.key}
          href={removeKey(a.key)}
          data-filter-chip={a.key}
          aria-label={`${a.label} filtresini kaldır`}
          className="group inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-sm text-foreground transition hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-foreground/30"
        >
          <span>{a.label}</span>
          <span
            aria-hidden="true"
            className="text-muted-foreground transition group-hover:text-foreground"
          >
            ×
          </span>
        </a>
      ))}
      <a
        href={clearAllHref()}
        data-filter-clear-all=""
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground/60 transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/30"
      >
        Tümünü temizle
      </a>
    </div>
  )
}
