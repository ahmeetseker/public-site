import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import { visualizer } from 'rollup-plugin-visualizer'

// LandX public-site — Astro 6 + React islands + Tailwind v4 (via PostCSS)
// @tailwindcss/vite, Astro'nun Vite 8 (rolldown) build'iyle uyumsuz olduğu için
// PostCSS moduna geçildi (postcss.config.mjs).
// Path-based deploy hedef: arsam.net/ root (admin /panel, ops /ops yan yana).
// Faz 9.13.b — Astro built-in i18n routing ENABLED.
// `prefixDefaultLocale: false` keeps TR canonical at `/` (so all existing /ara,
// /bolge/* URLs stay put) and EN under `/en/*`. Pages now opt-in via the
// `t(key, locale)` / `useDict(path, locale)` helpers in `src/i18n/`.
// See docs/i18n.md for the migration plan.
// Image pipeline (Wave-10 / Faz-13.i):
// - Astro auto-detects Sharp (already installed by Wave 6) for its built-in
//   image service, so we don't need to set `image.service` explicitly.
// - Real listing .webp files drop into `src/assets/listings/` and metadata
//   sits in the `listingImages` content collection (`src/content.config.ts`).
// - Components: `<ResponsiveListingImage>` is the canonical full-srcset path;
//   `<ListingImage>` remains as a backwards-compatible simple placeholder.
// See `docs/dev/images.md` for the full add-an-image workflow.
// Font policy (Wave-13/A65 — Faz 13.o):
// We intentionally ship NO custom @font-face. `src/styles/_theme.css` defines
// --font-sans/--font-serif/--font-mono as pure system stacks (SF Pro/New York/
// SF Mono with full BlinkMacSystemFont + ui-* fallbacks). That means:
//   1. Zero font bytes downloaded — no .woff2 in the build output.
//   2. Browser uses the OS font, which already has full TR coverage
//      (Ş/ş, İ/ı, Ğ/ğ, Ç/ç, U+0130 dotted-I, U+0131 dotless-i).
//   3. `unicode-range` subsetting is therefore N/A here — there is no @font-face
//      declaration to attach a range to. If we ever adopt a hosted webfont
//      (e.g. self-hosted Inter or Fraunces), the subset would be:
//        unicode-range: U+0000-024F, U+1E00-1EFF, U+0307, U+0130;
//      covering Basic Latin + Latin-1 Supplement + Latin Extended-A/-B
//      + combining dot above + capital dotted I (LATIN CAPITAL LETTER I WITH
//      DOT ABOVE). Logged here so it's not re-investigated.
export default defineConfig({
  output: 'static',
  site: process.env.SITE || 'https://arsam.net',
  base: process.env.BASE_PATH || '/',
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [react()],
  vite: {
    // F25.C — bundle analyzer (atolye/super patern reuse) — her build'de
    // dist/stats.html treemap üretir; ANALYZE flag aramıyoruz çünkü
    // public-site build'i nadir ve stats.html prod artifact'ına dahil
    // değil (yalnızca dev/CI inceleme için statik dosya).
    plugins: [
      visualizer({
        filename: 'dist/stats.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
    ],
    build: {
      // Wave-13/A65: explicit — Astro 6 defaults to true, but pin it so the
      // page-level CSS code-splitting Astro relies on (per-route _astro/*.css
      // chunks) cannot silently regress.
      cssCodeSplit: true,
    },
    // F25.C — 'hidden' source maps: .map dosyaları emit edilir ama
    // bundle içinde //# sourceMappingURL referansı yoktur. Sentry CLI
    // upload edebilir, end-user devtools'ta görmez.
    // Astro 6 sourcemap'i top-level vite.build.sourcemap'ten DEĞİL,
    // `environments.client.build.sourcemap`'ten okur (static-build.js:288).
    // Bu yüzden ayar burada nested yapılır.
    environments: {
      client: {
        build: {
          sourcemap: 'hidden',
        },
      },
    },
  },
})
