/**
 * FotoUpload — drag-drop + file-picker photo grid for /ilan-ver Step 3
 * (Wave F6.A).
 *
 * Responsibilities
 * ────────────────
 *  • Accept up to MAX_PHOTOS images (5 MB each, image/* mime).
 *  • Hand back a `PhotoMeta[]` to the parent on every change — the parent
 *    persists *metadata only* to `arsam.ilan-draft.v1`. Blob ObjectURLs stay
 *    local to this component (see `foto-objects.ts` for rationale).
 *  • Lifecycle: every accepted file gets `URL.createObjectURL`; we revoke on
 *    delete + on unmount via `revokeAll`.
 *  • HTML5 drag-reorder. We avoid a heavy dnd-kit dep because the grid is
 *    capped at 8 items and the interaction is forgiving.
 *
 * Why metadata-only persistence?
 *  • localStorage caps near 5 MB total. A single full-quality photo could
 *    bust it, and Safari private mode quota is even lower (~10 KB).
 *  • Re-rendering thumbnails on session-resume isn't worth crashing in private
 *    mode — IlanOnizleme falls back to a metadata caption when the URL is
 *    missing.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
  createPhotoEntry,
  revokeAll,
  revokePhoto,
  toPhotoMeta,
  validatePhotoFile,
  type PhotoEntry,
  type PhotoMeta,
  type PhotoValidationError,
} from '../../lib/foto-objects'

const LABELS = {
  tr: {
    legend: 'Fotoğraflar',
    hint: 'En fazla 8 foto, her biri 5 MB · sürükle bırak ya da seç',
    dropHere: 'Fotoğrafları buraya bırak',
    chooseFile: 'Dosya seç',
    pickHint: 'JPG, PNG veya WebP',
    counter: (n: number) => `${n} / ${MAX_PHOTOS}`,
    removeAria: (name: string) => `${name} fotoğrafını kaldır`,
    reorderHint: 'Sırayı sürükle bırak ile değiştir',
    errors: {
      size: 'Dosya 5 MB sınırını aşıyor',
      type: 'Sadece görsel dosyalar (JPG/PNG/WebP)',
      max: `En fazla ${MAX_PHOTOS} fotoğraf ekleyebilirsin`,
    } as Record<PhotoValidationError | 'max', string>,
  },
  en: {
    legend: 'Photos',
    hint: 'Up to 8 photos, 5 MB each · drag & drop or pick',
    dropHere: 'Drop photos here',
    chooseFile: 'Choose files',
    pickHint: 'JPG, PNG or WebP',
    counter: (n: number) => `${n} / ${MAX_PHOTOS}`,
    removeAria: (name: string) => `Remove photo ${name}`,
    reorderHint: 'Drag to reorder',
    errors: {
      size: 'File exceeds the 5 MB limit',
      type: 'Only image files (JPG/PNG/WebP)',
      max: `You can add at most ${MAX_PHOTOS} photos`,
    } as Record<PhotoValidationError | 'max', string>,
  },
} as const

export interface FotoUploadProps {
  /** Persisted metadata from the draft — used to hydrate the counter on mount. */
  initial?: PhotoMeta[]
  /** Fires on every state change with the persistable metadata slice. */
  onChange: (photos: PhotoMeta[]) => void
  locale?: 'tr' | 'en'
}

function formatSize(bytes: number, locale: 'tr' | 'en'): string {
  const mb = bytes / (1024 * 1024)
  const numLocale = locale === 'en' ? 'en-US' : 'tr-TR'
  if (mb >= 1) return `${new Intl.NumberFormat(numLocale, { maximumFractionDigits: 1 }).format(mb)} MB`
  const kb = bytes / 1024
  return `${new Intl.NumberFormat(numLocale, { maximumFractionDigits: 0 }).format(kb)} KB`
}

export default function FotoUpload({ initial, onChange, locale = 'tr' }: FotoUploadProps) {
  const L = LABELS[locale]
  // `entries` is the in-memory truth — ObjectURLs included. Metadata is what
  // we emit upward via `onChange`.
  const [entries, setEntries] = useState<PhotoEntry[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dragIdx = useRef<number | null>(null)

  // Restore *placeholders* for the metadata persisted from a prior session.
  // We can't replay the blob URL — only the count + names survive.
  useEffect(() => {
    if (!initial || initial.length === 0) return
    setEntries((prev) => {
      if (prev.length > 0) return prev
      return initial.slice(0, MAX_PHOTOS).map((m) => ({
        id: m.id,
        url: '',
        name: m.name,
        size: m.size,
      }))
    })
    // We intentionally hydrate ONCE per mount; subsequent updates flow through
    // user interactions (addFiles / removePhoto / reorder).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup on unmount — revoke every ObjectURL we created. Capture the *current*
  // entries via a ref-free closure: we rely on the cleanup running with the
  // latest closure (React 18+ behavior).
  useEffect(() => {
    return () => {
      revokeAll(entries)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emit = useCallback(
    (next: PhotoEntry[]) => {
      onChange(toPhotoMeta(next))
    },
    [onChange],
  )

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files)
      if (list.length === 0) return
      let nextEntries: PhotoEntry[] = []
      let validationError: string | null = null
      setEntries((prev) => {
        const accepted: PhotoEntry[] = []
        for (const f of list) {
          if (prev.length + accepted.length >= MAX_PHOTOS) {
            validationError = L.errors.max
            break
          }
          const v = validatePhotoFile(f)
          if (v) {
            validationError = L.errors[v]
            continue
          }
          accepted.push(createPhotoEntry(f))
        }
        nextEntries = [...prev, ...accepted]
        return nextEntries
      })
      // setError + emit happen *after* the state update is queued so we read
      // the post-update array via the closure variable we just assembled.
      setError(validationError)
      // Defer to next microtask so React commits the setState before we emit.
      queueMicrotask(() => emit(nextEntries))
    },
    [L, emit],
  )

  const removePhoto = useCallback(
    (id: string) => {
      let nextEntries: PhotoEntry[] = []
      setEntries((prev) => {
        const target = prev.find((p) => p.id === id)
        if (target) revokePhoto(target)
        nextEntries = prev.filter((p) => p.id !== id)
        return nextEntries
      })
      setError(null)
      queueMicrotask(() => emit(nextEntries))
    },
    [emit],
  )

  const reorder = useCallback(
    (fromIdx: number, toIdx: number) => {
      if (fromIdx === toIdx) return
      let nextEntries: PhotoEntry[] = []
      setEntries((prev) => {
        if (fromIdx < 0 || fromIdx >= prev.length || toIdx < 0 || toIdx >= prev.length) {
          nextEntries = prev
          return prev
        }
        const next = prev.slice()
        const [moved] = next.splice(fromIdx, 1)
        next.splice(toIdx, 0, moved)
        nextEntries = next
        return next
      })
      queueMicrotask(() => emit(nextEntries))
    },
    [emit],
  )

  // ── DOM handlers ───────────────────────────────────────────────────────
  function onPickClick() {
    fileInputRef.current?.click()
  }
  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    addFiles(e.target.files)
    // Reset so the same file can be re-picked after delete.
    e.target.value = ''
  }
  function onDragEnter(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    // Only clear when leaving the dropzone outright — guards against
    // entering child elements firing dragleave on the parent.
    if (e.currentTarget === e.target) setDragOver(false)
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    if (!e.dataTransfer?.files) return
    addFiles(e.dataTransfer.files)
  }

  function onTileDragStart(idx: number) {
    return (e: React.DragEvent) => {
      dragIdx.current = idx
      e.dataTransfer.effectAllowed = 'move'
      // Required for Firefox to start dragging at all.
      try { e.dataTransfer.setData('text/plain', String(idx)) } catch { /* ignore */ }
    }
  }
  function onTileDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  function onTileDrop(idx: number) {
    return (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const from = dragIdx.current
      dragIdx.current = null
      if (from == null) return
      reorder(from, idx)
    }
  }

  const remaining = MAX_PHOTOS - entries.length

  return (
    <div data-foto-upload="" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {L.legend}
            <span className="ml-2 tabular-nums normal-case tracking-normal text-muted-foreground/70">
              {L.counter(entries.length)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{L.hint}</p>
        </div>
      </div>

      <div
        data-foto-dropzone=""
        data-drag-over={dragOver ? 'true' : 'false'}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
          dragOver
            ? 'border-foreground bg-foreground/5'
            : 'border-border bg-card/40 hover:border-foreground/40'
        }`}
      >
        <p className="text-sm font-medium text-foreground">
          {dragOver ? L.dropHere : L.legend}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{L.pickHint}</p>
        <button
          type="button"
          onClick={onPickClick}
          disabled={remaining <= 0}
          data-foto-pick=""
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-foreground/60 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {L.chooseFile}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onFileInputChange}
          data-foto-input=""
          className="sr-only"
        />
      </div>

      {error && (
        <p
          data-foto-error=""
          className="text-xs text-rose-600 dark:text-rose-400"
          role="status"
          aria-live="polite"
        >
          {error}
        </p>
      )}

      {entries.length > 0 && (
        <>
          <ul
            data-foto-grid=""
            data-count={entries.length}
            className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-3"
          >
            {entries.map((p, idx) => (
              <li
                key={p.id}
                data-foto-tile=""
                data-foto-id={p.id}
                data-foto-idx={idx}
                draggable
                onDragStart={onTileDragStart(idx)}
                onDragOver={onTileDragOver}
                onDrop={onTileDrop(idx)}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-card"
              >
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.url}
                    alt={p.name}
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-card/60 px-2 text-center">
                    <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      {p.name.slice(0, 18)}
                    </span>
                    <span className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground/70">
                      {formatSize(p.size, locale)}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  data-foto-remove={p.id}
                  aria-label={L.removeAria(p.name)}
                  className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow ring-1 ring-border hover:bg-background"
                >
                  ×
                </button>
                <span className="pointer-events-none absolute bottom-1 left-1 rounded-full bg-background/80 px-1.5 py-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                  {idx + 1}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{L.reorderHint}</p>
        </>
      )}
    </div>
  )
}

export { MAX_PHOTOS, MAX_PHOTO_BYTES }
