// Office mock — promoted to @landx/data in Faz 12.1.a (Wave 6 / Agent-26)
// Origin: apps/public-site/src/data/offices.ts (Wave 2 / Agent-9 / Faz 9.4)

export interface Office {
  id: string
  slug: string
  name: string
  city: string
  district: string
  description: string
  founded: number
  agentCount: number
  listingCount: number
  rating: number // 0-5
  reviewCount: number
  phone: string
  email: string
  whatsapp: string
  address: string
  hours: string
  specialties: string[] // e.g. ['Zeytinlik', 'Villa Arsası']
  team: Array<{ name: string; role: string; phone: string }>
}

export const OFFICES: Office[] = [
  {
    id: 'atolye-ayvalik',
    slug: 'atolye-emlak-ayvalik',
    name: 'Atölye Emlak Ayvalık',
    city: 'Balıkesir',
    district: 'Ayvalık',
    description:
      'Ayvalık ve çevresinde 12 yıldır arsa, zeytinlik ve villa arsası satışı. Kıyıda doğrulanmış parsellerle çalışırız.',
    founded: 2013,
    agentCount: 6,
    listingCount: 24,
    rating: 4.8,
    reviewCount: 142,
    phone: '+90 266 312 12 12',
    email: 'info@atolye-ayvalik.com.tr',
    whatsapp: '+90 532 123 45 67',
    address: 'Sahil Cad. No:42, Ayvalık / Balıkesir',
    hours: 'Pzt-Cmt: 09:00 - 18:30',
    specialties: ['Zeytinlik', 'Villa Arsası', 'İmarlı'],
    team: [
      { name: 'Ahmet Seker', role: 'Genel Müdür', phone: '+90 532 123 45 67' },
      { name: 'Ayşe Kaya', role: 'Satış Uzmanı · Cunda', phone: '+90 532 234 56 78' },
      { name: 'Berk Demir', role: 'Zeytinlik Uzmanı', phone: '+90 532 345 67 89' },
    ],
  },
  {
    id: 'cesme-arsa',
    slug: 'cesme-arsa-merkezi',
    name: 'Çeşme Arsa Merkezi',
    city: 'İzmir',
    district: 'Çeşme',
    description:
      'Alaçatı ve Çeşme yarımadasında butik otel, konut ve ticari imarlı parseller. Şeffaf imar danışmanlığı.',
    founded: 2008,
    agentCount: 9,
    listingCount: 38,
    rating: 4.7,
    reviewCount: 218,
    phone: '+90 232 712 12 12',
    email: 'hello@cesmearsa.com',
    whatsapp: '+90 532 456 78 90',
    address: 'Liman Cad. No:18, Alaçatı / Çeşme',
    hours: 'Her gün: 10:00 - 20:00',
    specialties: ['Villa Arsası', 'Ticari İmarlı'],
    team: [
      { name: 'Mehmet Yılmaz', role: 'Kurucu Ortak', phone: '+90 532 456 78 90' },
      { name: 'Zeynep Aksoy', role: 'Alaçatı Uzmanı', phone: '+90 532 567 89 01' },
    ],
  },
  {
    id: 'datca-koy',
    slug: 'datca-koy-arsa',
    name: 'Datça Koy Arsa',
    city: 'Muğla',
    district: 'Datça',
    description:
      'Datça yarımadası, Knidos ve doğanın koy parselleri. Off-grid yaşam, sürdürülebilir mimarlık.',
    founded: 2018,
    agentCount: 3,
    listingCount: 12,
    rating: 4.9,
    reviewCount: 67,
    phone: '+90 252 712 88 99',
    email: 'iletisim@datcakoy.com',
    whatsapp: '+90 533 678 90 12',
    address: 'Yat Limanı Yolu, Datça / Muğla',
    hours: 'Pzt-Pzr: 09:00 - 19:00',
    specialties: ['Villa Arsası', 'Koy parseli'],
    team: [{ name: 'Selin Türk', role: 'Kurucu', phone: '+90 533 678 90 12' }],
  },
  {
    id: 'fethiye-pano',
    slug: 'fethiye-panorama-emlak',
    name: 'Fethiye Panorama Emlak',
    city: 'Muğla',
    district: 'Fethiye',
    description:
      'Hisarönü, Ölüdeniz, Kayaköy bölgesinde manzaralı villa arsaları ve butik yatırım parselleri.',
    founded: 2015,
    agentCount: 5,
    listingCount: 19,
    rating: 4.6,
    reviewCount: 94,
    phone: '+90 252 614 12 12',
    email: 'info@fethiyepano.com',
    whatsapp: '+90 532 789 01 23',
    address: 'Çalış Cad. No:74, Fethiye / Muğla',
    hours: 'Pzt-Cmt: 09:30 - 19:00',
    specialties: ['Villa Arsası', 'İmarlı'],
    team: [
      { name: 'Cem Aksan', role: 'Genel Müdür', phone: '+90 532 789 01 23' },
      { name: 'Pınar Yıldız', role: 'Yatırım Uzmanı', phone: '+90 532 890 12 34' },
    ],
  },
]

export interface OfficeReview {
  name: string
  rating: number
  date: string
  text: string
}

export const REVIEWS_BY_OFFICE: Record<string, OfficeReview[]> = {
  'atolye-ayvalik': [
    {
      name: 'Hakan Y.',
      rating: 5,
      date: '2 ay önce',
      text: 'Cunda tarafında 3 farklı parsel gezdirdiler. Şeffaf çalışıyorlar, tapu süreci 9 günde bitti.',
    },
    {
      name: 'Esra K.',
      rating: 5,
      date: '4 ay önce',
      text: 'Zeytinlik aradık, fiyat dışı detayları (sulama hattı, yola cephe) net anlattılar. Tavsiye ederim.',
    },
    {
      name: 'Mert D.',
      rating: 4,
      date: '6 ay önce',
      text: 'Profesyoneller. Yalnız ilk geri dönüş biraz geç oldu — yoğun sezondu.',
    },
  ],
  'cesme-arsa': [
    {
      name: 'Burak T.',
      rating: 5,
      date: '1 ay önce',
      text: 'Alaçatı butik otel arsası için 4 alternatif sundular. İmar durumunu ve yapılaşma planını net açıkladılar.',
    },
    {
      name: 'Ceren A.',
      rating: 5,
      date: '3 ay önce',
      text: 'Çeşme’de yatırımlık ticari imarlı parsel aldık. Süreç boyunca tek noktadan iletişim, çok rahattı.',
    },
    {
      name: 'Onur S.',
      rating: 4,
      date: '5 ay önce',
      text: 'Bilgi seviyeleri yüksek. Fiyat pazarlığında biraz katılar ama bölgenin değerini iyi biliyorlar.',
    },
    {
      name: 'Defne B.',
      rating: 5,
      date: '7 ay önce',
      text: 'Tapu, ipotek ve imar yazısı için adım adım yönlendirme yaptılar. Şeffaf ve hızlı.',
    },
  ],
  'datca-koy': [
    {
      name: 'Levent K.',
      rating: 5,
      date: '2 ay önce',
      text: 'Knidos tarafında bir koy parseli için günler boyunca alternatif gezdirdiler. Tutkulu çalışıyorlar.',
    },
    {
      name: 'İnci P.',
      rating: 5,
      date: '4 ay önce',
      text: 'Off-grid yaşam için aradığımız parseli buldular, su/elektrik fizibilitesini de paylaştılar.',
    },
    {
      name: 'Tarık H.',
      rating: 5,
      date: '8 ay önce',
      text: 'Bölgenin doğa ve imar hassasiyetini iyi anlıyorlar. Aceleci satış baskısı yok, gerçek danışmanlık.',
    },
  ],
  'fethiye-pano': [
    {
      name: 'Yağmur Ö.',
      rating: 5,
      date: '1 ay önce',
      text: 'Kayaköy’de manzaralı villa arsası için 6 farklı parsel gezdirdik, her birinin imar durumunu açıkladılar.',
    },
    {
      name: 'Sinan E.',
      rating: 4,
      date: '3 ay önce',
      text: 'Hisarönü’nde aradığımıza yakın bir parsel buldular. Tapu süreci 12 günde tamamlandı.',
    },
    {
      name: 'Asya M.',
      rating: 5,
      date: '6 ay önce',
      text: 'Ölüdeniz’e yakın butik bir yatırım parseli aldık. Süreç boyunca düzenli bilgilendirme yapıldı.',
    },
  ],
}

export function officeBySlug(slug: string): Office | undefined {
  return OFFICES.find((o) => o.slug === slug)
}

export function officesByCity(city: string): Office[] {
  return OFFICES.filter((o) => o.city === city)
}
