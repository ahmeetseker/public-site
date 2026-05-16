/**
 * Mock seed: bireysel kullanıcı ödemeleri (`/hesabim/odemeler`).
 * 12 kayıt — karışık status (success/pending/failed/refunded).
 * Tutarlar **kuruş** cinsinden (199_00 = 199 TL).
 */

import type { Payment } from '../types/billing'

function iso(daysAgo: number, hour = 12): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

const USER = 'user-self'

export const PAYMENTS_INDIVIDUAL: Payment[] = [
  {
    id: 'PAY-2026-0421',
    userId: USER,
    amount: 299_00,
    currency: 'TRY',
    status: 'success',
    method: 'card',
    description: 'Plus üyelik — aylık',
    createdAt: iso(2),
    invoiceId: 'INV-2026-0421',
    cardMasked: '**** 4242',
  },
  {
    id: 'PAY-2026-0398',
    userId: USER,
    amount: 49_00,
    currency: 'TRY',
    status: 'success',
    method: 'card',
    description: 'İlan öne çıkarma — Cunda zeytinlik',
    createdAt: iso(8),
    invoiceId: 'INV-2026-0398',
    cardMasked: '**** 4242',
  },
  {
    id: 'PAY-2026-0376',
    userId: USER,
    amount: 99_00,
    currency: 'TRY',
    status: 'success',
    method: 'wallet',
    description: 'Kredi yükleme — 100 TL paket',
    createdAt: iso(14),
    invoiceId: 'INV-2026-0376',
  },
  {
    id: 'PAY-2026-0354',
    userId: USER,
    amount: 199_00,
    currency: 'TRY',
    status: 'refunded',
    method: 'card',
    description: 'Plus üyelik — iptal edildi',
    createdAt: iso(28),
    invoiceId: 'INV-2026-0354',
    cardMasked: '**** 4242',
  },
  {
    id: 'PAY-2026-0331',
    userId: USER,
    amount: 49_00,
    currency: 'TRY',
    status: 'success',
    method: 'card',
    description: 'İlan öne çıkarma — Bodrum villa arsası',
    createdAt: iso(35),
    invoiceId: 'INV-2026-0331',
    cardMasked: '**** 8821',
  },
  {
    id: 'PAY-2026-0312',
    userId: USER,
    amount: 19_00,
    currency: 'TRY',
    status: 'success',
    method: 'wallet',
    description: 'İlan yayınlama — temel paket',
    createdAt: iso(42),
  },
  {
    id: 'PAY-2026-0287',
    userId: USER,
    amount: 299_00,
    currency: 'TRY',
    status: 'failed',
    method: 'card',
    description: 'Plus üyelik — başarısız (yetersiz bakiye)',
    createdAt: iso(48),
    cardMasked: '**** 4242',
  },
  {
    id: 'PAY-2026-0268',
    userId: USER,
    amount: 599_00,
    currency: 'TRY',
    status: 'success',
    method: 'bank',
    description: 'Pro üyelik — yıllık (kurumsal trial)',
    createdAt: iso(56),
    invoiceId: 'INV-2026-0268',
  },
  {
    id: 'PAY-2026-0241',
    userId: USER,
    amount: 49_00,
    currency: 'TRY',
    status: 'success',
    method: 'card',
    description: 'İlan öne çıkarma — Çeşme imarlı',
    createdAt: iso(63),
    invoiceId: 'INV-2026-0241',
    cardMasked: '**** 8821',
  },
  {
    id: 'PAY-2026-0220',
    userId: USER,
    amount: 49_00,
    currency: 'TRY',
    status: 'pending',
    method: 'bank',
    description: 'İlan öne çıkarma — havale doğrulama bekliyor',
    createdAt: iso(1, 9),
  },
  {
    id: 'PAY-2026-0198',
    userId: USER,
    amount: 99_00,
    currency: 'TRY',
    status: 'success',
    method: 'wallet',
    description: 'Kredi yükleme — 100 TL paket',
    createdAt: iso(78),
    invoiceId: 'INV-2026-0198',
  },
  {
    id: 'PAY-2026-0152',
    userId: USER,
    amount: 19_00,
    currency: 'TRY',
    status: 'success',
    method: 'wallet',
    description: 'İlan yayınlama — temel paket',
    createdAt: iso(92),
  },
] as const
