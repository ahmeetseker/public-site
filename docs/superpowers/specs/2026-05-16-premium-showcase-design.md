# Premium Showcase — Reflective Card Adaptation

**Tarih:** 2026-05-16
**Durum:** Tasarım onaylandı, implementation plan bekleniyor
**Kaynak:** React Bits `<ReflectiveCard />` komponenti

## Özet

React Bits'in `ReflectiveCard` komponentini arsam.net'in anasayfasında **vitrin ilan** (premium showcase) kartı olarak adapte etmek. Webcam tabanlı arka plan kaldırılıp yerine seçilen bir aktif ilanın hero görseli konuyor; metalik/cam efekt (SVG filter) korunuyor. Komponent saf Astro olarak yazılıyor — 0 JS bundle, SSG dostu.

## Hedef ve motivasyon

- Anasayfa'da Hero ve FeaturedListings arasında yüksek görsel ağırlıklı bir "vitrin" slotu açmak.
- Premium üyelik (`/premium.astro`) Plus/Pro planındaki "Vitrine X ilan/ay" feature'ının ürün karşılığı.
- Editöryel/sakin ana tasarım dilinden kontrast yaratan tek bir öne çıkan slot — kasıtlı görsel hiyerarşi.

## Kapsam dışı

- Carousel / çoklu vitrin (tek kart).
- İnteraktif animasyon (mouse hover parallax vb.).
- Webcam veya kullanıcıdan medya izni isteyen herhangi bir özellik.
- Vitrin ilan yönetim paneli (`featured` flag'in CMS'ten set edilmesi) — bu spec dışı.

## Yaklaşım

**Seçilen:** Saf Astro komponenti (Approach B).
**Reddedilen:** React island birebir port (yeni Tailwind-dışı CSS dosyası, gereksiz JS); hibrit Astro+React shell (net kazanç yok).

Webcam kaldırılınca komponent tamamen statik olduğu için React'a ihtiyaç kalmıyor. `@landx/icons` zaten `lucide-react`'i re-export ettiği için ikonlar Astro server-render edilen React komponentleri olarak basılır — hydration yok.

## Mimari

### Yeni dosya
- `src/components/home/PremiumShowcase.astro` — yapı, içerik ve SVG filter `<style>` bloku.

### Değişiklikler
- `src/pages/index.astro` — `<Hero>` ile `<FeaturedListings>` arasına `<PremiumShowcase locale={locale} />` eklenir.
- `src/i18n/dict/tr.ts` ve `src/i18n/dict/en.ts` — `homepage.showcase` namespace'i eklenir.

### Bağımlılıklar
Yeni `package.json` değişikliği YOK.

| Kullanılan | Sağlayan |
|---|---|
| `Lock`, `MapPin`, `Maximize2` ikonları | `@landx/icons` (re-export of lucide-react) |
| `LISTINGS`, `Listing` tipi | `@landx/data` |
| `formatTLCompact` | `@landx/ui/lib` |
| Görsel | `@/components/image/ListingImage.astro` |
| i18n | `@/i18n` (`useDict`, `detectLocaleFromPath`) |

## Komponent API'ı

```ts
export interface Props {
  locale?: Locale          // 'tr' | 'en' — varsayılan: path'den
  listing?: Listing        // override için opsiyonel
}
```

### Vitrin ilanın seçimi (sıralı fallback)

1. Props ile `listing` verilmişse onu kullan.
2. Aksi halde `LISTINGS.find(l => l.featured === true && l.status === 'Aktif')`.
3. O da yoksa `LISTINGS.filter(l => l.status === 'Aktif')[0]`.

> `Listing` şemasında `featured` alanı yoksa implementation plan aşamasında `@landx/data` schema'sı incelenip karar verilir; yoksa fiyat/büyüklük gibi heuristic ile en yüksek değerli aktif ilan seçilir.

### i18n stringleri (`homepage.showcase`)

| Anahtar | TR | EN |
|---|---|---|
| `eyebrow` | `VİTRİN İLAN` | `FEATURED LISTING` |
| `ctaLabel` | `İlanı incele` | `View listing` |
| `priceLabel` | `Fiyat` | `Price` |
| `sizeLabel` | `m²` | `sqm` |

### Edge case: ilan yoksa
Aktif ilan bulunamazsa komponent **render edilmez** (early return).

## Görsel yapı

### DOM hiyerarşisi (z-index sıralı, dıştan içe)

```
<a href="/ilan/{slug}" class="reflective-card-container">
  <svg class="reflective-svg-filters" aria-hidden> defs (görünmez)
  <ListingImage class="reflective-bg" loading="eager" />   ← z: 0  ← filter buraya
  <div class="reflective-noise"  aria-hidden />            ← z: 1
  <div class="reflective-sheen"  aria-hidden />            ← z: 2
  <div class="reflective-content"> …                        ← z: 10
  <div class="reflective-border" aria-hidden />            ← z: 20
</a>
```

### Boyut ve grid
- Container: `max-w-[1280px] mx-auto px-4 py-12 md:py-16`
- Kart: `aspect-[16/9]` mobile, `md:aspect-[21/9]` desktop (panoramik vitrin)
- Köşe: `rounded-3xl` (proje default'u `rounded-2xl` — bilinçli farklılık)

### Tipografi mapping

| Orijinal | Bizdeki karşılık |
|---|---|
| `font-family: Inter` | `font-sans` (Roboto — proje default) |
| user-name 24px bold | `font-serif text-3xl md:text-4xl tracking-tight` |
| security-badge 10px mono | `font-mono text-xs uppercase tracking-[0.18em]` |
| label 9px mono | `font-mono text-[10px] tracking-[0.18em] text-white/60` |
| value 14px monospace | `font-mono text-sm tabular-nums` |
| `color: white` | `text-white` (koyu overlay + sheen → AA kontrast) |

### İçerik haritası (orijinal → bizdeki)

| Orijinal slot | İçerik | İkon |
|---|---|---|
| security-badge (sol üst) | `eyebrow` ("VİTRİN İLAN") | `Lock` |
| status-icon (sağ üst) | `listing.district` (örn. "ÇUKUROVA") | `MapPin` |
| user-name (orta) | `listing.title` | — |
| user-role (orta, altta) | `listing.type` (örn. "ARSA · İMARLI") veya `listing.city` — implementation plan'da `@landx/data` şemasına göre karar | — |
| id-section (sol alt) | `priceLabel` + `formatTLCompact(listing.price)` | — |
| fingerprint-section (sağ alt) | `listing.size` + `sizeLabel` ("m²") | `Maximize2` |

### Prop varsayılanları (vitrin için ayarlanmış)

| Prop | Orijinal | Bizim default | Sebep |
|---|---|---|---|
| `blurStrength` | 12 | **8** | Arsa fotosu okunabilir kalsın |
| `metalness` | 1 | **0.7** | Sheen abartılı olmasın |
| `roughness` | 0.4 | **0.25** | Grain hafif |
| `displacementStrength` | 20 | **18** | — |
| `noiseScale` | 1 | **1.8** | İri ripple |
| `specularConstant` | 1.2 | **1.8** | Parlama biraz daha belirgin |
| `grayscale` | 1 | **0.2** | Fotoğrafın renkleri korunsun |
| `glassDistortion` | 0 | **24** | Kenar distorsiyonu |
| `overlayColor` | `rgba(255,255,255,0.1)` | **`rgba(0,0,0,0.35)`** | Metin okunabilirliği |

Implementation sırasında gerçek görselle ince ayar yapılacak.

### SVG filter
Orijinaldeki `<filter id="metallic-displacement">` zinciri (feTurbulence + feColorMatrix + feDisplacementMap + feSpecularLighting + feComposite + feBlend + feMorphology + feGaussianBlur + feComponentTransfer + ikinci feDisplacementMap) **birebir korunur**. Astro tarafında doğrudan inline `<svg>` olarak render edilir.

## Performans

- **0 KB JS** (hydration yok).
- **SSG:** Astro static output'a uyumlu.
- **Above-the-fold:** `<ListingImage loading="eager" />`.
- **Filter maliyeti:** Statik (animasyon yok) → her frame yeniden hesaplanmaz, GPU'da kabul edilebilir.
- **Düşük-end / reduced-motion fallback:**

```css
@media (prefers-reduced-motion: reduce), (max-width: 640px) {
  .reflective-bg {
    filter: saturate(var(--saturation)) contrast(120%) brightness(110%) blur(var(--blur-strength));
    /* url(#metallic-displacement) düşürülür */
  }
}
```

Sheen ve border korunur (ucuz CSS).

## Erişilebilirlik

- Kart `<a>` → doğal keyboard-focusable; `:focus-visible` → `outline: 2px solid var(--ring); outline-offset: 4px;`
- Tüm dekoratif div'ler ve `<svg>` defs `aria-hidden="true"` + `pointer-events: none`.
- `<ListingImage alt={`${listing.title} — vitrin ilanı`} />` — anlamlı alt text.
- Renk kontrastı: koyu overlay + `text-shadow` → WCAG AA.
- Reduced motion: yukarıdaki filter fallback.

## Test stratejisi

- **Unit:** Yok — saf Astro, JS logic yok.
- **E2E:** `tests/e2e/premium-showcase.spec.ts` — yeni dosya.
  - Homepage yüklendiğinde `[data-testid="premium-showcase"]` görünür.
  - Karta tıklayınca `/ilan/{slug}`'a yönlendirir.
  - `prefers-reduced-motion: reduce` koşulunda `.reflective-bg`'in computed `filter` değerinde `url(#metallic-displacement)` bulunmaz.
- **Astro check:** `pnpm --filter @landx/public-site exec astro check` → 0 hata.
- **Build:** `pnpm --filter @landx/public-site run build` → mevcut sayfa sayısına +0 (yeni route yok), sadece homepage HTML'i büyür.

## Doğrulama (verification before completion)

Implementation tamamlanınca aşağıdakiler PR'a iliştirilecek:
- `pnpm exec astro check` çıktısı (0 hata)
- `pnpm run build` çıktısı (success)
- `pnpm run test:e2e premium-showcase` çıktısı (geçer)
- Homepage'in `localhost:5180`'de manuel açılmış screenshot'u (TR + EN)

## Açık sorular

- `Listing.featured` alanı `@landx/data` şemasında var mı? (Implementation plan'ın ilk adımında kontrol edilecek.)
- `/en/index.astro` mevcutsa (scaffold), oraya da eklenecek mi? Şimdilik **evet** varsayıyoruz; yoksa adım atlanır.
