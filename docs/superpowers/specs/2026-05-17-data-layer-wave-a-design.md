# Dalga A — Veri Katmanı Foundation

**Tarih:** 2026-05-17
**Statü:** Spec — onay bekliyor
**Sahip:** ahmet şeker
**Bağlam:** 1M+ ilan + kullanıcı ölçeğine hazır frontend için 4 dalgalık refactor'un ilk dalgası. Dalga B (pagination + virtualization), Dalga C (image abstraction) ve Dalga D (SSR/hybrid geçişi) ayrı spec'lerde gelecek.

---

## 1. Hedef

Public-site frontend'ini, mock `LISTINGS` array'ine direkt bağımlılıktan kurtar. Tüm liste/sayım/arama/skorlama operasyonları **TanStack Query hook'larından** veya **server-side async data getter'lardan** geçsin. Backend hazır olunca `configureApi()` flip'i ile tüm sayfalar otomatik gerçek API'ye geçecek; mock layer ile production layer arasında **sadece data source farkı** kalacak.

**Başarı kriteri:** `dist/_astro/*.js` chunk'larının hiçbirinde mock `LISTINGS` data'sı (~50KB+ string) bulunmamak. ESLint kuralı tüm `LISTINGS` direct import'larını bloklamak. Mevcut tüm sayfalar görsel ve fonksiyonel olarak değişmemek.

**Hedef DEĞİL:**
- Backend HTTP endpoint'i yazmak (Dalga D / backend ekibi işi)
- Pagination eklemek (Dalga B)
- SSR'a geçmek (Dalga D)
- Image CDN abstraction (Dalga C)
- Mock data'yı silmek — sadece direkt import'unu yasaklamak

---

## 2. Mevcut Durum (Audit)

26 dosya `import { LISTINGS } from '@landx/data'` ile (veya `LISTINGS_V2`) direkt import ediyor. İki gruba ayrılır:

### 2.1 Build-time importer'lar (Astro frontmatter — SSG)

Bunlar **client bundle'a girmez**, build sırasında çalışır. Yine de yanlış pattern — backend hazır olunca her biri tek tek refactor etmek gerekecek.

| Dosya | Operasyon |
|---|---|
| `components/home/PremiumShowcase.astro` | `selectShowcaseListings(LISTINGS, {limit: 8})` |
| `components/home/FeaturedListings.astro` | `LISTINGS.filter(status==='Aktif').slice(0,6)` |
| `components/home/PopularRegions.astro` | her bölge için `.filter().length` |
| `components/home/StatsBand.astro` | `.length`, `.map(city)`, `.reduce(price)` |
| `components/bolge/SimilarRegions.astro` | per-region `.filter().length` |
| `components/bolge/NeighborRegions.astro` | per-region `.filter().length` |
| `pages/ara.astro` | tam filter pipeline |
| `pages/ilan/[slug].astro` | `getStaticPaths` + detail lookup |
| `pages/en/ilan/[slug].astro` | aynı |
| `pages/ofis/[slug].astro` | office portfolio listing |
| `pages/en/ofis/[slug].astro` | aynı |
| `pages/kategori/[slug].astro` | category filter |
| `pages/hesabim/aramalar.astro` | saved search match count |
| `pages/hesabim/favori.astro` | favorites lookup |
| `pages/en/hesabim/*` | aynı (TR mirror) |
| `pages/sitemap.xml.ts` | tüm slug üretimi |
| `pages/sitemap-debug.astro` | aynı |
| `pages/og/listing/[id].svg.ts` | OG kartı için detail |
| `pages/og/listing/[id].png.ts` | aynı |

### 2.2 Client island importer'lar — KRİTİK

Bu beş dosya, mock `LISTINGS` array'ini gerçekten **tarayıcıya bundle olarak gönderiyor**. 1M ilanda bu = ~500MB JSON, tarayıcı çöker.

| Dosya | Mevcut işlev | Yeni kaynak |
|---|---|---|
| `lib/use-filtered-listings.ts` | Map view için tüm array + client filter | `useListings(filters)` hook (zaten var) |
| `components/compare/CompareIsland.tsx` | `LISTINGS.find(l => l.id === id)` for each selected id | `useListingsByIds(ids)` (yeni hook) |
| `components/listing/SimilarListingsIsland.tsx` | `scoreRelatedListings(current, LISTINGS, ...)` — full scan | `useSimilarListings(currentId)` (yeni hook, backend tarafında scoring) |
| `lib/command-palette.ts` | Cmd+K için tüm LISTINGS/OFFICES/REGIONS | `useCommandPaletteSearch(query)` (yeni hook, debounced) |
| `lib/office-portfolio.ts` | office için listing lookup + centroid fallback | `useOfficeListings(officeId)` (yeni hook) |

### 2.3 Mevcut iskelet (kullanılabilir)

✅ `packages/data/src/query/listings.ts` — `useListings(filters)`, `useListing(id)`, `useListingStatusCounts()` zaten var
✅ `packages/data/src/query/client.ts` — `queryClient` export edilmiş
✅ `packages/data/src/api/` — `apiOrMock`, `landxApi` SDK wrapper hazır
✅ `packages/api-client/` — HTTP SDK hazır, `configureApi()` ile inject ediliyor
✅ `mockAsync()` helper'ı mock'a fake latency ekliyor (loading state'lerin doğru çalışması için)

Eksik olan: **aggregator hook'lar** (showcase, featured, popular regions, stats, similar, command palette) ve **server-side async getter'lar** (Astro frontmatter'dan çağrılabilir).

---

## 3. Mimari

İki yüzeyli bir veri katmanı:

```
┌─────────────────────────────────────────────────────────┐
│                  Sayfa / Component                       │
└─────────────────────────────────────────────────────────┘
         │                              │
         │ (Astro frontmatter)          │ (React island)
         ▼                              ▼
┌──────────────────────┐    ┌──────────────────────────────┐
│  Server Data Getters │    │  TanStack Query Hooks         │
│  (async functions)   │    │  (useListings, vs.)            │
└──────────────────────┘    └──────────────────────────────┘
         │                              │
         └──────────────┬───────────────┘
                        ▼
              ┌──────────────────┐
              │   apiOrMock()    │
              └──────────────────┘
                 │           │
        configured?         else
              ▼              ▼
      ┌─────────────┐  ┌──────────────┐
      │ landxApi    │  │ mock LISTINGS │
      │ (HTTP SDK)  │  │ (in-memory)   │
      └─────────────┘  └──────────────┘
```

**Kritik karar:** Astro `.astro` frontmatter'ı server-side çalışır ve **React hook çağıramaz**. Bu yüzden aggregator'lar iki yüzeyde sunulur:

- `getFeaturedListingsAsync({limit, locale})` — server-side async getter (Astro'dan çağrılır)
- `useFeaturedListings({limit, locale})` — TanStack Query hook (React island'dan çağrılır)

İki yüzey aynı **resolver**'ı çağırır:

```ts
// packages/data/src/query/aggregators.ts
async function resolveFeaturedListings(params) {
  return apiOrMock(
    () => landxApi.listings.featured(params).then(env => env.data),
    () => mockAsync(LISTINGS.filter(l => l.status === 'Aktif').slice(0, params.limit)),
  )
}

// Server-side (Astro frontmatter)
export const getFeaturedListingsAsync = resolveFeaturedListings

// React (TanStack Query)
export function useFeaturedListings(params) {
  return useQuery({
    queryKey: listingKeys.featured(params),
    queryFn: () => resolveFeaturedListings(params),
  })
}
```

Aynı resolver iki yerden çağrılır, **mock/prod switch'i tek noktada** (`apiOrMock`).

---

## 4. Eklenecek Hook'lar / Getter'lar

`packages/data/src/query/aggregators.ts` (yeni dosya):

| Hook / Getter | Parametreler | Döndürür | Kullanıcısı |
|---|---|---|---|
| `useFeaturedListings` / `getFeaturedListingsAsync` | `{limit, locale, category?}` | `Listing[]` | `FeaturedListings.astro`, `PremiumShowcase.astro` (showcase için), `home/*` |
| `useShowcaseListings` / `getShowcaseListingsAsync` | `{limit, override?, locale}` | `Listing[]` | `PremiumShowcase.astro` |
| `usePopularRegions` / `getPopularRegionsAsync` | `{limit, locale}` | `{region, count, slug}[]` | `PopularRegions.astro` |
| `useNeighborRegionCounts` / `getNeighborRegionCountsAsync` | `{regions[]}` | `{slug, count}[]` | `NeighborRegions.astro`, `SimilarRegions.astro` |
| `useStatsBand` / `getStatsBandAsync` | `{locale}` | `{totalListings, cityCount, districtCount, totalValueB}` | `StatsBand.astro` |
| `useSimilarListings` | `(currentId, opts)` | `Listing[]` | `SimilarListingsIsland.tsx` |
| `useListingsByIds` | `(ids[])` | `Listing[]` | `CompareIsland.tsx` |
| `useCommandPaletteSearch` | `(query, opts)` | `{listings, offices, regions}` (max 5 each) | `command-palette.ts` |
| `useOfficeListings` / `getOfficeListingsAsync` | `(officeId)` | `Listing[]` | `office-portfolio.ts`, `ofis/[slug].astro` |
| `getListingDetailAsync` | `(slug)` | `Listing \| null` | `ilan/[slug].astro`, OG endpoints |
| `getCategoryListingsAsync` | `(categorySlug, filters)` | `Listing[]` | `kategori/[slug].astro` |
| `getAllListingSlugsAsync` | `({locale})` | `{slug, id}[]` | `sitemap.xml.ts`, `getStaticPaths` çağrıları |
| `getSearchResultsAsync` | `(filters)` | `Listing[]` | `pages/ara.astro` (Dalga A'da pagination yok, tam liste döner; Dalga B'de cursor eklenir) |

**Query key'leri** `packages/data/src/query/keys.ts`'e eklenir:
```ts
listingKeys.featured(params)
listingKeys.showcase(params)
listingKeys.similar(currentId, opts)
listingKeys.byIds(ids)
listingKeys.search(filters)
listingKeys.commandPalette(query)
regionKeys.popular(params)
regionKeys.neighborCounts(slugs)
statsKeys.band(locale)
officeKeys.listings(officeId)
```

---

## 5. Dosya-Bazında Refactor (26 import noktası)

### 5.1 Build-time getter'a çevrilecekler

Pattern:
```diff
- import { LISTINGS } from '@landx/data'
- const featured = LISTINGS.filter(...).slice(0, 6)
+ import { getFeaturedListingsAsync } from '@landx/data'
+ const featured = await getFeaturedListingsAsync({ limit: 6, locale })
```

Her Astro `.astro` ve API endpoint dosyası (yukarıda 2.1'deki tablo) bu pattern'le güncellenir. `LISTINGS` import'u tamamen kalkar.

### 5.2 Client island'lar — hook'a çevrilecekler

`use-filtered-listings.ts`:
```diff
- import { LISTINGS } from '@landx/data'
- export function useFilteredListings(): Listing[] {
-   const [items, setItems] = useState(() => applyFilters(LISTINGS, sp))
-   ...
- }
+ import { useListings } from '@landx/data'
+ export function useFilteredListings(): Listing[] {
+   const filters = useFiltersFromUrl()  // mevcut URL parse mantığı
+   const { data = [] } = useListings(filters)
+   return data
+ }
```

`CompareIsland.tsx`:
```diff
- import { LISTINGS } from '@landx/data'
- const items = ids.map(id => LISTINGS.find(l => l.id === id)).filter(Boolean)
+ import { useListingsByIds } from '@landx/data'
+ const { data: items = [] } = useListingsByIds(ids)
```

`SimilarListingsIsland.tsx`:
```diff
- import { LISTINGS } from '@landx/data'
- const related = scoreRelatedListings(current, LISTINGS, opts)
+ import { useSimilarListings } from '@landx/data'
+ const { data: related = [] } = useSimilarListings(current.id, opts)
```

(Mock implementation: hook backend yokken `apiOrMock` ile mock'a düşer ve `scoreRelatedListings`'i in-memory çağırır. Backend hazır olunca `/listings/:id/similar` endpoint'i scoring'i server-side yapar.)

`command-palette.ts`:
- Helper artık React hook'a sarılı olacak. Mevcut `searchEntities(q)` fonksiyonu **kalır**, sadece input olarak `LISTINGS/OFFICES/REGIONS` parametre alır.
- `CommandPaletteMount.tsx` içinde `useCommandPaletteSearch(query)` hook'u çağrılır, debounce'lu, sonuçlar mount'a inject edilir.

`office-portfolio.ts`:
- Pure helper fonksiyonlarına dokunmuyoruz (`pickOfficeListings`, `centroidOf`).
- Sadece `LISTINGS` parametresi olarak dışarıdan geliyor. Çağıran taraf (Astro frontmatter veya island) `getOfficeListingsAsync(officeId)` ile çeker, helper'a verir.

### 5.3 Detay sayfaları (`ilan/[slug].astro`)

`getStaticPaths`'i şimdilik **olduğu gibi bırakıyoruz**. Statik build hâlâ çalışsın. Sadece:
```diff
- const listing = LISTINGS.find(l => slugify(l.title) + '-' + l.id === params.slug)
+ const listing = await getListingDetailAsync(params.slug)
```

`getStaticPaths` içinde de `getAllListingSlugsAsync()` çağrılır. Dalga D'de bu fonksiyon `getStaticPaths`'i hiç çağrılmaz, SSR'a geçer.

---

## 6. ESLint Kuralı

ESLint config (`packages/eslint-config/index.js` veya bu workspace package'ın canonical export'u — implementation aşamasında tam yolu doğrulanır) içine:

```js
{
  rules: {
    'no-restricted-imports': ['error', {
      paths: [{
        name: '@landx/data',
        importNames: ['LISTINGS', 'LISTINGS_V2'],
        message: 'Direct LISTINGS import yasak. Hook (useListings, useFeaturedListings vs.) veya server getter (getListingsAsync vs.) kullan. Wave A migration için bkz: docs/superpowers/specs/2026-05-17-data-layer-wave-a-design.md',
      }],
    }],
  },
  overrides: [
    {
      // Mock layer kendi kendine LISTINGS'i import edebilir
      files: ['packages/data/src/**/*'],
      rules: { 'no-restricted-imports': 'off' },
    },
    {
      // Vitest testleri seed verisi için import edebilir
      files: ['**/__tests__/**/*', '**/*.test.ts', '**/*.test.tsx'],
      rules: { 'no-restricted-imports': 'off' },
    },
  ],
}
```

Build CI: `pnpm typecheck && pnpm eslint .` ile bu kural enforce edilir.

---

## 7. Test Stratejisi

### 7.1 Unit (Vitest)

- `packages/data/src/__tests__/aggregators.test.ts` — yeni dosya
  - Her aggregator için mock LISTINGS verisiyle expected output testi
  - `mockAsync` ile async behavior testi
  - Edge case: boş liste, locale farkı (`tr` vs `en`)

### 7.2 Integration (Vitest)

- `src/lib/__tests__/use-filtered-listings.test.tsx` — varsa güncellenir, yoksa eklenir
  - TanStack Query test wrapper (`QueryClientProvider`) ile hook'u render et
  - URL search params değişince refetch beklentisi

### 7.3 E2E (Playwright)

**Kullanıcı bunları kendi çalıştıracak** (memory: `feedback_skip_e2e.md`). Sadece smoke check listesi vermem yeterli:

- `/` (anasayfa) görsel olarak değişmemiş
- `/ara` filtreleme hâlâ çalışıyor
- `/ara` map view marker'ları doğru
- `/ilan/<slug>` detay sayfası açılıyor, similar listings görünüyor
- `/karsilastir?ids=...` karşılaştırma çalışıyor
- Cmd+K palette arama doğru sonuç döner
- Office sayfası portfolyo gösteriyor

### 7.4 Bundle Doğrulama

`pnpm build` sonrası:
1. `dist/stats.html` aç (rollup-plugin-visualizer)
2. `LISTINGS` data'sının (50KB+ string) hiçbir client chunk'ta olmadığını doğrula
3. Total client JS bundle'ı önceki build'le karşılaştır — düşmüş olmalı

```bash
# Otomatik kontrol — herhangi bir _astro/*.js'de mock data yoksa exit 0
grep -l "id\":\"L[0-9]\{3,\}\".*\"district\"" dist/_astro/*.js && echo "FAIL: LISTINGS leaked to client" || echo "OK"
```

---

## 8. Migration Sırası

Üst üste atomik commit'lerle ilerlenir, her commit yeşil bırakır:

1. **Aggregator hook + getter'ları ekle** (`packages/data/src/query/aggregators.ts`, `query/keys.ts` update, `__tests__/aggregators.test.ts`). **Hiçbir consumer değişmez**, build hâlâ yeşil. Commit.
2. **Build-time consumer'ları çevir** (Astro `.astro` dosyaları + `.ts` endpoint'leri — Section 2.1). Tek tek dosya, küçük commit'ler grup grup (örn. "home/*", "bolge/*", "pages/og/*", "pages/hesabim/*"). Her commit'te `pnpm typecheck && pnpm build` çalışır.
3. **Client island'ları çevir** (Section 2.2). En riskli kısım — TanStack Query mount'larının çalıştığından emin olunur. Her island ayrı commit.
4. **ESLint kuralını aktive et**. Bu commit'te kuralın geçtiğini `pnpm eslint .` ile doğrula. Eğer kalan yer varsa o commit'te düzelt.
5. **Bundle doğrulaması**, `dist/stats.html` incelenir, son commit'in açıklamasında `LISTINGS` leak yok bilgisi (örn. "client bundle'da mock data 0 byte") notu bırakılır.

Tahmini commit sayısı: 8-12 küçük commit. Her biri bağımsız revert edilebilir.

---

## 9. Riskler ve Azaltma

| Risk | Olasılık | Etki | Azaltma |
|---|---|---|---|
| TanStack Query island'ların hydration patlatması (her ada kendi `QueryClientProvider`'ını sarmıyor) | Orta | Yüksek — runtime hata | `packages/data/src/query/client.ts` üzerinden tek `queryClient` instance shared. Mount component'lerinde `<QueryClientProvider client={queryClient}>` sarımı kontrol — eğer yoksa eklenecek (`src/components/*/MountWithProvider.tsx` pattern'i) |
| `mockAsync` latency'si build'i yavaşlatır | Düşük | Düşük | Server-side getter'lar build'de `mockAsync` yerine direkt sync resolution yapar (env flag: `BUILD_TIME=true` → no fake latency) |
| Aggregator hook'un useEffect dependency loop'u (URL state ile combine olduğunda) | Orta | Orta | `useFilteredListings` refactor'unda mevcut popstate/arsam:urlchange dinleyicileri korunur, sadece veri kaynağı değişir |
| `getStaticPaths` async fonksiyona izin verir mi? | Düşük | Yüksek — build kırılır | Astro 6'da `getStaticPaths()` async destekler (test edilecek; değilse top-level await ile build time'da çağrılır) |
| Test seed verisi (`__tests__/`) ESLint override'tan dolayı yine LISTINGS import eder, koda sızabilir | Düşük | Düşük | Test path'leri sadece `__tests__/` ve `*.test.ts(x)` — production import kontrolü kurallı |
| `command-palette`'in debounced search'ünde TanStack Query keepPreviousData davranışı flicker yapar | Orta | Düşük | `placeholderData: keepPreviousData` (zaten `useListings`'te var) palette hook'unda da kullanılır |

---

## 10. Onay Sonrası Adımlar

1. Bu spec onaylandıktan sonra `superpowers:writing-plans` skill'i ile **detaylı implementation plan** çıkarılır (`docs/superpowers/plans/2026-05-17-data-layer-wave-a-plan.md`).
2. Plan'da her commit için: dokunulan dosyalar, yapılan değişiklik özeti, çalıştırılacak test/build komutları, beklenen sonuçlar bulunur.
3. Plan da onaylandıktan sonra `superpowers:executing-plans` ile uygulamaya geçilir.

---

## 11. Out-of-Scope (Sonraki Dalgalar)

- **Dalga B:** `/ara` cursor pagination + `react-virtuoso` sanal liste. `useListings` hook'u `useInfiniteQuery`'ye genişler.
- **Dalga C:** `getListingImageUrl(id, {w,h,q})` helper + `ResponsiveListingImage` kanonik, eski `ListingImage` deprecate.
- **Dalga D:** `output: 'static'` → `output: 'server'`, Vercel adapter, `getStaticPaths` kaldırılır, ISR ile listing detayı dinamik render.

Her dalga kendi spec'iyle gelir. Dalgalar kabaca paralel değil — her dalga öncekinin temellerine yaslanır.
