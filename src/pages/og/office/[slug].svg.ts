import type { APIRoute, GetStaticPaths } from 'astro'
import { OFFICES } from '@landx/data'
import { renderOgSvg, type OgInput } from '@/lib/og'

// Wave-5 / Agent-25 / Faz 9.11 — per-office 1200x630 OG SVG.
// Output path: /og/office/<slug>.svg (one per OFFICES entry, 4 total).

export const getStaticPaths: GetStaticPaths = () => {
  return OFFICES.map((o) => ({
    params: { slug: o.slug },
    props: {
      og: {
        type: 'office',
        title: o.name,
        subtitle: `${o.district}, ${o.city}`,
        badge: `${o.rating.toFixed(1)}/5 · ${o.reviewCount} değerlendirme`,
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
