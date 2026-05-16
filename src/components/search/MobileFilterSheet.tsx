/**
 * MobileFilterSheet — bottom-sheet modal (mobile filter UX).
 *
 * Faz 10.F2 / Wave-F2 / Agent-F2D.
 *
 * Listens for `arsam:filter-sheet-open` from MobileFilterButton. Mirrors the
 * FilterSidebar fields (q, tip, il, priceMax). Sticky footer: "Tümünü sıfırla"
 * left + "Sonuçları gör (N)" primary submit right. ESC + backdrop close.
 *
 * URL state strategy: submit builds URLSearchParams (preserving `sort` if not
 * default) and assigns to window.location — full document reload mirrors the
 * SSR-form pattern. No client-side store.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { trapFocus } from '@/lib/a11y'
import { FILTER_SHEET_OPEN_EVENT } from './MobileFilterButton'

export interface Props {
  /** Listing types (e.g., ['İmarlı','Tarla','Zeytinlik','Villa Arsası']) */
  types: string[]
  /** Unique city list (server-computed) */
  cities: string[]
  /** Total potential results — shown in CTA until form changes */
  totalCount: number
  /** Path prefix for locale (e.g., '/en' for English, '' for TR) */
  basePath?: string
}

type FormState = {
  q: string
  tip: string
  il: string
  priceMax: string
}

function readInitial(): FormState {
  if (typeof window === 'undefined') {
    return { q: '', tip: 'Tümü', il: 'Tümü', priceMax: '' }
  }
  const params = new URLSearchParams(window.location.search)
  return {
    q: params.get('q') ?? '',
    tip: params.get('tip') ?? 'Tümü',
    il: params.get('il') ?? 'Tümü',
    priceMax: params.get('priceMax') ?? '',
  }
}

function buildHref(form: FormState, basePath: string): string {
  const next = new URLSearchParams()
  if (form.q.trim()) next.set('q', form.q.trim())
  if (form.tip && form.tip !== 'Tümü') next.set('tip', form.tip)
  if (form.il && form.il !== 'Tümü') next.set('il', form.il)
  if (form.priceMax && Number(form.priceMax) > 0) next.set('priceMax', form.priceMax)
  // Preserve sort if non-default.
  const current = new URLSearchParams(window.location.search)
  const sort = current.get('sort')
  if (sort && sort !== 'lastUpdate') next.set('sort', sort)
  const qs = next.toString()
  const path = `${basePath}/ara`
  return qs ? `${path}?${qs}` : path
}

export default function MobileFilterSheet({
  types,
  cities,
  totalCount,
  basePath = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(() => ({
    q: '',
    tip: 'Tümü',
    il: 'Tümü',
    priceMax: '',
  }))
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)

  // Hydrate from URL once.
  useEffect(() => {
    setForm(readInitial())
  }, [])

  // Open trigger from MobileFilterButton.
  useEffect(() => {
    const onOpen = () => {
      setForm(readInitial())
      setOpen(true)
    }
    window.addEventListener(FILTER_SHEET_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(FILTER_SHEET_OPEN_EVENT, onOpen)
  }, [])

  // ESC close + focus trap entry (Wave F23.C: shared `trapFocus` helper).
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    // Lock body scroll while open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Install focus trap on the dialog. `trapFocus` moves focus into the
    // container and restores it to the previously-active element on teardown.
    // We override the initial target so it lands on the first form field
    // rather than the close (×) button.
    const dialog = dialogRef.current
    let teardown: (() => void) | null = null
    if (dialog) {
      teardown = trapFocus(dialog, {
        initialFocus: firstFieldRef.current ?? undefined,
        restoreFocus: true,
      })
    }
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      teardown?.()
    }
  }, [open])

  const onSubmit = useCallback(
    (e: { preventDefault: () => void }) => {
      e.preventDefault()
      const href = buildHref(form, basePath)
      window.location.href = href
    },
    [form, basePath],
  )

  const onReset = useCallback(() => {
    window.location.href = `${basePath}/ara`
  }, [basePath])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((s) => ({ ...s, [key]: value }))

  const hasChanges = useMemo(() => {
    const initial = readInitial()
    return (
      initial.q !== form.q ||
      initial.tip !== form.tip ||
      initial.il !== form.il ||
      initial.priceMax !== form.priceMax
    )
  }, [form])

  if (!open) return null

  return (
    <div
      role="presentation"
      data-filter-sheet=""
      className="fixed inset-0 z-50 md:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Sheet */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filtreler"
        data-filter-sheet-dialog=""
        className="absolute inset-x-0 bottom-0 flex max-h-[80vh] flex-col rounded-t-2xl bg-card shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Drag handle / header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Filtreler
            </div>
            <h2 className="mt-0.5 font-serif text-lg font-medium tracking-tight">
              Aramayı <em className="font-normal italic">daralt</em>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Kapat"
            data-filter-sheet-close=""
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:text-foreground"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
          data-filter-sheet-form=""
        >
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              <label className="block">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Anahtar kelime
                </span>
                <input
                  ref={firstFieldRef}
                  type="search"
                  name="q"
                  value={form.q}
                  onChange={(e) => setField('q', e.target.value)}
                  placeholder="İlçe, mahalle, anahtar…"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-[hsl(var(--placeholder))] focus:border-foreground/30 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Tip
                </span>
                <select
                  name="tip"
                  value={form.tip}
                  onChange={(e) => setField('tip', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
                >
                  <option value="Tümü">Tümü</option>
                  {types.map((ty) => (
                    <option key={ty} value={ty}>
                      {ty}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Şehir
                </span>
                <select
                  name="il"
                  value={form.il}
                  onChange={(e) => setField('il', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
                >
                  <option value="Tümü">Tümü</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Fiyat aralığı — Max (TL)
                </span>
                <input
                  type="number"
                  name="priceMax"
                  value={form.priceMax}
                  onChange={(e) => setField('priceMax', e.target.value)}
                  min="0"
                  step="100000"
                  placeholder="Sınırsız"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-[hsl(var(--placeholder))] focus:border-foreground/30 focus:outline-none"
                />
              </label>
            </div>
          </div>

          {/* Sticky footer */}
          <div className="flex items-center justify-between gap-2 border-t border-border bg-card px-4 py-3">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Tümünü sıfırla
            </button>
            <button
              type="submit"
              data-filter-sheet-apply=""
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
            >
              {hasChanges ? 'Uygula' : `Sonuçları gör (${totalCount})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
