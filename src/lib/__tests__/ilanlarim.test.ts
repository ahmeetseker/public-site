// Vitest: ilanlarim.ts adapter (Wave F5.E).
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  addIlan,
  clearIlanlarim,
  getIlanlarim,
  ILANLARIM_KEY,
  removeIlan,
} from '../ilanlarim'

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  localStorage.clear()
})

const mk = (ref: string) => ({
  ref,
  title: `T-${ref}`,
  district: 'D',
  city: 'C',
  price: 100,
  area: 1000,
  status: 'aktif' as const,
})

describe('ilanlarim', () => {
  it('empty initially', () => {
    expect(getIlanlarim()).toEqual([])
  })

  it('add returns full entry with createdAt + default status', () => {
    const { status: _omit, ...rest } = mk('A')
    const e = addIlan(rest)
    expect(e.ref).toBe('A')
    expect(e.status).toBe('aktif')
    expect(e.createdAt).toBeGreaterThan(0)
  })

  it('newest first', async () => {
    addIlan(mk('A'))
    await new Promise((r) => setTimeout(r, 5))
    addIlan(mk('B'))
    expect(getIlanlarim().map((e) => e.ref)).toEqual(['B', 'A'])
  })

  it('dedupe by ref', () => {
    addIlan(mk('A'))
    addIlan(mk('A'))
    expect(getIlanlarim()).toHaveLength(1)
  })

  it('remove deletes', () => {
    addIlan(mk('A'))
    addIlan(mk('B'))
    removeIlan('A')
    expect(getIlanlarim().map((e) => e.ref)).toEqual(['B'])
  })

  it('clear empties', () => {
    addIlan(mk('A'))
    clearIlanlarim()
    expect(getIlanlarim()).toEqual([])
  })

  it('survives malformed payload', () => {
    localStorage.setItem(ILANLARIM_KEY, '{not json')
    expect(getIlanlarim()).toEqual([])
  })

  it('ignores non-array payload', () => {
    localStorage.setItem(ILANLARIM_KEY, JSON.stringify({ ref: 'X' }))
    expect(getIlanlarim()).toEqual([])
  })

  it('filters out malformed entries', () => {
    const now = Date.now()
    localStorage.setItem(
      ILANLARIM_KEY,
      JSON.stringify([
        { ...mk('A'), createdAt: now },
        { ref: 'broken' },
        { ...mk('B'), createdAt: now },
      ]),
    )
    expect(getIlanlarim().map((e) => e.ref).sort()).toEqual(['A', 'B'])
  })

  it('preserves optional zoning + thumbnail', () => {
    addIlan({
      ...mk('A'),
      zoning: 'Konut',
      thumbnail: 'data:image/png;base64,iVBORw0KGgo=',
    })
    const [e] = getIlanlarim()
    expect(e.zoning).toBe('Konut')
    expect(e.thumbnail).toContain('iVBOR')
  })
})
