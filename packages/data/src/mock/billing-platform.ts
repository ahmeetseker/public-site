/**
 * Mock seed: super-admin (LandX ops) — cross-tenant ödemeler + refund kuyruğu.
 * - 80 cross-tenant ödeme (5 tenant × ~16 kayıt)
 * - 6 bekleyen refund request
 * Tutarlar **kuruş**.
 */

import type { Payment, PaymentMethod, PaymentStatus, RefundRequest } from '../types/billing'

function iso(daysAgo: number, hourOffset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(8 + hourOffset, 15, 0, 0)
  return d.toISOString()
}

const TENANTS = ['t-atolye-001', 't-egemar-002', 't-cunda-003', 't-aliaga-004', 't-bodrum-005']
const USERS = [
  'user-pln-1001',
  'user-pln-1002',
  'user-pln-1003',
  'user-pln-1004',
  'user-pln-1005',
  'user-pln-1006',
  'user-pln-1007',
  'user-pln-1008',
]

const STATUS_DIST: PaymentStatus[] = [
  ...Array<PaymentStatus>(11).fill('success'),
  ...Array<PaymentStatus>(2).fill('pending'),
  ...Array<PaymentStatus>(2).fill('failed'),
  ...Array<PaymentStatus>(1).fill('refunded'),
]

const METHODS: PaymentMethod[] = ['card', 'card', 'card', 'bank', 'wallet']

const DESCRIPTIONS = [
  'Pro plan — aylık abonelik',
  'Plus plan — aylık abonelik',
  'İlan öne çıkarma paketi',
  'Premium ilan paketi (10 adet)',
  'Ek koltuk paketi (1 ay)',
  'Kredi yükleme — 100 TL',
  'Kredi yükleme — 50 TL',
  'İşletme plan — yıllık abonelik',
  'Vitrin reklam paketi',
  'API kullanım ücreti',
]

const AMOUNTS = [29_00, 49_00, 99_00, 199_00, 299_00, 599_00, 1499_00, 4999_00]

function buildPlatformPayments(): Payment[] {
  const out: Payment[] = []
  for (let i = 0; i < 80; i++) {
    const tenant = TENANTS[i % TENANTS.length]
    const user = USERS[i % USERS.length]
    const status = STATUS_DIST[i % STATUS_DIST.length]
    const method = METHODS[i % METHODS.length]
    const description = DESCRIPTIONS[i % DESCRIPTIONS.length]
    const amount = AMOUNTS[i % AMOUNTS.length]
    const daysAgo = Math.floor(i / 4) + (i % 3)

    const payment: Payment = {
      id: `PLN-PAY-${(50000 - i * 17).toString().padStart(6, '0')}`,
      userId: user,
      tenantId: tenant,
      amount,
      currency: 'TRY',
      status,
      method,
      description,
      createdAt: iso(daysAgo, i % 12),
    }
    if (status === 'success' || status === 'refunded') {
      payment.invoiceId = `INV-PLN-${(50000 - i * 17).toString().padStart(6, '0')}`
    }
    if (method === 'card') {
      payment.cardMasked = i % 3 === 0 ? '**** 4242' : i % 3 === 1 ? '**** 8821' : '**** 1199'
    }
    out.push(payment)
  }
  return out
}

export const PAYMENTS_PLATFORM: Payment[] = buildPlatformPayments()

export const REFUND_REQUESTS: RefundRequest[] = [
  {
    id: 'RFD-2026-0042',
    paymentId: 'PLN-PAY-049983',
    userId: 'user-pln-1002',
    amount: 299_00,
    reason: 'Ödediğim ay üyeliği aktive olmadı.',
    status: 'pending',
    requestedAt: iso(1),
  },
  {
    id: 'RFD-2026-0041',
    paymentId: 'PLN-PAY-049966',
    userId: 'user-pln-1003',
    amount: 49_00,
    reason: 'İlan öne çıkarma yanlış ilanda çalıştı.',
    status: 'pending',
    requestedAt: iso(2),
  },
  {
    id: 'RFD-2026-0040',
    paymentId: 'PLN-PAY-049932',
    userId: 'user-pln-1004',
    amount: 1499_00,
    reason: 'Kurumsal hesabımı kapattım, kalan ay için kısmi iade istiyorum.',
    status: 'pending',
    requestedAt: iso(3),
  },
  {
    id: 'RFD-2026-0039',
    paymentId: 'PLN-PAY-049898',
    userId: 'user-pln-1005',
    amount: 99_00,
    reason: 'Kredi yükleme iki kere düştü, ikinci tahsilatın iadesi.',
    status: 'pending',
    requestedAt: iso(4),
  },
  {
    id: 'RFD-2026-0038',
    paymentId: 'PLN-PAY-049864',
    userId: 'user-pln-1006',
    amount: 199_00,
    reason: 'Yanlış paket aldım, doğru paket için iade gerekli.',
    status: 'pending',
    requestedAt: iso(5),
  },
  {
    id: 'RFD-2026-0037',
    paymentId: 'PLN-PAY-049813',
    userId: 'user-pln-1007',
    amount: 599_00,
    reason: 'Hizmet sağlanmadı — sahibinden sync 2 hafta down.',
    status: 'pending',
    requestedAt: iso(7),
  },
] as const
