import type { APIRoute, GetStaticPaths } from 'astro'
import { LISTINGS } from '@landx/data'
import { renderOgSvg, type OgInput } from '@/lib/og'

// Wave-5 / Agent-25 / Faz 9.11 — per-listing 1200x630 OG SVG.
// Output path: /og/listing/<id>.svg (one per LISTINGS entry, 18 total).

export const getStaticPaths: GetStaticPaths = () => {
  return LISTINGS.map((l) => ({
    params: { id: l.id },
    props: {
      og: {
        type: 'listing',
        title: l.title,
        subtitle: `${l.district}, ${l.city} · ${l.size.toLocaleString('tr-TR')} m²`,
        badge: l.type,
        accent: l.status,
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
