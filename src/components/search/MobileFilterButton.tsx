/**
 * MobileFilterButton — sticky floating "Filtreler" button (mobile only).
 *
 * Faz 10.F2 / Wave-F2 / Agent-F2D.
 *
 * Visible only on `< md` screens. Dispatches a custom event the sheet listens
 * for so we don't need a parent store. Shows an active-filter count badge.
 */
import { useEffect, useState } from 'react'

export const FILTER_SHEET_OPEN_EVENT = 'arsam:filter-sheet-open'

function countActive(search: string): number {
  const params = new URLSearchParams(search)
  let n = 0
  if (params.get('q')?.trim()) n += 1
  const tip = params.get('tip')
  if (tip && tip !== 'Tümü') n += 1
  const il = params.get('il')
  if (il && il !== 'Tümü') n += 1
  if (params.get('priceMax')) n += 1
  return n
}

export default function MobileFilterButton() {
  const [mounted, setMounted] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(countActive(window.location.search))
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <button
      type="button"
      data-filter-sheet-trigger=""
      aria-label={count > 0 ? `Filtreleri aç (${count} aktif)` : 'Filtreleri aç'}
      onClick={() => {
        window.dispatchEvent(new CustomEvent(FILTER_SHEET_OPEN_EVENT))
      }}
      className="fixed bottom-4 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-foreground px-4 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-background shadow-lg transition hover:opacity-90 md:hidden"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <span aria-hidden="true">☰</span>
      <span>Filtreler</span>
      {count > 0 && (
        <span
          data-filter-count=""
          className="ml-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-background px-1.5 py-0.5 text-xs font-medium tabular-nums text-foreground"
        >
          {count}
        </span>
      )}
    </button>
  )
}
