// SVG-based OG image template — Wave-5 / Agent-25 / Faz 9.11
// Generates 1200x630 Open Graph cards with brand-consistent styling.
// Pure SVG (no Satori/Resvg dependency) — assembled inline and served via
// Astro endpoints that pre-render to `dist/og/<type>/<slug>.svg` at build.

export type OgType = 'listing' | 'region' | 'office' | 'home'

export interface OgInput {
  type: OgType
  title: string
  subtitle: string
  badge?: string
  accent?: string // status pill / category hint
}

// 1200x630 — canonical OG dimensions per og:image spec.
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

// Naive word-wrap that respects soft maxChars per line.
// Caps at 3 lines for predictable layout — overflow is silently dropped.
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/)
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
  return lines.slice(0, 3)
}

// Pastel background per content type — keeps cards readable when shared in
// link unfurls (warm cream brand palette compatible).
function bgColor(type: OgType): string {
  switch (type) {
    case 'listing':
      return '#fef3c7'
    case 'region':
      return '#dcfce7'
    case 'office':
      return '#dbeafe'
    case 'home':
    default:
      return '#fde68a'
  }
}

export function renderOgSvg(og: OgInput): string {
  const titleLines = wrap(og.title, 32)
  const titleY = 240 // baseline of first line
  const lineHeight = 76
  const bg = bgColor(og.type)

  const eyebrow = `ARSAM.NET${og.badge ? ' · ' + og.badge.toUpperCase() : ''}`

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="1" stop-color="#fafaf9"/>
    </linearGradient>
    <linearGradient id="ink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1c1917"/>
      <stop offset="1" stop-color="#44403c"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <g fill="#1c1917" opacity="0.06">
    <circle cx="${W - 80}" cy="80" r="120"/>
    <circle cx="${W - 200}" cy="${H - 150}" r="80"/>
  </g>

  <text x="80" y="100" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="20" letter-spacing="3" fill="#78716c">${escape(eyebrow)}</text>

  <text x="80" y="160" font-family="ui-serif, Georgia, 'Times New Roman', serif" font-size="40" font-weight="300" fill="#1c1917">arsam<tspan font-style="italic" fill="#78716c">.net</tspan></text>

  ${titleLines
    .map(
      (line, i) =>
        `<text x="80" y="${titleY + i * lineHeight}" font-family="ui-serif, Georgia, 'Times New Roman', serif" font-size="68" font-weight="300" fill="url(#ink)">${escape(line)}</text>`,
    )
    .join('\n  ')}

  <text x="80" y="${titleY + titleLines.length * lineHeight + 50}" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" font-size="28" fill="#44403c">${escape(og.subtitle)}</text>

  ${og.accent ? `<g transform="translate(80 ${H - 130})">
    <rect x="0" y="0" rx="14" ry="14" width="${og.accent.length * 14 + 28}" height="36" fill="#1c1917" opacity="0.92"/>
    <text x="14" y="24" font-family="ui-mono, monospace" font-size="14" letter-spacing="2" fill="#fafaf9">${escape(og.accent.toUpperCase())}</text>
  </g>` : ''}

  <circle cx="80" cy="${H - 60}" r="6" fill="#1c1917"/>
  <text x="100" y="${H - 55}" font-family="ui-monospace, monospace" font-size="16" letter-spacing="2" fill="#78716c">TÜRKİYE'NİN ARSA PAZARI</text>
</svg>`
}
