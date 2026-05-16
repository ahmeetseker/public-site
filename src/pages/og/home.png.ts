import type { APIRoute } from 'astro'
import { renderOgPng } from '@/lib/og-template'

// Wave F22.C — homepage 1200×630 OG PNG.
// Sibling of `home.svg.ts`. Pre-rendered at build (`prerender = true`) so the
// Satori + Resvg cost lives in `astro build`, not in production responses.

export const prerender = true

export const GET: APIRoute = async () => {
  const png = await renderOgPng({
    eyebrow: 'ARSAM.NET',
    title: "Türkiye'nin arsa pazarı",
    subtitle: 'Aracısız emlak ofisleri · Doğrulanmış ilanlar · Şeffaf fiyat',
  })
  return new Response(png as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
