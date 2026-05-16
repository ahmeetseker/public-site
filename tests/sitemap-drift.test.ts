// Wave F22.B — Sitemap drift gate.
//
// Asserts that `collectSitemap` (F22.0) covers every LISTING, OFFICE and REGION
// exported from `@landx/data`, plus the canonical sitemap URL referenced by
// `robots.txt`. CI fails fast when a slug is added/renamed without updating
// the sitemap helper or the listing-page getStaticPaths.
//
// Drift gate scope:
//   1. listing slugs   — `${slugify(title)}-${id}` parity with /ilan/[slug].astro
//   2. office slugs    — `OFFICES.map((o) => o.slug)`
//   3. region slugs    — `REGIONS.map((r) => r.slug)`
//   4. robots.txt      — canonical Sitemap URL line is correct + present

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { LISTINGS, OFFICES, REGIONS } from '@landx/data'
import { collectSitemap } from '@/lib/sitemap-data'

const ORIGIN = 'https://arsam.net'

// Mirrors the `slugify` in `pages/ilan/[slug].astro` AND `pages/sitemap.xml.ts`.
// We deliberately do NOT import from `pages/sitemap.xml.ts` because that file
// pulls `astro:content` (`getCollection`) which is unavailable under vitest.
const slugify = (s: string): string =>
  s
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const listingSlug = (l: { title: string; id: string }): string =>
  `${slugify(l.title)}-${l.id}`

function pathsFor(opts: Parameters<typeof collectSitemap>[0]): string[] {
  return collectSitemap(opts).map((e) => e.path)
}

describe('sitemap drift gate (Wave F22.B)', () => {
  it('every LISTING is reachable as /ilan/<slug>', () => {
    const paths = pathsFor({
      origin: ORIGIN,
      listingSlugs: LISTINGS.map(listingSlug),
    })
    expect(LISTINGS.length).toBeGreaterThan(0)
    for (const l of LISTINGS) {
      expect(paths).toContain(`/ilan/${listingSlug(l)}`)
    }
  })

  it('every OFFICE is reachable as /ofis/<slug>', () => {
    const paths = pathsFor({
      origin: ORIGIN,
      officeSlugs: OFFICES.map((o) => o.slug),
    })
    expect(OFFICES.length).toBeGreaterThan(0)
    for (const o of OFFICES) {
      expect(paths).toContain(`/ofis/${o.slug}`)
    }
  })

  it('every REGION is reachable as /bolge/<slug>', () => {
    const paths = pathsFor({
      origin: ORIGIN,
      regionSlugs: REGIONS.map((r) => r.slug),
    })
    expect(REGIONS.length).toBeGreaterThan(0)
    for (const r of REGIONS) {
      expect(paths).toContain(`/bolge/${r.slug}`)
    }
  })

  it('static pages include the home, search and legal hub', () => {
    const paths = pathsFor({ origin: ORIGIN })
    for (const p of ['/', '/ara', '/iletisim', '/kvkk', '/blog']) {
      expect(paths).toContain(p)
    }
  })

  it('hreflang alternates attach to every dynamic entry', () => {
    const entries = collectSitemap({
      origin: ORIGIN,
      listingSlugs: [listingSlug(LISTINGS[0])],
    })
    const listingEntry = entries.find((e) => e.path.startsWith('/ilan/'))
    expect(listingEntry?.alternates).toBeDefined()
    const hrefs = listingEntry!.alternates!.map((a) => a.hreflang)
    expect(hrefs).toContain('tr')
    expect(hrefs).toContain('en')
    expect(hrefs).toContain('x-default')
  })

  it('robots.txt references the canonical sitemap URL', () => {
    // vitest cwd = apps/public-site; resolve directly off it.
    const robotsPath = resolve(process.cwd(), 'public/robots.txt')
    const robots = readFileSync(robotsPath, 'utf-8')
    expect(robots).toMatch(/^Sitemap:\s+https:\/\/arsam\.net\/sitemap\.xml$/m)
  })
})
