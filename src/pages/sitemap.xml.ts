// Wave F22.B — Dynamic sitemap endpoint.
//
// Swapped from a hand-rolled Entry[] + XML renderer to the F22.0 helpers
// (`collectSitemap` + `renderSitemapXml`) in `@/lib/sitemap-data`. The helpers
// are the single source of truth for hreflang alternates (TR canonical, EN
// companion, x-default) and the drift gate in `tests/sitemap-drift.test.ts`
// consumes the same `collectSitemap` API to assert URL coverage.
//
// Slug parity with `pages/ilan/[slug].astro`:
//   listing slug = slugify(title) + '-' + id  (NOT just `l.slug` — the LISTINGS
//   mock has no `slug` field, the slug is derived from title/id).
import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { LISTINGS, OFFICES, REGIONS } from '@landx/data'
import { collectSitemap, renderSitemapXml } from '@/lib/sitemap-data'

const ORIGIN = 'https://arsam.net'

const slugify = (s: string): string =>
  s
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Mirrors `pages/ilan/[slug].astro` getStaticPaths slug derivation. */
export const listingSlug = (l: { title: string; id: string }): string =>
  `${slugify(l.title)}-${l.id}`

export const GET: APIRoute = async () => {
  // Blog posts live as `<locale>/<slug>` ids; we only want the trailing slug
  // for TR canonical entries (EN companion is auto-derived by `enCompanionFor`).
  const blogPostsAll = await getCollection('blog').catch(() => [])
  const blogSlugs = blogPostsAll
    .filter((p) => p.data.locale === 'tr')
    .map((p) => {
      const parts = p.id.split('/')
      return parts.length > 1 ? parts.slice(1).join('/') : p.id
    })

  const entries = collectSitemap({
    origin: ORIGIN,
    listingSlugs: LISTINGS.map(listingSlug),
    officeSlugs: OFFICES.map((o) => o.slug),
    regionSlugs: REGIONS.map((r) => r.slug),
    blogSlugs,
  })

  return new Response(renderSitemapXml(entries, ORIGIN), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
