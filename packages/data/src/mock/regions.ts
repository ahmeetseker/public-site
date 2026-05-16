// Region mock — promoted to @landx/data in Faz 12.1.a (Wave 6 / Agent-26)
// Origin: apps/public-site/src/data/regions.ts (Wave 3 / Agent-14)

import { LISTINGS } from './listings'
import type { Listing } from './types'

export interface RegionMarketStats {
  avgPricePerSqm: number
  activeBuyers: number
  avgDealDays: number
  yoy: string // örn. "+18% son 12 ay"
}

export interface RegionFaq {
  q: string
  a: string
}

export interface Region {
  slug: string
  name: string // Display name
  city: string // İl
  match: (district: string) => boolean
  heroEyebrow: string
  heroHeadline: string
  description: string
  marketStats: RegionMarketStats
  highlights: string[]
  faqs: RegionFaq[]
  similarSlugs?: string[]
}

export const REGIONS: Region[] = [
  {
    slug: 'ayvalik',
    name: 'Ayvalık',
    city: 'Balıkesir',
    match: (d) => d.startsWith('Ayvalık'),
    heroEyebrow: 'BÖLGE · BALIKESİR',
    heroHeadline: 'Ayvalık arsa pazarı',
    description:
      "Ege'nin zeytin ve deniz mirasının buluştuğu nokta. Cunda, Sarımsaklı, Altınova ve Küçükköy'de doğrulanmış parseller.",
    marketStats: {
      avgPricePerSqm: 4800,
      activeBuyers: 47,
      avgDealDays: 32,
      yoy: '+22% son 12 ay',
    },
    highlights: [
      'Cunda Adası: turistik bölge, denize sıfır parseller nadir',
      'Sarımsaklı: 580+ ağaçlı zeytinlikler, sulu tarım uygun',
      'Altınova: imarlı yatırım parselleri, hızlı ulaşım',
      'Küçükköy: hemen yapılaşma için ideal',
    ],
    faqs: [
      {
        q: "Ayvalık'ta arsa fiyatları ne kadar?",
        a: "Ortalama m² fiyatı 4.800 TL civarında; 580 m² zeytinlikten 1.240 m² imarlıya kadar farklı segmentler bulunuyor. Cunda ve Sarımsaklı'da fiyatlar %20-30 daha yüksek seyrediyor.",
      },
      {
        q: "Ayvalık'ta hangi tip arsa popüler?",
        a: 'Zeytinlik ve imarlı parseller en çok aranan kategoriler. Cunda Adası butik konut için, Altınova hızlı yapılaşma için tercih ediliyor. Sarımsaklı ağaç sayısı yüksek zeytinlikleriyle öne çıkıyor.',
      },
      {
        q: "Ayvalık'ta arsa alırken nelere dikkat edilmeli?",
        a: "İmar durumu, yola cephe metrajı, zeytinlikte ağaç sayısı, sulu/susuz toprak farkı, hisseli/müstakil tapu kontrolü kritik. Cunda'da SİT sınıfı, sahil şeridinde kıyı kanunu sınırlamaları ayrıca incelenmeli.",
      },
      {
        q: "Ayvalık'ta ortalama satış süresi ne kadar?",
        a: 'Doğrulanmış ilanlarda satış ortalaması 32 gün. Cunda ve imarlı parsellerde bu süre 20 günün altına inerken, hisseli zeytinliklerde 60 günü bulabiliyor.',
      },
    ],
    similarSlugs: ['cesme', 'edremit'],
  },
  {
    slug: 'cesme',
    name: 'Çeşme',
    city: 'İzmir',
    match: (d) => d.startsWith('Çeşme'),
    heroEyebrow: 'BÖLGE · İZMİR',
    heroHeadline: 'Çeşme yarımadası',
    description:
      "Alaçatı, Reisdere ve Çiftlik'te butik otel, konut ve ticari imarlı parseller. Türkiye'nin en yüksek talep gören bölgesi.",
    marketStats: {
      avgPricePerSqm: 8200,
      activeBuyers: 89,
      avgDealDays: 21,
      yoy: '+34% son 12 ay',
    },
    highlights: [
      'Alaçatı içi: ticari imarlı parseller butik otel için',
      "Reisdere: denize 600m'de çift cepheli imarlılar",
      'Yüksek likidite, ortalama 21 günde satış',
    ],
    faqs: [
      {
        q: "Çeşme'de arsa fiyatları ne kadar?",
        a: "Ortalama m² fiyatı 8.200 TL. Alaçatı merkezde 12.000-18.000 TL/m²'ye çıkabiliyor; Reisdere ve Çiftlik kıyısı 6.000-9.000 TL/m² bandında ilerliyor.",
      },
      {
        q: "Çeşme'de butik otel için arsa nasıl seçilir?",
        a: "Ticari imar şerhi ve turizm tesisi yapılabilir not kritik. Alaçatı içinde dar sokak parsellerinde otopark zorunluluğu, Reisdere'de denize uzaklık ve cephe genişliği değerlendirilmeli.",
      },
      {
        q: "Çeşme'de en hızlı satılan parsel tipi hangisi?",
        a: 'İmarlı, ticari ve villa arsaları 21 günün altında işlem görüyor. Yüksek aktif alıcı sayısı (89) ile Türkiye ortalamasının üstünde likidite.',
      },
    ],
    similarSlugs: ['urla', 'ayvalik'],
  },
  {
    slug: 'datca',
    name: 'Datça',
    city: 'Muğla',
    match: (d) => d.startsWith('Datça'),
    heroEyebrow: 'BÖLGE · MUĞLA',
    heroHeadline: 'Datça yarımadası',
    description:
      'Knidos antik kentinin koy parselleri, off-grid yaşam ve sürdürülebilir mimarlık için tercih edilen bölge.',
    marketStats: {
      avgPricePerSqm: 6800,
      activeBuyers: 28,
      avgDealDays: 48,
      yoy: '+18% son 12 ay',
    },
    highlights: [
      'Datça merkez: villa arsaları, deniz manzaralı',
      'Knidos: arkeolojik sit yakını, koy önü parseller',
      'Daha az yoğun, kalıcı yaşam tercihi',
    ],
    faqs: [
      {
        q: "Datça'da arsa fiyatları ne kadar?",
        a: "Ortalama 6.800 TL/m². Knidos koy önünde 9.000 TL/m² üzeri, merkez ve iç köylerde 4.500-6.000 TL/m² bandında parseller mevcut.",
      },
      {
        q: "Datça'da arkeolojik SİT sınırlamaları nasıl çalışır?",
        a: 'Knidos çevresindeki I-III. derece SİT alanlarında yapılaşma izni sıkı denetimli. Tapu üzerindeki şerhler ve Koruma Bölge Kurulu kararları satın almadan önce mutlaka kontrol edilmeli.',
      },
      {
        q: "Datça'da off-grid yaşam için altyapı sorun olur mu?",
        a: 'Bazı iç köylerde şebeke elektrik ve kanalizasyon olmayabiliyor. Güneş + kuyu + septik tank çözümü için yer seçimi ve toprak etüdü öne çıkıyor.',
      },
    ],
    similarSlugs: ['fethiye', 'marmaris'],
  },
  {
    slug: 'fethiye',
    name: 'Fethiye',
    city: 'Muğla',
    match: (d) => d.startsWith('Fethiye'),
    heroEyebrow: 'BÖLGE · MUĞLA',
    heroHeadline: 'Fethiye ve Hisarönü',
    description:
      "Ölüdeniz, Kayaköy ve Hisarönü'nde panoramik villa arsaları. Üst yol manzaralı parsellerle dolu portföy.",
    marketStats: {
      avgPricePerSqm: 7400,
      activeBuyers: 35,
      avgDealDays: 28,
      yoy: '+24% son 12 ay',
    },
    highlights: [
      'Hisarönü: panoramik villa arsaları',
      'Kayaköy: tarihi ve sürdürülebilir yapılaşma',
      'Üst yol parselleri: deniz manzaralı yatırım',
    ],
    faqs: [
      {
        q: "Fethiye'de villa arsası fiyatları ne kadar?",
        a: "Ortalama 7.400 TL/m². Hisarönü panaromik üst yol parselleri 9.000-12.000 TL/m², Ölüdeniz sırtı 8.000 TL/m² civarında.",
      },
      {
        q: "Kayaköy'de yapılaşma kuralları neler?",
        a: "Kayaköy SİT alanı içinde geleneksel taş mimari zorunluluğu var. Yeni yapılarda gabari, çatı eğimi ve cephe malzemeleri için Koruma Kurulu onayı şart.",
      },
      {
        q: "Fethiye'de hangi bölge yatırım için en kazançlı?",
        a: 'Üst yol manzaralı imarlı parseller son 24 ayda %24 değer kazandı. Hisarönü ve Ovacık üzeri parseller hem kira hem yeniden satış için tercih ediliyor.',
      },
    ],
    similarSlugs: ['datca', 'marmaris'],
  },
  {
    slug: 'urla',
    name: 'Urla',
    city: 'İzmir',
    match: (d) => d.startsWith('Urla'),
    heroEyebrow: 'BÖLGE · İZMİR',
    heroHeadline: 'Urla zeytinlikleri',
    description:
      'Zeytinalanı, Demircili ve Bademler köylerinde zeytinlik + tarım parselleri. Üretici belgesi alabilecek arazi seçenekleri.',
    marketStats: {
      avgPricePerSqm: 1200,
      activeBuyers: 22,
      avgDealDays: 56,
      yoy: '+12% son 12 ay',
    },
    highlights: [
      'Zeytinalanı: ikiz parsel imkanı',
      'Kuyu, elektrik altyapısı çoğunda mevcut',
      'Tarım faaliyeti için elverişli toprak',
    ],
    faqs: [
      {
        q: "Urla'da zeytinlik arsa fiyatları ne kadar?",
        a: "Ortalama 1.200 TL/m². Demircili ve Bademler'de 800-1.500 TL/m², imarlı butik konut parsellerinde 3.000 TL/m² ve üzeri.",
      },
      {
        q: "Urla'da üretici belgesi nasıl alınır?",
        a: 'En az 2 dönüm zeytinlikte ÇKS (Çiftçi Kayıt Sistemi) kaydı + tapu + ikametgah ile İl Tarım Müdürlüğü başvurusu yeterli. Vergi muafiyeti ve teşvik kapsamı açılır.',
      },
      {
        q: "Urla'da zeytinlik nasıl değerlenir?",
        a: 'Aktif ağaç sayısı, yaş ortalaması, sulama altyapısı, anayola mesafe ve imar plan revizyonu beklentisi en kritik faktörler. Son 12 ayda %12 değer artışı görüldü.',
      },
    ],
    similarSlugs: ['ayvalik', 'cesme'],
  },
  {
    slug: 'marmaris',
    name: 'Marmaris',
    city: 'Muğla',
    match: (d) => d.startsWith('Marmaris'),
    heroEyebrow: 'BÖLGE · MUĞLA',
    heroHeadline: 'Marmaris Bozburun',
    description:
      'Bozburun yarımadasında koy önü villa arsaları. Lüks segment, özel deniz erişimi.',
    marketStats: {
      avgPricePerSqm: 12500,
      activeBuyers: 18,
      avgDealDays: 42,
      yoy: '+28% son 12 ay',
    },
    highlights: [
      'Bozburun koy parselleri',
      'Özel deniz erişimi',
      'Lüks villa segmenti',
    ],
    faqs: [
      {
        q: "Marmaris Bozburun'da arsa fiyatları neden bu kadar yüksek?",
        a: "Bozburun yarımadası kısıtlı imar ve nadir koy önü parsel arzı nedeniyle 12.500 TL/m² ortalamasıyla Türkiye'nin en pahalı bölgeleri arasında.",
      },
      {
        q: "Bozburun'da özel deniz erişimi nasıl güvence altına alınır?",
        a: 'Tapuda kıyı kenar çizgisi ve mülkiyet kontrolü şart. Çekme kat, iskele izni ve kıyı kanunu kapsamı bakım/inşaat aşamasında izlenmeli.',
      },
      {
        q: "Marmaris'te kiralama getirisi nasıl?",
        a: 'Lüks villa segmentinde sezonluk haftalık kira 5.000-15.000 EUR aralığında değişiyor. Yatırım amaçlı alımlarda yıllık brüt getiri %4-7 bandında öngörülüyor.',
      },
    ],
    similarSlugs: ['datca', 'fethiye'],
  },
  {
    slug: 'soke',
    name: 'Söke',
    city: 'Aydın',
    match: (d) => d.startsWith('Söke'),
    heroEyebrow: 'BÖLGE · AYDIN',
    heroHeadline: 'Söke tarım arazileri',
    description:
      'Söke ovasında geniş tarla parselleri. Tarımsal yatırım ve hayvancılık için elverişli toprak.',
    marketStats: {
      avgPricePerSqm: 380,
      activeBuyers: 12,
      avgDealDays: 78,
      yoy: '+8% son 12 ay',
    },
    highlights: [
      '5000+ m² tarla parselleri',
      'Sulu tarım altyapısı',
      'Tarımsal teşvik kapsamı',
    ],
    faqs: [
      {
        q: "Söke ovasında tarla fiyatları ne kadar?",
        a: 'Ortalama 380 TL/m². Sulu tarla, kanal ve göletlere yakın parsellerde 500 TL/m², susuz iç tarlalarda 250 TL/m² seviyesinde.',
      },
      {
        q: "Söke'de tarımsal teşviklerden nasıl yararlanılır?",
        a: 'ÇKS kaydı + Bağ-Kur (4/b) çiftçi sigortası + tarım kredi kooperatifi üyeliği ile mazot, gübre, sertifikalı tohum destek primlerinden faydalanılabilir.',
      },
      {
        q: "Söke'de yatırım için doğru zaman mı?",
        a: 'Son 12 ayda %8 değer artışı görece düşük olsa da, Aydın-Söke karayolu modernizasyonu ve sulama yatırımları orta vadeli prim potansiyeli taşıyor.',
      },
    ],
    similarSlugs: ['urla'],
  },
  {
    slug: 'edremit',
    name: 'Edremit',
    city: 'Balıkesir',
    match: (d) => d.startsWith('Edremit'),
    heroEyebrow: 'BÖLGE · BALIKESİR',
    heroHeadline: 'Edremit Körfezi',
    description:
      'Akçay ve çevresinde sahile yakın imarlı parseller. İkinci konut ve site içi yaşam.',
    marketStats: {
      avgPricePerSqm: 5400,
      activeBuyers: 31,
      avgDealDays: 35,
      yoy: '+18% son 12 ay',
    },
    highlights: [
      'Akçay merkez: sahile 200-350m',
      'Site içi parseller',
      'İkinci konut için ideal lokasyon',
    ],
    faqs: [
      {
        q: "Edremit Körfezi'nde arsa fiyatları ne kadar?",
        a: "Ortalama 5.400 TL/m². Akçay sahil hattı 7.500-9.000 TL/m², iç mahalleler ve Altınoluk yolu üstü 4.000-5.500 TL/m² civarında.",
      },
      {
        q: "Akçay'da ikinci konut için arsa mı, hazır site mi?",
        a: 'Bütçe ve zaman ufkuna bağlı. Site içi parsel hemen kullanım için pratik; bağımsız imarlı parsel uzun vadede yüksek prim ve özelleştirme avantajı sunuyor.',
      },
      {
        q: "Edremit'te kira getirisi nasıl?",
        a: 'Akçay yaz sezonu (Haziran-Eylül) haftalık 8.000-25.000 TL bandında. Yıllık brüt getiri %5-8 aralığında, Körfez bölgesinde son 12 ayda %18 değerlenme görüldü.',
      },
    ],
    similarSlugs: ['ayvalik'],
  },
]

export function getRegionListings(region: Region): Listing[] {
  return LISTINGS.filter((l) => region.match(l.district))
}

export function regionBySlug(slug: string): Region | undefined {
  return REGIONS.find((r) => r.slug === slug)
}

/** @deprecated use `regionBySlug` (kept for compatibility — Faz 12.1.a transition) */
export const getRegionBySlug = regionBySlug
