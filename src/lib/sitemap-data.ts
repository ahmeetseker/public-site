/**
 * Wave F22.0 — Sitemap entry collector.
 *
 * Single source of truth for sitemap.xml.ts + future drift gate tests.
 * Pulls static pages, content collection (blog), and dynamic getStaticPaths
 * targets (ilan/ofis/bolge/yardim) into a flat `SitemapEntry[]`.
 *
 * Hreflang alternates are attached when a TR page has an EN companion under
 * `/en/...` (and vice-versa). Drift gate compares the generated set to
 * `dist/sitemap.xml`, failing CI on missing or extra URLs.
 */

export type ChangeFreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never'

export interface HreflangAlternate {
  hreflang: string
  href: string
}

export interface SitemapEntry {
  path: string          // '/path' canonical (TR by default)
  lastmod?: string       // ISO 8601 date
  changefreq?: ChangeFreq
  priority?: number      // 0.0 – 1.0
  alternates?: HreflangAlternate[]
}

export interface CollectSitemapOptions {
  origin: string
  /** Pre-resolved listing slugs (caller passes from LISTINGS or API). */
  listingSlugs?: string[]
  /** Pre-resolved office slugs. */
  officeSlugs?: string[]
  /** Pre-resolved region slugs (`/bolge/[slug]`). */
  regionSlugs?: string[]
  /** Pre-resolved help article slugs (`/yardim/[slug]`). */
  helpSlugs?: string[]
  /** Pre-resolved blog post slugs (`/blog/[slug]`). */
  blogSlugs?: string[]
  /** Drop EN companion duplicates if the consumer only wants TR canonical. */
  excludeEn?: boolean
}

const STATIC_PAGES: ReadonlyArray<{ path: string; priority: number; changefreq: ChangeFreq }> = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/ara', priority: 0.9, changefreq: 'daily' },
  { path: '/ilan-ver', priority: 0.7, changefreq: 'monthly' },
  { path: '/iletisim', priority: 0.6, changefreq: 'monthly' },
  { path: '/hakkimizda', priority: 0.6, changefreq: 'monthly' },
  { path: '/karsilastir', priority: 0.6, changefreq: 'monthly' },
  { path: '/ofisler', priority: 0.7, changefreq: 'weekly' },
  { path: '/yardim', priority: 0.6, changefreq: 'monthly' },
  { path: '/blog', priority: 0.7, changefreq: 'weekly' },
  { path: '/cerez-politikasi', priority: 0.3, changefreq: 'yearly' },
  { path: '/kullanim-sartlari', priority: 0.3, changefreq: 'yearly' },
  { path: '/kvkk', priority: 0.3, changefreq: 'yearly' },
  { path: '/giris', priority: 0.4, changefreq: 'monthly' },
  { path: '/kayit', priority: 0.4, changefreq: 'monthly' },
]

/** TR slug → EN companion path (best-effort suffix swap). */
function enCompanionFor(trPath: string): string | null {
  // Static suffix swaps for legal/static pages
  const directSwap: Record<string, string> = {
    '/hakkimizda': '/en/about',
    '/iletisim': '/en/contact',
    '/cerez-politikasi': '/en/cookie-policy',
    '/kullanim-sartlari': '/en/terms',
    '/kvkk': '/en/privacy',
    '/ofisler': '/en/offices',
    '/blog': '/en/blog',
    '/yardim': '/en/help',
    '/': '/en/',
    '/ara': '/en/search',
  }
  if (directSwap[trPath]) return directSwap[trPath]

  // Dynamic prefix swaps
  const dyn: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
    [/^\/ilan\/(.+)$/, (m) => `/en/listing/${m[1]}`],
    [/^\/ofis\/(.+)$/, (m) => `/en/office/${m[1]}`],
    [/^\/bolge\/(.+)$/, (m) => `/en/region/${m[1]}`],
    [/^\/blog\/(.+)$/, (m) => `/en/blog/${m[1]}`],
    [/^\/yardim\/(.+)$/, (m) => `/en/help/${m[1]}`],
  ]
  for (const [re, fn] of dyn) {
    const m = trPath.match(re)
    if (m) return fn(m)
  }
  return null
}

function entry(
  path: string,
  origin: string,
  meta: { priority?: number; changefreq?: ChangeFreq; lastmod?: string } = {},
  excludeEn = false,
): SitemapEntry {
  const alt = enCompanionFor(path)
  const alternates: HreflangAlternate[] = []
  if (!excludeEn) {
    alternates.push({ hreflang: 'tr', href: `${origin}${path}` })
    if (alt) alternates.push({ hreflang: 'en', href: `${origin}${alt}` })
    if (alternates.length === 0 || (alt === null && alternates.length < 2)) {
      // include x-default → TR canonical
      alternates.push({ hreflang: 'x-default', href: `${origin}${path}` })
    } else {
      alternates.push({ hreflang: 'x-default', href: `${origin}${path}` })
    }
  }
  return {
    path,
    priority: meta.priority,
    changefreq: meta.changefreq,
    lastmod: meta.lastmod,
    alternates: alternates.length > 0 ? alternates : undefined,
  }
}

export function collectSitemap(opts: CollectSitemapOptions): SitemapEntry[] {
  const { origin, excludeEn = false } = opts
  const entries: SitemapEntry[] = []

  for (const p of STATIC_PAGES) {
    entries.push(entry(p.path, origin, { priority: p.priority, changefreq: p.changefreq }, excludeEn))
  }

  for (const slug of opts.listingSlugs ?? []) {
    entries.push(entry(`/ilan/${slug}`, origin, { priority: 0.85, changefreq: 'weekly' }, excludeEn))
  }
  for (const slug of opts.officeSlugs ?? []) {
    entries.push(entry(`/ofis/${slug}`, origin, { priority: 0.7, changefreq: 'monthly' }, excludeEn))
  }
  for (const slug of opts.regionSlugs ?? []) {
    entries.push(entry(`/bolge/${slug}`, origin, { priority: 0.7, changefreq: 'monthly' }, excludeEn))
  }
  for (const slug of opts.helpSlugs ?? []) {
    entries.push(entry(`/yardim/${slug}`, origin, { priority: 0.5, changefreq: 'monthly' }, excludeEn))
  }
  for (const slug of opts.blogSlugs ?? []) {
    entries.push(entry(`/blog/${slug}`, origin, { priority: 0.6, changefreq: 'monthly' }, excludeEn))
  }

  return entries
}

/**
 * Renders the collected entries as a valid `<urlset>` XML body. Caller
 * embeds it in the Astro endpoint response.
 */
export function renderSitemapXml(entries: ReadonlyArray<SitemapEntry>, origin: string): string {
  const head = '<?xml version="1.0" encoding="UTF-8"?>\n'
  const open =
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
  const body = entries
    .map((e) => {
      const loc = `${origin}${e.path}`
      const parts: string[] = [`  <url>`, `    <loc>${escape(loc)}</loc>`]
      if (e.lastmod) parts.push(`    <lastmod>${escape(e.lastmod)}</lastmod>`)
      if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`)
      if (e.priority !== undefined) parts.push(`    <priority>${e.priority.toFixed(1)}</priority>`)
      for (const alt of e.alternates ?? []) {
        parts.push(
          `    <xhtml:link rel="alternate" hreflang="${escape(alt.hreflang)}" href="${escape(alt.href)}" />`,
        )
      }
      parts.push(`  </url>`)
      return parts.join('\n')
    })
    .join('\n')
  return `${head}${open}${body}\n</urlset>\n`
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
