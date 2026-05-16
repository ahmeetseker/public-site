/**
 * Notification mock seed for the atolye-admin notifications feed.
 *
 * Faz 12 / Wave F3-C: backend doesn't expose notification endpoints yet
 * (LandX-API survey, Wave 15). Hooks in `query/notifications.ts` mock-only
 * with apiOrMock(landxApi.notifications.* — TODO, mockAsync(...)) so the
 * call sites stay identical when the API lands.
 */

export type NotificationType = 'info' | 'warning' | 'success' | 'system'

export type NotificationCategory =
  | 'mention'
  | 'sistem'
  | 'müşteri'
  | 'satış'
  | 'finans'

export interface NotificationRelatedEntity {
  type: 'listing' | 'customer' | 'deal' | 'transaction' | 'message' | 'report'
  id: string
}

export interface Notification {
  id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  body: string
  /** ISO timestamp */
  timestamp: string
  read: boolean
  relatedEntity?: NotificationRelatedEntity
  actionLabel?: string
  actionHref?: string
}

const NOW = Date.now()
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString()
const hoursAgo = (h: number) => minutesAgo(h * 60)
const daysAgo = (d: number) => hoursAgo(d * 24)

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'n-001',
    type: 'info',
    category: 'müşteri',
    title: 'Yeni müşteri eşleşmesi',
    body: 'Hakan Y. — Cunda denize 80m parselini favorilerine ekledi.',
    timestamp: minutesAgo(12),
    read: false,
    relatedEntity: { type: 'customer', id: 'M-2401' },
    actionLabel: 'Müşteriyi gör',
    actionHref: '/customers',
  },
  {
    id: 'n-002',
    type: 'info',
    category: 'satış',
    title: 'Fırsat aşama değişti (M-2398)',
    body: 'Esra K. — "Görüşme" → "Teklif" aşamasına geçti.',
    timestamp: hoursAgo(1),
    read: false,
    relatedEntity: { type: 'deal', id: 'M-2398' },
    actionLabel: 'Pipeline aç',
    actionHref: '/sales',
  },
  {
    id: 'n-003',
    type: 'warning',
    category: 'finans',
    title: 'Tahsilat gecikti (INV-2026-0142)',
    body: 'INV-2026-0142 ödemesi 14 gün geçmiş.',
    timestamp: hoursAgo(2),
    read: false,
    relatedEntity: { type: 'transaction', id: 'INV-2026-0142' },
    actionLabel: 'İşlemi gör',
    actionHref: '/finance',
  },
  {
    id: 'n-004',
    type: 'system',
    category: 'sistem',
    title: 'Haftalık özet hazır',
    body: 'Bu hafta 4 yeni ilan, 2 satış, 12 yeni müşteri.',
    timestamp: hoursAgo(3),
    read: false,
    relatedEntity: { type: 'report', id: 'weekly-2026-19' },
    actionLabel: 'Raporları aç',
    actionHref: '/reports',
  },
  {
    id: 'n-005',
    type: 'warning',
    category: 'sistem',
    title: 'Entegrasyon uyarısı',
    body: 'sahibinden.com sync 2 saat önce başarısız oldu.',
    timestamp: hoursAgo(5),
    read: false,
    actionLabel: 'Entegrasyonları aç',
    actionHref: '/profile',
  },
  {
    id: 'n-006',
    type: 'info',
    category: 'müşteri',
    title: 'Yeni mesaj (M-2401)',
    body: 'Mert D.: "Yarın 14:00 müsait misiniz?"',
    timestamp: hoursAgo(6),
    read: true,
    relatedEntity: { type: 'message', id: 'C-7401' },
    actionLabel: 'Yanıtla',
    actionHref: '/messages',
  },
  {
    id: 'n-007',
    type: 'success',
    category: 'satış',
    title: 'Tapu tamamlandı (L-3142)',
    body: 'Pınar Y. — Alaçatı bağ evi imarlı satışı tamamlandı.',
    timestamp: daysAgo(1),
    read: true,
    relatedEntity: { type: 'listing', id: 'L-3142' },
    actionLabel: 'Detay',
    actionHref: '/sales',
  },
  {
    id: 'n-008',
    type: 'info',
    category: 'mention',
    title: 'Ekipte bahsedildin',
    body: 'Selin S. bir notta seni etiketledi: "@ahmet bu parsel için müsait misin?"',
    timestamp: daysAgo(2),
    read: true,
    actionLabel: 'Notu aç',
    actionHref: '/messages',
  },
  {
    id: 'n-009',
    type: 'success',
    category: 'finans',
    title: 'Komisyon ödendi',
    body: 'Selin S. — Mart komisyon ödemesi ₺ 18.4K hesaba yatırıldı.',
    timestamp: daysAgo(3),
    read: true,
    relatedEntity: { type: 'transaction', id: 'COM-2026-031' },
    actionLabel: 'Finansta aç',
    actionHref: '/finance',
  },
  {
    id: 'n-010',
    type: 'system',
    category: 'sistem',
    title: 'Yedek alındı',
    body: 'Otomatik yedek başarıyla tamamlandı (12.4 MB).',
    timestamp: daysAgo(4),
    read: true,
    actionLabel: 'Ayarlara git',
    actionHref: '/profile',
  },
  {
    id: 'n-011',
    type: 'info',
    category: 'müşteri',
    title: 'Yeni kayıt formu dolduruldu',
    body: 'Cunda Ofisi web formundan 3 yeni müşteri kaydı geldi.',
    timestamp: daysAgo(5),
    read: true,
    actionLabel: 'Müşterileri aç',
    actionHref: '/customers',
  },
  {
    id: 'n-012',
    type: 'info',
    category: 'satış',
    title: 'Pipeline haftalık özet',
    body: 'Bu hafta 3 yeni fırsat, 1 kapanış. Toplam değer ₺ 6.2M.',
    timestamp: daysAgo(7),
    read: true,
    actionLabel: 'Pipeline aç',
    actionHref: '/sales',
  },
  {
    id: 'n-013',
    type: 'info',
    category: 'satış',
    title: 'Yeni ilan eklendi (L-1234)',
    body: 'Ayvalık · Cunda · İmarlı 1.240 m² portföye girdi.',
    timestamp: daysAgo(8),
    read: true,
    relatedEntity: { type: 'listing', id: 'L-1234' },
    actionLabel: 'İlanı aç',
    actionHref: '/listings',
  },
  {
    id: 'n-014',
    type: 'info',
    category: 'müşteri',
    title: 'Görüşme planı (M-2401)',
    body: 'Burhan K. ile Pazar 14:00 ikinci ziyaret planlandı.',
    timestamp: daysAgo(9),
    read: true,
    relatedEntity: { type: 'customer', id: 'M-2401' },
    actionLabel: 'Takvime git',
    actionHref: '/calendar',
  },
]
