import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  STORAGE_KEY,
  addReview,
  clearReviews,
  getAverageRating,
  getReviews,
  makeReviewId,
  type Review,
  type ReviewRating,
} from '../reviews'

beforeEach(() => { localStorage.clear() })
afterEach(() => { localStorage.clear() })

const mkReview = (
  listingId: string,
  rating: ReviewRating,
  body = 'Yeterince uzun bir test yorumu.',
  author = 'Test Kullanıcı',
): Review => ({
  id: makeReviewId(),
  listingId,
  author,
  rating,
  body,
  createdAt: Date.now(),
})

describe('reviews storage', () => {
  it('seeds 3 deterministic reviews on first read', () => {
    const a = getReviews('28.AY.0142')
    expect(a).toHaveLength(3)
    // Calling again should return the same persisted entries (same ids).
    const b = getReviews('28.AY.0142')
    expect(b.map((r) => r.id)).toEqual(a.map((r) => r.id))
  })

  it('seeds are isolated per listingId', () => {
    const a = getReviews('A.1')
    const b = getReviews('B.1')
    expect(a.map((r) => r.id)).not.toEqual(b.map((r) => r.id))
    // Different listings live under different keys in the same store object.
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>
    expect(Object.keys(raw).sort()).toEqual(['A.1', 'B.1'])
  })

  it('seed reviews all have rating between 1 and 5', () => {
    const list = getReviews('listing-x')
    for (const r of list) {
      expect(r.rating).toBeGreaterThanOrEqual(1)
      expect(r.rating).toBeLessThanOrEqual(5)
    }
  })

  it('addReview prepends a new review and survives reload', () => {
    const id = 'listing-add'
    getReviews(id) // seed first
    const r = mkReview(id, 5, 'Çok güzel ve detaylı bir yorum metni burada.', 'Ahmet Y.')
    const after = addReview(r)
    expect(after[0]).toEqual(r)
    expect(after).toHaveLength(4) // 3 seeds + 1 new

    // Simulate reload: clear in-memory state, read again from storage.
    const reread = getReviews(id)
    expect(reread[0].id).toBe(r.id)
    expect(reread).toHaveLength(4)
  })

  it('getAverageRating returns rounded value with seeds', () => {
    const id = 'listing-avg'
    const seeds = getReviews(id)
    const expected =
      Math.round((seeds.reduce((s, r) => s + r.rating, 0) / seeds.length) * 10) / 10
    expect(getAverageRating(id)).toBe(expected)
  })

  it('getAverageRating updates after addReview', () => {
    const id = 'listing-avg2'
    getReviews(id)
    addReview(mkReview(id, 1, 'Düşük puan veren bir yorum metni.'))
    const avg = getAverageRating(id)
    expect(avg).toBeGreaterThan(0)
    expect(avg).toBeLessThanOrEqual(5)
  })

  it('clearReviews(listingId) wipes only that listing', () => {
    getReviews('keep-me')
    getReviews('delete-me')
    clearReviews('delete-me')
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>
    expect(Object.keys(raw)).toEqual(['keep-me'])
  })

  it('clearReviews() with no arg wipes the whole store', () => {
    getReviews('a')
    getReviews('b')
    clearReviews()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('survives malformed localStorage payload (returns fresh seeds)', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json')
    const list = getReviews('listing-malformed')
    expect(list).toHaveLength(3)
  })

  it('survives non-array payload for a listingId', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 'bad-listing': 'wrong-type' }))
    const list = getReviews('bad-listing')
    expect(list).toHaveLength(3)
  })

  it('makeReviewId returns reasonably unique values across calls', () => {
    const a = makeReviewId()
    const b = makeReviewId()
    expect(a).not.toBe(b)
    expect(a).toMatch(/^r-/)
  })
})
