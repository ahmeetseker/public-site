/**
 * SaveSearchButton — "Aramayı kaydet" CTA on /ara (React island, client:idle).
 *
 * Wave F4 / Agent-F4B. Captures `window.location.search` + an optional
 * inline label and pushes a SavedSearchEntry to F3E's `arsam.savedSearches.v1`
 * store (`saveSearch()`). Fires `arsam:saved-searches-changed` so any open
 * /hesabim/aramalar page refreshes.
 *
 * UX flow:
 *   1. Default state: a single "Aramayı kaydet" button.
 *   2. Click → opens an inline name input with placeholder
 *      "Ayvalık zeytinlik 0-2M" and Save/Cancel buttons.
 *   3. On save → `saveSearch({q, filters, label})` + slide-down toast
 *      "Arama kaydedildi" (auto-dismiss).
 *
 * Hidden when there are zero filters / no query (URL pristine), to avoid
 * persisting empty searches that would just clutter the dashboard.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { saveSearch, type SavedSearchEntry } from '../../lib/account-store'
import SaveSearchToast from './SaveSearchToast'

/** Keys we promote into the saved-search `filters` snapshot. */
const FILTER_KEYS = ['tip', 'il', 'ilce', 'priceMin', 'priceMax', 'sort'] as const

function readUrlSnapshot(): { q: string; filters: Record<string, string>; isEmpty: boolean } {
  if (typeof window === 'undefined') return { q: '', filters: {}, isEmpty: true }
  const params = new URLSearchParams(window.location.search)
  const q = params.get('q')?.trim() ?? ''
  const filters: Record<string, string> = {}
  for (const k of FILTER_KEYS) {
    const v = params.get(k)
    if (v && v !== 'Tümü') filters[k] = v
  }
  const isEmpty = q.length === 0 && Object.keys(filters).length === 0
  return { q, filters, isEmpty }
}

function summarize(q: string, filters: Record<string, string>): string {
  const parts: string[] = []
  if (q) parts.push(q)
  if (filters.tip) parts.push(filters.tip)
  if (filters.il) parts.push(filters.il)
  if (filters.priceMax) parts.push(`≤ ${filters.priceMax}`)
  return parts.length > 0 ? parts.join(' · ') : 'Tüm arsalar'
}

export default function SaveSearchButton() {
  const [hydrated, setHydrated] = useState(false)
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [snapshot, setSnapshot] = useState(readUrlSnapshot())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSnapshot(readUrlSnapshot())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editing])

  const onOpen = useCallback(() => {
    // Pre-fill the input with our best-guess summary so the user can edit it
    // instead of staring at a blank box.
    setLabel(summarize(snapshot.q, snapshot.filters))
    setEditing(true)
  }, [snapshot])

  const onCancel = useCallback(() => {
    setEditing(false)
    setLabel('')
  }, [])

  const onSave = useCallback(() => {
    const entry: Omit<SavedSearchEntry, 'id' | 'savedAt'> = {
      q: snapshot.q,
      filters: snapshot.filters,
      label: label.trim() || summarize(snapshot.q, snapshot.filters),
    }
    saveSearch(entry)
    setEditing(false)
    setLabel('')
    setToastVisible(true)
  }, [snapshot, label])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onSave()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    },
    [onSave, onCancel],
  )

  // Until we know the URL state, render nothing — avoids a CTA flash for a
  // pristine /ara visit. Same hidden-while-hydrating pattern as FilterChips.
  if (!hydrated) return null

  // No filters → nothing meaningful to save.
  if (snapshot.isEmpty) return null

  return (
    <div data-save-search="" className="w-full md:w-auto">
      {!editing ? (
        <button
          type="button"
          onClick={onOpen}
          data-save-search-trigger=""
          className={[
            'inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2',
            'text-sm font-medium text-foreground transition hover:bg-foreground/5',
            'focus:outline-none focus:ring-2 focus:ring-foreground/30 md:w-auto',
          ].join(' ')}
        >
          <span aria-hidden="true">☆</span>
          <span>Aramayı kaydet</span>
        </button>
      ) : (
        <div
          data-save-search-form=""
          className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-card p-2 md:flex-row md:items-center"
        >
          <label className="sr-only" htmlFor="save-search-label">
            Buna bir isim ver
          </label>
          <input
            ref={inputRef}
            id="save-search-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Bu aramaya bir isim ver: Ayvalık zeytinlik 0-2M"
            data-save-search-input=""
            maxLength={80}
            className={[
              'min-w-0 flex-1 rounded-full border border-border bg-background px-3 py-1.5',
              'text-sm text-foreground placeholder:text-muted-foreground',
              'focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20',
            ].join(' ')}
          />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onSave}
              data-save-search-confirm=""
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-sm font-medium text-background transition hover:opacity-90"
            >
              Kaydet
            </button>
            <button
              type="button"
              onClick={onCancel}
              data-save-search-cancel=""
              className="inline-flex items-center justify-center rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground/70 transition hover:text-foreground"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      <SaveSearchToast
        visible={toastVisible}
        message="Arama kaydedildi"
        onDone={() => setToastVisible(false)}
      />
    </div>
  )
}
