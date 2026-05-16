import type { APIRoute, GetStaticPaths } from 'astro'
import { REGIONS } from '@landx/data'
import { renderOgSvg, type OgInput } from '@/lib/og'

// Wave-5 / Agent-25 / Faz 9.11 — per-region 1200x630 OG SVG.
// Output path: /og/region/<slug>.svg (one per REGIONS entry, 8 total).

export const getStaticPaths: GetStaticPaths = () => {
  return REGIONS.map((r) => ({
    params: { slug: r.slug },
    props: {
      og: {
        type: 'region',
        title: r.name,
        subtitle: `${r.city} · Arsa pazarı`,
        badge: 'Bölge',
      } satisfies OgInput,
    },
  }))
}

export const GET: APIRoute = ({ props }) => {
  const og = props.og as OgInput
  const svg = renderOgSvg(og)
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
