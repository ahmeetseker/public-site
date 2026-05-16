// Wave F13.D — Marquee-page OG image template.
// Wave F22.C — Satori-backed PNG sibling.
//
// Sibling of `lib/og.ts` (Wave-5 listing/region/office cards). This template
// targets the 10 marquee public pages (anasayfa, ilan, ofis, bölge, blog,
// yardim + 4 featured blog posts) and exposes a slightly different layout:
// big serif/italic title, eyebrow above, optional subtitle below.
//
// Two renderers are exported:
//   - renderOgSvg → fast, dependency-free SVG (kept for legacy / fallback).
//   - renderOgPng → Satori + Resvg (PNG buffer) for crawlers that don't
//     reliably accept image/svg+xml (Facebook, LinkedIn pre-2024 caches,
//     WhatsApp link previews on some Android builds).
//
// Endpoints under `pages/og/*.png.ts` are SSG-pre-rendered, so the cost lives
// at build time. At request time the static file is served straight off disk.

export interface OgTemplateInput {
  title: string
  subtitle?: string
  eyebrow?: string
}

const W = 1200
const H = 630

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Naive word-wrap clamped at `maxLines` lines. Long words are not split.
 */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const w of words) {
    const next = current ? `${current} ${w}` : w
    if (next.length > maxChars && current) {
      lines.push(current)
      current = w
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, maxLines)
}

/**
 * Render the 1200×630 marquee OG card as an SVG string.
 *
 * Visual recipe
 *   - Background: very dark warm stone (matches dark-mode `bg-card` token).
 *   - Subtle radial corner glow for depth.
 *   - "ARSAM.NET" wordmark + eyebrow on a single line, top-left.
 *   - Title: serif italic, large, multiline (≤2 lines, 28 chars each).
 *   - Optional subtitle below the title, sans-serif body.
 *   - Footer tagline pinned bottom-left.
 */
export function renderOgSvg(input: OgTemplateInput): string {
  const titleLines = wrap(input.title, 28, 2)
  const titleY = 280
  const lineHeight = 88
  const bottomY = titleY + titleLines.length * lineHeight
  const subtitleY = bottomY + 60
  const eyebrow = input.eyebrow ?? 'ARSAM.NET'

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escape(input.title)}">
  <defs>
    <radialGradient id="glow" cx="85%" cy="15%" r="70%">
      <stop offset="0%" stop-color="#3f3f46" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#0a0a0a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fafaf9"/>
      <stop offset="1" stop-color="#d6d3d1"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="#0a0a0a"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <g fill="#fafaf9" opacity="0.06">
    <circle cx="${W - 90}" cy="100" r="140"/>
    <circle cx="${W - 220}" cy="${H - 170}" r="90"/>
  </g>

  <text x="80" y="110" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="20" letter-spacing="3" fill="#a8a29e">${escape(eyebrow.toUpperCase())}</text>

  <text x="80" y="170" font-family="ui-serif, Georgia, 'Times New Roman', serif" font-size="40" font-weight="300" fill="#fafaf9">arsam<tspan font-style="italic" fill="#a8a29e">.net</tspan></text>

  ${titleLines
    .map(
      (line, i) =>
        `<text x="80" y="${titleY + i * lineHeight}" font-family="ui-serif, Georgia, 'Times New Roman', serif" font-style="italic" font-size="80" font-weight="300" fill="url(#ink)">${escape(line)}</text>`,
    )
    .join('\n  ')}

  ${input.subtitle ? `<text x="80" y="${subtitleY}" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" font-size="30" fill="#d6d3d1">${escape(input.subtitle)}</text>` : ''}

  <circle cx="80" cy="${H - 60}" r="6" fill="#fafaf9"/>
  <text x="100" y="${H - 55}" font-family="ui-monospace, monospace" font-size="16" letter-spacing="2" fill="#a8a29e">TÜRKİYE'NİN ARSA PAZARI</text>
</svg>`
}

// ---------------------------------------------------------------------------
// Wave F22.C — Satori-backed PNG renderer.
//
// `renderOgPng` produces a 1200×630 PNG buffer with a brand recipe similar to
// `renderOgSvg`, flattened to raster so legacy/strict OG crawlers can still
// scrape a preview. Fonts ship as local TTF assets under `src/assets/fonts/`
// (Inter @ 300/400/600, latin subset) — total ~204 KB, read once per build
// via a module-level promise cache.
//
// Astro pre-renders these endpoints (`prerender = true`), so runtime cost in
// production is zero; the Satori + Resvg work happens during `astro build`.
// ---------------------------------------------------------------------------

interface OgFont {
  name: string
  data: ArrayBuffer
  weight: 300 | 400 | 600
  style: 'normal'
}

let _fontsCache: Promise<OgFont[]> | null = null

// Resolve the font directory at runtime. Strategy:
//   1. Try `import.meta.url` → `fileURLToPath` (works for Node ESM, Astro
//      dev server, Vitest with file URLs).
//   2. Walk up from `process.cwd()` looking for an `apps/public-site` segment
//      so the resolution also works when Astro relocates the chunk into
//      `dist/.prerender/chunks/` at build time (the source TTFs stay in
//      `src/assets/fonts/`, never copied to dist).
//   3. Final fallback: `process.cwd() + src/assets/fonts/` for tests run from
//      the public-site root.
async function resolveFontDir(): Promise<string> {
  const { fileURLToPath } = await import('node:url')
  const path = await import('node:path')
  const fs = await import('node:fs/promises')

  const candidates: string[] = []
  try {
    const fromImport = fileURLToPath(new URL('../assets/fonts/', import.meta.url))
    candidates.push(fromImport)
  } catch {
    /* non-file URL — Vitest jsdom env. */
  }

  // Walk up the cwd until we find `apps/public-site/src/assets/fonts/`. This
  // gives us a build-output-agnostic anchor — the rolldown chunk under
  // `dist/.prerender/chunks/` has a useless relative URL, but the project
  // root is still discoverable.
  let dir = process.cwd()
  for (let i = 0; i < 8; i++) {
    const trySrc = path.join(dir, 'apps/public-site/src/assets/fonts/')
    candidates.push(trySrc)
    const trySelf = path.join(dir, 'src/assets/fonts/')
    candidates.push(trySelf)
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  for (const c of candidates) {
    try {
      await fs.access(`${c}Inter-Regular.ttf`)
      return c
    } catch {
      /* try next */
    }
  }
  throw new Error(
    `og-template: could not locate Inter-Regular.ttf in any of: ${candidates.join(', ')}`,
  )
}

async function loadFonts(): Promise<OgFont[]> {
  if (_fontsCache) return _fontsCache
  _fontsCache = (async () => {
    const { readFile } = await import('node:fs/promises')
    const here = await resolveFontDir()
    const toArrayBuffer = (b: Buffer): ArrayBuffer =>
      b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer
    const [light, regular, semi] = await Promise.all([
      readFile(`${here}Inter-Light.ttf`),
      readFile(`${here}Inter-Regular.ttf`),
      readFile(`${here}Inter-SemiBold.ttf`),
    ])
    return [
      { name: 'Inter', data: toArrayBuffer(light), weight: 300, style: 'normal' },
      { name: 'Inter', data: toArrayBuffer(regular), weight: 400, style: 'normal' },
      { name: 'Inter', data: toArrayBuffer(semi), weight: 600, style: 'normal' },
    ]
  })()
  return _fontsCache
}

/**
 * Build the Satori JSX node tree for a marquee OG card.
 *
 * Mirrors `renderOgSvg`'s visual recipe expressed as flexbox. Satori only
 * accepts a JS object with `{ type, props: { style, children } }` — raw
 * inline styles, no `class` / Tailwind.
 */
function buildOgNode(input: OgTemplateInput): unknown {
  const eyebrow = (input.eyebrow ?? 'ARSAM.NET').toUpperCase()
  return {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0a0a',
        color: '#fafaf9',
        fontFamily: 'Inter',
        padding: '80px',
        position: 'relative',
      },
      children: [
        // Faux corner glow — Satori has no radial gradient, so we offset a
        // soft circle past the top-right edge.
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: '-160px',
              right: '-160px',
              width: '520px',
              height: '520px',
              borderRadius: '520px',
              backgroundColor: '#3f3f46',
              opacity: 0.35,
              display: 'flex',
            },
            children: '',
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: '20px',
              letterSpacing: '4px',
              color: '#a8a29e',
              fontWeight: 600,
              display: 'flex',
            },
            children: eyebrow,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: '36px',
              fontWeight: 300,
              color: '#fafaf9',
              marginTop: '24px',
              display: 'flex',
            },
            children: 'arsam.net',
          },
        },
        {
          type: 'div',
          props: { style: { flex: 1, display: 'flex' }, children: '' },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: '76px',
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: '#fafaf9',
              display: 'flex',
            },
            children: input.title,
          },
        },
        input.subtitle
          ? {
              type: 'div',
              props: {
                style: {
                  fontSize: '28px',
                  color: '#d6d3d1',
                  marginTop: '28px',
                  display: 'flex',
                  fontWeight: 400,
                },
                children: input.subtitle,
              },
            }
          : null,
        {
          type: 'div',
          props: {
            style: {
              fontSize: '16px',
              color: '#a8a29e',
              letterSpacing: '3px',
              marginTop: '48px',
              fontWeight: 600,
              display: 'flex',
            },
            children: "TÜRKİYE'NİN ARSA PAZARI",
          },
        },
      ].filter(Boolean),
    },
  }
}

/**
 * Render the 1200×630 marquee OG card as a PNG buffer.
 *
 * Pipeline: Satori (JSX → SVG) → Resvg (SVG → PNG). Satori is pure JS;
 * Resvg is a native Node addon. Verified working on Node v22 and v25.
 */
export async function renderOgPng(input: OgTemplateInput): Promise<Buffer> {
  const [{ default: satori }, { Resvg }, fonts] = await Promise.all([
    import('satori'),
    import('@resvg/resvg-js'),
    loadFonts(),
  ])
  const svg = await satori(buildOgNode(input) as never, {
    width: 1200,
    height: 630,
    fonts: fonts as never,
  })
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
}

/**
 * Convert a `pathname` to a marquee slug used by `/og/<slug>.svg`. Returns
 * `'anasayfa'` for `/`, `'en'` for `/en`, etc. The endpoint only handles a
 * fixed set of slugs; pages outside the set should opt out via `ogImage`
 * override or simply not render an og:image.
 */
export function slugFromPath(pathname: string): string {
  const cleaned = pathname.replace(/^\/+|\/+$/g, '')
  if (!cleaned) return 'anasayfa'
  // Strip `/en` prefix — EN companion pages reuse the TR slug map.
  const withoutLocale = cleaned.replace(/^en\/?/, '')
  if (!withoutLocale) return 'anasayfa'
  // First segment only — `/ilan/AY-001` → `ilan`.
  const first = withoutLocale.split('/')[0]
  return first || 'anasayfa'
}
