/**
 * Mock seed: content & insights.
 * - 6 rehber makalesi (`/rehber/[slug]`)
 * - 30 günlük KPI time series (random walk)
 * - 4 kategori arşivi (`/kategori/[slug]`)
 */

import type { AnalyticsDailyPoint, CategoryArchive, Guide, UserAnalytics } from '../types/content'

function isoDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

function iso(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(10, 0, 0, 0)
  return d.toISOString()
}

const USER = 'user-self'

// ─── Guides ──────────────────────────────────────────────────────────────────

export const GUIDES: Guide[] = [
  {
    slug: 'tarla-alirken-dikkat-edilecekler',
    title: 'Tarla alırken dikkat edilecekler',
    subtitle: 'İmar durumu, yol cephesi, su ve elektrik altyapısı — alımdan önce kontrol listesi.',
    cover: '/guides/tarla-cover.jpg',
    body: `# Tarla alırken dikkat edilecekler

Tarla yatırımı, **doğru parsel + doğru zaman** denklemine bağlı. Bu rehber, alım öncesi 7 kritik kontrolü kapsar.

## 1. İmar durumu
İlçe belediyesinden veya **e-Belediye** üzerinden parselin imar durumunu sorgula. "Tarım" görünüyorsa konut yapısına çevirme süreci 2-5 yıl sürebilir.

## 2. Tapu kontrolü
Tapuda **hisseli** mı yoksa **müstakil** mi olduğunu kontrol et. Hisseli tapular sonradan satışta sıkıntı yaratır.

## 3. Yol cephesi
Parselin asfalt veya stabilize yola cephesi olmalı. Köy yolu varsa belediye yatırım planına dahil mi diye sor.

## 4. Su & Elektrik
**TEDAŞ**'tan elektrik gelir mi, **DSİ**'den su izni alınır mı kontrol et.

## 5. Sulu/kuru tarım
Toprak analizini bir tarım mühendisi ile yap.

## 6. Komşu yapılaşma
Çevredeki yeni inşaatlar değerlenme sinyali.

## 7. Aracı seçimi
Lisanslı emlakçı ile çalış. **LandX** üzerinde "doğrulanmış" rozetli profillere öncelik ver.`,
    author: 'Mert Soydan',
    publishedAt: iso(15),
    tags: ['yatirim', 'imar', 'tapu'],
    related: ['imar-durumu-nasil-sorgulanir', 'zeytinlik-yatirimi-rehberi'],
    readingMinutes: 6,
  },
  {
    slug: 'imar-durumu-nasil-sorgulanir',
    title: 'İmar durumu nasıl sorgulanır?',
    subtitle: 'e-Belediye, tapu kadastro ve şehir plan müdürlüğü üzerinden adım adım.',
    cover: '/guides/imar-cover.jpg',
    body: `# İmar durumu nasıl sorgulanır?

Parselin imar durumu, yatırım kararının temelidir.

## e-Belediye yöntemi
1. **e-Belediye** uygulamasına gir
2. Belediyenizi seçin
3. "İmar durumu sorgulama" menüsü
4. Parsel/ada numarası ile sorgula

## Tapu kadastro yöntemi
**TKGM** üzerinden parselin koordinatlarını al, ardından belediye İmar Müdürlüğü'ne dilekçe ile başvur.

## Önemli notlar
- 1/1000 ölçekli plan ile 1/5000 ölçekli plan farklıdır
- "Plansız alan" görünüyorsa = imar yok demek
- Çevre düzeni planı her 5 yılda revize edilir`,
    author: 'Esra Karataş',
    publishedAt: iso(28),
    tags: ['imar', 'hukuk'],
    related: ['tarla-alirken-dikkat-edilecekler'],
    readingMinutes: 4,
  },
  {
    slug: 'zeytinlik-yatirimi-rehberi',
    title: 'Zeytinlik yatırımı rehberi',
    subtitle: 'Ege kıyısında zeytinlik almak — ruhsat, ekim, vergi ve değerlenme.',
    cover: '/guides/zeytinlik-cover.jpg',
    body: `# Zeytinlik yatırımı rehberi

Ege ve Akdeniz kıyısında zeytinlik, hem **gelir** hem **değerlenme** sağlar.

## Doğru bölge
- Ayvalık, Edremit körfezi: yüksek verim
- Urla, Seferihisar: butik üretim
- Burhaniye, Havran: geleneksel zeytinyağı

## Bakım
Zeytin ağacı 20-30 yılda meyve verir. **Bakımsız zeytinlik** = düşük verim. Aldığında yaş profilini kontrol et.

## Vergi avantajı
Zeytinlik **tarım arazisi** olarak değerlendirilir, vergi düşük.

## Çıkış stratejisi
Uzun vadede imara açılırsa değer **5-10x** artar (ama 10+ yıl vadeli düşün).`,
    author: 'Tunç Berksoy',
    publishedAt: iso(45),
    tags: ['yatirim', 'kira'],
    related: ['tarla-alirken-dikkat-edilecekler'],
    readingMinutes: 5,
  },
  {
    slug: 'arsa-vergisi-2026',
    title: 'Arsa vergisi 2026',
    subtitle: 'Emlak vergisi oranları, beyanname süresi ve indirim koşulları.',
    cover: '/guides/vergi-cover.jpg',
    body: `# Arsa vergisi 2026

Arsa sahibi olduğunda ödediğin **emlak vergisi** = arsa rayiç bedelinin **%0.3** (büyükşehir belediyeleri için).

## Beyanname zamanı
Yıllık beyanname **mart-mayıs** arasında verilir.

## İndirim koşulları
- Emekli, gazi, dul-yetim için **indirim** mümkün
- Konut yapımına başlanan arsalar için **muafiyet** süresi var

## Online ödeme
**e-Belediye** veya **interaktif vergi dairesi** üzerinden anında ödenir.`,
    author: 'Lale Erdem',
    publishedAt: iso(62),
    tags: ['vergi', 'hukuk'],
    related: ['imar-durumu-nasil-sorgulanir'],
    readingMinutes: 3,
  },
  {
    slug: 'satis-vaadi-sozlesmesi',
    title: 'Satış vaadi sözleşmesi nedir?',
    subtitle: 'Tapuda devirden önce tarafları bağlayan noter onaylı sözleşme.',
    cover: '/guides/sozlesme-cover.jpg',
    body: `# Satış vaadi sözleşmesi nedir?

**Satış vaadi sözleşmesi**, tapu devri öncesinde tarafları bağlar.

## Ne zaman gerekli?
- Kaparo verildiğinde
- Tapu süreci uzun sürecekse (kredi onayı, imar değişikliği)
- Hisseli mülk satışında

## Noter onayı şart mı?
Evet — noter onayı olmadan **hukuki bağlayıcılığı yok**.

## Tipik maddeler
- Toplam fiyat
- Ödeme planı
- Tapu devir tarihi
- Cayma cezası
- Zilyetlik tarihi`,
    author: 'Deniz Yıldırım',
    publishedAt: iso(80),
    tags: ['hukuk', 'tapu'],
    related: ['tarla-alirken-dikkat-edilecekler'],
    readingMinutes: 4,
  },
  {
    slug: 'kira-mi-satis-mi',
    title: 'Kira mı satış mı?',
    subtitle: 'Arsa için kısa vadeli gelir ve uzun vadeli değerlenme karşılaştırması.',
    cover: '/guides/kira-cover.jpg',
    body: `# Kira mı satış mı?

Arsa sahibinin klasik ikilemi.

## Kira avantajı
- Hemen aylık gelir
- Mülkün sende kalması
- Vergi optimizasyonu

## Satış avantajı
- Toplu nakit
- Yeniden yatırım imkanı
- Bakım yükü yok

## Karar matrisi
| Durum | Öneri |
|---|---|
| Acil nakit lazım | Satış |
| Pasif gelir lazım | Kira |
| Bölge değerleniyor | Bekle |
| Vergi yüksek geliyor | Satış |`,
    author: 'Pınar Akın',
    publishedAt: iso(95),
    tags: ['kira', 'satis', 'yatirim'],
    related: ['zeytinlik-yatirimi-rehberi'],
    readingMinutes: 4,
  },
]

// ─── User analytics (30 günlük random walk) ──────────────────────────────────

function buildDaily(): AnalyticsDailyPoint[] {
  const out: AnalyticsDailyPoint[] = []
  // Deterministic random walk (seed = 42) — test stability + realistic dağılım
  let viewBase = 120
  let clickBase = 18
  let msgBase = 4
  // Linear congruential generator (LCG) — deterministic
  let seed = 42
  const rand = (): number => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  for (let i = 29; i >= 0; i--) {
    const dayOfWeek = new Date(Date.now() - i * 86400000).getDay()
    const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 1.4 : 1.0
    // Trend: hafif yukarı + gürültü
    viewBase += Math.round((rand() - 0.4) * 30)
    if (viewBase < 50) viewBase = 50
    clickBase += Math.round((rand() - 0.5) * 6)
    if (clickBase < 5) clickBase = 5
    msgBase += Math.round((rand() - 0.5) * 2)
    if (msgBase < 1) msgBase = 1
    out.push({
      date: isoDate(i),
      views: Math.round(viewBase * weekendBoost),
      clicks: Math.round(clickBase * weekendBoost),
      messages: Math.round(msgBase * weekendBoost),
    })
  }
  return out
}

const DAILY = buildDaily()

const totalViews = DAILY.reduce((s, p) => s + p.views, 0)
const totalClicks = DAILY.reduce((s, p) => s + p.clicks, 0)
const totalMessages = DAILY.reduce((s, p) => s + p.messages, 0)

export const USER_ANALYTICS: UserAnalytics = {
  userId: USER,
  range: {
    from: isoDate(29),
    to: isoDate(0),
  },
  totals: {
    views: totalViews,
    clicks: totalClicks,
    messages: totalMessages,
    ctr: totalViews > 0 ? Math.round((totalClicks / totalViews) * 1000) / 1000 : 0,
  },
  daily: DAILY,
  topListings: [
    { id: 'L-1234', title: 'Cunda denize 80m imarlı parsel', views: 1842 },
    { id: 'L-2001', title: 'Alaçatı bağ evi imarlı parsel', views: 1407 },
    { id: 'L-5001', title: 'Bozburun koyu villa arsası', views: 1185 },
    { id: 'L-3001', title: 'Akçay merkez deniz manzaralı arsa', views: 967 },
    { id: 'L-6001', title: 'Havran zeytinlik 5 dönüm', views: 728 },
  ],
}

// ─── Category archives ───────────────────────────────────────────────────────

export const CATEGORY_ARCHIVES: CategoryArchive[] = [
  {
    slug: 'imarli-parsel',
    title: 'İmarlı Parsel',
    description:
      'Konut, ticari veya turizm imarına sahip parseller. Hemen yapı izni alınabilir, değerlenmesi hızlıdır.',
    listingIds: ['L-1234', 'L-2001', 'L-2002', 'L-3001'],
    cover: '/categories/imarli-parsel.jpg',
    filterHref: '/ara?type=İmarlı',
  },
  {
    slug: 'tarla',
    title: 'Tarla',
    description:
      'Tarım amaçlı kullanılan, gelecekte değerlenme potansiyeli olan araziler. Kuru ve sulu seçenekler.',
    listingIds: ['L-1245', 'L-1247', 'L-3002', 'L-5002'],
    cover: '/categories/tarla.jpg',
    filterHref: '/ara?type=Tarla',
  },
  {
    slug: 'zeytinlik',
    title: 'Zeytinlik',
    description:
      'Ege kıyısında zeytin ağaçları ile dolu parseller. Yıllık üretim geliri + uzun vadeli değerlenme.',
    listingIds: ['L-1235', 'L-1239', 'L-1241', 'L-6001'],
    cover: '/categories/zeytinlik.jpg',
    filterHref: '/ara?type=Zeytinlik',
  },
  {
    slug: 'villa-arsasi',
    title: 'Villa Arsası',
    description:
      'Müstakil villa yapımına uygun, deniz manzaralı veya doğa içinde lüks parseller.',
    listingIds: ['L-1238', 'L-1244', 'L-1254', 'L-5001'],
    cover: '/categories/villa-arsasi.jpg',
    filterHref: '/ara?type=Villa Arsası',
  },
]
