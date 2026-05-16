/**
 * buyer-mock — minimal read-only mock data for the public-site /hesabim/*
 * islands. The Astro pages already render `@landx/data`-backed SSR content;
 * the React islands re-import a slimmer subset here so the bundled JS stays
 * small (we don't ship the full LISTINGS array into the island chunk).
 *
 * Wave F3 / Agent-F3E.
 */

export interface MockConversation {
  id: string
  office: string
  listingTitle: string
  lastMessage: string
  lastMessageAt: string
  unread: number
  messages: { from: 'me' | 'office'; text: string; at: string }[]
}

/**
 * Curated 4-entry conversation list — small enough that islands stay light
 * but rich enough to demo thread expansion. Keep in sync with
 * `packages/data/src/mock/buyer.ts MOCK_CONVERSATIONS` shape so the SSR
 * `mesajlar.astro` and this island agree visually.
 */
export const BUYER_MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: 'c1',
    office: 'Atölye Emlak Ayvalık',
    listingTitle: 'Cunda · denize 80m, yola cephe imarlı arsa',
    lastMessage: "Tabii, yarın 14:00'de Cunda'da görüşelim.",
    lastMessageAt: '2026-05-11T10:30:00Z',
    unread: 1,
    messages: [
      { from: 'me', text: 'Merhaba, Cunda denize 80m parsele bakmak istiyorum.', at: '2026-05-10T09:00:00Z' },
      { from: 'office', text: 'Tabii, hafta sonu uygun musunuz?', at: '2026-05-10T09:42:00Z' },
      { from: 'me', text: 'Cumartesi öğleden sonra olur.', at: '2026-05-11T08:15:00Z' },
      { from: 'office', text: "Tabii, yarın 14:00'de Cunda'da görüşelim.", at: '2026-05-11T10:30:00Z' },
    ],
  },
  {
    id: 'c2',
    office: 'Çeşme Arsa & Yatırım',
    listingTitle: 'Alaçatı merkez · imarlı köşe parsel',
    lastMessage: 'Tapu kaydını PDF olarak gönderebilirim.',
    lastMessageAt: '2026-05-09T16:45:00Z',
    unread: 0,
    messages: [
      { from: 'me', text: "Alaçatı'daki parselin tapu kaydını görebilir miyim?", at: '2026-05-09T15:20:00Z' },
      { from: 'office', text: 'Tapu kaydını PDF olarak gönderebilirim.', at: '2026-05-09T16:45:00Z' },
    ],
  },
  {
    id: 'c3',
    office: 'Datça Koy Emlak',
    listingTitle: 'Datça merkez · villa imarlı, 2.150 m²',
    lastMessage: 'Pazarlık payı var, görüşelim.',
    lastMessageAt: '2026-05-07T11:10:00Z',
    unread: 0,
    messages: [
      { from: 'me', text: '14.2M biraz yüksek geldi. Esneklik var mı?', at: '2026-05-07T10:30:00Z' },
      { from: 'office', text: 'Pazarlık payı var, görüşelim.', at: '2026-05-07T11:10:00Z' },
    ],
  },
  {
    id: 'c4',
    office: 'Urla Zeytinlik Emlak',
    listingTitle: 'Urla · 4 dönüm zeytinlik, yola cephe',
    lastMessage: 'Pazar günü gezdirebilirim, müsait misiniz?',
    lastMessageAt: '2026-05-05T13:00:00Z',
    unread: 0,
    messages: [
      { from: 'me', text: 'Urla zeytinliğinde yerinde bakmak istiyorum.', at: '2026-05-05T12:10:00Z' },
      { from: 'office', text: 'Pazar günü gezdirebilirim, müsait misiniz?', at: '2026-05-05T13:00:00Z' },
    ],
  },
]

/** A short-text helper used by RecentActivity island. */
export interface MockActivity {
  id: string
  kind: 'favorite' | 'search' | 'message' | 'price'
  text: string
  at: string
}

export const BUYER_MOCK_ACTIVITY: MockActivity[] = [
  { id: 'm1', kind: 'message', text: 'Atölye Emlak Ayvalık size yanıt verdi', at: '2026-05-11T10:30:00Z' },
  { id: 'm2', kind: 'favorite', text: 'Cunda · denize 80m parselini favorilere ekledin', at: '2026-05-10T14:20:00Z' },
  { id: 'm3', kind: 'search', text: '"Çeşme Alaçatı · 5-10M ₺" araman 7 yeni eşleşme buldu', at: '2026-05-10T07:00:00Z' },
  { id: 'm4', kind: 'price', text: 'Datça villa imarlı parselin fiyatı %3 düştü', at: '2026-04-28T09:15:00Z' },
]
