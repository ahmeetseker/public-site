import type { APIRoute, GetStaticPaths } from 'astro'
import { renderOgPng, type OgTemplateInput } from '@/lib/og-template'
import { getAllPosts, postSlug } from '@/lib/blog'

// Wave F22.C — marquee-page OG PNG endpoint (PNG sibling of `[slug].svg.ts`).
//
// Output path: /og/<slug>.png. Same 6 fixed slugs + featured blog posts as the
// SVG variant, so the OG meta swap in `RootLayout.astro` can simply replace
// the `.svg` extension with `.png` on a per-slug basis.

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
