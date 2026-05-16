import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addRecent, getRecent, clearRecent, MAX_RECENT } from '../recent-views'

beforeEach(() => { localStorage.clear() })
afterEach(() => { localStorage.clear() })

const mk = (slug: string, n = 1) => ({
  slug,
  title: `T${n}`,
  price: 100 + n,
  currency: 'TRY' as const,
  image: `/i${n}.webp`,
  addedAt: n,
})

describe('recent-views storage', () => {
  it('returns empty array initially', () => {
    expect(getRecent()).toEqual([])
  })

  it('adds entries with newest first', () => {
    addRecent(mk('a', 1))
    addRecent(mk('b', 2))
    expect(getRecent().map((e) => e.slug)).toEqual(['b', 'a'])
  })

  it('dedupes by slug, refreshes addedAt', () => {
    addRecent(mk('a', 1))
    addRecent(mk('b', 2))
    addRecent(mk('a', 3))
    const recent = getRecent()
    expect(recent.map((e) => e.slug)).toEqual(['a', 'b'])
    expect(recent[0].addedAt).toBe(3)
  })

  it('caps at MAX_RECENT entries (FIFO oldest dropped)', () => {
    for (let i = 0; i < MAX_RECENT + 3; i++) addRecent(mk(`s${i}`, i))
    const recent = getRecent()
    expect(recent.length).toBe(MAX_RECENT)
    expect(recent[0].slug).toBe(`s${MAX_RECENT + 2}`)
  })

  it('clearRecent empties storage', () => {
    addRecent(mk('a', 1))
    clearRecent()
    expect(getRecent()).toEqual([])
  })

  it('survives malformed localStorage payload (returns [])', () => {
    localStorage.setItem('arsam.recent.v1', 'not-json')
    expect(getRecent()).toEqual([])
  })
})
