/**
 * Mock seed: identity domain.
 * - 6 public profile (`/profil/[username]`)
 * - 14 KYC review item (super-admin: 8 bireysel + 6 kurumsal)
 * - 3 verification request (bireysel)
 * - 1 ofis verification (atolye-admin)
 * - 1 bildirim tercih matrisi (bireysel)
 */

import type {
  KycReviewItem,
  NotificationChannelMatrix,
  NotificationEventType,
  NotificationPrefs,
  OfficeVerification,
  OfficeVerificationDoc,
  PublicProfile,
  VerificationRequest,
} from '../types/identity'

function iso(daysAgo: number, hour = 12): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

function isoYears(yearsAgo: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - yearsAgo)
  return d.toISOString()
}

const USER = 'user-self'

// ─── Public profiles ─────────────────────────────────────────────────────────

export const PUBLIC_PROFILES: PublicProfile[] = [
  {
    username: 'mert-soydan',
    displayName: 'Mert Soydan',
    avatar: '/avatars/mert.jpg',
    memberSince: isoYears(4),
    rating: 4.8,
    reviewCount: 47,
    activeListings: 6,
    bio: 'Ayvalık & Cunda bölgesinde 8 yıllık emlakçı. Sahil parselleri uzmanı.',
    city: 'Balıkesir',
    verified: true,
    listings: [
      { id: 'L-1234', title: 'Cunda denize 80m imarlı parsel', city: 'Balıkesir', district: 'Ayvalık', price: 5800000 },
      { id: 'L-1235', title: 'Sarımsaklı zeytinlik 4 dönüm', city: 'Balıkesir', district: 'Ayvalık', price: 2400000 },
      { id: 'L-1236', title: 'Altınova villa arsası', city: 'Balıkesir', district: 'Altınova', price: 1800000 },
    ],
    reviews: [
      { id: 'r-001', rating: 5, comment: 'Süper hızlı dönüş, dürüst yaklaşım.', authorName: 'Selin K.', at: iso(15) },
      { id: 'r-002', rating: 5, comment: 'Tapuya kadar her aşamada destek oldu.', authorName: 'Hakan Y.', at: iso(38) },
      { id: 'r-003', rating: 4, comment: 'Görüşmeler güzel ama trafik yoğun.', authorName: 'Pınar A.', at: iso(72) },
    ],
  },
  {
    username: 'esra-karatas',
    displayName: 'Esra Karataş',
    memberSince: isoYears(2),
    rating: 4.6,
    reviewCount: 23,
    activeListings: 4,
    bio: 'Çeşme yarımadası — imarlı parsel & villa arsası odaklı.',
    city: 'İzmir',
    verified: true,
    listings: [
      { id: 'L-2001', title: 'Alaçatı bağ evi imarlı parsel', city: 'İzmir', district: 'Çeşme', price: 11000000 },
      { id: 'L-2002', title: 'Şifne koyu villa arsası', city: 'İzmir', district: 'Çeşme', price: 8500000 },
    ],
    reviews: [
      { id: 'r-101', rating: 5, comment: 'Mükemmel iletişim.', authorName: 'Burhan K.', at: iso(20) },
      { id: 'r-102', rating: 4, comment: 'Belge süreci hızlı.', authorName: 'Lale E.', at: iso(45) },
    ],
  },
  {
    username: 'tunca-berksoy',
    displayName: 'Tunç Berksoy',
    memberSince: isoYears(6),
    rating: 4.9,
    reviewCount: 89,
    activeListings: 12,
    bio: 'Akçay-Edremit körfezi emlak danışmanı. 12 yıllık tecrübe.',
    city: 'Balıkesir',
    verified: true,
    listings: [
      { id: 'L-3001', title: 'Akçay merkez deniz manzaralı arsa', city: 'Balıkesir', district: 'Edremit', price: 4200000 },
      { id: 'L-3002', title: 'Güre kaplıcalar arsa', city: 'Balıkesir', district: 'Edremit', price: 1900000 },
    ],
    reviews: [
      { id: 'r-201', rating: 5, comment: 'Profesyonel.', authorName: 'Mehmet Y.', at: iso(10) },
    ],
  },
  {
    username: 'pinar-akin',
    displayName: 'Pınar Akın',
    memberSince: isoYears(1),
    rating: 4.3,
    reviewCount: 8,
    activeListings: 3,
    bio: 'Urla & Seferihisar bölgesi.',
    city: 'İzmir',
    verified: false,
    listings: [
      { id: 'L-4001', title: 'Urla zeytinlik 3 dönüm', city: 'İzmir', district: 'Urla', price: 3100000 },
    ],
    reviews: [],
  },
  {
    username: 'deniz-yildirim',
    displayName: 'Deniz Yıldırım',
    memberSince: isoYears(3),
    rating: 4.7,
    reviewCount: 34,
    activeListings: 7,
    bio: 'Bozburun & Marmaris koy parselleri.',
    city: 'Muğla',
    verified: true,
    listings: [
      { id: 'L-5001', title: 'Bozburun koyu villa arsası', city: 'Muğla', district: 'Marmaris', price: 22000000 },
      { id: 'L-5002', title: 'Selimiye koyu tarla', city: 'Muğla', district: 'Marmaris', price: 6800000 },
    ],
    reviews: [
      { id: 'r-401', rating: 5, comment: 'Koy parselleri konusunda en iyisi.', authorName: 'Atilla K.', at: iso(25) },
    ],
  },
  {
    username: 'lale-erdem',
    displayName: 'Lale Erdem',
    memberSince: isoYears(2),
    rating: 4.5,
    reviewCount: 18,
    activeListings: 5,
    bio: 'Havran & Burhaniye zeytinlikleri.',
    city: 'Balıkesir',
    verified: true,
    listings: [
      { id: 'L-6001', title: 'Havran zeytinlik 5 dönüm', city: 'Balıkesir', district: 'Havran', price: 1750000 },
    ],
    reviews: [
      { id: 'r-501', rating: 5, comment: 'Hızlı ve dürüst.', authorName: 'Filiz U.', at: iso(8) },
    ],
  },
]

// ─── Verification requests (bireysel) ────────────────────────────────────────

export const VERIFICATION_REQUESTS: VerificationRequest[] = [
  {
    id: 'VRF-2026-001',
    userId: USER,
    type: 'email',
    status: 'verified',
    sentAt: iso(180),
    verifiedAt: iso(180),
    targetMasked: 'ah***@gmail.com',
  },
  {
    id: 'VRF-2026-002',
    userId: USER,
    type: 'phone',
    status: 'verified',
    sentAt: iso(60),
    verifiedAt: iso(60),
    targetMasked: '+90 *** *** 12 34',
  },
  {
    id: 'VRF-2026-003',
    userId: USER,
    type: 'identity',
    status: 'pending',
    sentAt: iso(2),
    targetMasked: 'TC *** *** 4242',
  },
]

// ─── Notification preferences (bireysel) ─────────────────────────────────────

const allChannels = (email: boolean, push: boolean, sms: boolean): NotificationChannelMatrix => ({
  email,
  push,
  sms,
})

export const NOTIFICATION_PREFS: NotificationPrefs = {
  userId: USER,
  matrix: {
    new_message: allChannels(true, true, false),
    listing_view: allChannels(false, true, false),
    price_change: allChannels(true, true, false),
    favorite: allChannels(false, true, false),
    appointment: allChannels(true, true, true),
    offer: allChannels(true, true, true),
    payment: allChannels(true, false, true),
    security: allChannels(true, true, true),
  } satisfies Record<NotificationEventType, NotificationChannelMatrix>,
  quietHours: '22:00-08:00',
}

// ─── Office verification (atolye-admin) ──────────────────────────────────────

const OFFICE = 'office-001'

const officeDocs: OfficeVerificationDoc[] = [
  {
    id: 'DOC-OFFICE-001',
    type: 'kep_address',
    fileName: 'kep-belgesi.pdf',
    status: 'approved',
    uploadedAt: iso(45),
    reviewedAt: iso(43),
  },
  {
    id: 'DOC-OFFICE-002',
    type: 'tax_certificate',
    fileName: 'vergi-levhasi-2026.pdf',
    status: 'approved',
    uploadedAt: iso(45),
    reviewedAt: iso(44),
  },
  {
    id: 'DOC-OFFICE-003',
    type: 'broker_license',
    fileName: 'broker-yetki-belgesi.pdf',
    status: 'pending',
    uploadedAt: iso(3),
  },
]

export const OFFICE_VERIFICATION: OfficeVerification = {
  id: 'OFV-001',
  officeId: OFFICE,
  overallStatus: 'pending_review',
  documents: officeDocs,
  updatedAt: iso(3),
}

// ─── KYC review queue (super-admin) ──────────────────────────────────────────

const KYC_TENANTS = ['t-atolye-001', 't-egemar-002', 't-cunda-003', 't-aliaga-004', 't-bodrum-005']

interface KycSeed {
  daysAgo: number
  kind: 'individual' | 'office'
  subjectName: string
  documentCount: number
}

const KYC_ROWS: KycSeed[] = [
  // 8 bireysel
  { daysAgo: 0, kind: 'individual', subjectName: 'Mert Soydan', documentCount: 2 },
  { daysAgo: 0, kind: 'individual', subjectName: 'Esra Karataş', documentCount: 3 },
  { daysAgo: 1, kind: 'individual', subjectName: 'Tunç Berksoy', documentCount: 2 },
  { daysAgo: 1, kind: 'individual', subjectName: 'Pınar Akın', documentCount: 1 },
  { daysAgo: 2, kind: 'individual', subjectName: 'Deniz Yıldırım', documentCount: 3 },
  { daysAgo: 3, kind: 'individual', subjectName: 'Lale Erdem', documentCount: 2 },
  { daysAgo: 4, kind: 'individual', subjectName: 'Burhan Kaynak', documentCount: 2 },
  { daysAgo: 6, kind: 'individual', subjectName: 'Selin Aksoy', documentCount: 3 },
  // 6 kurumsal
  { daysAgo: 0, kind: 'office', subjectName: 'Atölye Emlak Ltd.', documentCount: 4 },
  { daysAgo: 1, kind: 'office', subjectName: 'EgeMar Gayrimenkul A.Ş.', documentCount: 4 },
  { daysAgo: 2, kind: 'office', subjectName: 'Cunda Sahil Emlak Ltd.', documentCount: 3 },
  { daysAgo: 3, kind: 'office', subjectName: 'Aliağa Endüstri Arsa Ltd.', documentCount: 4 },
  { daysAgo: 5, kind: 'office', subjectName: 'Bodrum Yarımada Emlak A.Ş.', documentCount: 4 },
  { daysAgo: 7, kind: 'office', subjectName: 'Çeşme Premium Gayrimenkul', documentCount: 3 },
]

export const KYC_QUEUE: KycReviewItem[] = KYC_ROWS.map((row, i) => ({
  id: `KYC-${(3000 - i * 11).toString().padStart(5, '0')}`,
  kind: row.kind,
  subjectId: row.kind === 'individual' ? `user-kyc-${(1000 + i).toString()}` : `office-kyc-${(100 + i).toString()}`,
  subjectName: row.subjectName,
  tenantId: KYC_TENANTS[i % KYC_TENANTS.length],
  status: 'pending',
  submittedAt: iso(row.daysAgo, 9 + (i % 8)),
  documentCount: row.documentCount,
}))
