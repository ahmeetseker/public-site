# Premium Showcase — Redesign (Slider + Visible Images + Details)

**Tarih:** 2026-05-16
**Durum:** Tasarım onaylandı, implementation plan bekleniyor
**Önceki:** `2026-05-16-premium-showcase-design.md` (tekil reflective kart, görsel blur arkasında)

## Özet

Mevcut `PremiumShowcase.astro`'nun **redesign**'ı. Şu anda tek bir ilan seçilip, görseli metalik blur arkasında dekoratif arkaplan olarak veriliyor; gerçek "ilan görüntüleme" değeri düşük. Yeni tasarımda:

1. **Çoklu vitrin ilanları** bir slider içinde dönüyor (aktif imarlı/öne çıkan ilanlar).
2. Her slide'da **net görsel** (artık blur yok) + **detay paneli** (başlık, konum, fiyat, m², tip, rozetler).
3. **Responsive**: mobilde üst-alt yığın, desktop'ta yan yana; tipografi breakpoint'lere göre ölçekleniyor.
4. **Premium "metalik" kimlik korunuyor**: mevcut `.reflective-border`, `.reflective-sheen`, `.reflective-noise` katmanları dış kabuk/çerçeve olarak yeniden kullanılıyor. Sadece `.reflective-bg` (blur'lu ilan görseli) kalkıyor; yerine sade koyu zemin geliyor.

## Hedef ve motivasyon

- Kullanıcının dile getirdiği problem: "ilanın resimlerini bırakalım detayını da bırakalım ve yazılar responsive düşünelim ve slider olursa daha iyi olur."
- Mevcut blur'lu tek-kart, görselin değer üretemediği bir "dekoratif slot" haline gelmişti. Birden fazla vitrin ilanını, kullanıcının gerçekten görüp tıklayabileceği şekilde sunmak.
- "Premium" görsel imzasını (parlak metalik kenar + sheen) korumak — markanın `/premium.astro` ile bağı bozulmasın.

## Kapsam dışı

- Vitrin/öne çıkan flag'in CMS/admin yönetimi (mevcut heuristik: aktif imarlı ilanlar, fiyata göre top-N).
- Mouse parallax / 3D tilt animasyonları.
- Webcam, kullanıcı izni isteyen herhangi bir özellik.
- Detay sayfasındaki lightbox/gallery (`Gallery.astro`) değişmiyor.
- Yeni `images: string[]` alanlarına bağlı dosya sistemine yeni asset yüklenmesi — `ResponsiveListingImage` placeholder fallback aynı şekilde devam.

## Yaklaşım

**Seçilen (A):** Mevcut Astro shell + içeride React island (slider için minimal client JS).
**Reddedilen (B):** Saf scroll-snap, JS yok. Auto-play istendiği için bu kapı kapandı.
**Reddedilen (C):** Mevcut blur'lu görseli koruyup üzerine slider ekleme. Kullanıcının "görseller net" talebine ters.

React island, mevcut codebase'le (`RecentViewedCarousel.tsx`) tutarlı; sadece bu komponent için yeni dosya. `client:visible` ile hydrate edilecek (homepage'de viewport'a girince).

## Bileşen mimarisi

```
src/components/home/
  PremiumShowcase.astro         (revize — slider sarmalayıcısı, seçim heuristiği, i18n)
  PremiumShowcaseSlider.tsx     (YENİ — React island; auto-play, oklar, dots, swipe)
  PremiumShowcaseSlide.astro    (YENİ — tek slide şablonu, sunucu-render edilen markup)
```

**Görev dağılımı:**

- `PremiumShowcase.astro` — server-side: listings seçimi (`selectShowcaseListings`), her birinin slide markup'ını render eder, listeyi `PremiumShowcaseSlider`'a children olarak geçirir. Tüm i18n burada çözülür.
- `PremiumShowcaseSlide.astro` — server-side: tek slide'ın TÜM HTML'i (görsel + detay paneli + rozetler). 0 JS.
- `PremiumShowcaseSlider.tsx` — client island: children olarak gelen slide'ları aktif slide göre `aria-hidden`/`tabindex` toggle eder, kayma transformu uygular, oklar/dots/swipe/auto-play yönetir.

**Neden böyle bölündü:** Slide içeriği (görsel + i18n + heuristik) server-side, JS bundle'a girmesin. Slider sadece DOM'da var olan slide'ları kontrol eder — markup'ı kendisi üretmez. Bu, Astro'nun "JS'i minimumda tut" pattern'ine uyar ve önceki spec'le tutarlı.

## Veri akışı

```
LISTINGS (mock, build-time)
   │
   ▼
selectShowcaseListings(N=8)  ──►  Listing[]   (aktif imarlı, fiyata göre azalan, top-8)
   │
   ▼
PremiumShowcase.astro
   │ slugify + i18n
   ▼
PremiumShowcaseSlider (client island)
   ├─ <PremiumShowcaseSlide listing={...} />  × N
   │     ├─ ResponsiveListingImage (placeholder fallback)
   │     └─ Detail panel (title, location, price, size+type, badges)
   └─ controls: prev/next, dots, auto-play (5s)
```

**Seçim heuristiği:**

```ts
function selectShowcaseListings(overrides?: Listing[]): Listing[] {
  if (overrides && overrides.length > 0) return overrides.slice(0, 8)
  const active = LISTINGS.filter((l) => l.status === 'Aktif')
  const imarli = active.filter((l) => l.type === 'İmarlı')
  const pool = imarli.length >= 3 ? imarli : active
  return [...pool].sort((a, b) => b.price - a.price).slice(0, 8)
}
```

Eğer pool 0 ise — komponent hiçbir şey render etmez (mevcut davranış korunur).
Eğer pool tek elemanlı ise — slider tek slide render eder, oklar ve dots gizlenir (slider modeli "1 slide" durumunu zarif handle eder).

## Görsel tasarım — responsive layout

```
┌─ Desktop (≥ md, 768px+) ─────────────────────────────────────────┐
│  metallic border + sheen + noise + shadow (dış kabuk)            │
│  ┌────────────────────────┬───────────────────────────────┐      │
│  │                        │  VİTRİN İLAN     ÇEŞME·ALAÇATI│      │
│  │   net ResponsiveImage  │                               │      │
│  │   (16/10 ratio)        │  Alaçatı bağ evi              │      │
│  │   60%                  │  imarlı, asfalta sıfır        │      │
│  │                        │  ──────────────────────────   │      │
│  │                        │  ₺12,5M    1.250 m² · İmarlı  │      │
│  │                        │  ●Yol ●Su ●Elektrik           │      │
│  │                        │  [İlanı incele →]             │      │
│  └────────────────────────┴───────────────────────────────┘      │
│  ‹                                          ●●●○○○○○         ›  │
└──────────────────────────────────────────────────────────────────┘
```

```
┌─ Mobile (< 640px) ───────────────────┐
│  metallic border + sheen (kompakt)   │
│  ┌──────────────────────────────┐    │
│  │                              │    │
│  │    net image (16/9 ratio)    │    │
│  │                              │    │
│  └──────────────────────────────┘    │
│  VİTRİN İLAN        ÇEŞME·ALAÇATI    │
│  Alaçatı bağ evi imarlı...           │
│  ₺12,5M                              │
│  1.250 m² · İmarlı                   │
│  ●Yol ●Su ●Elektrik                  │
│  [İlanı incele →]                    │
│       ●●●○○○○○                       │
└──────────────────────────────────────┘
```

### Breakpoint kuralları

| Eleman                  | < 640px (mobile)      | 640–768 (sm)          | ≥ 768px (md+)         |
|-------------------------|----------------------|----------------------|----------------------|
| Layout                  | dikey yığın          | dikey yığın          | yatay 60/40 split    |
| Görsel oranı            | 16/9                 | 16/9                 | 16/10                |
| Başlık                  | `text-xl`            | `text-2xl`           | `text-3xl lg:text-4xl` |
| Fiyat                   | `text-2xl`           | `text-2xl`           | `text-3xl`           |
| Konum/tip eyebrow       | `text-[10px]`        | `text-xs`            | `text-xs`            |
| Rozetler                | yatay scroll, max 3  | grid, max 4          | grid, max 4          |
| Slider okları           | gizli                | gizli                | görünür (overlay)    |
| Dots                    | her zaman görünür    | her zaman görünür    | her zaman görünür    |
| Section padding         | `py-8 px-4`          | `py-12 px-4`         | `py-16 px-4`         |

`line-clamp-2` başlığa uygulanıyor — uzun başlıklarda taşma yok.

### Metalik katman koruması

Mevcut `<style>` bloğundaki şu katmanlar **aynen** kalır:
- `.reflective-card-container` (gölge + içsel beyaz border)
- `.reflective-sheen` (köşegen parıltı overlay)
- `.reflective-noise` (SVG noise overlay)
- `.reflective-border` (metalik gradient kenarlık, mask trick)
- `.reflective-content` (semi-transparent overlay)

**Kaldırılan:** `.reflective-bg` ve `<svg class="reflective-svg-filters">` (metallic-displacement filter) — bunların tek tüketicisi blur'lu bg image idi, artık yok. Slide görseli net render edileceği için filter'a ihtiyaç yok.

Detay paneli, sağ tarafta `bg-black/40 backdrop-blur-sm` ile yarı şeffaf cam yüzeyde durur — metalik sheen bunun üzerinden de geçer, premium hissini taşır.

## Slider davranışı

**Auto-play:**
- Varsayılan 5 saniye / slide.
- `prefers-reduced-motion: reduce` → auto-play kapalı (mevcut testle tutarlı).
- Hover veya focus-within → auto-play durur, dışına çıkınca devam.
- Sayfa görünür değilse (`document.visibilityState !== 'visible'`) → duraklat.

**Manuel kontroller:**
- **Oklar** (desktop): sol/sağ, slide kenarına overlay; klavye `←` `→`.
- **Dots** (tüm boyutlar): aktif olan farklı renkte; tıklanınca o slide'a git.
- **Swipe** (mobil): pointer events ile yatay sürükleme, threshold 50px.
- **Klavye**: Tab ile odaklanılan slide aktif olur; `Home`/`End` ilk/son.

**Erişilebilirlik:**
- Slider kabuk `<section aria-roledescription="carousel" aria-label={dict.eyebrow}>`.
- Slide'lar `role="group" aria-roledescription="slide" aria-label="N / total"`.
- Aktif olmayan slide'lar `aria-hidden="true" tabindex="-1"` — odak tuzaklanmaz.
- Auto-play sırasında `aria-live="off"`, kullanıcı kontrol ettiğinde gerek yok.

## i18n

Mevcut `homepage.showcase` sözlüğü genişletilir:

**TR (`src/i18n/tr.ts`):**
```ts
showcase: {
  eyebrow: 'VİTRİN İLAN',
  ctaLabel: 'İlanı incele',
  priceLabel: 'Fiyat',
  sizeLabel: 'm²',
  // YENİ
  prevSlide: 'Önceki ilan',
  nextSlide: 'Sonraki ilan',
  goToSlide: 'İlana git: {n}',
  badges: {
    road: 'Yol',
    water: 'Su',
    electricity: 'Elektrik',
    titleDeed: 'Tapu hazır',
  },
}
```

**EN (`src/i18n/en.ts`):** karşılıkları ('Previous listing', 'Road', 'Water', vs.).

## Rozet (badge) mantığı

Slide'da gösterilecek rozetler:
- `hasRoad` → "Yol"
- `hasWater` → "Su"
- `hasElectricity` → "Elektrik"
- `titleStatus === 'mustakil'` veya `'kat-irtifakli'` → "Tapu hazır"

Mobilde max 3, desktop'ta hepsi. `false`/`undefined` olanlar gösterilmez. 0 rozet varsa rozet sırası tamamen gizlenir.

## Test stratejisi

Mevcut `tests/e2e/premium-showcase.spec.ts` testleri:

1. `renders showcase card with eyebrow and CTA` — **korunuyor**, eyebrow ve CTA hâlâ ilk slide'da var.
2. `card links to a listing detail page` — **güncelleniyor**: ilk slide'ın `data-testid="premium-showcase-slide"` (veya hâlâ `premium-showcase`) içinde `<a>` arıyor.
3. `respects prefers-reduced-motion` — **güncelleniyor**: artık `metallic-displacement` yok; bunun yerine "auto-play stopped" davranışı doğrulanıyor (örn. 6 saniye bekle, aktif slide değişmiş mi?).
4. `EN homepage shows the English showcase label` — **korunuyor**.

**Yeni testler:**
- `next arrow advances to slide 2` (desktop viewport)
- `dots reflect active slide` — aktif dot'un `aria-current="true"` veya distinct class'ı var
- `inactive slides are aria-hidden` — sadece bir slide kullanıcıya görünür
- `slider renders single slide gracefully when pool size is 1` — birim test ya da fixture'la

**Birim test (`vitest`):**
- `selectShowcaseListings` heuristiği — top-N, tie-break, imarlı yetersizse genel pool, override path.

## Performans

- `PremiumShowcaseSlider.tsx` `client:visible` ile yüklenir → hero görseli aşağıdaysa, ilk paint'i blok etmez.
- İlk slide görseli `loading="eager"` (above-the-fold ihtimali yüksek), diğerleri `loading="lazy"`.
- Slide markup'ı server-render olduğu için JS bundle ~küçük tutulur (transform + event listener, library yok).
- `prefers-reduced-motion` → auto-play kapalı (cihaz pil tasarrufu).

## Risk & dikkat

- **Tek slide durumu:** Pool 1 elemanlı → slider yine de render ediyor ama oklar/dots gizleniyor. Aksi takdirde "Önceki/Sonraki" anlamsız olur.
- **Hydration:** Slide markup'ı SSG, sadece slider shell hydrate olur. Hydration öncesi: ilk slide görünür, diğerleri `aria-hidden + opacity-0`. JS yüklenmezse → kullanıcı en azından ilk vitrin ilanı görür ve tıklayabilir (graceful degradation).
- **Mevcut spec'le ilişki:** Eski `2026-05-16-premium-showcase-design.md` "tekil reflective kart" olarak ürün haline getirmişti. Bu redesign onun yerini alıyor; eski spec'i silmiyoruz, "Önceki" referansı olarak duruyor.

## Rollout

- Tek PR — bu spec → plan → implementation tek branch.
- Mevcut `PremiumShowcase` çağrı yerleri (`src/pages/index.astro`, `src/pages/en/index.astro`) prop API'sini değiştirmiyor — drop-in replacement.

## Açık olmayan kalan kararlar

- **Slide sayısı:** Kullanıcı "tüm vitrin işaretli ilanlar (8-10)" dedi. Aktif imarlı havuzu varsa top-8, az ise pool ne kadarsa o kadar.
- **Auto-play hızı:** 5 saniye (UX endüstri standardı, uzun başlıkları okumaya yetiyor).
- **Görsel oranı:** Desktop 16/10, mobil 16/9 — net detay panelle desktop'ta yan yana sığsın diye.
