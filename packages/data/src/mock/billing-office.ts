/**
 * Mock seed: atolye-admin (emlak ofisi) billing.
 * - 1 ofis aboneliği (Pro plan, 5 koltuk)
 * - 18 e-fatura
 * - 1 billing profile (vergi & adres)
 * Tutarlar **kuruş**.
 */

import type { BillingProfile, Invoice, OfficeSubscription } from '../types/billing'

const OFFICE = 'office-001'
const VAT_RATE = 0.20

function iso(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(10, 0, 0, 0)
  return d.toISOString()
}

function isoFuture(daysAhead: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  d.setHours(10, 0, 0, 0)
  return d.toISOString()
}

function calc(lineItems: Invoice['lineItems']): { subtotal: number; vatAmount: number; total: number } {
  const subtotal = lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0)
  const vatAmount = Math.round(subtotal * VAT_RATE)
  return { subtotal, vatAmount, total: subtotal + vatAmount }
}

export const OFFICE_SUBSCRIPTION: OfficeSubscription = {
  id: 'SUB-OFFICE-001',
  officeId: OFFICE,
  planId: 'plan-pro',
  planName: 'Pro',
  status: 'active',
  cycle: 'monthly',
  seats: 5,
  seatsUsed: 4,
  nextChargeAmount: 1499_00,
  nextChargeAt: isoFuture(8),
  startedAt: iso(180),
}

export const OFFICE_BILLING_PROFILE: BillingProfile = {
  id: 'BILL-OFFICE-001',
  officeId: OFFICE,
  legalName: 'Atölye Emlak ve Danışmanlık Ltd. Şti.',
  taxId: '4870123456',
  taxOffice: 'Ayvalık',
  kepAddress: 'atolye.emlak@hs01.kep.tr',
  address: 'Cunda Mahallesi, Sahil Yolu No:42',
  city: 'Balıkesir',
  district: 'Ayvalık',
  zipCode: '10405',
  email: 'fatura@atolye-emlak.com',
  phone: '+90 266 312 4242',
}

// 18 aylık fatura — son 18 ay Pro abonelik + zaman zaman ek koltuk/ilan paketi
function buildOfficeInvoices(): Invoice[] {
  const out: Invoice[] = []
  for (let i = 0; i < 18; i++) {
    const monthsAgo = i
    const dayOffset = monthsAgo * 30
    const lineItems: Invoice['lineItems'] = [
      { name: `Pro plan — aylık abonelik (${monthsAgo === 0 ? 'bu ay' : `${monthsAgo} ay önce`})`, qty: 1, unitPrice: 1249_17 },
    ]
    if (i % 4 === 0 && i > 0) {
      lineItems.push({ name: 'Ek koltuk paketi (1 ay)', qty: 1, unitPrice: 199_17 })
    }
    if (i % 5 === 1) {
      lineItems.push({ name: 'Premium ilan paketi (10 adet)', qty: 1, unitPrice: 416_67 })
    }
    out.push({
      id: `INV-OFFICE-${(2000 - i).toString().padStart(4, '0')}`,
      paymentId: `PAY-OFFICE-${(2000 - i).toString().padStart(4, '0')}`,
      number: `INV-OFFICE-${(2000 - i).toString().padStart(4, '0')}`,
      vatRate: VAT_RATE,
      lineItems,
      issuedAt: iso(dayOffset),
      ...calc(lineItems),
      buyerName: OFFICE_BILLING_PROFILE.legalName,
      buyerTaxId: OFFICE_BILLING_PROFILE.taxId,
    })
  }
  return out
}

export const OFFICE_INVOICES: Invoice[] = buildOfficeInvoices()
