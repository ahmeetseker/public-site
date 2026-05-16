import type { APIRoute, GetStaticPaths } from 'astro'
import { LISTINGS } from '@landx/data'
import { renderOgPng, type OgTemplateInput } from '@/lib/og-template'

// Wave F22.C — per-listing 1200×630 OG PNG sibling of `[id].svg.ts`.
// Output path: /og/listing/<id>.png (one per LISTINGS entry).

export const prerender = true

export const getStaticPaths: GetStaticPaths = () => {
  return LISTINGS.map((l) => ({
    params: { id: l.id },
    props: {
      og: {
        eyebrow: `ARSAM · ${l.type.toUpperCase()}`,
        title: l.title,
        subtitle: `${l.district}, ${l.city} · ${l.size.toLocaleString('tr-TR')} m²`,
      } satisfies OgTemplateInput,
    },
  }))
}

export const GET: APIRoute = async ({ props }) => {
  const og = (props as { og: OgTemplateInput }).og
  const png = await renderOgPng(og)
  return new Response(png as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
