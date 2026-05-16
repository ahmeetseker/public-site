import type { APIRoute, GetStaticPaths } from 'astro'
import { OFFICES } from '@landx/data'
import { renderOgPng, type OgTemplateInput } from '@/lib/og-template'

// Wave F22.C — per-office 1200×630 OG PNG sibling of `[slug].svg.ts`.
// Output path: /og/office/<slug>.png (one per OFFICES entry).

export const prerender = true

export const getStaticPaths: GetStaticPaths = () => {
  return OFFICES.map((o) => ({
    params: { slug: o.slug },
    props: {
      og: {
        eyebrow: 'ARSAM · OFİS',
        title: o.name,
        subtitle: `${o.district}, ${o.city} · ${o.rating.toFixed(1)}/5 · ${o.reviewCount} değerlendirme`,
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
