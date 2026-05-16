/**
 * Mock seed — ECA Rule Engine (Wave F36 / Faz 1).
 *
 * 15 örnek kural — landxpanelpages-main referansından türetilmiş ama
 * bizim type yapımıza adapte:
 *   - 5 listing.* event (created/updated/price_changed/viewed/status)
 *   - 4 offer.* (created/accepted/rejected ×2)
 *   - 3 user.* + tkgm.* karması
 *   - 3 system.cron.* (daily/hourly)
 *
 * Her kural 1-3 condition (AND) + 1-2 action.
 * triggerCount 0-150 random, ~30% disabled, kalan enabled.
 * lastTriggeredAt enabled + triggerCount>0 olanlar için set.
 *
 * F36 Faz 2 (`/rules` UI) bu seed üzerinde liste/detay/dry-run yapar.
 */

import type { EcaRule } from '../types/landxpanel-deepening'

const T_BASE = new Date('2026-04-01T08:00:00.000Z').getTime()

function isoOffset(daysAgo: number, hoursAgo = 0): string {
  return new Date(T_BASE - daysAgo * 86_400_000 - hoursAgo * 3_600_000).toISOString()
}

export const ECA_RULES: EcaRule[] = [
  // ── 1. listing.created — TKGM ipotek uyarısı ──
  {
    id: 'rule-001',
    name: 'TKGM İpotekli İlan Uyarısı',
    description:
      'Yeni ilan TKGM\'de ipotekli kayıtlıysa içerik moderasyon ekibine bildirim gönder.',
    event: 'listing.created',
    conditions: [
      {
        id: 'cond-001-1',
        field: 'listing.tkgmStatus',
        operator: 'eq',
        value: 'ipotekli',
      },
    ],
    actions: [
      {
        id: 'act-001-1',
        type: 'send_notification',
        params: {
          channel: 'in_app',
          recipientRole: 'moderator',
          priority: 'now',
          template: 'tkgm_ipotek_alert',
        },
      },
      {
        id: 'act-001-2',
        type: 'create_audit',
        params: { category: 'moderation', severity: 'medium' },
      },
    ],
    enabled: true,
    triggerCount: 87,
    lastTriggeredAt: isoOffset(0, 3),
    createdAt: isoOffset(45),
    updatedAt: isoOffset(12),
  },

  // ── 2. listing.created — Hisseli tarım arazisi flag ──
  {
    id: 'rule-002',
    name: 'Hisseli Tarım Arazisi Etiketle',
    description:
      'Hisseli + tarım vasıflı arazide alıcılara "hisseli" uyarı badge ekle.',
    event: 'listing.created',
    conditions: [
      {
        id: 'cond-002-1',
        field: 'listing.tapuType',
        operator: 'eq',
        value: 'hisseli',
      },
      {
        id: 'cond-002-2',
        field: 'listing.cinsi',
        operator: 'in',
        value: ['Tarla', 'Bağ', 'Bahçe'],
      },
    ],
    actions: [
      {
        id: 'act-002-1',
        type: 'update_listing_status',
        params: { addBadge: 'hisseli_uyari' },
      },
    ],
    enabled: true,
    triggerCount: 142,
    lastTriggeredAt: isoOffset(1, 6),
    createdAt: isoOffset(40),
    updatedAt: isoOffset(20),
  },

  // ── 3. listing.price_changed — anomali ──
  {
    id: 'rule-003',
    name: 'Fiyat Anomalisi Tespiti',
    description:
      'Fiyat tek seferde %20 üzerinde değiştiyse risk skoru için audit log ve operatör ekibine bildirim.',
    event: 'listing.price_changed',
    conditions: [
      {
        id: 'cond-003-1',
        field: 'listing.priceChangePct',
        operator: 'gt',
        value: 20,
      },
    ],
    actions: [
      {
        id: 'act-003-1',
        type: 'send_notification',
        params: { recipientRole: 'ops', priority: 'soon' },
      },
      {
        id: 'act-003-2',
        type: 'create_audit',
        params: { category: 'price_anomaly', severity: 'high' },
      },
    ],
    enabled: true,
    triggerCount: 31,
    lastTriggeredAt: isoOffset(2),
    createdAt: isoOffset(38),
    updatedAt: isoOffset(15),
  },

  // ── 4. listing.viewed — sıcak alıcı ──
  {
    id: 'rule-004',
    name: 'Sıcak Alıcı Bildirimi',
    description:
      'İlan 24 saat içinde 5+ kez görüntülendiyse satıcıya "ilana ilgi yüksek" bildirimi gönder.',
    event: 'listing.viewed',
    conditions: [
      {
        id: 'cond-004-1',
        field: 'listing.viewsLast24h',
        operator: 'gte',
        value: 5,
      },
    ],
    actions: [
      {
        id: 'act-004-1',
        type: 'send_email',
        params: { template: 'seller_hot_lead', priority: 'soon' },
      },
    ],
    enabled: true,
    triggerCount: 23,
    lastTriggeredAt: isoOffset(0, 8),
    createdAt: isoOffset(35),
    updatedAt: isoOffset(35),
  },

  // ── 5. listing.status_changed — eski draft ──
  {
    id: 'rule-005',
    name: 'Eski Draft İlan Hatırlatması',
    description:
      'Draft statüsünde 7 günden uzun süre kalmış ilan için satıcıya hatırlatma e-postası.',
    event: 'listing.status_changed',
    conditions: [
      {
        id: 'cond-005-1',
        field: 'listing.status',
        operator: 'eq',
        value: 'draft',
      },
      {
        id: 'cond-005-2',
        field: 'listing.daysInStatus',
        operator: 'gte',
        value: 7,
      },
    ],
    actions: [
      {
        id: 'act-005-1',
        type: 'send_email',
        params: { template: 'draft_reminder' },
      },
    ],
    enabled: false,
    triggerCount: 0,
    createdAt: isoOffset(30),
    updatedAt: isoOffset(30),
  },

  // ── 6. offer.created — yüksek teklif ──
  {
    id: 'rule-006',
    name: 'İyi Teklif Bildirimi (≥%90)',
    description:
      'Liste fiyatının %90 ve üzerinde teklif geldiğinde satıcıya öncelikli push.',
    event: 'offer.created',
    conditions: [
      {
        id: 'cond-006-1',
        field: 'offer.offerToListRatio',
        operator: 'gte',
        value: 0.9,
      },
    ],
    actions: [
      {
        id: 'act-006-1',
        type: 'send_notification',
        params: { channel: 'push', priority: 'now', template: 'good_offer' },
      },
    ],
    enabled: true,
    triggerCount: 64,
    lastTriggeredAt: isoOffset(0, 1),
    createdAt: isoOffset(32),
    updatedAt: isoOffset(8),
  },

  // ── 7. offer.created — düşük teklif spam ──
  {
    id: 'rule-007',
    name: 'Düşük Teklif Spam Koruması',
    description:
      'Aynı alıcıdan 24 saat içinde 3+ düşük teklif (≤%70) gelirse webhook ile risk ekibine ilet.',
    event: 'offer.created',
    conditions: [
      {
        id: 'cond-007-1',
        field: 'offer.offerToListRatio',
        operator: 'lte',
        value: 0.7,
      },
      {
        id: 'cond-007-2',
        field: 'offer.buyerOffers24h',
        operator: 'gte',
        value: 3,
      },
    ],
    actions: [
      {
        id: 'act-007-1',
        type: 'webhook',
        params: { url: 'https://internal/risk/spam-offer', method: 'POST' },
      },
    ],
    enabled: true,
    triggerCount: 12,
    lastTriggeredAt: isoOffset(3),
    createdAt: isoOffset(28),
    updatedAt: isoOffset(14),
  },

  // ── 8. offer.accepted — komisyon hesaplama ──
  {
    id: 'rule-008',
    name: 'Teklif Onayında Audit Kaydı',
    description:
      'Teklif kabul edildiğinde hash-chain audit log\'a kayıt düşür.',
    event: 'offer.accepted',
    conditions: [],
    actions: [
      {
        id: 'act-008-1',
        type: 'create_audit',
        params: { category: 'transaction', severity: 'low' },
      },
    ],
    enabled: true,
    triggerCount: 49,
    lastTriggeredAt: isoOffset(1, 2),
    createdAt: isoOffset(26),
    updatedAt: isoOffset(26),
  },

  // ── 9. offer.rejected — tekrar eden red ──
  {
    id: 'rule-009',
    name: 'Tekrar Eden Red Moderatör Bildirimi',
    description:
      'Satıcı 30 günde 5+ teklif reddettiyse moderatöre incele bildirimi gönder.',
    event: 'offer.rejected',
    conditions: [
      {
        id: 'cond-009-1',
        field: 'seller.rejectsLast30d',
        operator: 'gte',
        value: 5,
      },
    ],
    actions: [
      {
        id: 'act-009-1',
        type: 'send_notification',
        params: { recipientRole: 'moderator', priority: 'soon' },
      },
    ],
    enabled: false,
    triggerCount: 4,
    createdAt: isoOffset(22),
    updatedAt: isoOffset(22),
  },

  // ── 10. user.registered — KYC e-posta ──
  {
    id: 'rule-010',
    name: 'Yeni Kayıt KYC Hatırlatma',
    description:
      'Telefon-only KYC ile kayıt olan kullanıcıya tam KYC için e-posta gönder.',
    event: 'user.registered',
    conditions: [
      {
        id: 'cond-010-1',
        field: 'user.kycLevel',
        operator: 'eq',
        value: 'phone',
      },
    ],
    actions: [
      {
        id: 'act-010-1',
        type: 'send_email',
        params: { template: 'kyc_upgrade_invite' },
      },
    ],
    enabled: true,
    triggerCount: 118,
    lastTriggeredAt: isoOffset(0, 4),
    createdAt: isoOffset(50),
    updatedAt: isoOffset(2),
  },

  // ── 11. user.kyc_verified — hoşgeldin kupon ──
  {
    id: 'rule-011',
    name: 'KYC Tamamlandı Hoşgeldin Kuponu',
    description:
      'Tam KYC tamamlandığında SMS ile ilk ilan ücretsiz kuponu gönder.',
    event: 'user.kyc_verified',
    conditions: [],
    actions: [
      {
        id: 'act-011-1',
        type: 'send_sms',
        params: { template: 'kyc_welcome_coupon' },
      },
    ],
    enabled: true,
    triggerCount: 76,
    lastTriggeredAt: isoOffset(0, 5),
    createdAt: isoOffset(48),
    updatedAt: isoOffset(48),
  },

  // ── 12. tkgm.queried — yüksek frekans ──
  {
    id: 'rule-012',
    name: 'TKGM Aşırı Sorgu Tespiti',
    description:
      'Aynı kullanıcı 1 saat içinde 10+ TKGM sorgusu yaparsa rate-limit hatırlatma.',
    event: 'tkgm.queried',
    conditions: [
      {
        id: 'cond-012-1',
        field: 'user.tkgmQueriesLastHour',
        operator: 'gte',
        value: 10,
      },
    ],
    actions: [
      {
        id: 'act-012-1',
        type: 'send_notification',
        params: { recipientRole: 'self', priority: 'soon' },
      },
      {
        id: 'act-012-2',
        type: 'create_audit',
        params: { category: 'rate_limit', severity: 'low' },
      },
    ],
    enabled: false,
    triggerCount: 2,
    createdAt: isoOffset(18),
    updatedAt: isoOffset(18),
  },

  // ── 13. tkgm.updated — şerh/tedbir flag değişti ──
  {
    id: 'rule-013',
    name: 'TKGM Şerh/Tedbir Flag Değişikliği',
    description:
      'Parselin TKGM durumu temiz → şerh/tedbir/haciz geçtiyse ilana otomatik uyarı badge.',
    event: 'tkgm.updated',
    conditions: [
      {
        id: 'cond-013-1',
        field: 'tkgm.newStatus',
        operator: 'in',
        value: ['serh', 'tedbir', 'haciz'],
      },
    ],
    actions: [
      {
        id: 'act-013-1',
        type: 'update_listing_status',
        params: { addBadge: 'tkgm_kisitlama' },
      },
      {
        id: 'act-013-2',
        type: 'send_notification',
        params: { recipientRole: 'seller', priority: 'now' },
      },
    ],
    enabled: true,
    triggerCount: 18,
    lastTriggeredAt: isoOffset(4),
    createdAt: isoOffset(20),
    updatedAt: isoOffset(10),
  },

  // ── 14. system.cron.daily — eski ilan süresi ──
  {
    id: 'rule-014',
    name: 'Günlük Sona Erecek İlan Hatırlatma',
    description:
      'Süresi 7 gün içinde dolacak aktif ilanlar için satıcıya yenile e-postası.',
    event: 'system.cron.daily',
    conditions: [
      {
        id: 'cond-014-1',
        field: 'listing.daysToExpire',
        operator: 'lte',
        value: 7,
      },
      {
        id: 'cond-014-2',
        field: 'listing.status',
        operator: 'eq',
        value: 'active',
      },
    ],
    actions: [
      {
        id: 'act-014-1',
        type: 'send_email',
        params: { template: 'listing_expiry_reminder' },
      },
    ],
    enabled: true,
    triggerCount: 152,
    lastTriggeredAt: isoOffset(0, 12),
    createdAt: isoOffset(55),
    updatedAt: isoOffset(5),
  },

  // ── 15. system.cron.hourly — orphan draft cleanup ──
  {
    id: 'rule-015',
    name: 'Saatlik Yetim Draft Temizleme',
    description:
      'Hiç görüntü eklenmemiş ve 48 saatten eski draft\'ları otomatik sil.',
    event: 'system.cron.hourly',
    conditions: [
      {
        id: 'cond-015-1',
        field: 'listing.imageCount',
        operator: 'eq',
        value: 0,
      },
      {
        id: 'cond-015-2',
        field: 'listing.hoursInDraft',
        operator: 'gt',
        value: 48,
      },
    ],
    actions: [
      {
        id: 'act-015-1',
        type: 'update_listing_status',
        params: { newStatus: 'deleted', reason: 'orphan_cleanup' },
      },
      {
        id: 'act-015-2',
        type: 'create_audit',
        params: { category: 'cleanup', severity: 'low' },
      },
    ],
    enabled: false,
    triggerCount: 0,
    createdAt: isoOffset(15),
    updatedAt: isoOffset(15),
  },
]
