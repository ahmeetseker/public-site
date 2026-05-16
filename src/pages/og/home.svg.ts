import type { APIRoute } from 'astro'
import { renderOgSvg, type OgInput } from '@/lib/og'

// Wave-5 / Agent-25 / Faz 9.11 — homepage 1200x630 OG SVG.
// Static (no params) — output path: /og/home.svg.

const og: OgInput = {
  type: 'home',
  title: "Türkiye'nin arsa pazarı",
  subtitle: 'Aracısız emlak ofisleri · Doğrulanmış ilanlar · Şeffaf fiyat',
  badge: '47 ilan',
}

export const GET: APIRoute = () => {
  const svg = renderOgSvg(og)
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
