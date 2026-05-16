import { describe, expect, it, vi } from 'vitest'

import { formatComparisonDate, triggerPrint } from '../compare-pdf'

describe('formatComparisonDate', () => {
  const FIXED = new Date('2026-05-14T10:00:00Z')

  it('formats a TR date with long month + numeric year', () => {
    const out = formatComparisonDate('tr', FIXED)
    // "14 Mayıs 2026" — assert by substring to stay tolerant to NBSP differences
    expect(out).toMatch(/14/)
    expect(out).toMatch(/Mayıs/)
    expect(out).toMatch(/2026/)
  })

  it('formats an EN date with long month + numeric year', () => {
    const out = formatComparisonDate('en', FIXED)
    expect(out).toMatch(/14/)
    expect(out).toMatch(/May/)
    expect(out).toMatch(/2026/)
  })

  it('uses the current date when no argument is provided', () => {
    const out = formatComparisonDate('tr')
    // Should at least contain the current year.
    const year = new Date().getFullYear().toString()
    expect(out).toContain(year)
  })
})

describe('triggerPrint', () => {
  it('calls the injected window.print() and returns true', () => {
    const fakeWin = { print: vi.fn() }
    const ok = triggerPrint(fakeWin as unknown as Window)
    expect(ok).toBe(true)
    expect(fakeWin.print).toHaveBeenCalledTimes(1)
  })

  it('returns false when window has no print method (null)', () => {
    expect(
      triggerPrint({ print: null as unknown as () => void }),
    ).toBe(false)
  })

  it('returns false when window has no print function', () => {
    expect(
      triggerPrint({ print: undefined as unknown as () => void }),
    ).toBe(false)
  })

  it('returns false if print() throws', () => {
    const throwingWin = {
      print: () => {
        throw new Error('blocked')
      },
    }
    expect(triggerPrint(throwingWin as unknown as Window)).toBe(false)
  })
})
