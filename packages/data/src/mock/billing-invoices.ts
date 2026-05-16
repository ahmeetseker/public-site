/**
 * Mock seed: bireysel kullanıcı faturaları (`/hesabim/odemeler/[id]/fatura`).
 * 3 fatura — payment id'leri ./billing-payments.ts ile senkron.
 * Tutarlar **kuruş**.
 */

import type { Invoice } from '../types/billing'

function iso(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

const VAT_RATE = 0.20

function calc(lineItems: Invoice['lineItems']): { subtotal: number; vatAmount: number; total: number } {
  const subtotal = lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0)
  const vatAmount = Math.round(subtotal * VAT_RATE)
  return { subtotal, vatAmount, total: subtotal + vatAmount }
}

const inv421: Invoice['lineItems'] = [
  { name: 'Plus üyelik — aylık abonelik', qty: 1, unitPrice: 249_17 },
]

const inv398: Invoice['lineItems'] = [
  { name: 'İlan öne çıkarma — Cunda zeytinlik (7 gün)', qty: 1, unitPrice: 40_83 },
]

const inv268: Invoice['lineItems'] = [
  { name: 'Pro üyelik — yıllık abonelik', qty: 1, unitPrice: 499_17 },
]

export const INVOICES_INDIVIDUAL: Invoice[] = [
  {
    id: 'INV-2026-0421',
    paymentId: 'PAY-2026-0421',
    number: 'INV-2026-0421',
    vatRate: VAT_RATE,
    lineItems: inv421,
    issuedAt: iso(2),
    ...calc(inv421),
    buyerName: 'Ahmet Şeker',
    buyerTaxId: '12345678901',
  },
  {
    id: 'INV-2026-0398',
    paymentId: 'PAY-2026-0398',
    number: 'INV-2026-0398',
    vatRate: VAT_RATE,
    lineItems: inv398,
    issuedAt: iso(8),
    ...calc(inv398),
    buyerName: 'Ahmet Şeker',
  },
  {
    id: 'INV-2026-0268',
    paymentId: 'PAY-2026-0268',
    number: 'INV-2026-0268',
    vatRate: VAT_RATE,
    lineItems: inv268,
    issuedAt: iso(56),
    ...calc(inv268),
    buyerName: 'Ahmet Şeker',
    buyerTaxId: '12345678901',
  },
] as const
