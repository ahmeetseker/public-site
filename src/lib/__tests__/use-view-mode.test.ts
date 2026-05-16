import { describe, expect, it } from 'vitest'
import { parseViewMode } from '../use-view-mode'

describe('parseViewMode', () => {
  it('returns "list" by default', () => {
    expect(parseViewMode(new URLSearchParams())).toBe('list')
  })
  it('accepts valid modes', () => {
    expect(parseViewMode(new URLSearchParams('view=map'))).toBe('map')
    expect(parseViewMode(new URLSearchParams('view=split'))).toBe('split')
    expect(parseViewMode(new URLSearchParams('view=list'))).toBe('list')
  })
  it('coerces unknown values to "list"', () => {
    expect(parseViewMode(new URLSearchParams('view=xyz'))).toBe('list')
  })
})
