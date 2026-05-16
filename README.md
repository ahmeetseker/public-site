# Public Site

`arsam.net/` — Türkiye'nin arsa pazarı.

## Komutlar

```bash
pnpm --filter @landx/public-site run dev           # :5180
pnpm --filter @landx/public-site run build         # 58 SSG sayfa + 31 OG SVG
pnpm --filter @landx/public-site run preview       # :4174
pnpm --filter @landx/public-site exec astro check  # 0 errors target
pnpm --filter @landx/public-site run test:e2e
```

## Mimari

- **Astro 6** SSG + React islands
- **Tailwind v4** (PostCSS mode — vite plugin Vite 8 ile uyumsuz)
- **Output:** static (CDN-friendly, no server runtime)
- **58 sayfa:** homepage, /ara, /ilan/[slug] x 18, /ofisler + /ofis/[slug] x 4, /bolge + /bolge/[slug] x 8, /sss, /hakkimizda, /iletisim, /kvkk, /cerez-politikasi, /kullanim-sartlari, /ilan-ver wizard (8 step), /hesabim/* x 5, /giris, /kayit, /cikis, /en/, /sitemap-debug

## SEO

- 31 OG SVG endpoint (1200x630 deterministic palette per type)
- JSON-LD: WebSite (home), RealEstateListing (ilan), RealEstateAgent + AggregateRating (ofis), Place + FAQPage (bölge), FAQPage (/sss), BreadcrumbList (component)
- sitemap.xml dynamic endpoint (37+ URLs)
- robots.txt — Allows public, disallows /panel /ops /hesabim /_mock-, blocks AI training crawlers (GPTBot, ClaudeBot, etc.)

## i18n

- TR canonical, EN scaffold (LocalePicker in SiteHeader, /en/index.astro proof-of-concept)
- Full Astro i18n migration: Faz 9.13.b (see [docs/i18n.md](../../docs/i18n.md))

## /hesabim/* (buyer area)

Cookie-based mock auth (`arsam_buyer_demo=1`). Real auth: Faz 10.2.
