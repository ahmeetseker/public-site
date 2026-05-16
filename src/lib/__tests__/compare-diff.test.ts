import { describe, expect, it } from 'vitest'

import { findDiffs } from '../compare-diff'

describe('findDiffs', () => {
  it('returns empty when single row', () => {
    expect(findDiffs([{ key: 'price', values: [100] }])).toEqual(new Set())
  })

  it('returns empty when all values equal', () => {
    expect(findDiffs([{ key: 'price', values: [100, 100, 100] }])).toEqual(
      new Set(),
    )
  })

  it('flags keys where any value differs', () => {
    const diffs = findDiffs([
      { key: 'price', values: [100, 200, 100] },
      { key: 'size', values: [50, 50, 50] },
    ])
    expect(diffs.has('price')).toBe(true)
    expect(diffs.has('size')).toBe(false)
  })

  it('treats null/undefined as same as another null/undefined', () => {
    const diffs = findDiffs([{ key: 'zoning', values: [null, null, null] }])
    expect(diffs.has('zoning')).toBe(false)
  })

  it('treats null vs value as diff', () => {
    const diffs = findDiffs([
      { key: 'zoning', values: ['konut', null, 'konut'] },
    ])
    expect(diffs.has('zoning')).toBe(true)
  })
})
