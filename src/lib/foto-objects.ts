/**
 * foto-objects — ObjectURL lifecycle helpers for the /ilan-ver photo upload
 * (Wave F6.A).
 *
 * Why this file exists separately from the FotoUpload component:
 *   1. **Pure & testable.** `URL.createObjectURL` is the only side-effecting
 *      call here; we centralise it so component code can stay declarative.
 *   2. **No localStorage.** Blob URLs MUST stay in-memory. Persisting them to
 *      `arsam.ilan-draft.v1` would burst the 5 MB quota and also crash in
 *      Safari private mode. The draft schema persists *metadata only*
 *      (`{ id, name, size }`); the URLs are regenerated when the wizard
 *      session re-mounts (or shown as fallback placeholders in preview).
 *   3. **Validation is decoupled.** Both Drag-Drop and file-picker code paths
 *      reuse `validatePhotoFile` so the size/type rule lives in one place.
 *
 * SSR safety: the module body has zero top-level side effects. Every helper
 * checks `typeof URL` before calling, so it stays importable from Astro
 * components without crashing during static build.
 */

/** Hard cap — matches FotoUpload's max grid size + spec §4. */
export const MAX_PHOTOS = 8

/** 5 MB per photo — client-side guard, NOT a security boundary. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024

/**
 * In-memory photo entry surfaced to the FotoUpload grid. Only `{ id, name,
 * size }` is persisted to the draft; `url` is regenerated on each mount.
 */
export interface PhotoEntry {
  /** Stable per-session id — survives reorder, used as React key. */
  id: string
  /** `blob:` URL produced by URL.createObjectURL. Empty when restored from metadata. */
  url: string
  /** Original filename — shown in alt text + preview fallback caption. */
  name: string
  /** Bytes — used to drive the "Foto · 2.3 MB" metadata fallback. */
  size: number
}

/**
 * Persisted metadata snapshot. The draft store keeps this subset under
 * `arsam.ilan-draft.v1` so the wizard can re-render thumbnails (with empty
 * URLs) after a refresh/back-button round trip.
 */
export interface PhotoMeta {
  id: string
  name: string
  size: number
}

let idCounter = 0

/** Stable id generator. crypto.randomUUID is preferred when present. */
function nextId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  idCounter += 1
  return `photo-${Date.now().toString(36)}-${idCounter}`
}

/**
 * Build a PhotoEntry from a browser `File`. Caller is responsible for
 * eventually invoking `revokePhoto`/`revokeAll` when the entry leaves state.
 */
export function createPhotoEntry(file: File): PhotoEntry {
  const url = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
    ? URL.createObjectURL(file)
    : ''
  return {
    id: nextId(),
    url,
    name: file.name,
    size: file.size,
  }
}

/** Release the ObjectURL backing a single entry. Safe to call multiple times. */
export function revokePhoto(entry: Pick<PhotoEntry, 'url'>): void {
  if (!entry.url) return
  if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') return
  try {
    URL.revokeObjectURL(entry.url)
  } catch {
    /* ignore — already revoked */
  }
}

/** Convenience wrapper — revokes every entry in the array. */
export function revokeAll(entries: ReadonlyArray<Pick<PhotoEntry, 'url'>>): void {
  for (const e of entries) revokePhoto(e)
}

/** Reduce a PhotoEntry array down to the metadata persisted in the draft. */
export function toPhotoMeta(entries: ReadonlyArray<PhotoEntry>): PhotoMeta[] {
  return entries.map((e) => ({ id: e.id, name: e.name, size: e.size }))
}

/**
 * Validate a single File. Returns a stable error code or `null` when the file
 * is acceptable. Component code resolves the locale-aware message.
 */
export type PhotoValidationError = 'type' | 'size'

export function validatePhotoFile(file: File): PhotoValidationError | null {
  if (!file.type.startsWith('image/')) return 'type'
  if (file.size > MAX_PHOTO_BYTES) return 'size'
  return null
}
