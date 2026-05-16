# Public-site E2E Tests (Playwright)

## Local çalıştırma

İlk seferde browser binary'leri kur:

```bash
pnpm exec playwright install chromium
```

Sonra:

```bash
pnpm --filter @landx/public-site run test:e2e         # headless run
pnpm --filter @landx/public-site run test:e2e:ui      # interactive UI mode
```

Pre-test build otomatik (`pretest:e2e`).

## CI

CI'da `playwright install --with-deps chromium` çalıştırılmalı sonra `pnpm test:e2e`.

## Webserver stratejisi

`playwright.config.ts` `webServer` config'i `pnpm run preview --port 4174 --host` ile Astro preview server'ı spawn eder. Preview server ancak `pnpm build` sonrası `dist/` üzerinden çalışır — bu yüzden `pretest:e2e` scripti otomatik build çalıştırır.

`reuseExistingServer: !process.env.CI` — local'de zaten 4174'te bir preview varsa onu kullanır; CI'da her seferinde fresh server spawn'lar.

## Port allocation (Wave-6)

- atolye-admin → 4173
- public-site → 4174 (bu app)
- super-admin → 4175

## Test dosyaları

- `01-homepage.spec.ts` — hero + search render, JSON-LD WebSite, header nav
- `02-search.spec.ts` — /ara grid, ?tip filter, ?sort URL preserved
- `03-listing-detail.spec.ts` — Cunda listing JSON-LD RealEstateListing/TRY, 3 sample slug reachable
- `04-region.spec.ts` — /bolge index, /bolge/cesme FAQ details/summary
- `05-auth-flow.spec.ts` — /hesabim redirect to /giris, login sets `arsam_buyer_demo` cookie
- `06-legal-sitemap.spec.ts` — /kvkk renders, /sitemap.xml XML valid, /robots.txt sitemap ref
