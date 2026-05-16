import type { APIRoute, GetStaticPaths } from 'astro'
import { REGIONS } from '@landx/data'
import { renderOgPng, type OgTemplateInput } from '@/lib/og-template'

// Wave F22.C — per-region 1200×630 OG PNG sibling of `[slug].svg.ts`.
// Output path: /og/region/<slug>.png (one per REGIONS entry).

export const prerender = true

export const getStaticPaths: GetStaticPaths = () => {
  return REGIONS.map((r) => ({
    params: { slug: r.slug },
    props: {
      og: {
        eyebrow: 'ARSAM · BÖLGE',
        title: r.name,
        subtitle: `${r.city} · Arsa pazarı`,
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
