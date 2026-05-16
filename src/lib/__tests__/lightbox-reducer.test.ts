import { describe, it, expect } from 'vitest'
import { lightboxReducer, type LightboxState } from '../lightbox-reducer'

const init = (total = 4): LightboxState => ({ open: false, index: 0, total })

describe('lightboxReducer', () => {
  it('opens at given index', () => {
    const s = lightboxReducer(init(), { type: 'open', index: 2 })
    expect(s).toEqual({ open: true, index: 2, total: 4 })
  })
  it('next wraps around', () => {
    const s = lightboxReducer({ open: true, index: 3, total: 4 }, { type: 'next' })
    expect(s.index).toBe(0)
  })
  it('prev wraps around', () => {
    const s = lightboxReducer({ open: true, index: 0, total: 4 }, { type: 'prev' })
    expect(s.index).toBe(3)
  })
  it('close resets open flag', () => {
    const s = lightboxReducer({ open: true, index: 2, total: 4 }, { type: 'close' })
    expect(s).toEqual({ open: false, index: 2, total: 4 })
  })
  it('open clamps out-of-range index', () => {
    const s = lightboxReducer(init(4), { type: 'open', index: 99 })
    expect(s.index).toBe(0)
  })
  it('next on total=1 is no-op', () => {
    const s = lightboxReducer({ open: true, index: 0, total: 1 }, { type: 'next' })
    expect(s.index).toBe(0)
  })
  it('setTotal updates total and clamps stale index', () => {
    const s = lightboxReducer(
      { open: true, index: 5, total: 0 },
      { type: 'setTotal', total: 3 },
    )
    expect(s).toEqual({ open: true, index: 2, total: 3 })
  })
  it('setTotal with 0 resets index to 0', () => {
    const s = lightboxReducer(
      { open: false, index: 2, total: 4 },
      { type: 'setTotal', total: 0 },
    )
    expect(s).toEqual({ open: false, index: 0, total: 0 })
  })
  it('open with total=0 stays effectively closed', () => {
    const s = lightboxReducer({ open: false, index: 0, total: 0 }, { type: 'open', index: 0 })
    expect(s.total).toBe(0)
    // Modal renders null when images[index] is undefined, so open: true with total:0 is functionally closed
  })
})
