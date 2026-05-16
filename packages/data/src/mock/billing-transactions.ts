/**
 * Mock seed: bireysel kullanıcı kredi geçmişi (`/hesabim/islemler`).
 * 35 kayıt — credit (yükleme/iade) + debit (yayınlama/öne çıkarma).
 * `amount` burada **kredi adedi** (TL değil).
 */

import type { WalletTransaction, WalletTransactionReason } from '../types/billing'

function iso(daysAgo: number, hour = 12): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 30, 0, 0)
  return d.toISOString()
}

const USER = 'user-self'

interface SeedRow {
  daysAgo: number
  type: WalletTransaction['type']
  amount: number
  reason: WalletTransactionReason
  description?: string
  relatedListingId?: string
}

const ROWS: SeedRow[] = [
  { daysAgo: 1, type: 'debit', amount: 5, reason: 'listing_boost', description: 'Cunda zeytinlik — 7 gün öne çıkarma', relatedListingId: 'L-1234' },
  { daysAgo: 2, type: 'credit', amount: 100, reason: 'topup', description: '100 kredi paket yükleme' },
  { daysAgo: 3, type: 'debit', amount: 2, reason: 'listing_publish', description: 'Bodrum villa arsası ilan yayınlama', relatedListingId: 'L-1235' },
  { daysAgo: 5, type: 'debit', amount: 5, reason: 'listing_boost', description: 'Çeşme imarlı — 7 gün öne çıkarma', relatedListingId: 'L-1236' },
  { daysAgo: 7, type: 'debit', amount: 30, reason: 'subscription', description: 'Plus üyelik aylık ücreti' },
  { daysAgo: 9, type: 'debit', amount: 2, reason: 'listing_publish', description: 'Akçay merkez ilan yayınlama', relatedListingId: 'L-1237' },
  { daysAgo: 11, type: 'credit', amount: 30, reason: 'refund', description: 'Plus üyelik iadesi — kısmi' },
  { daysAgo: 13, type: 'debit', amount: 5, reason: 'listing_boost', description: 'Alaçatı bağ evi — 7 gün öne çıkarma', relatedListingId: 'L-1238' },
  { daysAgo: 14, type: 'credit', amount: 50, reason: 'topup', description: '50 kredi paket yükleme' },
  { daysAgo: 15, type: 'debit', amount: 2, reason: 'listing_publish', description: 'Urla zeytinlik ilan yayınlama', relatedListingId: 'L-1239' },
  { daysAgo: 18, type: 'debit', amount: 5, reason: 'listing_boost', description: 'Söke tarla — 7 gün öne çıkarma', relatedListingId: 'L-1240' },
  { daysAgo: 20, type: 'debit', amount: 2, reason: 'listing_publish', description: 'Havran zeytinlik ilan yayınlama', relatedListingId: 'L-1241' },
  { daysAgo: 22, type: 'credit', amount: 100, reason: 'topup', description: '100 kredi paket yükleme' },
  { daysAgo: 23, type: 'debit', amount: 5, reason: 'listing_boost', description: 'Bozburun koy — 7 gün öne çıkarma', relatedListingId: 'L-1242' },
  { daysAgo: 25, type: 'debit', amount: 2, reason: 'listing_publish', description: 'Datça arsa ilan yayınlama', relatedListingId: 'L-1243' },
  { daysAgo: 27, type: 'debit', amount: 5, reason: 'listing_boost', description: 'Foça villa — 7 gün öne çıkarma', relatedListingId: 'L-1244' },
  { daysAgo: 30, type: 'debit', amount: 30, reason: 'subscription', description: 'Plus üyelik aylık ücreti' },
  { daysAgo: 32, type: 'debit', amount: 2, reason: 'listing_publish', description: 'Kuşadası tarla ilan yayınlama', relatedListingId: 'L-1245' },
  { daysAgo: 35, type: 'debit', amount: 5, reason: 'listing_boost', description: 'Ayvalık merkez — 7 gün öne çıkarma', relatedListingId: 'L-1246' },
  { daysAgo: 37, type: 'credit', amount: 50, reason: 'topup', description: '50 kredi paket yükleme' },
  { daysAgo: 40, type: 'debit', amount: 2, reason: 'listing_publish', description: 'Marmaris arsa ilan yayınlama', relatedListingId: 'L-1247' },
  { daysAgo: 43, type: 'debit', amount: 5, reason: 'listing_boost', description: 'Selimiye koyu — 7 gün öne çıkarma', relatedListingId: 'L-1248' },
  { daysAgo: 46, type: 'debit', amount: 2, reason: 'listing_publish', description: 'Şirince zeytinlik ilan yayınlama', relatedListingId: 'L-1249' },
  { daysAgo: 49, type: 'credit', amount: 100, reason: 'topup', description: '100 kredi paket yükleme' },
  { daysAgo: 51, type: 'debit', amount: 5, reason: 'listing_boost', description: 'Karaada tarla — 7 gün öne çıkarma', relatedListingId: 'L-1250' },
  { daysAgo: 54, type: 'debit', amount: 2, reason: 'listing_publish', description: 'Akyaka arsa ilan yayınlama', relatedListingId: 'L-1251' },
  { daysAgo: 58, type: 'debit', amount: 5, reason: 'listing_boost', description: 'Gökova koy — 7 gün öne çıkarma', relatedListingId: 'L-1252' },
  { daysAgo: 62, type: 'debit', amount: 2, reason: 'listing_publish', description: 'İztuzu plajı arsa ilan yayınlama', relatedListingId: 'L-1253' },
  { daysAgo: 65, type: 'credit', amount: 50, reason: 'topup', description: '50 kredi paket yükleme' },
  { daysAgo: 68, type: 'debit', amount: 5, reason: 'listing_boost', description: 'Kalkan villa arsası — 7 gün öne çıkarma', relatedListingId: 'L-1254' },
  { daysAgo: 72, type: 'debit', amount: 2, reason: 'listing_publish', description: 'Kaş merkez ilan yayınlama', relatedListingId: 'L-1255' },
  { daysAgo: 76, type: 'debit', amount: 5, reason: 'listing_boost', description: 'Patara plajı — 7 gün öne çıkarma', relatedListingId: 'L-1256' },
  { daysAgo: 81, type: 'debit', amount: 2, reason: 'listing_publish', description: 'Demre arsa ilan yayınlama', relatedListingId: 'L-1257' },
  { daysAgo: 86, type: 'credit', amount: 100, reason: 'topup', description: '100 kredi paket yükleme' },
  { daysAgo: 92, type: 'debit', amount: 30, reason: 'subscription', description: 'Plus üyelik aylık ücreti' },
]

// Bakiye geriye doğru hesaplanır — son satır 100, ilk satır en güncel.
function buildTransactions(): WalletTransaction[] {
  let balance = 50 // başlangıç bakiyesi (en güncel)
  const out: WalletTransaction[] = []
  for (let i = 0; i < ROWS.length; i++) {
    const row = ROWS[i]
    const tx: WalletTransaction = {
      id: `TXN-${(10000 - i * 47).toString().padStart(5, '0')}`,
      userId: USER,
      type: row.type,
      amount: row.amount,
      reason: row.reason,
      balanceAfter: balance,
      createdAt: iso(row.daysAgo, 8 + (i % 12)),
      ...(row.description !== undefined ? { description: row.description } : {}),
      ...(row.relatedListingId !== undefined ? { relatedListingId: row.relatedListingId } : {}),
    }
    out.push(tx)
    // Önceki bakiye = mevcut bakiye - (credit ekledi / debit çıkardı) tersini al
    balance += row.type === 'credit' ? -row.amount : row.amount
  }
  return out
}

export const TRANSACTIONS_INDIVIDUAL: WalletTransaction[] = buildTransactions()
