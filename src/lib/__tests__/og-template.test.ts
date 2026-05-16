import { describe, it, expect } from 'vitest'
import { renderOgSvg, renderOgPng, slugFromPath } from '../og-template'

// Wave F13.D — SVG renderer smoke tests.
// Wave F22.C — Satori PNG renderer smoke tests.

describe('renderOgSvg', () => {
  it('emits an svg with the title text embedded', () => {
    const svg = renderOgSvg({ title: 'Test başlığı' })
    expect(svg).toMatch(/<svg /)
    expect(svg).toContain('Test başlığı')
    expect(svg).toContain('width="1200"')
    expect(svg).toContain('height="630"')
  })

  it('escapes html-unsafe characters in the title', () => {
    const svg = renderOgSvg({ title: '<script>alert(1)</script>' })
    expect(svg).not.toMatch(/<script>/)
    expect(svg).toContain('&lt;script&gt;')
  })

  it('includes the subtitle line when provided', () => {
    const svg = renderOgSvg({ title: 't', subtitle: 's-line' })
    expect(svg).toContain('s-line')
  })
})

describe('slugFromPath', () => {
  it.each([
    ['/', 'anasayfa'],
    ['/en', 'anasayfa'],
    ['/en/', 'anasayfa'],
    ['/ilan', 'ilan'],
    ['/ilan/AY-001', 'ilan'],
    ['/en/ilan/AY-001', 'ilan'],
    ['/bolge/cesme', 'bolge'],
  ])('maps %s → %s', (input, expected) => {
    expect(slugFromPath(input)).toBe(expected)
  })
})

describe('renderOgPng', { timeout: 30_000 }, () => {
  // Satori + Resvg load native + font assets — slow under cold start, fine in
  // CI. We only assert PNG signature so the test stays robust to layout
  // tweaks. The full build (`pnpm run build`) is the visual regression net.
  it('returns a PNG buffer with the correct magic bytes', async () => {
    const png = await renderOgPng({
      title: 'Smoke title',
      subtitle: 'Smoke subtitle',
      eyebrow: 'TEST',
    })
    expect(Buffer.isBuffer(png)).toBe(true)
    expect(png.length).toBeGreaterThan(1000)
    // PNG header: 89 50 4E 47 0D 0A 1A 0A
    const sig = [...png.subarray(0, 8)]
    expect(sig).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  })
})
