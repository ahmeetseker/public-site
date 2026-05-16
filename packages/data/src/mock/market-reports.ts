/**
 * Mock seed: bölge AI pazar raporları (`/bolge/[slug]`).
 * 8 bölge — `regions.ts` slug'larıyla uyumlu + ek slug'lar.
 *
 * Trend: 30 günlük random walk (deterministik — tekrar üretilince aynı).
 * `price` kuruş cinsinden m² birim fiyat (örn. `82_00 00` = 8.200 TL/m²).
 * `volume` aktif ilan sayısı.
 */

import type { MarketReport, MarketTrendPoint } from '../types/ai'

/** ISO date (sadece YYYY-MM-DD) — `daysAgo` gün önce. */
function isoDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

/** Deterministik string-hash. */
function hashSeed(input: string): number {
  let h = 0
  for (const c of input) h = (h * 31 + c.charCodeAt(0)) % 1_000_003
  return Math.abs(h)
}

/** Deterministik [0, 1) rastgele. */
function det(key: string, salt: string): number {
  const h = hashSeed(`${key}::${salt}`)
  return (h % 10_000) / 10_000
}

/**
 * 30 günlük random walk fiyat trendi üret.
 * Başlangıç fiyatı `basePriceKurus` (kuruş, m² birim).
 * Her gün ±%2 oynaklık, mean-reversion.
 */
function buildTrend(slug: string, basePriceKurus: number, baseVolume: number): MarketTrendPoint[] {
  const points: MarketTrendPoint[] = []
  let price = basePriceKurus
  let volume = baseVolume
  for (let i = 29; i >= 0; i--) {
    const r = det(slug, `d${i}`)
    const drift = (r - 0.5) * 0.04 // ±%2
    price = Math.round(price * (1 + drift))
    // Mean reversion — uzaklaştıkça base'e doğru
    price = Math.round(price * 0.92 + basePriceKurus * 0.08)
    const vDrift = Math.round((det(slug, `v${i}`) - 0.5) * 12)
    volume = Math.max(5, volume + vDrift)
    points.push({
      date: isoDate(i),
      price,
      volume,
    })
  }
  return points
}

export const MARKET_REPORTS: MarketReport[] = [
  {
    regionSlug: 'cesme',
    trend: buildTrend('cesme', 8_200_00, 47),
    demandHeat: 78,
    aiSummary:
      'Çeşme genelinde son 30 günde m² fiyatı %4.2 yükselmiş. Alaçatı ve Ovacık bölgelerinde deniz manzaralı imarlı parseller 30 günden kısa sürede satılıyor. İç kesim tarım vasıflı arazilerde durgunluk var. Genel tablo güçlü alıcı talebi gösteriyor.',
    topRisks: [
      'İmar planı revizyonu Q4 2026\'da gündemde — bazı parsellerin kullanım sınıfı değişebilir',
      'Yaz sonrası talep kırılması beklenebilir (mevsimsel)',
      'Dolar kuru oynaklığı yabancı alıcıyı etkiliyor',
    ],
    topOpportunities: [
      'Alaçatı civarı butik otel projesi için uygun parseller %12 altında değerleniyor',
      'Ovacık iç kesim tarım vasıflı arazilerde dönüşüm potansiyeli',
      '500 m² altı küçük parseller likiditesi yüksek — hızlı çıkış',
    ],
    generatedAt: new Date().toISOString(),
  },
  {
    regionSlug: 'ayvalik',
    trend: buildTrend('ayvalik', 6_800_00, 38),
    demandHeat: 71,
    aiSummary:
      'Ayvalık ve Cunda tarafında deniz manzaralı parseller talep görüyor. Son 12 ayda m² ortalama %22 yükseldi. Sahilkent ve Altınova\'da yeni siteleşme projeleri fiyatları destekliyor. İç kesimde durgunluk devam ediyor.',
    topRisks: [
      'Cunda\'da koruma alanı sınırları belirsiz — yeni inşaat izinleri zor',
      'Liman trafiği artışı bazı bölgelerde yaşam kalitesini düşürüyor',
      'Yaz nüfusu sonrası kış dönemi alıcı talebi azalıyor',
    ],
    topOpportunities: [
      'Sahilkent imarlı 1.000 m² altı parseller — site komşuluğunda değer artışı',
      'Cunda eski taş ev parselleri butik turizm için ideal',
      'Ortalamanın altı sahil arsaları yıl sonu kampanyada hızla tükeniyor',
    ],
    generatedAt: new Date().toISOString(),
  },
  {
    regionSlug: 'datca',
    trend: buildTrend('datca', 5_400_00, 29),
    demandHeat: 64,
    aiSummary:
      'Datça yarımadasında villa imarlı parseller 5.500-8.000 TL/m² aralığında. İmar planı yenilenmesi nedeniyle arz sınırlı. Mesudiye ve Knidos tarafında butik villa talebi sürüyor. Merkez tarafında köşe parsellerde prim mevcut.',
    topRisks: [
      'Yarımadanın ulaşım altyapısı sınırlı — yoğun sezonda erişim zorlaşıyor',
      'Su kaynağı problemi — bazı bölgelerde yapı izni şartlı',
      'İmar planı revizyonu sonrası bazı parsellerin durumu değişebilir',
    ],
    topOpportunities: [
      'Mesudiye butik otel için 2-3 dönüm parseller değerleniyor',
      'Knidos antik kent yakını parsellerde turizm dönüşümü',
      'Datça merkez 1 dönüm üstü konut parselleri likit',
    ],
    generatedAt: new Date().toISOString(),
  },
  {
    regionSlug: 'urla',
    trend: buildTrend('urla', 4_200_00, 52),
    demandHeat: 68,
    aiSummary:
      'Urla\'da Zeytinalanı ve İçmeler tarafında zeytinlik + tarım arazisi talep görüyor. Bağcılık dönüşümü Karaburun\'a doğru kayıyor. Merkez konut parselleri durağan ama yatırım amaçlı arsa talebi sürüyor. Yıl başına göre m² %14 yukarıda.',
    topRisks: [
      'Tarım arazilerinde imar dönüşümü onayları yavaşladı',
      'Üzüm bağı kurulan parsellerde geri dönüşüm zorlaşıyor (KÇS kaydı)',
      'Bazı zeytinlik parsellerinde miras paylaşımı belirsizliği',
    ],
    topOpportunities: [
      'Zeytinalanı tarım vasıflı parseller hala uygun fiyatlı',
      'Karaburun yolu üzeri bağcılık dönüşümü için ideal',
      'Urla merkez yakını site projeleri için 2 dönüm üstü parseller',
    ],
    generatedAt: new Date().toISOString(),
  },
  {
    regionSlug: 'fethiye',
    trend: buildTrend('fethiye', 7_100_00, 41),
    demandHeat: 73,
    aiSummary:
      'Fethiye\'de Çiftlik ve Hisarönü tarafında deniz manzaralı imarlı parseller hızlı satılıyor. Ölüdeniz çevresi premium segment, 12-18 ay vade ile yatırımcı talebi yüksek. Faralya ve Kabak tarafında butik villa projesi için arsa arayışı sürüyor.',
    topRisks: [
      'Ölüdeniz çevresinde sit alanı sınırları sıkı — yapılaşma kısıtlı',
      'Yaz aylarında turist yoğunluğu yaşam kalitesini etkiliyor',
      'İmar planı 2027\'de revize edilecek',
    ],
    topOpportunities: [
      'Faralya 1+ dönüm parseller butik otel için değerleniyor',
      'Çiftlik koyu yakını imarlı parseller —30 günden kısa sürede satılıyor',
      'Kayaköy bölgesi turizm dönüşümü için izinli parseller',
    ],
    generatedAt: new Date().toISOString(),
  },
  {
    regionSlug: 'edremit',
    trend: buildTrend('edremit', 3_500_00, 64),
    demandHeat: 58,
    aiSummary:
      'Edremit körfezinde Akçay ve Altınoluk tarafında zeytinlik + konut parselleri talep görüyor. Sahilkent projeleri fiyatları destekliyor. İç kesim Kazdağı eteklerinde turizm odaklı parseller değer kazanıyor. Genel tempo orta seviyede.',
    topRisks: [
      'Akçay\'da imar planı yenilenecek (2027) — bazı parsellerin durumu değişebilir',
      'Sahil tarafında yapılaşma yoğunlaşıyor — manzaralı parseller azalıyor',
      'Zeytinlik koruma yasası bazı dönüşümleri engelliyor',
    ],
    topOpportunities: [
      'Akçay merkez 1.000 m² altı imarlı parseller likit',
      'Altınoluk Kazdağı tarafı doğa turizmi için cazip',
      'Edremit merkez yakını site projeleri için 2 dönüm üstü parseller',
    ],
    generatedAt: new Date().toISOString(),
  },
  {
    regionSlug: 'marmaris',
    trend: buildTrend('marmaris', 6_400_00, 33),
    demandHeat: 66,
    aiSummary:
      'Marmaris\'te Hisarönü ve İçmeler tarafında deniz manzaralı parseller talep görüyor. Datça yolu üzeri yatırımcı ilgisi sürüyor. Selimiye ve Bozburun tarafında butik turizm projesi için arsa arayışı var. Merkez tarafında durgunluk gözleniyor.',
    topRisks: [
      'Hisarönü trafik yoğunluğu sezon dışında bile yüksek',
      'Selimiye\'de yapılaşma sınırlı (sit alanı)',
      'Yat turizmi etrafında fiyat balonu riski',
    ],
    topOpportunities: [
      'Hisarönü körfezi 2 dönüm üstü parseller butik otel için değerleniyor',
      'Bozburun balıkçı köyü dönüşümü potansiyeli',
      'Selimiye organik tarım turizmi için izinli parseller',
    ],
    generatedAt: new Date().toISOString(),
  },
  {
    regionSlug: 'soke',
    trend: buildTrend('soke', 2_400_00, 78),
    demandHeat: 49,
    aiSummary:
      'Söke ve Didim tarafında uygun fiyatlı tarım arazileri öne çıkıyor. Akbük ve Bafa Gölü çevresinde butik turizm projesi için arsa arayışı sürüyor. Sahil tarafında yatırımcı talebi orta seviyede. Genel tempo durağan ama uzun vadeli yatırım için cazip fırsatlar var.',
    topRisks: [
      'Bafa Gölü çevresinde imar kısıtlamaları sıkı',
      'Tarım arazilerinde dönüşüm onayları yavaş',
      'Sahil tarafında turizm yatırımı bekleniyor — fiyatlar yıl sonu artabilir',
    ],
    topOpportunities: [
      'Akbük sahil yakını imarlı parseller henüz uygun fiyatlı',
      'Bafa Gölü çevresi doğa turizmi için cazip',
      'Söke merkez 5 dönüm üstü tarım arazileri',
    ],
    generatedAt: new Date().toISOString(),
  },
] as const
