/**
 * ilan-draft — SSR-safe localStorage wrapper for /ilan-ver/* wizard.
 *
 * Wave F4 / Agent-F4A.
 *
 * Persists a single draft listing under `arsam.ilan-draft.v1` so the user can
 * resume the 4-step wizard from any tab / refresh / hesabim navigation. Each
 * mutation emits `arsam:ilan-draft-changed` so the React islands stay in sync.
 *
 * Steps (TR):
 *   1. Konum     — il, ilçe, tip
 *   2. Özellikler — alan (m²), imar, tapu, koordinatlar (opsiyonel)
 *   3. Fiyat     — fiyat (TL), açıklama, etiketler, foto slot meta
 *   4. İletişim   — ad, telefon, email, KVKK
 *
 * SSR safety: every export checks `typeof window`. Modules can be imported by
 * React islands without breaking Astro's static build.
 */

export const STORAGE_KEY = 'arsam.ilan-draft.v1'
export const EVENT_NAME = 'arsam:ilan-draft-changed'

export type IlanTip = 'imarli' | 'tarla' | 'zeytinlik' | 'villa-arsasi'
export type ImarDurumu = 'konut' | 'ticari' | 'karma' | 'tarim' | 'yok'
export type TapuTipi = 'mustakil' | 'hisseli'

export interface PhotoSlot {
  /** Stable per-slot id (1, 2, 3). */
  id: 1 | 2 | 3
  /** Optional human label set by user (e.g. "Manzara"). */
  label: string
  /** True if user dropped a file. We don't store the blob — just intent. */
  filled: boolean
}

/**
 * F6.A — uploaded photo metadata. Only `{ id, name, size }` is persisted —
 * blob ObjectURLs stay in-memory inside the FotoUpload component because
 * localStorage would burst at the first 5 MB photo. Preview thumbnails after
 * a session boundary fall back to a metadata caption (see IlanOnizleme).
 */
export interface PhotoMeta {
  id: string
  name: string
  size: number
}

export interface IlanDraft {
  /** Step 1 — Konum */
  il: string
  ilce: string
  tip: IlanTip | ''
  /** Step 2 — Özellikler */
  alan: string
  imar: ImarDurumu | ''
  tapu: TapuTipi | ''
  lat: string
  lng: string
  /** Step 3 — Fiyat & detay */
  fiyat: string
  aciklama: string
  etiketler: string[]
  fotograflar: PhotoSlot[]
  /**
   * F6.A — Uploaded photo metadata (NOT blob). FotoUpload owns the in-memory
   * ObjectURL list; the draft only round-trips persistable metadata so we can
   * show "3 photos uploaded" after a refresh without busting quota.
   */
  photos: PhotoMeta[]
  /** Step 4 — İletişim */
  ad: string
  telefon: string
  email: string
  kvkk: boolean
  /** Internal — highest step reached (1..4). Used to drive resume CTAs. */
  lastStep: 1 | 2 | 3 | 4
  /** ISO timestamp of last mutation. */
  updatedAt: string
}

export const EMPTY_DRAFT: IlanDraft = {
  il: '',
  ilce: '',
  tip: '',
  alan: '',
  imar: '',
  tapu: '',
  lat: '',
  lng: '',
  fiyat: '',
  aciklama: '',
  etiketler: [],
  fotograflar: [
    { id: 1, label: '', filled: false },
    { id: 2, label: '', filled: false },
    { id: 3, label: '', filled: false },
  ],
  photos: [],
  ad: '',
  telefon: '',
  email: '',
  kvkk: false,
  lastStep: 1,
  updatedAt: '',
}

function safeWindow(): Window | null {
  return typeof window !== 'undefined' ? window : null
}

function normalize(raw: unknown): IlanDraft {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_DRAFT }
  const o = raw as Partial<IlanDraft>
  const tip: IlanDraft['tip'] =
    o.tip === 'imarli' || o.tip === 'tarla' || o.tip === 'zeytinlik' || o.tip === 'villa-arsasi'
      ? o.tip
      : ''
  const imar: IlanDraft['imar'] =
    o.imar === 'konut' || o.imar === 'ticari' || o.imar === 'karma' || o.imar === 'tarim' || o.imar === 'yok'
      ? o.imar
      : ''
  const tapu: IlanDraft['tapu'] = o.tapu === 'mustakil' || o.tapu === 'hisseli' ? o.tapu : ''
  const lastStepRaw = typeof o.lastStep === 'number' ? o.lastStep : 1
  const lastStep = (lastStepRaw >= 1 && lastStepRaw <= 4 ? lastStepRaw : 1) as IlanDraft['lastStep']
  const slots = Array.isArray(o.fotograflar) ? o.fotograflar : EMPTY_DRAFT.fotograflar
  const fotograflar: PhotoSlot[] = [1, 2, 3].map((id) => {
    const found = slots.find((p) => p && typeof p === 'object' && (p as PhotoSlot).id === id) as
      | PhotoSlot
      | undefined
    return {
      id: id as 1 | 2 | 3,
      label: typeof found?.label === 'string' ? found.label : '',
      filled: !!found?.filled,
    }
  })
  // F6.A — `photos` is a NEW field; older drafts (pre-F6) lack it. Default to
  // [] and filter out any malformed entries so a stale draft doesn't crash.
  const photosRaw = Array.isArray(o.photos) ? o.photos : []
  const photos: PhotoMeta[] = photosRaw
    .filter((p): p is PhotoMeta =>
      !!p && typeof p === 'object' &&
      typeof (p as PhotoMeta).id === 'string' &&
      typeof (p as PhotoMeta).name === 'string' &&
      typeof (p as PhotoMeta).size === 'number',
    )
    .slice(0, 8)
  return {
    il: typeof o.il === 'string' ? o.il : '',
    ilce: typeof o.ilce === 'string' ? o.ilce : '',
    tip,
    alan: typeof o.alan === 'string' ? o.alan : '',
    imar,
    tapu,
    lat: typeof o.lat === 'string' ? o.lat : '',
    lng: typeof o.lng === 'string' ? o.lng : '',
    fiyat: typeof o.fiyat === 'string' ? o.fiyat : '',
    aciklama: typeof o.aciklama === 'string' ? o.aciklama : '',
    etiketler: Array.isArray(o.etiketler)
      ? o.etiketler.filter((v): v is string => typeof v === 'string' && v.length > 0)
      : [],
    fotograflar,
    photos,
    ad: typeof o.ad === 'string' ? o.ad : '',
    telefon: typeof o.telefon === 'string' ? o.telefon : '',
    email: typeof o.email === 'string' ? o.email : '',
    kvkk: !!o.kvkk,
    lastStep,
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : '',
  }
}

export function getDraft(): IlanDraft {
  const w = safeWindow()
  if (!w) return { ...EMPTY_DRAFT }
  try {
    const raw = w.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_DRAFT }
    return normalize(JSON.parse(raw))
  } catch {
    return { ...EMPTY_DRAFT }
  }
}

export function setDraft(patch: Partial<IlanDraft>): IlanDraft {
  const current = getDraft()
  const merged: IlanDraft = {
    ...current,
    ...patch,
    fotograflar: patch.fotograflar ?? current.fotograflar,
    etiketler: patch.etiketler ?? current.etiketler,
    photos: patch.photos ?? current.photos,
    updatedAt: new Date().toISOString(),
  }
  const w = safeWindow()
  if (w) {
    try {
      w.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    } catch {
      /* quota / private mode — swallow */
    }
    try {
      w.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: merged }))
    } catch {
      /* CustomEvent unsupported */
    }
  }
  return merged
}

export function clearDraft(): void {
  const w = safeWindow()
  if (!w) return
  try {
    w.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  try {
    w.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { ...EMPTY_DRAFT } }))
  } catch {
    /* ignore */
  }
}

export function hasDraft(): boolean {
  const w = safeWindow()
  if (!w) return false
  try {
    return w.localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

// ─────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────

export type StepNumber = 1 | 2 | 3 | 4
export type StepErrors = Record<string, string>

const PHONE_RE = /^(\+?90)?\s?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateStep(step: StepNumber, draft: IlanDraft): StepErrors {
  const errors: StepErrors = {}
  if (step === 1) {
    if (!draft.il.trim()) errors.il = 'Bu alan zorunlu'
    if (!draft.ilce.trim()) errors.ilce = 'Bu alan zorunlu'
    if (!draft.tip) errors.tip = 'İlan tipi seç'
  } else if (step === 2) {
    if (!draft.alan.trim()) {
      errors.alan = 'Bu alan zorunlu'
    } else {
      const n = Number(draft.alan)
      if (!Number.isFinite(n) || n <= 0) errors.alan = 'Geçerli bir alan girin (m²)'
    }
    if (!draft.imar) errors.imar = 'İmar durumu seç'
    if (!draft.tapu) errors.tapu = 'Tapu tipi seç'
    if (draft.lat.trim()) {
      const n = Number(draft.lat)
      if (!Number.isFinite(n) || n < -90 || n > 90) errors.lat = 'Geçerli enlem girin'
    }
    if (draft.lng.trim()) {
      const n = Number(draft.lng)
      if (!Number.isFinite(n) || n < -180 || n > 180) errors.lng = 'Geçerli boylam girin'
    }
  } else if (step === 3) {
    if (!draft.fiyat.trim()) {
      errors.fiyat = 'Bu alan zorunlu'
    } else {
      const n = Number(draft.fiyat.replace(/[^\d]/g, ''))
      if (!Number.isFinite(n) || n <= 0) errors.fiyat = 'Geçerli bir fiyat girin (TL)'
    }
    if (draft.aciklama.trim().length < 20) {
      errors.aciklama = 'En az 20 karakter yaz'
    }
  } else if (step === 4) {
    if (!draft.ad.trim()) errors.ad = 'Bu alan zorunlu'
    if (!draft.telefon.trim()) {
      errors.telefon = 'Bu alan zorunlu'
    } else if (!PHONE_RE.test(draft.telefon.trim())) {
      errors.telefon = 'Geçerli telefon girin'
    }
    if (draft.email.trim() && !EMAIL_RE.test(draft.email.trim())) {
      errors.email = 'Geçerli e-posta girin'
    }
    if (!draft.kvkk) errors.kvkk = 'KVKK onayı zorunlu'
  }
  return errors
}

export function isStepComplete(step: StepNumber, draft: IlanDraft): boolean {
  return Object.keys(validateStep(step, draft)).length === 0
}

/** Step n is reachable when every previous step is complete. */
export function canEnterStep(step: StepNumber, draft: IlanDraft): boolean {
  if (step === 1) return true
  for (let i = 1; i < step; i++) {
    if (!isStepComplete(i as StepNumber, draft)) return false
  }
  return true
}

/** Highest step the user can resume into (1..4 or 5 = preview-ready). */
export function resumeStep(draft: IlanDraft): 1 | 2 | 3 | 4 | 5 {
  for (let i = 1; i <= 4; i++) {
    if (!isStepComplete(i as StepNumber, draft)) return i as 1 | 2 | 3 | 4
  }
  return 5
}

// ─────────────────────────────────────────────────────────────
// SUBMIT — generate a mock ref number (matches existing AT-YYYY-NNNN format).
// ─────────────────────────────────────────────────────────────

export function generateRef(): string {
  const year = new Date().getFullYear()
  const n = Math.floor(1000 + Math.random() * 9000)
  return `AT-${year}-${n}`
}

// ─────────────────────────────────────────────────────────────
// LABEL HELPERS (used by preview + summary)
// ─────────────────────────────────────────────────────────────

export const TIP_LABEL: Record<IlanTip, string> = {
  imarli: 'İmarlı arsa',
  tarla: 'Tarla',
  zeytinlik: 'Zeytinlik',
  'villa-arsasi': 'Villa arsası',
}

export const IMAR_LABEL: Record<ImarDurumu, string> = {
  konut: 'Konut',
  ticari: 'Ticari',
  karma: 'Karma',
  tarim: 'Tarım',
  yok: 'İmarsız',
}

export const TAPU_LABEL: Record<TapuTipi, string> = {
  mustakil: 'Müstakil',
  hisseli: 'Hisseli',
}
