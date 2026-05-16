// Wave F27.B — shared command palette shell.
//
// Atolye-admin (F15.B), super-admin (F16.A) and public-site (F24.C) each
// had a near-identical CommandPalette component (≈85% reuse per the F16
// retrospective). This base extracts the shared chrome:
//
//   - backdrop-blur modal + centered card
//   - autofocus search input + close button
//   - sectioned list with ↑↓/Enter/Esc keyboard navigation
//   - "recent searches" chip row when the query is empty
//   - footer keyboard hint strip
//
// What stays app-specific: entity search, locale-aware copy, routing
// (react-router `navigate()` vs Astro `window.location.href`), focus-trap
// behaviour. Apps wrap this base, pass `sections` + `recent`, and handle
// activation in `onActivate(item)`.
//
// The base is intentionally **icon-library-agnostic** — it imports nothing
// from `@landx/icons` and instead accepts an optional `Icon` field on each
// `PaletteItem`. Magnifying-glass + close icons are inline SVGs.

import { useEffect, useMemo, useRef, useState } from 'react'
import type { FlatSection, PaletteItem } from './types'

export interface CommandPaletteBaseProps {
  open: boolean
  onClose: () => void
  query: string
  onQueryChange: (q: string) => void
  sections: ReadonlyArray<FlatSection>
  recent?: ReadonlyArray<string>
  onApplyRecent?: (recent: string) => void
  onActivate: (item: PaletteItem) => void
  /** ARIA label for the dialog and the search input. */
  ariaLabel?: string
  ariaSearchLabel?: string
  placeholder?: string
  closeLabel?: string
  recentLabel?: string
  emptyLabel?: string
  navHint?: string
  openHint?: string
  closeHint?: string
  /** Footer brand chip (e.g. "arsam", "arsam ops"). */
  brand?: string
  /**
   * Optional ref to the inner card. Useful for apps that install a
   * focus-trap on the card itself (public-site F23.0 a11y).
   */
  cardRef?: React.RefObject<HTMLDivElement | null>
}

interface FlatRow {
  item: PaletteItem
  flatIndex: number
}

function flatten(sections: ReadonlyArray<FlatSection>): FlatRow[] {
  const rows: FlatRow[] = []
  let flatIndex = 0
  for (const sec of sections) {
    for (const item of sec.items) {
      rows.push({ item, flatIndex: flatIndex++ })
    }
  }
  return rows
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

export function CommandPaletteBase({
  open,
  onClose,
  query,
  onQueryChange,
  sections,
  recent,
  onApplyRecent,
  onActivate,
  ariaLabel = 'Komut paleti',
  ariaSearchLabel = 'Arama',
  placeholder = 'Komut, sayfa veya kayıt ara…',
  closeLabel = 'Kapat',
  recentLabel = 'SON ARAMALAR',
  emptyLabel = 'Sonuç bulunamadı.',
  navHint = 'gez',
  openHint = 'aç',
  closeHint = 'kapat',
  brand = 'arsam',
  cardRef,
}: CommandPaletteBaseProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const flat = useMemo(() => flatten(sections), [sections])

  // Reset activeIndex + autofocus on open. Apps own query reset + recent
  // hydration (they decide whether to clear the query between mounts), so
  // we don't touch those here.
  useEffect(() => {
    if (!open) return
    setActiveIndex(0)
    const t = window.setTimeout(() => inputRef.current?.focus(), 30)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-palette-index="${activeIndex}"]`,
    )
    node?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (flat.length ? (i + 1) % flat.length : 0))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const row = flat[activeIndex]
      if (row) onActivate(row.item)
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!open) return null

  const hasRecent = !query.trim() && recent && recent.length > 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/40 px-4 pt-[10vh] backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={cardRef}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            aria-label={ariaSearchLabel}
            data-testid="command-palette-input"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1">
          {hasRecent && (
            <div className="px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {recentLabel}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {recent!.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => (onApplyRecent ? onApplyRecent(r) : onQueryChange(r))}
                    className="rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sections.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              {emptyLabel}
            </div>
          ) : (
            sections.map((sec) => (
              <div key={sec.label} className="py-1">
                <div className="px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {sec.label}
                </div>
                {sec.items.map((item) => {
                  const row = flat.find((r) => r.item.id === item.id)
                  const flatIndex = row?.flatIndex ?? -1
                  const isActive = flatIndex === activeIndex
                  const Icon = item.Icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      data-palette-index={flatIndex}
                      data-testid={`palette-item-${item.id}`}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      onClick={() => onActivate(item)}
                      className={
                        'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ' +
                        (isActive
                          ? 'bg-foreground/5 text-foreground'
                          : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground')
                      }
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint && (
                        <span className="truncate text-xs text-muted-foreground">
                          {item.hint}
                        </span>
                      )}
                      {item.shortcut && (
                        <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-foreground/[0.02] px-3 py-2 text-[11px] text-muted-foreground">
          <div className="flex gap-3">
            <span>
              <kbd className="rounded border border-border bg-card px-1 py-0.5 font-mono text-[10px]">
                ↑↓
              </kbd>{' '}
              {navHint}
            </span>
            <span>
              <kbd className="rounded border border-border bg-card px-1 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>{' '}
              {openHint}
            </span>
            <span>
              <kbd className="rounded border border-border bg-card px-1 py-0.5 font-mono text-[10px]">
                Esc
              </kbd>{' '}
              {closeHint}
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]">{brand}</span>
        </div>
      </div>
    </div>
  )
}

export default CommandPaletteBase
