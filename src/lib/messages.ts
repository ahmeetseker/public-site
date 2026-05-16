/**
 * messages — `arsam.messages.v1` localStorage adapter (Wave F9.B).
 *
 * Backs the /hesabim/mesajlar real-time mock: 3 deterministic seeded threads,
 * deterministic 5sn polling office-reply injector, and read-receipt + typing
 * indicator state. Public-site is SSG with no backend; everything is mocked
 * client-side and survives reload via localStorage.
 *
 * Spec: `docs/superpowers/specs/2026-05-14-wave-f9-page-deepening-remainder-design.md` §5.
 */

export const MESSAGES_KEY = 'arsam.messages.v1'
export const EVENT_MESSAGES_CHANGED = 'arsam:messages-changed'

export type MessageFrom = 'me' | 'office'
export type AttachmentType = 'image' | 'document'

export interface MessageAttachment {
  url: string
  type: AttachmentType
  name: string
}

export interface Message {
  /** msg-<threadId>-NNN, monotonic per thread. */
  id: string
  threadId: string
  from: MessageFrom
  body: string
  attachments?: MessageAttachment[]
  /** Read receipt — applies only to from:'me'. office messages omit. */
  read?: boolean
  createdAt: number
}

export interface Thread {
  /** thr-NNN */
  id: string
  officeName: string
  officeAvatar?: string
  listingTitle?: string
  unreadCount: number
  /** Transient — not persisted across reloads; reset to undefined on read. */
  isOfficeTyping?: boolean
}

interface MessagesStore {
  threads: Thread[]
  messages: Message[]
}

/** Deterministic seed anchor — all initial timestamps derive from here. */
const SEED_ANCHOR_MS = Date.parse('2026-05-14T12:00:00Z')

/** Office reply probability per polling tick (per thread). 0.15 = 15%. */
const OFFICE_REPLY_PROBABILITY = 0.15

/** Polling tick bucket size in ms — used to make per-tick decisions deterministic. */
const TICK_BUCKET_MS = 5_000

// ──────────────────────────────────────────────────────────────────────────
// Storage primitives
// ──────────────────────────────────────────────────────────────────────────

function safeWindow(): Window | null {
  return typeof window !== 'undefined' ? window : null
}

function isAttachment(v: unknown): v is MessageAttachment {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.url === 'string' &&
    (o.type === 'image' || o.type === 'document') &&
    typeof o.name === 'string'
  )
}

function isMessage(v: unknown): v is Message {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  if (
    typeof o.id !== 'string' ||
    typeof o.threadId !== 'string' ||
    (o.from !== 'me' && o.from !== 'office') ||
    typeof o.body !== 'string' ||
    typeof o.createdAt !== 'number'
  )
    return false
  if (o.attachments !== undefined) {
    if (!Array.isArray(o.attachments)) return false
    if (!o.attachments.every(isAttachment)) return false
  }
  if (o.read !== undefined && typeof o.read !== 'boolean') return false
  return true
}

function isThread(v: unknown): v is Thread {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.officeName === 'string' &&
    typeof o.unreadCount === 'number' &&
    (o.officeAvatar === undefined || typeof o.officeAvatar === 'string') &&
    (o.listingTitle === undefined || typeof o.listingTitle === 'string') &&
    (o.isOfficeTyping === undefined || typeof o.isOfficeTyping === 'boolean')
  )
}

function readRaw(): MessagesStore {
  if (typeof localStorage === 'undefined') return { threads: [], messages: [] }
  try {
    const raw = localStorage.getItem(MESSAGES_KEY)
    if (!raw) return { threads: [], messages: [] }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return { threads: [], messages: [] }
    }
    const threadsRaw = (parsed as Record<string, unknown>).threads
    const messagesRaw = (parsed as Record<string, unknown>).messages
    if (!Array.isArray(threadsRaw) || !Array.isArray(messagesRaw)) {
      return { threads: [], messages: [] }
    }
    const threads = threadsRaw.filter(isThread)
    const messages = messagesRaw.filter(isMessage)
    // Dedupe threads + messages by id (last-write-wins).
    const tSeen = new Set<string>()
    const tOut: Thread[] = []
    for (const t of threads) {
      if (tSeen.has(t.id)) continue
      tSeen.add(t.id)
      tOut.push(t)
    }
    const mSeen = new Set<string>()
    const mOut: Message[] = []
    for (const m of messages) {
      if (mSeen.has(m.id)) continue
      mSeen.add(m.id)
      mOut.push(m)
    }
    return { threads: tOut, messages: mOut }
  } catch {
    return { threads: [], messages: [] }
  }
}

function writeRaw(store: MessagesStore): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(store))
  } catch {
    /* quota / private-mode — swallow */
  }
  const w = safeWindow()
  if (w) {
    try {
      w.dispatchEvent(
        new CustomEvent(EVENT_MESSAGES_CHANGED, { detail: store }),
      )
    } catch {
      /* ignore */
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Public API — threads + messages
// ──────────────────────────────────────────────────────────────────────────

/** All threads, ordered by last activity (newest message first). */
export function getThreads(): Thread[] {
  const { threads, messages } = readRaw()
  const lastByThread = new Map<string, number>()
  for (const m of messages) {
    const cur = lastByThread.get(m.threadId) ?? 0
    if (m.createdAt > cur) lastByThread.set(m.threadId, m.createdAt)
  }
  return [...threads].sort((a, b) => {
    const aT = lastByThread.get(a.id) ?? 0
    const bT = lastByThread.get(b.id) ?? 0
    return bT - aT
  })
}

/** Messages in a thread, oldest first. */
export function getMessages(threadId: string): Message[] {
  return readRaw()
    .messages.filter((m) => m.threadId === threadId)
    .sort((a, b) => a.createdAt - b.createdAt)
}

/** Last message in a thread, or undefined if empty. */
export function getLastMessage(threadId: string): Message | undefined {
  const msgs = getMessages(threadId)
  return msgs[msgs.length - 1]
}

/** Total unread count across all threads. */
export function getTotalUnread(): number {
  return readRaw().threads.reduce((s, t) => s + t.unreadCount, 0)
}

/**
 * Append a user message to a thread. Returns the persisted message.
 * read=false by default — the office "reads" later via deterministic delay.
 */
export function sendMessage(
  threadId: string,
  body: string,
  attachments?: MessageAttachment[],
  now: number = Date.now(),
): Message | null {
  const store = readRaw()
  const thread = store.threads.find((t) => t.id === threadId)
  if (!thread) return null
  const trimmed = body.trim()
  if (!trimmed && (!attachments || attachments.length === 0)) return null

  const existing = store.messages.filter((m) => m.threadId === threadId)
  const nextSeq = existing.length + 1
  const msg: Message = {
    id: `msg-${threadId}-${String(nextSeq).padStart(3, '0')}`,
    threadId,
    from: 'me',
    body: trimmed,
    attachments: attachments && attachments.length > 0 ? attachments : undefined,
    read: false,
    createdAt: now,
  }
  writeRaw({
    threads: store.threads,
    messages: [...store.messages, msg],
  })
  return msg
}

/**
 * Append a mock office reply. Used by the polling loop + the typing-indicator
 * follow-up. The body is seeded by thread.id + tick bucket so polling stays
 * deterministic across reloads (same Date.now bucket → same reply).
 */
export function addMockReply(
  threadId: string,
  now: number = Date.now(),
  bodyOverride?: string,
): Message | null {
  const store = readRaw()
  const thread = store.threads.find((t) => t.id === threadId)
  if (!thread) return null
  const existing = store.messages.filter((m) => m.threadId === threadId)
  const nextSeq = existing.length + 1
  const body = bodyOverride ?? pickReplyBody(threadId, now)
  const msg: Message = {
    id: `msg-${threadId}-${String(nextSeq).padStart(3, '0')}`,
    threadId,
    from: 'office',
    body,
    createdAt: now,
  }
  // Increment unread + clear isOfficeTyping on the thread.
  const nextThreads = store.threads.map((t) =>
    t.id === threadId
      ? {
          ...t,
          unreadCount: t.unreadCount + 1,
          isOfficeTyping: undefined,
        }
      : t,
  )
  writeRaw({
    threads: nextThreads,
    messages: [...store.messages, msg],
  })
  return msg
}

/** Mark every office message in a thread as "seen" + zero unreadCount. */
export function markThreadAsRead(threadId: string): void {
  const store = readRaw()
  const thread = store.threads.find((t) => t.id === threadId)
  if (!thread) return
  const needsThread = thread.unreadCount > 0
  // Also flip read=true on the user's outbound messages (read receipts).
  const nextMessages = store.messages.map((m) =>
    m.threadId === threadId && m.from === 'me' && m.read !== true
      ? { ...m, read: true }
      : m,
  )
  const messagesChanged = nextMessages.some(
    (m, i) => m.read !== store.messages[i].read,
  )
  if (!needsThread && !messagesChanged) return
  writeRaw({
    threads: store.threads.map((t) =>
      t.id === threadId ? { ...t, unreadCount: 0 } : t,
    ),
    messages: nextMessages,
  })
}

/** Set isOfficeTyping flag on a thread (transient). */
export function setOfficeTyping(threadId: string, typing: boolean): void {
  const store = readRaw()
  const thread = store.threads.find((t) => t.id === threadId)
  if (!thread) return
  if ((thread.isOfficeTyping ?? false) === typing) return
  writeRaw({
    threads: store.threads.map((t) =>
      t.id === threadId
        ? { ...t, isOfficeTyping: typing ? true : undefined }
        : t,
    ),
    messages: store.messages,
  })
}

// ──────────────────────────────────────────────────────────────────────────
// Deterministic seeded helpers
// ──────────────────────────────────────────────────────────────────────────

/**
 * djb2 string hash → unsigned 32-bit int. Used for deterministic dice rolls
 * keyed by (threadId + tickBucket) so polling decisions reproduce.
 */
export function hashString(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0
  }
  return h >>> 0
}

/**
 * Returns a deterministic [0, 1) float for the (threadId, tickBucket) pair.
 * Used by `shouldInjectReply()` to decide whether to add a mock reply for
 * this thread on this 5s polling tick.
 */
export function tickRoll(threadId: string, tickBucket: number): number {
  const h = hashString(`${threadId}:${tickBucket}`)
  return (h % 10_000) / 10_000
}

/** True if the given thread should receive a mock office reply on this tick. */
export function shouldInjectReply(
  threadId: string,
  now: number,
  probability: number = OFFICE_REPLY_PROBABILITY,
): boolean {
  const tickBucket = Math.floor(now / TICK_BUCKET_MS)
  return tickRoll(threadId, tickBucket) < probability
}

const REPLY_POOL: string[] = [
  'Merhaba, ilanla ilgili size geri dönüyorum.',
  'Detayları sizinle paylaşmak isterim.',
  'Görüşme için bu hafta uygun olur musunuz?',
  'Tapuyu inceledim, her şey yolunda.',
  'Fiyatta küçük bir esnetme yapabiliriz.',
  'Bölgede başka uygun ilanlarımız da var.',
  'Yarın saat 14:00 sizin için uygun mu?',
  'Resimleri az önce galeride güncelledim.',
]

function pickReplyBody(threadId: string, now: number): string {
  const bucket = Math.floor(now / TICK_BUCKET_MS)
  const idx = hashString(`${threadId}:reply:${bucket}`) % REPLY_POOL.length
  return REPLY_POOL[idx]
}

// ──────────────────────────────────────────────────────────────────────────
// Seed
// ──────────────────────────────────────────────────────────────────────────

/**
 * Populates storage with 3 deterministic mock threads + initial messages if
 * the store is empty. Idempotent — second call is a no-op.
 *
 * Spec §5 fixes the office names and initial message bodies; do NOT alter
 * without spec update.
 */
export function seedIfEmpty(): void {
  const current = readRaw()
  if (current.threads.length > 0) return

  const anchor = SEED_ANCHOR_MS
  const threads: Thread[] = [
    {
      id: 'thr-001',
      officeName: 'Çeşme Sahil Emlak',
      listingTitle: 'Çeşme · Alaçatı 2 dönüm tarla',
      unreadCount: 1,
    },
    {
      id: 'thr-002',
      officeName: 'Bodrum Marina Emlak',
      listingTitle: 'Bodrum · Yalıkavak deniz manzaralı arsa',
      unreadCount: 0,
    },
    {
      id: 'thr-003',
      officeName: 'Datça Yarımada Emlak',
      listingTitle: 'Datça · 5 dönüm zeytinlik',
      unreadCount: 2,
    },
  ]

  const messages: Message[] = [
    // thr-001: 3 messages, 1 unread office reply
    {
      id: 'msg-thr-001-001',
      threadId: 'thr-001',
      from: 'me',
      body: 'Merhaba, ilanla ilgili bilgi almak istiyorum.',
      read: true,
      createdAt: anchor - 6 * 60 * 60 * 1000,
    },
    {
      id: 'msg-thr-001-002',
      threadId: 'thr-001',
      from: 'office',
      body: 'Merhaba, ilan hala satılık. Detayları paylaşabilirim.',
      createdAt: anchor - 5 * 60 * 60 * 1000,
    },
    {
      id: 'msg-thr-001-003',
      threadId: 'thr-001',
      from: 'office',
      body: 'Yarın yerinde görüşme yapabiliriz, uygun musunuz?',
      createdAt: anchor - 2 * 60 * 60 * 1000,
    },
    // thr-002: 2 messages, 0 unread (all read)
    {
      id: 'msg-thr-002-001',
      threadId: 'thr-002',
      from: 'me',
      body: 'Bu arsa için tapu durumu nedir?',
      read: true,
      createdAt: anchor - 24 * 60 * 60 * 1000,
    },
    {
      id: 'msg-thr-002-002',
      threadId: 'thr-002',
      from: 'office',
      body: 'Müstakil tapu, imar durumu konut.',
      createdAt: anchor - 22 * 60 * 60 * 1000,
    },
    // thr-003: 4 messages, 2 unread
    {
      id: 'msg-thr-003-001',
      threadId: 'thr-003',
      from: 'me',
      body: 'Zeytinlik için fiyatta esneme olabilir mi?',
      read: true,
      createdAt: anchor - 3 * 24 * 60 * 60 * 1000,
    },
    {
      id: 'msg-thr-003-002',
      threadId: 'thr-003',
      from: 'office',
      body: 'Tabii, pazarlık payımız var. Müsait olduğunuzda görüşelim.',
      createdAt: anchor - 2 * 24 * 60 * 60 * 1000,
    },
    {
      id: 'msg-thr-003-003',
      threadId: 'thr-003',
      from: 'office',
      body: 'Bu hafta sonu yerinde gezi yapabiliriz.',
      createdAt: anchor - 1 * 24 * 60 * 60 * 1000,
    },
    {
      id: 'msg-thr-003-004',
      threadId: 'thr-003',
      from: 'office',
      body: 'Resimleri tekrar güncelledim, son haline bakabilirsiniz.',
      createdAt: anchor - 1 * 60 * 60 * 1000,
    },
  ]

  writeRaw({ threads, messages })
}

/** Test-only — wipes both threads + messages. */
export function clearAllMessages(): void {
  writeRaw({ threads: [], messages: [] })
}

// ──────────────────────────────────────────────────────────────────────────
// Validation helpers (used by AttachmentDialog)
// ──────────────────────────────────────────────────────────────────────────

const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|#|$)/i

/** Returns true if `value` parses as an http(s) URL. */
export function isValidUrl(value: string): boolean {
  return URL_RE.test(value.trim())
}

/** Guesses an attachment type from the URL extension. Defaults to 'document'. */
export function guessAttachmentType(url: string): AttachmentType {
  return IMAGE_EXT_RE.test(url) ? 'image' : 'document'
}

/** Derives a friendly filename from a URL (last path segment, default 'ek'). */
export function deriveAttachmentName(url: string): string {
  try {
    const u = new URL(url)
    const seg = u.pathname.split('/').filter(Boolean).pop()
    if (seg) return decodeURIComponent(seg)
  } catch {
    /* fallthrough */
  }
  return 'ek'
}

// ──────────────────────────────────────────────────────────────────────────
// Cursor insert helper (used by EmojiPicker)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Returns the new text + new caret position after inserting `insert` at the
 * given selection. Pure helper — DOM access stays in the component.
 */
export function insertAtCursor(
  current: string,
  selectionStart: number,
  selectionEnd: number,
  insert: string,
): { value: string; caret: number } {
  const start = Math.max(0, Math.min(selectionStart, current.length))
  const end = Math.max(start, Math.min(selectionEnd, current.length))
  const value = current.slice(0, start) + insert + current.slice(end)
  return { value, caret: start + insert.length }
}
