export interface TeamMember {
  id: string
  name: string
  initials: string
  role: 'Patron' | 'Senior' | 'Junior'
  email: string
  phone: string
  joinedAt: string
  activeDeals: number
  online: boolean
}

export const TEAM: TeamMember[] = [
  {
    id: 'T-001',
    name: 'Ahmet Şeker',
    initials: 'AŞ',
    role: 'Patron',
    email: 'ahmet@atolye.land',
    phone: '+90 532 000 00 01',
    joinedAt: '2022-03-15',
    activeDeals: 12,
    online: true,
  },
  {
    id: 'T-002',
    name: 'Ayşe Karaca',
    initials: 'AK',
    role: 'Senior',
    email: 'ayse@atolye.land',
    phone: '+90 532 000 00 02',
    joinedAt: '2023-09-04',
    activeDeals: 9,
    online: true,
  },
  {
    id: 'T-003',
    name: 'Berk Demir',
    initials: 'BD',
    role: 'Senior',
    email: 'berk@atolye.land',
    phone: '+90 532 000 00 03',
    joinedAt: '2024-02-21',
    activeDeals: 7,
    online: false,
  },
  {
    id: 'T-004',
    name: 'Ceren Yıldız',
    initials: 'CY',
    role: 'Junior',
    email: 'ceren@atolye.land',
    phone: '+90 532 000 00 04',
    joinedAt: '2025-08-12',
    activeDeals: 6,
    online: true,
  },
]

export type IntegrationStatus = 'Bağlı' | 'Uyarı' | 'Bağlı değil'

export interface Integration {
  id: string
  name: string
  description: string
  status: IntegrationStatus
  lastSyncAt?: string
  category: 'İlan' | 'İletişim' | 'Finans' | 'Belge'
}

export const INTEGRATIONS: Integration[] = [
  {
    id: 'INT-sah',
    name: 'Sahibinden API',
    description: 'İlan yayınla, sorgu al, yanıt yaz.',
    status: 'Bağlı',
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    category: 'İlan',
  },
  {
    id: 'INT-hur',
    name: 'Hürriyet Emlak',
    description: 'İlan eş yayını ve potansiyel müşteri akışı.',
    status: 'Bağlı',
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    category: 'İlan',
  },
  {
    id: 'INT-wa',
    name: 'WhatsApp Business',
    description: 'Müşteri mesajları doğrudan panele düşer.',
    status: 'Uyarı',
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    category: 'İletişim',
  },
  {
    id: 'INT-ig',
    name: 'Instagram DM',
    description: 'Sosyal medya soruları için tek pencere.',
    status: 'Bağlı değil',
    category: 'İletişim',
  },
  {
    id: 'INT-bank',
    name: 'Banka entegrasyonu',
    description: 'Havale ve EFT bildirimleri otomatik eşleşir.',
    status: 'Bağlı',
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    category: 'Finans',
  },
  {
    id: 'INT-edevlet',
    name: 'e-Devlet kapısı',
    description: 'Tapu ve nüfus doğrulama için resmi servis.',
    status: 'Bağlı',
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    category: 'Belge',
  },
]

export type ShortcutKey =
  | 'general'
  | 'team'
  | 'integration'
  | 'security'
  | 'notifications'
  | 'billing'
  | 'workshop'

export interface ProfileShortcut {
  key: ShortcutKey
  title: string
  description: string
  badge?: string
  badgeTone?: 'emerald' | 'amber' | 'rose' | 'slate'
}

export const SHORTCUTS: ProfileShortcut[] = [
  {
    key: 'general',
    title: 'Genel ayarlar',
    description: 'Atölye adı, logo, dil, saat dilimi ve para birimi.',
  },
  {
    key: 'team',
    title: 'Ekip yönetimi',
    description: 'Üye davet et, rol değiştir, yetki gruplarını düzenle.',
    badge: `${TEAM.length} aktif`,
    badgeTone: 'slate',
  },
  {
    key: 'integration',
    title: 'Entegrasyonlar',
    description: 'Sahibinden, WhatsApp, banka, e-Devlet bağlantıları.',
    badge: `${INTEGRATIONS.filter((i) => i.status === 'Uyarı').length} uyarı`,
    badgeTone: 'amber',
  },
  {
    key: 'security',
    title: 'Güvenlik',
    description: '2FA, oturum geçmişi, IP kısıtlamaları ve yedek anahtarlar.',
    badge: '2FA açık',
    badgeTone: 'emerald',
  },
  {
    key: 'notifications',
    title: 'Bildirimler',
    description: 'E-posta, push ve SMS bildirim tercihleri.',
  },
  {
    key: 'billing',
    title: 'Faturalama',
    description: 'Abonelik, ödeme yöntemi ve geçmiş faturalar.',
    badge: 'Nisan 4.890 ₺',
    badgeTone: 'slate',
  },
]

export interface AccountPlan {
  name: string
  tier: 'Pro'
  seatsUsed: number
  seatsTotal: number
  monthlyPrice: number
  renewAt: string
}

export const ACCOUNT_PLAN: AccountPlan = {
  name: 'Atölye Pro',
  tier: 'Pro',
  seatsUsed: TEAM.length,
  seatsTotal: 8,
  monthlyPrice: 4890,
  renewAt: '2026-05-30',
}
