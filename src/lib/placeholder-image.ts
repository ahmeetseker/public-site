// Deterministic placeholder image generator.
//
// Goal: every listing / office / region renders a *stable* gradient + label so
// the same entity always looks the same across pages — but no real asset is
// required yet. Same input always produces the same SVG. When real .webp files
// drop into `src/assets/<type>/`, the dedicated *Image components can be
// upgraded to prefer them and this helper continues to back the fallback path.
//
// Output is inlined as a `data:image/svg+xml,...` URI so it ships in the HTML
// (no extra HTTP round-trip) and works in static SSG output.

const PALETTE = [
  { from: '#fde68a', to: '#f59e0b', label: '#78350f' }, // amber
  { from: '#bbf7d0', to: '#22c55e', label: '#14532d' }, // emerald
  { from: '#dbeafe', to: '#3b82f6', label: '#1e3a8a' }, // blue
  { from: '#fecaca', to: '#ef4444', label: '#7f1d1d' }, // rose
  { from: '#e9d5ff', to: '#8b5cf6', label: '#4c1d95' }, // violet
  { from: '#cffafe', to: '#06b6d4', label: '#164e63' }, // cyan
  { from: '#fbcfe8', to: '#ec4899', label: '#831843' }, // pink
  { from: '#d9f99d', to: '#84cc16', label: '#365314' }, // lime
] as const

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function pickPalette(seed: string): (typeof PALETTE)[number] {
  return PALETTE[hash(seed) % PALETTE.length]!
}

export type PlaceholderRatio = '16/9' | '4/3' | '1/1'
export type PlaceholderSize = 'sm' | 'md' | 'lg'

export interface PlaceholderOptions {
  /** Anything stable: `listing.id`, `office.slug`, `region.slug`. */
  seed: string
  /** Visible text — keep short (district, initials, region name). */
  label: string
  ratio?: PlaceholderRatio
  /** Controls label font size only (gradient is full-bleed regardless). */
  size?: PlaceholderSize
}

const RATIO_DIMS: Record<PlaceholderRatio, { w: number; h: number }> = {
  '16/9': { w: 1280, h: 720 },
  '4/3': { w: 960, h: 720 },
  '1/1': { w: 720, h: 720 },
}

const SIZE_FONT: Record<PlaceholderSize, number> = { sm: 56, md: 96, lg: 144 }

export function buildPlaceholderSvg(opts: PlaceholderOptions): string {
  const { seed, label, ratio = '4/3', size = 'md' } = opts
  const dims = RATIO_DIMS[ratio]
  const p = pickPalette(seed)
  const safeLabel = label.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const gid = `g-${hash(seed)}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dims.w} ${dims.h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${safeLabel}">
  <defs>
    <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.from}" />
      <stop offset="1" stop-color="${p.to}" />
    </linearGradient>
  </defs>
  <rect width="${dims.w}" height="${dims.h}" fill="url(#${gid})" />
  <text x="${dims.w / 2}" y="${dims.h / 2}" text-anchor="middle" dominant-baseline="middle" font-family="ui-serif, 'New York', Lora, serif" font-size="${SIZE_FONT[size]}" font-weight="300" fill="${p.label}" opacity="0.35">${safeLabel}</text>
</svg>`
}

/** Return the placeholder as a data URI suitable for `<img src>`. */
export function placeholderDataUri(opts: PlaceholderOptions): string {
  const svg = buildPlaceholderSvg(opts)
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22')
  return `data:image/svg+xml;charset=utf-8,${encoded}`
}

/** Return the rendered pixel dimensions for a ratio — handy for `<img width/height>`. */
export function dimsForRatio(ratio: PlaceholderRatio): { w: number; h: number } {
  return RATIO_DIMS[ratio]
}
