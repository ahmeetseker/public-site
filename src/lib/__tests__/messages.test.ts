// Vitest: messages.ts adapter (Wave F9.B).
//
// `arsam.messages.v1` localStorage adapter backs the /hesabim/mesajlar
// real-time mock. Twelve cases cover spec §5: seed determinism, send + reply
// lifecycle, read-receipt + thread unread semantics, deterministic polling
// dice rolls, attachment helpers, cursor-insert helper, and malformed
// payload survival.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  MESSAGES_KEY,
  type Message,
  addMockReply,
  clearAllMessages,
  deriveAttachmentName,
  getLastMessage,
  getMessages,
  getThreads,
  getTotalUnread,
  guessAttachmentType,
  hashString,
  insertAtCursor,
  isValidUrl,
  markThreadAsRead,
  seedIfEmpty,
  sendMessage,
  setOfficeTyping,
  shouldInjectReply,
  tickRoll,
} from '../messages'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('messages', () => {
  it('seedIfEmpty populates 3 deterministic threads + initial messages when empty', () => {
    expect(getThreads()).toEqual([])
    seedIfEmpty()
    const threads = getThreads()
    expect(threads).toHaveLength(3)
    const ids = threads.map((t) => t.id).sort()
    expect(ids).toEqual(['thr-001', 'thr-002', 'thr-003'])
    // Initial unreadCount values per spec.
    const byId = new Map(threads.map((t) => [t.id, t]))
    expect(byId.get('thr-001')?.unreadCount).toBe(1)
    expect(byId.get('thr-002')?.unreadCount).toBe(0)
    expect(byId.get('thr-003')?.unreadCount).toBe(2)
    // Messages exist per thread.
    expect(getMessages('thr-001').length).toBeGreaterThan(0)
    expect(getMessages('thr-002').length).toBeGreaterThan(0)
    expect(getMessages('thr-003').length).toBeGreaterThan(0)
  })

  it('seedIfEmpty is idempotent — second call leaves storage untouched', () => {
    seedIfEmpty()
    const before = localStorage.getItem(MESSAGES_KEY)
    seedIfEmpty()
    const after = localStorage.getItem(MESSAGES_KEY)
    expect(after).toBe(before)
  })

  it('getThreads orders by last-activity newest-first', () => {
    seedIfEmpty()
    const list = getThreads()
    // Per seed: thr-001 last office reply at anchor-2h; thr-002 at anchor-22h;
    // thr-003 at anchor-1h → expected order thr-003, thr-001, thr-002.
    expect(list.map((t) => t.id)).toEqual(['thr-003', 'thr-001', 'thr-002'])
  })

  it('sendMessage appends a user message with read=false + monotonic id', () => {
    seedIfEmpty()
    const before = getMessages('thr-001')
    const beforeLen = before.length
    const msg = sendMessage('thr-001', 'Yeni mesajım', undefined, 1_700_000_000_000)
    expect(msg).not.toBeNull()
    expect(msg?.from).toBe('me')
    expect(msg?.read).toBe(false)
    expect(msg?.body).toBe('Yeni mesajım')
    expect(msg?.id).toBe(`msg-thr-001-${String(beforeLen + 1).padStart(3, '0')}`)
    expect(getMessages('thr-001')).toHaveLength(beforeLen + 1)
  })

  it('sendMessage rejects empty body without attachments + ignores unknown thread', () => {
    seedIfEmpty()
    expect(sendMessage('thr-001', '   ')).toBeNull()
    expect(sendMessage('thr-999', 'merhaba')).toBeNull()
    // But: empty body with attachments works.
    const msg = sendMessage(
      'thr-001',
      '',
      [{ url: 'https://x/y.png', type: 'image', name: 'y.png' }],
      1_700_000_000_000,
    )
    expect(msg).not.toBeNull()
    expect(msg?.attachments).toHaveLength(1)
  })

  it('addMockReply appends an office message + increments unread + clears typing', () => {
    seedIfEmpty()
    setOfficeTyping('thr-002', true)
    expect(getThreads().find((t) => t.id === 'thr-002')?.isOfficeTyping).toBe(true)
    const before = getMessages('thr-002').length
    const beforeUnread =
      getThreads().find((t) => t.id === 'thr-002')?.unreadCount ?? 0
    const msg = addMockReply('thr-002', 1_700_000_000_000)
    expect(msg).not.toBeNull()
    expect(msg?.from).toBe('office')
    expect(getMessages('thr-002')).toHaveLength(before + 1)
    const after = getThreads().find((t) => t.id === 'thr-002')
    expect(after?.unreadCount).toBe(beforeUnread + 1)
    expect(after?.isOfficeTyping).toBeUndefined()
  })

  it('markThreadAsRead zeroes unread + flips outbound message read=true', () => {
    seedIfEmpty()
    // Drop a fresh user message (read=false) into thr-003 so we have something
    // to flip.
    sendMessage('thr-003', 'okundu testi', undefined, 1_700_000_000_000)
    expect(getTotalUnread()).toBeGreaterThan(0)
    const beforeOutbound = getMessages('thr-003').filter(
      (m: Message) => m.from === 'me',
    )
    expect(beforeOutbound.some((m) => m.read !== true)).toBe(true)

    markThreadAsRead('thr-003')

    expect(
      getThreads().find((t) => t.id === 'thr-003')?.unreadCount,
    ).toBe(0)
    const afterOutbound = getMessages('thr-003').filter(
      (m: Message) => m.from === 'me',
    )
    expect(afterOutbound.every((m) => m.read === true)).toBe(true)
    // No-op on second call.
    const snapshot = localStorage.getItem(MESSAGES_KEY)
    markThreadAsRead('thr-003')
    expect(localStorage.getItem(MESSAGES_KEY)).toBe(snapshot)
  })

  it('tickRoll + shouldInjectReply are deterministic per (threadId, tick)', () => {
    const t = 'thr-test'
    const now = 1_700_000_000_000
    const r1 = tickRoll(t, Math.floor(now / 5_000))
    const r2 = tickRoll(t, Math.floor(now / 5_000))
    expect(r1).toBe(r2)
    expect(r1).toBeGreaterThanOrEqual(0)
    expect(r1).toBeLessThan(1)
    // Same now → same shouldInjectReply.
    expect(shouldInjectReply(t, now)).toBe(shouldInjectReply(t, now))
    // probability=1 always true, probability=0 always false.
    expect(shouldInjectReply(t, now, 1)).toBe(true)
    expect(shouldInjectReply(t, now, 0)).toBe(false)
  })

  it('hashString is stable + non-trivial', () => {
    expect(hashString('a')).toBe(hashString('a'))
    expect(hashString('a')).not.toBe(hashString('b'))
    expect(hashString('')).toBeGreaterThanOrEqual(0)
  })

  it('isValidUrl / guessAttachmentType / deriveAttachmentName cover URL helper contract', () => {
    expect(isValidUrl('https://example.com/foo.png')).toBe(true)
    expect(isValidUrl('http://example.com/path')).toBe(true)
    expect(isValidUrl('ftp://example.com')).toBe(false)
    expect(isValidUrl('not-a-url')).toBe(false)
    expect(isValidUrl('  ')).toBe(false)

    expect(guessAttachmentType('https://x/y.png')).toBe('image')
    expect(guessAttachmentType('https://x/y.JPG?v=1')).toBe('image')
    expect(guessAttachmentType('https://x/y.pdf')).toBe('document')

    expect(deriveAttachmentName('https://example.com/path/photo.png')).toBe('photo.png')
    expect(deriveAttachmentName('https://example.com/')).toBe('ek')
    expect(deriveAttachmentName('garbage')).toBe('ek')
  })

  it('insertAtCursor inserts at selection + computes new caret', () => {
    expect(insertAtCursor('hello world', 5, 5, '!')).toEqual({
      value: 'hello! world',
      caret: 6,
    })
    expect(insertAtCursor('abc', 1, 2, 'XY')).toEqual({
      value: 'aXYc',
      caret: 3,
    })
    // Out-of-range selection clamps safely.
    expect(insertAtCursor('a', 99, 99, 'b')).toEqual({ value: 'ab', caret: 2 })
    expect(insertAtCursor('a', -1, -1, 'b')).toEqual({ value: 'ba', caret: 1 })
  })

  it('survives malformed payload — returns empty store', () => {
    localStorage.setItem(MESSAGES_KEY, '{not json')
    expect(getThreads()).toEqual([])
    expect(getMessages('thr-001')).toEqual([])
    expect(getTotalUnread()).toBe(0)
    // seedIfEmpty recovers.
    seedIfEmpty()
    expect(getThreads()).toHaveLength(3)
  })

  it('getLastMessage + clearAllMessages helpers', () => {
    seedIfEmpty()
    const last = getLastMessage('thr-001')
    expect(last).toBeDefined()
    expect(last?.threadId).toBe('thr-001')
    clearAllMessages()
    expect(getThreads()).toEqual([])
    expect(getLastMessage('thr-001')).toBeUndefined()
  })
})
