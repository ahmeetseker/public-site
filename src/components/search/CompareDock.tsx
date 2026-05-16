/**
 * CompareDock — sticky bottom bar (React island, client:load).
 *
 * Faz 9.16 / Wave-11 / Agent-A52.
 *
 * Shows when at least 1 listing is selected; provides CTA to /karsilastir?ids=...
 * Subscribes to `arsam:compare-changed` so toggles anywhere on the page reflect here.
 */
import { useEffect, useState } from 'react'
import {
  EVENT_NAME,
  MAX,
  clear,
  getCompareIds,
} from '../../lib/compare-store'

export default function CompareDock() {
  const [ids, setIds] = useState<string[]>([])
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    const sync = () => setIds(getCompareIds())
    sync()
    setMounted(true)
    window.addEventListener(EVENT_NAME, sync as EventListener)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT_NAME, sync as EventListener)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // SSR + initial hydration → render nothing until we've read storage,
  // and render nothing if selection is empty.
  if (!mounted || ids.length === 0) return null

  const href = `/karsilastir?ids=${ids.join(',')}`
  const atCap = ids.length >= MAX

  return (
    <div
      role="region"
      aria-label="Karşılaştırma listesi"
      data-compare-dock=""
      data-count={ids.length}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-foreground px-2 font-mono text-xs tabular-nums text-background">
            {ids.length}
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-serif text-base tracking-tight text-foreground">
              {ids.length} arsa seçildi
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {atCap ? `Üst sınır (${MAX}) — karşılaştırmaya hazır` : `En çok ${MAX} arsa eklenebilir`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => clear()}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground transition hover:border-foreground hover:text-foreground"
          >
            Temizle
          </button>
          <a
            href={href}
            data-compare-cta=""
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-background transition hover:opacity-90"
          >
            Karşılaştır
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </div>
  )
}
