// Vitest: notifications.ts adapter (Wave F8.B).
//
// `arsam.notifications.v1` localStorage adapter backs the header
// NotificationBell dropdown and the /hesabim/bildirimler inbox. Eight cases
// below mirror the spec §5 contract: seed determinism, unread counts,
// markAsRead semantics, markAllAsRead, delete, malformed payload survival,
// empty-state behavior, and id dedupe.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  NOTIFICATIONS_KEY,
  type AppNotification,
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  seedIfEmpty,
} from '../notifications'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('notifications', () => {
  it('seedIfEmpty populates 5 deterministic mock notifications when empty', () => {
    expect(getNotifications()).toEqual([])
    seedIfEmpty()
    const list = getNotifications()
    expect(list).toHaveLength(5)
    // Sorted newest-first by createdAt.
    for (let i = 0; i < list.length - 1; i++) {
      expect(list[i].createdAt).toBeGreaterThanOrEqual(list[i + 1].createdAt)
    }
    // IDs match spec §5 (ntf-NNN).
    const ids = list.map((n) => n.id).sort()
    expect(ids).toEqual(['ntf-001', 'ntf-002', 'ntf-003', 'ntf-004', 'ntf-005'])
    // Types from spec.
    const byId = new Map(list.map((n) => [n.id, n]))
    expect(byId.get('ntf-001')?.type).toBe('system')
    expect(byId.get('ntf-002')?.type).toBe('listing')
    expect(byId.get('ntf-003')?.type).toBe('message')
    expect(byId.get('ntf-004')?.type).toBe('system')
    expect(byId.get('ntf-005')?.type).toBe('listing')
  })

  it('seedIfEmpty is idempotent — second call leaves storage untouched', () => {
    seedIfEmpty()
    const before = JSON.stringify(getNotifications())
    seedIfEmpty()
    const after = JSON.stringify(getNotifications())
    expect(after).toBe(before)
    expect(getNotifications()).toHaveLength(5)
  })

  it('getUnreadCount counts only unread notifications', () => {
    seedIfEmpty()
    // Per spec §5 seeded mocks: 3 unread (ntf-001, ntf-002, ntf-005) + 2 read.
    expect(getUnreadCount()).toBe(3)
  })

  it('markAsRead flips one notification and updates unread count', () => {
    seedIfEmpty()
    expect(getUnreadCount()).toBe(3)
    markAsRead('ntf-001')
    expect(getUnreadCount()).toBe(2)
    const list = getNotifications()
    const target = list.find((n) => n.id === 'ntf-001')
    expect(target?.read).toBe(true)
    // markAsRead on already-read is a no-op (does not error).
    markAsRead('ntf-001')
    expect(getUnreadCount()).toBe(2)
  })

  it('markAllAsRead flips every notification to read=true', () => {
    seedIfEmpty()
    expect(getUnreadCount()).toBe(3)
    markAllAsRead()
    expect(getUnreadCount()).toBe(0)
    const list = getNotifications()
    expect(list.every((n) => n.read)).toBe(true)
  })

  it('deleteNotification removes the matching id', () => {
    seedIfEmpty()
    expect(getNotifications()).toHaveLength(5)
    deleteNotification('ntf-003')
    const list = getNotifications()
    expect(list).toHaveLength(4)
    expect(list.find((n) => n.id === 'ntf-003')).toBeUndefined()
    // Deleting a missing id is a no-op.
    deleteNotification('ntf-999')
    expect(getNotifications()).toHaveLength(4)
  })

  it('survives malformed payload — returns empty array', () => {
    localStorage.setItem(NOTIFICATIONS_KEY, '{not json')
    expect(getNotifications()).toEqual([])
    expect(getUnreadCount()).toBe(0)
    // seedIfEmpty recovers because read returned [].
    seedIfEmpty()
    expect(getNotifications()).toHaveLength(5)
  })

  it('dedupe by id — duplicate write filtered on read', () => {
    seedIfEmpty()
    const list = getNotifications()
    const dup: AppNotification = { ...list[0] }
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([...list, dup]))
    const after = getNotifications()
    expect(after).toHaveLength(5)
    const ids = after.map((n) => n.id)
    expect(new Set(ids).size).toBe(5)
  })
})
