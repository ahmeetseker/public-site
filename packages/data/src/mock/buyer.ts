// Mock buyer profile data for the demo /hesabim/* area.
// In Faz 10.2 these will be hydrated from real auth + user-profile service.

export interface BuyerProfile {
  id: string
  name: string
  email: string
  phone: string
  avatarInitials: string
  joinedISO: string
  preferences: {
    cities: string[]
    types: string[]
    priceMaxTL: number
  }
}

export interface SavedSearch {
  id: string
  name: string
  q: string
  filters: Record<string, string | number>
  matchCount: number
  lastRun: string
  alerts: boolean
}

export interface BuyerConversation {
  id: string
  office: string
  officeSlug: string
  listingId: string
  listingTitle: string
  lastMessage: string
  lastMessageAt: string
  unread: number
  messages: BuyerConversationMessage[]
}

export interface BuyerConversationMessage {
  from: 'me' | 'office'
  text: string
  at: string
}

export interface ActivityItem {
  id: string
  icon: 'heart' | 'mail' | 'search' | 'price'
  text: string
  at: string
}

export const BUYER: BuyerProfile = {
  id: 'demo-user',
  name: 'Demo Kullanıcı',
  email: 'demo@arsam.net',
  phone: '+90 555 123 45 67',
  avatarInitials: 'DK',
  joinedISO: '2026-03-15T00:00:00Z',
  preferences: {
    cities: ['Balıkesir', 'İzmir'],
    types: ['İmarlı', 'Zeytinlik'],
    priceMaxTL: 15000000,
  },
}

export const SAVED_SEARCHES: SavedSearch[] = [
  {
    id: 's1',
    name: 'Ayvalık Cunda · İmarlı',
    q: 'Cunda',
    filters: { tip: 'İmarlı', il: 'Balıkesir' },
    matchCount: 4,
    lastRun: '2026-05-08',
    alerts: true,
  },
  {
    id: 's2',
    name: 'Çeşme Alaçatı · 5-10M ₺',
    q: 'Alaçatı',
    filters: { tip: 'Tümü', priceMax: 10000000 },
    matchCount: 7,
    lastRun: '2026-05-10',
    alerts: false,
  },
  {
    id: 's3',
    name: 'Urla zeytinliği',
    q: 'Urla',
    filters: { tip: 'Zeytinlik' },
    matchCount: 2,
    lastRun: '2026-04-22',
    alerts: true,
  },
]

// Listing ids that the demo user "favorited" — must match real ids in @landx/data LISTINGS.
export const FAVORITE_LISTING_IDS: string[] = [
  '28.AY.0142',
  '09.AL.0061',
  '09.UR.0114',
  '48.FT.0072',
  '17.AK.0089',
]

export const MOCK_CONVERSATIONS: BuyerConversation[] = [
  {
    id: 'c1',
    office: 'Atölye Emlak Ayvalık',
    officeSlug: 'atolye-emlak-ayvalik',
    listingId: '28.AY.0142',
    listingTitle: 'Cunda · denize 80m, yola cephe imarlı arsa',
    lastMessage: "Tabii, yarın 14:00'de Cunda'da görüşelim. Konum atayım.",
    lastMessageAt: '2026-05-11T10:30:00Z',
    unread: 1,
    messages: [
      {
        from: 'me',
        text: 'Merhaba, Cunda denize 80m parsele bakmak istiyorum. Hafta sonu müsait misiniz?',
        at: '2026-05-10T09:00:00Z',
      },
      {
        from: 'office',
        text: 'Merhaba, tabii. Müsait olduğunuz bir gün ayarlayalım. Cumartesi sizin için uygun mu?',
        at: '2026-05-10T09:42:00Z',
      },
      {
        from: 'me',
        text: 'Cumartesi öğleden sonra olur.',
        at: '2026-05-11T08:15:00Z',
      },
      {
        from: 'office',
        text: "Tabii, yarın 14:00'de Cunda'da görüşelim. Konum atayım.",
        at: '2026-05-11T10:30:00Z',
      },
    ],
  },
  {
    id: 'c2',
    office: 'Çeşme Arsa & Yatırım',
    officeSlug: 'cesme-arsa-yatirim',
    listingId: '09.AL.0061',
    listingTitle: 'Alaçatı merkez · imarlı köşe parsel',
    lastMessage: 'Tapu kaydını PDF olarak gönderebilirim.',
    lastMessageAt: '2026-05-09T16:45:00Z',
    unread: 0,
    messages: [
      {
        from: 'me',
        text: "Alaçatı'daki köşe parselin tapu kaydını görebilir miyim?",
        at: '2026-05-09T15:20:00Z',
      },
      {
        from: 'office',
        text: 'Tapu kaydını PDF olarak gönderebilirim.',
        at: '2026-05-09T16:45:00Z',
      },
    ],
  },
  {
    id: 'c3',
    office: 'Datça Koy Emlak',
    officeSlug: 'datca-koy-emlak',
    listingId: '48.DT.0028',
    listingTitle: 'Datça merkez · villa imarlı, 2.150 m²',
    lastMessage: 'Pazarlık payı var, görüşelim.',
    lastMessageAt: '2026-05-07T11:10:00Z',
    unread: 0,
    messages: [
      {
        from: 'me',
        text: '14.2M biraz yüksek geldi. Esneklik var mı?',
        at: '2026-05-07T10:30:00Z',
      },
      {
        from: 'office',
        text: 'Pazarlık payı var, görüşelim.',
        at: '2026-05-07T11:10:00Z',
      },
    ],
  },
]

export const ACTIVITY_FEED: ActivityItem[] = [
  {
    id: 'a1',
    icon: 'mail',
    text: 'Atölye Emlak Ayvalık size yanıt verdi',
    at: '2026-05-11T10:30:00Z',
  },
  {
    id: 'a2',
    icon: 'heart',
    text: 'Cunda · denize 80m parselini favorilerine ekledin',
    at: '2026-05-10T14:20:00Z',
  },
  {
    id: 'a3',
    icon: 'search',
    text: '"Çeşme Alaçatı · 5-10M ₺" araman 7 yeni eşleşme buldu',
    at: '2026-05-10T07:00:00Z',
  },
  {
    id: 'a4',
    icon: 'price',
    text: 'Datça villa imarlı parselin fiyatı %3 düştü',
    at: '2026-04-28T09:15:00Z',
  },
  {
    id: 'a5',
    icon: 'search',
    text: '"Urla zeytinliği" araman 2 yeni eşleşme buldu',
    at: '2026-04-22T07:00:00Z',
  },
]

export const REGIONS_OF_INTEREST = [
  { slug: 'ayvalik', name: 'Ayvalık', subtitle: 'Cunda · Sarımsaklı · Altınova' },
  { slug: 'cesme', name: 'Çeşme', subtitle: 'Alaçatı · Reisdere' },
  { slug: 'urla', name: 'Urla', subtitle: 'Zeytinalanı · merkez' },
]
