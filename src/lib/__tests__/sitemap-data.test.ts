import { describe, expect, it } from 'vitest'
import { collectSitemap, renderSitemapXml } from '@/lib/sitemap-data'

const ORIGIN = 'https://arsam.net'

describe('collectSitemap', () => {
  it('includes static pages by default', () => {
    const out = collectSitemap({ origin: ORIGIN })
    const paths = out.map((e) => e.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/ara')
    expect(paths).toContain('/ofisler')
  })

  it('appends dynamic listing/office/region/help/blog slugs', () => {
    const out = collectSitemap({
      origin: ORIGIN,
      listingSlugs: ['a1', 'a2'],
      officeSlugs: ['ofis-1'],
      regionSlugs: ['ayvalik'],
      helpSlugs: ['nasil'],
      blogSlugs: ['p1'],
    })
    const paths = out.map((e) => e.path)
    expect(paths).toContain('/ilan/a1')
    expect(paths).toContain('/ofis/ofis-1')
    expect(paths).toContain('/bolge/ayvalik')
    expect(paths).toContain('/yardim/nasil')
    expect(paths).toContain('/blog/p1')
  })

  it('produces hreflang alternates including x-default', () => {
    const out = collectSitemap({ origin: ORIGIN })
    const home = out.find((e) => e.path === '/')
    expect(home?.alternates?.find((a) => a.hreflang === 'tr')).toBeDefined()
    expect(home?.alternates?.find((a) => a.hreflang === 'x-default')).toBeDefined()
  })

  it('drops alternates when excludeEn is true', () => {
    const out = collectSitemap({ origin: ORIGIN, excludeEn: true })
    for (const e of out) {
      expect(e.alternates ?? []).toEqual([])
    }
  })

  it('priorities + changefreq are wired for static pages', () => {
    const out = collectSitemap({ origin: ORIGIN })
    const home = out.find((e) => e.path === '/')
    expect(home?.priority).toBe(1.0)
    expect(home?.changefreq).toBe('daily')
  })

  it('dynamic listing slugs get weekly changefreq + 0.85 priority', () => {
    const out = collectSitemap({ origin: ORIGIN, listingSlugs: ['x'] })
    const e = out.find((entry) => entry.path === '/ilan/x')
    expect(e?.priority).toBe(0.85)
    expect(e?.changefreq).toBe('weekly')
  })
})

describe('renderSitemapXml', () => {
  it('emits XML declaration + urlset wrapper', () => {
    const out = renderSitemapXml(
      collectSitemap({ origin: ORIGIN }).slice(0, 3),
      ORIGIN,
    )
    expect(out.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(out).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
    expect(out).toContain('</urlset>')
  })

  it('emits one <url> per entry', () => {
    const entries = collectSitemap({ origin: ORIGIN }).slice(0, 5)
    const out = renderSitemapXml(entries, ORIGIN)
    const matches = out.match(/<url>/g) ?? []
    expect(matches.length).toBe(entries.length)
  })

  it('emits xhtml:link alternates when present', () => {
    const entries = collectSitemap({ origin: ORIGIN }).filter((e) => e.path === '/')
    const out = renderSitemapXml(entries, ORIGIN)
    expect(out).toContain('xhtml:link rel="alternate"')
    expect(out).toContain('hreflang="tr"')
    expect(out).toContain('hreflang="x-default"')
  })

  it('escapes XML-special chars in loc', () => {
    const out = renderSitemapXml(
      [{ path: '/q?a=1&b=2', alternates: undefined }],
      ORIGIN,
    )
    expect(out).toContain('?a=1&amp;b=2')
  })
})
