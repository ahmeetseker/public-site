// Vitest: support-tickets.ts adapter (Wave F7.D).
//
// arsam.support-tickets.v1 — minimal localStorage adapter for /hesabim/destek.
// CRUD + async mock reply (setTimeout configurable via setMockReplyDelay) +
// ID generator (SUP-YYYY-NNN, monotonic per-year). Eight cases below mirror
// the spec §7 contract.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SUPPORT_TICKETS_KEY,
  createTicket,
  getTickets,
  markAsClosed,
  removeTicket,
  setMockReplyDelay,
  type SupportTicket,
} from '../support-tickets'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  // Default test delay: 100ms so we can advance timers deterministically.
  setMockReplyDelay(100)
})

afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})

describe('support-tickets', () => {
  it('empty initial state', () => {
    expect(getTickets()).toEqual([])
  })

  it('createTicket generates SUP-YYYY-NNN incrementing IDs', () => {
    const a = createTicket({
      category: 'hesap',
      subject: 'Konu A',
      message: 'Bu yeterince uzun bir mesajdır.',
    })
    const b = createTicket({
      category: 'ilan',
      subject: 'Konu B',
      message: 'Yine yeterince uzun bir mesajdır.',
    })
    expect(a.id).toMatch(/^SUP-\d{4}-\d{3}$/)
    expect(b.id).toMatch(/^SUP-\d{4}-\d{3}$/)
    const numA = Number(a.id.split('-')[2])
    const numB = Number(b.id.split('-')[2])
    expect(numB).toBe(numA + 1)
    expect(a.status).toBe('open')
    expect(a.createdAt).toBeGreaterThan(0)
  })

  it('list returns tickets newest-first', () => {
    const a = createTicket({
      category: 'hesap',
      subject: 'Eski',
      message: 'Bu yeterince uzun bir mesajdır.',
    })
    // Simulate clock moving forward.
    vi.setSystemTime(new Date(a.createdAt + 1000))
    const b = createTicket({
      category: 'odeme',
      subject: 'Yeni',
      message: 'Daha sonra oluşturulmuş bir mesaj.',
    })
    const list = getTickets()
    expect(list).toHaveLength(2)
    expect(list[0].id).toBe(b.id)
    expect(list[1].id).toBe(a.id)
  })

  it('removeTicket removes the ticket from storage', () => {
    const a = createTicket({
      category: 'hesap',
      subject: 'X',
      message: 'Bu yeterince uzun bir mesajdır.',
    })
    expect(getTickets()).toHaveLength(1)
    removeTicket(a.id)
    expect(getTickets()).toHaveLength(0)
  })

  it('markAsClosed flips status to closed', () => {
    const a = createTicket({
      category: 'diger',
      subject: 'Kapat beni',
      message: 'Bu yeterince uzun bir mesajdır.',
    })
    expect(a.status).toBe('open')
    markAsClosed(a.id)
    const list = getTickets()
    expect(list[0].status).toBe('closed')
  })

  it('mockReply async — after delay status becomes answered and mockReply is populated', () => {
    const a = createTicket({
      category: 'ilan',
      subject: 'Cevap bekliyorum',
      message: 'Bu yeterince uzun bir mesajdır.',
    })
    expect(a.mockReply).toBeUndefined()
    expect(getTickets()[0].status).toBe('open')

    vi.advanceTimersByTime(100)

    const after = getTickets()
    expect(after[0].status).toBe('answered')
    expect(after[0].mockReply?.body).toBeTruthy()
    expect(after[0].mockReply?.repliedAt).toBeGreaterThan(0)
  })

  it('survives malformed payload (returns empty array)', () => {
    localStorage.setItem(SUPPORT_TICKETS_KEY, '{not json')
    expect(getTickets()).toEqual([])
  })

  it('dedupe by id — duplicate write via direct localStorage filtered on read', () => {
    const a = createTicket({
      category: 'hesap',
      subject: 'Tek',
      message: 'Bu yeterince uzun bir mesajdır.',
    })
    // Manually inject a duplicate to simulate a corrupted state.
    const dup: SupportTicket = { ...a }
    localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify([a, dup]))
    const list = getTickets()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(a.id)
  })
})
