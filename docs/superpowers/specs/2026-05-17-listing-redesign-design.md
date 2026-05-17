# Listing (/ara) yeniden tasarımı — design spec

**Tarih:** 2026-05-17
**Statü:** brainstorming çıktısı, implementation planı bekliyor
**Mockup kaynağı:** `arsa_arama_responsive_yeniden_tasarim.html` (repo root)

## Bağlam

`arsa_arama_responsive_yeniden_tasarim.html` mockup'ı `/ara` listing sayfası için tam yeniden tasarım öneriyor. Mockup geniş ekran + mobil (≤640px) varyantlarını içeriyor. Veri katmanı (filtreler, hazard scores, comparison fields) zaten büyük ölçüde mevcut; migration ağırlıklı olarak **organizasyon ve görsel** seviyesinde.

### Karar özetleri (brainstorming aşamasında onaylandı)

- **Kapsam:** Tam migration — mevcut `/ara` mockup'a uyarlanır.
- **Tasarım dili:** mockup'un layout/component yapısı + mevcut editorial dil (font-serif başlıklar, font-mono caps eyebrow, mevcut renk tokenları). Mockup'taki Ti-ikon set'i mevcut ikon kütüphanesine (Lucide) eşlenir.
- **Harita modu:** `AraMapShell` aynen korunur; sadece toolbar'daki view picker mockup stiline gelir.
- **Vitrin mekanizması:** `Listing` tipine `isFeatured?: boolean` eklenir; mock seed'de işaretlenen ilanlar üstte yatay vitrin kartı olarak render edilir.
- **İş dilimleme:** 4 wave, her wave ayrı PR.

## Mimari

```
src/pages/ara.astro                                  # SSR; yeni query param'lar bağlanır
└── src/components/search/
    ├── SearchHeader.astro                           # CategoryTabs header'a, mockup düzeni
    ├── MobileHeader.astro                           # YENİ — mobil burger+search+tabs
    ├── FilterSidebar.astro                          # chip/pill, segmented, multi-checkbox
    │   └── category-filter-blocks/ArsaFilters.astro # mockup'a göre gruplandırılır
    ├── ResultsToolbar.astro                         # YENİ — sayım + "X yeni" + sort + view picker
    ├── FeaturedListingCard.astro                    # YENİ — yatay altın çerçeve
    ├── ListingCard.astro                            # mockup tarzı bilgi yoğun kart
    ├── ResultsGrid.astro                            # vitrin slot + sm:2/xl:3 grid + ?page=
    ├── SaveSearchBanner.astro                       # YENİ — feed sonu CTA (mobil + desktop)
    ├── MobileQuickFilters.tsx                       # YENİ — yatay pill row + mini bottom sheet
    ├── MobileStickyBar.tsx                          # YENİ — Filtreler/Sırala/Harita 3-buton
    └── MobileFilterSheet.tsx                        # focusSection prop ile reuse genişletilir

packages/data/src/mock/types.ts                      # +isFeatured?, +hasGas?
packages/data/src/mock/listings-v2 seed              # featured + hasGas işaretler
packages/data/src/lib/getHazardBand.ts               # YENİ — hazard score → band helper
```

**Data flow:** URL query → `ara.astro` SSR filter+sort+paginate → component'lere prop. Compare/save/fav island'ları kendi local state'ini tutar; URL global source of truth.

## Wave 1 — Veri katmanı (foundation)

**Amaç:** sonraki dalgaların ihtiyaç duyduğu alanlar ve helper'lar hazır olsun.

1. `packages/data/src/mock/types.ts` — `Listing` interface'ine eklenir:
   - `isFeatured?: boolean` — vitrin işareti
   - `hasGas?: boolean` — özellik filtresi (mockup'ta "Doğalgaz" checkbox)
   - `comparisonHint?: string` — vitrin kartında "%9 emsal altı" gibi serbest metin (basitleştirme; gerçek emsal hesaplama scope dışı)
2. Seed (`listings-v2` veya ilgili kaynak dosya — implementation aşamasında lokalize edilir): kategori başına 1-2 ilan `isFeatured: true` + uygun `comparisonHint`; `hasGas` mantıklı bir oranda true atanır.
3. `packages/data/src/lib/getHazardBand.ts` — `HAZARD_SCORES` tablosundan listing id ile join eden, `'dusuk' | 'orta' | 'yuksek'` döndüren saf fonksiyon. **Sınır değerleri** mevcut `HAZARD_SCORES` dağılımına kalibre edildi (LISTINGS şehirleri Aydın/Balıkesir/Muğla/İzmir; skor aralığı ~[40, 100]): `< 55 → düşük`, `< 80 → orta`, `≥ 80 → yüksek`. Balıkesir alt aralığı (PGA ~0.22-0.27) düşük band'a; orta şehirler orta band'a; İzmir/Muğla/Aydın üst yarısı yüksek band'a doğal olarak düşer. Ek seed listingsi gerekmez.
4. `src/pages/ara.astro` SSR filter loop'una eklenecek query param'lar:
   - `priceMin` (number, varsayılan 0)
   - `sizeMin` / `sizeMax` (number)
   - `imar` (csv multi: `konut,ticari`) — `Listing.zoning` ile eşleşir
   - `tapu` (single: `tapulu`/`hisseli`) — `Listing.titleStatus`
   - `cephe`, `su`, `elektrik`, `gaz` (boolean) — `hasRoad/Water/Electricity/Gas`
   - `depremRisk` (csv multi: `dusuk,orta,yuksek`) — `getHazardBand(id)` join
5. `ara.astro` SSR'da türetilen yeni değişkenler:
   - `newCount`: `filtered.filter(l => Date.now() - new Date(l.lastUpdate).getTime() < 7 * 86400_000).length`
   - `featured`: `filtered.find(l => l.isFeatured)`
   - `regular`: `filtered.filter(l => l !== featured)`
   - `page`: `Number(url.searchParams.get('page') ?? 1)`; `pageSize` sabit 12

**Test:**
- `getHazardBand` unit (Vitest): sınır değerleri.
- `ara.astro` integration (Playwright): yeni query param kombinasyonları için sonuç sayısı.

**Risk:** Düşük. Pure additive; UI tarafında değişiklik yok.

## Wave 2 — Filter sidebar redesign

**Amaç:** mevcut `<details>+select` sidebar'ı, mockup'taki gruplanmış chip/pill/segmented yapıya taşı; URL state ve sessionStorage davranışını koru.

### Bölüm yapısı

| Bölüm | Mockup hedefi | URL param |
|---|---|---|
| Header | "Filtreler" + sağda inline "Temizle" | – |
| Anahtar kelime | text input | `q` |
| Arsa tipi | **pill toggle (single)** | `tip` |
| Konum | text input + popüler il chip'leri ("İzmir 84") | `il` |
| Fiyat ₺ | Min/Max input + range slider | `priceMin` + `priceMax` |
| Yüzölçümü m² | Min/Max input | `sizeMin` + `sizeMax` |
| İmar durumu | **checkbox list (multi)** | `imar` (csv) |
| Tapu durumu | **segmented pill** (Tapulu/Hisseli) — mockup parite | `tapu` |
| Özellikler | checkbox list (4: yola cephe/su/elektrik/**doğalgaz**) | `cephe`,`su`,`elektrik`,`gaz` |
| Deprem risk bandı | 3'lü segmented (Düşük yeşil/Orta/Yüksek) | `depremRisk` (csv multi) |
| CTA | sticky alt "N ilanı göster" | submit |

**Popüler il chip'leri:** ilk uygulamada hardcoded ("İzmir", "Muğla", "Balıkesir") + count = `LISTINGS.filter(l => l.city === c).length`. İleride top-N city count'tan türetme.

**Tapu kapsamı notu:** `ListingTitleStatus` tipi `tapulu | hisseli | kat-irtifaki | kat-mulkiyeti` değerlerini destekliyor. Mockup sadece Tapulu/Hisseli'yi gösteriyor — bu spec mockup parite ile aynı 2 değer için segmented pill render eder. `kat-*` değerleri arsa kategorisinde tipik olarak yer almadığı için kapsam dışı; konut/villa kategorilerine girildiğinde ayrı filtre bloğu (`KonutFilters.astro`) bunu kendi içinde ele alır.

### Davranış

- Mevcut `<details>` accordion + `sessionStorage` collapse persistence **mantığı korunur**; `<summary>` mockup'taki kompakt `fs-h` stiline (caps mono eyebrow + `›` chevron) çevrilir.
- Reset linki form-level; URL `/ara` (locale prefix korunur).
- Range slider: native `<input type="range">` çifti + CSS thumb'ları. İnteraktif min↔max bağı için ufak inline script (form sınırlarında). React island değil.
- CategoryTabs sidebar'dan **görsel olarak gizlenir** (Wave 4'te header'a taşınınca tamamen silinir). Bu wave'de `<input type="hidden" name="kat">` form'da kalır ki kategori state'i submit'lerde bozulmasın.

### Atom: `FilterPill`

`@landx/ui/atoms` altına eklenir. `variant: 'default' | 'active'`, `as: 'button' | 'label'`. Tüm pill/chip kullanımları (filter sidebar, FilterChips, MobileQuickFilters) bunu tüketir — tek source of truth.

### Test
- Playwright: her yeni filtre tıklama → URL değişimi + sonuç sayısı doğrulama.
- A11y: checkbox/segmented label-input bağı, focus-ring kontrolü.

### Risk
- `sessionStorage` collapse key'leri değişirse mevcut kullanıcılarda state kaybı olur; key'ler aynı `arsam.filter.collapsed` namespace'inde tutulur.
- CategoryTabs taşıma Wave 4'e gecikiyor — Wave 2 sonrası sidebar üstünde hidden input ile aynı UX korunur (test ile doğrulanır).

## Wave 3 — ResultsGrid + Vitrin kart + Toolbar

**Amaç:** sonuç akışını mockup'taki bilgi-yoğun karta çevir, vitrin yatay kartını üstte yerleştir, toolbar'ı segmented view picker + "X yeni" rozeti ile yeniden organize et, gerçek pagination'ı bağla.

### Yeni: `ResultsToolbar.astro`

- Sol: `N arsa bulundu` (text-sm font-medium) + **"X yeni" yeşil rozet** (`bg-success-soft text-success`, `text-[10px]`).
- Sağ: `SortPicker` + **segmented view picker** (Grid/List/Map). View picker `body.dataset.viewMode` set eder; `AraMapShell` CSS hook'ları (`body[data-view-mode='map'] [data-ara-list] { display: none }` vs) bozulmadan reuse edilir. `AraMapShell` içindeki kendi toggle'ı kaldırılır.

### Yeni: `FeaturedListingCard.astro`

- Yatay layout: sol 160px görsel + sağ içerik.
- Altın çerçeve: `border-2` + yeni semantic token `--gold` (mockup'taki `#BA7517`). Token `packages/ui/src/tokens` altına eklenir; light/dark variant ileride.
- Görsel slot: **VİTRİN rozeti** (altın bg, `text-[10px]` caps mono) + foto sayısı (bottom-left, `images?.length || 0`).
- İçerik: location row + **Doğrulanmış rozeti** (mevcut `verification-badges` mock'ta `verified` ise), font-serif `text-base` başlık, 3-attribute row (m² · imar · yola cephe), fiyat (`formatTLCompact`) + `₺/m²` + opsiyonel **`comparisonHint` yeşil tag**.
- Sağ alt: favori + karşılaştır iconButton (`FavoriteToggle`/`CompareToggle` `variant="round"` ile reuse).

### Revize: `ListingCard.astro`

- Görsel yüksekliği `h-44` → `h-32` (mockup'a kompakt).
- Üst sol: `TypeChip` (mevcut). Üst sağ: yuvarlak favori (mevcut `FavoriteToggle` `variant="round-on-image"`). Sağ alt: foto sayısı `bg-black/65 text-white`.
- İçerik: location üst (`text-xs text-muted-foreground`), font-serif `text-base` başlık (line-clamp-2), attribute row (`m² · ikon · ikon`) üst/alt border'lı band, fiyat + `₺/m²` + sağ "X gün önce" (`relativeTime(lastUpdate)`).
- Mevcut sağ-alt `Karşılaştır` text link kaldırılır; `CompareToggle` görselin üzerine icon button olarak yerleşir.

### Revize: `ResultsGrid.astro`

- Editorial sayım başlığı (`foundHeading` font-serif h2) `ResultsToolbar`'a devredilir; sayfa-level hero band varsa hero `SearchHeader`'da korunur.
- Layout: `<FeaturedListingCard>` üstte tek sütun (varsa) → altında `<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">`.
- Vitrin seçimi: `ara.astro`'dan props (`featured`, `regular`). Vitrin grid'de tekrar etmez.
- No-results state aynen korunur.
- Pagination: gerçek `?page=` logic. `pageSize = 12`. `regular.slice((page-1)*12, page*12)`. Görsel: Prev + numerik (max 3 visible) + Next + sol "1-12 / 47 ilan" özet.
- `?page=` URL'e eklenirken diğer params korunur (helper: `buildPageUrl(page, currentParams)`).

### Revize: `FilterChips.tsx`

- Yeni param'lar için chip'ler:
  - `priceMin` → "Min fiyat: ₺X"
  - `sizeMin`/`sizeMax` → "Yüzölçümü: X-Y m²" (tek chip)
  - `imar` (csv) → "İmar: Konut + Ticari" (tek chip; ✕ tüm değerleri siler)
  - `tapu` → "Tapu: Tapulu"
  - `cephe`/`su`/`elektrik`/`gaz` → "Yola cephe", "Su", "Elektrik", "Doğalgaz"
  - `depremRisk` (csv) → "Risk: Düşük + Orta"
- Sağa **"Aramayı kaydet" button** (`SaveSearchButton` reuse) aynı satırda.

### Test
- Playwright: vitrin kart üstte; normal grid altında; view picker `body.dataset.viewMode` toggle; pagination next/prev; FilterChips yeni param chip'leri.
- Unit: `relativeTime`, `getNewListingCount` helpers.

### Risk
- `AraMapShell` içindeki kendi toggle'ı toolbar'a taşınırken çift toggle riski.
- `?page=` Playwright URL snapshot'lar güncellenir (mevcut testler etkilenebilir).

## Wave 4 — Mobil redesign + saved-search CTA banner

**Amaç:** mockup'taki mobil-first deneyimi getir; mevcut FAB filter butonunu sticky 3-buton bara konsolide et; quick filter pill row ekle; CategoryTabs'i header'a taşı; saved-search banner'ı feed sonunda yerleştir.

### Yeni: `MobileQuickFilters.tsx` (`client:idle`)

- Yatay scroll pill row: **`Filtreler (N)`** + **`Fiyat ▾` · `m² ▾` · `İmar ▾` · `Tapu ▾`**.
- Her quick pill → **tek alanlı mini bottom sheet** (mevcut `MobileFilterSheet`'in `focusSection?: 'fiyat' | 'size' | 'imar' | 'tapu'` prop'lu variant'ı).
- Mini sheet: Uygula/Sıfırla/Vazgeç 3 aksiyon barı; form submit URL state'ini günceller.
- Badge sayımı: SSR'da hesaplanır, URL params'tan türetilir.

### Yeni: `MobileStickyBar.tsx` (`client:idle`)

- `fixed bottom-0`, 3 eşit kolon: **Filtreler (N)** · **Sırala** · **Harita**.
- Filtreler → `MobileFilterSheet` (full); Sırala → mini bottom sheet (radio list, `SortPicker` mobile variant); Harita → `body.dataset.viewMode = 'map'` toggle (`aria-pressed`).
- `prefers-reduced-motion` respect; her zaman görünür.
- Mevcut `MobileFilterButton.tsx` **silinir**; sticky bar tek bottom sürfaktıdır.

### Yeni: `SaveSearchBanner.astro`

- İkon (bell-ringing — Lucide `BellRing`) + başlık "Bu aramayı kaydet" + sub "Filtrelerine uyan yeni ilan geldiğinde sana bildirim gönderelim." + "Kaydet" buton (`SaveSearchButton` `variant="banner"` reuse).
- `ResultsGrid.astro`'da pagination'ın **altında**, **sadece son sayfada** koşullu render (her sayfada görünmesi spam).
- Mobil: kompakt tek-satır variant (ikon + başlık + buton). md+: 3-blok mockup variant (daire ikon + 2-satır metin + buton).

### Revize: `SearchHeader.astro` ve mobil header

- Desktop: logo + **CategoryTabs** (arsa/konut/villa/isyeri inline tab'leri) + favori/bildirim/İlan Ver/avatar sağ küme.
- Mobil header: burger + logo (sol) + favori/bildirim (sağ). Altında **category tabs** `overflow-x-auto`, count'lu — "Arsa 15 · Tarla 8 · Zeytinlik 12 · Villa 6". Count'lar SSR'da hesaplanır.
- CategoryTabs.tsx artık header'da kullanılır; sidebar tarafındaki kalıntı (Wave 2'de gizlenmişti) tamamen silinir. Hidden `kat` input header form'una taşınır.
- Mobil search input sağında **mikrofon ikonu** — şimdilik **dekoratif**, `aria-label="Sesli arama (yakında)"`, `disabled`. Web Speech API entegrasyonu future scope.

### Revize: `MobileFilterSheet.tsx`

- `focusSection?: string` prop kabul eder — verilirse tek-section modu (quick filter mini sheet için).
- Alt aksiyon bar (Uygula/Sıfırla/Vazgeç) standartlaştırılır.

### Davranış

- `MobileStickyBar` + `MobileQuickFilters` `md:hidden`.
- Map mode aktifken sticky bar görünmeye devam eder; Harita butonu `aria-pressed=true`.

### Test
- Playwright (mobile viewport 375x667): sticky bar 3 buton; quick filter mini sheet açılma; view mode toggle.
- A11y: focus trap mini sheet'lerde; `aria-labelledby` başlık bağı.
- Visual: snapshot 360w viewport — vitrin, normal kart, banner, sticky bar.

### Risk
- Mevcut `MobileFilterButton.tsx` silinmesi → başka sayfalardan import edilmiyor (grep ile doğrulanır).
- Mikrofon dekoratif olduğu halde bazı kullanıcı confusion'ı — tooltip "yakında" ile mitige edilir.

## Açık konular (Future scope)

- Sesli arama (Web Speech API) — Wave 4'te mikrofon dekoratif.
- Gerçek emsal hesaplama (`comparisonHint` türetimi) — şimdilik string seed.
- Saved search backend persistence — mevcut `SaveSearchButton` localStorage; ileride API.
- Pagination size tercihi (`?per=` query) — Wave 3'te sabit 12.
- Popüler şehir chip'leri top-N city count'tan dinamik türetme — Wave 2'de hardcoded.

## Test stratejisi (özet)

| Tip | Konu | Wave |
|---|---|---|
| Unit (Vitest) | `getHazardBand`, `relativeTime`, `getNewListingCount` | 1, 3 |
| Integration (Playwright) | yeni query param'lar → SSR sonuç sayısı | 1 |
| E2E (Playwright) | filtre tıklama → URL → sonuç; vitrin kart üstte; view picker; pagination | 2, 3 |
| Mobile E2E | sticky bar, quick filter mini sheet, view mode | 4 |
| A11y | label-input, focus trap, `aria-pressed` | 2, 4 |
| Visual snapshot | desktop + mobile viewport'larda key componentler | 3, 4 |

## PR sırası

1. **PR-1 (Wave 1):** veri katmanı + helper + SSR filter param eklentileri.
2. **PR-2 (Wave 2):** FilterSidebar redesign + FilterPill atom.
3. **PR-3 (Wave 3):** ResultsToolbar + FeaturedListingCard + ListingCard revize + ResultsGrid + FilterChips revize + pagination.
4. **PR-4 (Wave 4):** MobileStickyBar + MobileQuickFilters + SaveSearchBanner + Header revize + CategoryTabs taşıma.
