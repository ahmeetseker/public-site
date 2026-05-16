// reviews.ts — Wave F6.B.
//
// localStorage-backed reviews per listing. SSR-safe (all accessors guarded).
// Key: `arsam.reviews.v1` (JSON-serialised Record<listingId, Review[]>).
//
// First time a listing is read, if no entries exist for it, we seed 3
// deterministic mock reviews derived from listing.id so the demo never shows
// "no reviews yet". Subsequent reads return whatever is in storage (user adds
// are appended).
//
// API:
//   - getReviews(listingId)       → Review[]   (auto-seeds on first read)
//   - addReview(review)           → void       (appends, refreshes storage)
//   - getAverageRating(listingId) → number     (rounded to 1 decimal, 0 if empty)
//   - clearReviews(listingId?)    → void       (test helper)

export const STORAGE_KEY = 'arsam.reviews.v1'

export type ReviewRating = 1 | 2 | 3 | 4 | 5

export interface Review {
  id: string
  listingId: string
  author: string
  rating: ReviewRating
  body: string
  createdAt: number
}

type ReviewStore = Record<string, Review[]>

function isReview(v: unknown): v is Review {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.listingId === 'string' &&
    typeof o.author === 'string' &&
    typeof o.rating === 'number' &&
    o.rating >= 1 &&
    o.rating <= 5 &&
    typeof o.body === 'string' &&
    typeof o.createdAt === 'number'
  )
}

function safeStorage(): Storage | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage
}

function readAll(): ReviewStore {
  const ls = safeStorage()
  if (!ls) return {}
  try {
    const raw = ls.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: ReviewStore = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(v)) continue
      out[k] = v.filter(isReview)
    }
    return out
  } catch {
    return {}
  }
}

function writeAll(store: ReviewStore): void {
  const ls = safeStorage()
  if (!ls) return
  try {
    ls.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // quota exceeded — silently drop.
  }
}

// Tiny deterministic PRNG so the same listingId always produces the same
// seed reviews. xfnv1a hash + mulberry32 — both well-known small-space PRNGs.
function xfnv1a(str: string): () => number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h ^= h >>> 16) >>> 0
  }
}

function mulberry32(seedFn: () => number): () => number {
  let a = seedFn()
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SEED_AUTHORS = [
  'Mehmet K.',
  'Ayşe Y.',
  'Burak T.',
  'Selin A.',
  'Fatma D.',
  'Ali R.',
]

const SEED_BODIES = [
  'Konumu çok iyi, sahile yakın. Ofis ekibi her sorumu sabırla yanıtladı, gezdirme programı çok düzgündü.',
  'Tapu durumu net, sınırlar açık. Profesyonel bir ekip, aracısız ofis avantajı gerçekten hissediliyor.',
  'Çevresi gelişiyor, yatırım için biçilmiş kaftan. İlanın fotoğrafları yerinde gerçeği yansıtıyor.',
  'Yola cephe avantajı çok güzel. Beklediğimden de iyi çıktı, gezerken vakit kaybı olmadı.',
  'Bölge sakin, manzara doğal. İlanın açıklamasında belirtilen her detay yerinde bire bir uydu.',
  'Fiyat-performans çok dengeli. Süreç şeffaf yürüdü, taraflar arasında net iletişim kuruldu.',
]

function seedReviews(listingId: string): Review[] {
  const rand = mulberry32(xfnv1a(listingId))
  const out: Review[] = []
  // Deterministic base time: derive an "anchor" timestamp from the listingId
  // so SSR + tests don't depend on Date.now (which changes per run).
  const baseTime = 1_700_000_000_000 + Math.floor(rand() * 60 * 86_400_000) // up to 60d window
  for (let i = 0; i < 3; i++) {
    const ratingPool: ReviewRating[] = [3, 4, 4, 5, 5, 5]
    const rating = ratingPool[Math.floor(rand() * ratingPool.length)] ?? 5
    const author = SEED_AUTHORS[Math.floor(rand() * SEED_AUTHORS.length)] ?? 'Anonim'
    const body = SEED_BODIES[Math.floor(rand() * SEED_BODIES.length)] ?? ''
    out.push({
      id: `seed-${listingId}-${i}`,
      listingId,
      author,
      rating,
      body,
      // Earlier seeds get older timestamps so newest-first sort is stable.
      createdAt: baseTime - i * 86_400_000,
    })
  }
  return out
}

/**
 * Returns reviews for a listing. If storage has no entries for this
 * listingId yet, seeds 3 deterministic mocks and persists them so
 * subsequent reads (including a future addReview call) build on top of
 * the same baseline.
 */
export function getReviews(listingId: string): Review[] {
  if (!listingId) return []
  const store = readAll()
  if (Array.isArray(store[listingId])) {
    return store[listingId]
  }
  const seeded = seedReviews(listingId)
  store[listingId] = seeded
  writeAll(store)
  return seeded
}

/**
 * Append a review for its listing. Returns the persisted list (newest-first).
 * Caller is responsible for validation — see AddReviewForm for the UI checks.
 */
export function addReview(review: Review): Review[] {
  const store = readAll()
  // Make sure seeds exist so newly-added reviews don't replace the baseline.
  const existing = Array.isArray(store[review.listingId])
    ? store[review.listingId]
    : seedReviews(review.listingId)
  // Newest-first ordering inside the array.
  const next = [review, ...existing]
  store[review.listingId] = next
  writeAll(store)
  return next
}

/**
 * Average rating across all reviews for a listing. Returns 0 if none.
 * Rounded to 1 decimal so UI displays cleanly (e.g. "4.3").
 */
export function getAverageRating(listingId: string): number {
  const list = getReviews(listingId)
  if (list.length === 0) return 0
  const sum = list.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((sum / list.length) * 10) / 10
}

/**
 * Test/dev helper. Clears all reviews when no listingId is provided,
 * or only the entries for the given listing.
 */
export function clearReviews(listingId?: string): void {
  const ls = safeStorage()
  if (!ls) return
  if (!listingId) {
    try {
      ls.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    return
  }
  const store = readAll()
  delete store[listingId]
  writeAll(store)
}

/**
 * Generate a short id for client-side review creation. Not collision-proof
 * across users (this app is single-user demo), but good enough to dedupe
 * within one browser.
 */
export function makeReviewId(): string {
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
