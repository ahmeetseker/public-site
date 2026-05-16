import type { APIRoute, GetStaticPaths } from 'astro'
import { renderOgSvg, type OgTemplateInput } from '@/lib/og-template'
import { getAllPosts, postSlug } from '@/lib/blog'

// Wave F13.D — marquee-page OG image endpoint.
//
// Output path: /og/<slug>.svg — one file per top-level public page.
// Pre-renders at build (Astro picks up `getStaticPaths` + `prerender = true`).
//
// Slug roster
//   6 fixed: anasayfa, ilan, ofis, bolge, yardim, blog
//   + 4 featured blog posts (newest TR posts via getAllPosts('tr').slice(0,4))
//
// Why SVG, not PNG?
//   PNG would require a runtime SVG-to-raster step (satori + resvg/sharp).
//   Adding that pipeline mid-wave costs build time and node-version risk.
//   Modern OG scrapers (Slack, Twitter X, Discord, Facebook 2024+, LinkedIn
//   2024+) all accept `image/svg+xml`, and we already ship .svg from the
//   Wave-5 listing/region/office endpoints with no incidents.

export const prerender = true

const FIXED_SLUGS: Record<string, OgTemplateInput> = {
  anasayfa: {
    eyebrow: 'ARSAM.NET',
    title: "Türkiye'nin arsa pazarı",
    subtitle: 'Aracısız emlak ofisleri · Doğrulanmış ilanlar · Şeffaf fiyat',
  },
  ilan: {
    eyebrow: 'ARSAM · İLANLAR',
    title: 'İlan kataloğu',
    subtitle: 'Arsa, tarla ve zeytinlik — tek bir karşılaştırma diliyle',
  },
  ofis: {
    eyebrow: 'ARSAM · OFİSLER',
    title: 'Ofis ağı',
    subtitle: 'Doğrulanmış emlak ofisleri ve portföyleri',
  },
  bolge: {
    eyebrow: 'ARSAM · BÖLGELER',
    title: 'Bölge rehberi',
    subtitle: 'Ayvalık, Çeşme, Datça, Bodrum ve ötesi',
  },
  yardim: {
    eyebrow: 'ARSAM · YARDIM',
    title: 'Yardım merkezi',
    subtitle: 'Sıkça sorulan sorular, rehberler ve destek',
  },
  blog: {
    eyebrow: 'ARSAM · BLOG',
    title: 'Notlar ve rehberler',
    subtitle: 'Arsa, ofis ve bölge analizlerinden seçmeler',
  },
}

type StaticEntry = { params: { slug: string }; props: { og: OgTemplateInput } }

export const getStaticPaths: GetStaticPaths = async () => {
  const fixed: StaticEntry[] = Object.entries(FIXED_SLUGS).map(([slug, og]) => ({
    params: { slug },
    props: { og },
  }))

  // Featured blog slugs — newest 4 TR posts. If the collection is empty we
  // silently skip; the fixed list above still ships.
  let featured: StaticEntry[] = []
  try {
    const posts = await getAllPosts('tr')
    featured = posts.slice(0, 4).map((p) => ({
      params: { slug: `blog-${postSlug(p)}` },
      props: {
        og: {
          eyebrow: 'ARSAM · BLOG',
          title: p.data.title,
          subtitle: p.data.description,
        },
      },
    }))
  } catch {
    // Content collection unavailable in test env — skip featured posts.
  }

  return [...fixed, ...featured]
}

export const GET: APIRoute = ({ props }) => {
  const og = (props as { og: OgTemplateInput }).og
  const svg = renderOgSvg(og)
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
