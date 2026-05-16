/**
 * Mock seed: Tapu OCR extract'leri (`/hesabim/tapu`).
 * 18 kayıt — listings ile bire bir eşleşme.
 *   - 3 ipotek (high severity)
 *   - 4 şerh (med severity)
 *   - 11 temiz
 *
 * Risk türleri:
 *   - ipotek: bankaya rehin (genelde yüksek tutarlı)
 *   - haciz: icra kararı (orta-yüksek risk)
 *   - şerh: tedbir/önalım hakkı (düşük-orta risk)
 *   - temiz: hiçbir risk yok (entry yine de ekleniyor — log için)
 */

import type { TapuExtract } from '../types/ai'

function iso(daysAgo: number, hour = 12): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const TAPU_EXTRACTS: TapuExtract[] = [
  // ─── İpotek (3) — high severity ────────────────────────────────────────────
  {
    id: 'tapu-001',
    listingId: '28.AY.0142',
    ada: '142',
    parsel: '18',
    alan: 1240,
    cins: 'arsa',
    imarDurumu: 'Konut + ticari, E:1.20, h_max:9.50m',
    risks: [
      {
        type: 'ipotek',
        severity: 'high',
        note: 'Garanti BBVA lehine 1.200.000 TL ipotek (12.03.2024) — satış öncesi fek gerekli',
      },
    ],
    ocrConfidence: 0.94,
    uploadedAt: iso(2, 14),
  },
  {
    id: 'tapu-002',
    listingId: '48.MR.0044',
    ada: '203',
    parsel: '7',
    alan: 1850,
    cins: 'arsa',
    imarDurumu: 'Turizm, E:0.80, h_max:12.50m',
    risks: [
      {
        type: 'ipotek',
        severity: 'high',
        note: 'Yapı Kredi Bankası lehine 2.500.000 TL ipotek (08.06.2025)',
      },
      {
        type: 'serh',
        severity: 'low',
        note: 'Komşu parsel önalım hakkı şerhi (kullanım süresi geçmiş)',
      },
    ],
    ocrConfidence: 0.88,
    uploadedAt: iso(5, 11),
  },
  {
    id: 'tapu-003',
    listingId: '48.DT.0091',
    ada: '88',
    parsel: '24',
    alan: 5400,
    cins: 'arsa',
    imarDurumu: 'Villa konut (1/2 hisse), E:0.40, h_max:6.50m',
    risks: [
      {
        type: 'ipotek',
        severity: 'high',
        note: 'İş Bankası lehine 4.800.000 TL ipotek (22.01.2025) — büyük tutar',
      },
    ],
    ocrConfidence: 0.91,
    uploadedAt: iso(8, 9),
  },

  // ─── Şerh (4) — med severity ───────────────────────────────────────────────
  {
    id: 'tapu-004',
    listingId: '09.CS.0033',
    ada: '47',
    parsel: '12',
    alan: 1450,
    cins: 'arsa',
    imarDurumu: 'Konut + ticari, E:1.50, h_max:9.50m',
    risks: [
      {
        type: 'serh',
        severity: 'med',
        note: 'Belediye geçit hakkı şerhi (kuzey sınır, 3 metre)',
      },
    ],
    ocrConfidence: 0.92,
    uploadedAt: iso(3, 16),
  },
  {
    id: 'tapu-005',
    listingId: '10.AY.0207',
    ada: '156',
    parsel: '34',
    alan: 980,
    cins: 'arsa',
    imarDurumu: 'Konut, E:1.20, h_max:6.50m',
    risks: [
      {
        type: 'serh',
        severity: 'med',
        note: 'TEDAŞ enerji hattı geçiş şerhi (güney köşe, 4m irtifak)',
      },
    ],
    ocrConfidence: 0.85,
    uploadedAt: iso(6, 10),
  },
  {
    id: 'tapu-006',
    listingId: '10.HV.0156',
    ada: '92',
    parsel: '5',
    alan: 1320,
    cins: 'arsa',
    imarDurumu: 'Konut + ticari, E:1.40, h_max:9.50m',
    risks: [
      {
        type: 'serh',
        severity: 'med',
        note: 'Komşu parsel geçit hakkı şerhi (batı sınır, 2.5 metre)',
      },
      {
        type: 'temiz',
        severity: 'low',
        note: 'İpotek/haciz kaydı yok',
      },
    ],
    ocrConfidence: 0.89,
    uploadedAt: iso(9, 14),
  },
  {
    id: 'tapu-007',
    listingId: '17.AK.0102',
    ada: '78',
    parsel: '19',
    alan: 920,
    cins: 'arsa',
    imarDurumu: 'Konut, E:1.50, h_max:9.50m',
    risks: [
      {
        type: 'serh',
        severity: 'med',
        note: 'İSKİ atık su hattı şerhi (parsel ortası, 3m irtifak)',
      },
    ],
    ocrConfidence: 0.87,
    uploadedAt: iso(11, 12),
  },

  // ─── Temiz (11) — sadece "temiz" entry ─────────────────────────────────────
  {
    id: 'tapu-008',
    listingId: '48.DT.0028',
    ada: '215',
    parsel: '8',
    alan: 2150,
    cins: 'arsa',
    imarDurumu: 'Villa konut, E:0.60, h_max:6.50m',
    risks: [{ type: 'temiz', severity: 'low', note: 'İpotek, haciz veya şerh kaydı yok' }],
    ocrConfidence: 0.96,
    uploadedAt: iso(1, 11),
  },
  {
    id: 'tapu-009',
    listingId: '09.AL.0061',
    ada: '321',
    parsel: '14',
    alan: 3200,
    cins: 'tarla',
    imarDurumu: 'Tarım vasıflı, yapılaşma yasak',
    risks: [{ type: 'temiz', severity: 'low', note: 'Tüm kayıtlar temiz' }],
    ocrConfidence: 0.93,
    uploadedAt: iso(4, 15),
  },
  {
    id: 'tapu-010',
    listingId: '09.UR.0114',
    ada: '187',
    parsel: '22',
    alan: 1820,
    cins: 'arsa',
    imarDurumu: 'Konut + ticari, E:1.20, h_max:9.50m',
    risks: [{ type: 'temiz', severity: 'low', note: 'Tüm kayıtlar temiz' }],
    ocrConfidence: 0.95,
    uploadedAt: iso(7, 13),
  },
  {
    id: 'tapu-011',
    listingId: '10.AY.0218',
    ada: '264',
    parsel: '11',
    alan: 1080,
    cins: 'arsa',
    imarDurumu: 'Konut, E:1.20, h_max:6.50m',
    risks: [{ type: 'temiz', severity: 'low', note: 'Tüm kayıtlar temiz' }],
    ocrConfidence: 0.91,
    uploadedAt: iso(10, 16),
  },
  {
    id: 'tapu-012',
    listingId: '09.SK.0301',
    ada: '195',
    parsel: '6',
    alan: 4200,
    cins: 'tarla',
    imarDurumu: 'Tarım vasıflı (zeytinlik tescili)',
    risks: [{ type: 'temiz', severity: 'low', note: 'Tüm kayıtlar temiz' }],
    ocrConfidence: 0.88,
    uploadedAt: iso(13, 10),
  },
  {
    id: 'tapu-013',
    listingId: '17.AK.0089',
    ada: '67',
    parsel: '28',
    alan: 750,
    cins: 'arsa',
    imarDurumu: 'Konut, E:1.50, h_max:9.50m',
    risks: [{ type: 'temiz', severity: 'low', note: 'Tüm kayıtlar temiz' }],
    ocrConfidence: 0.94,
    uploadedAt: iso(15, 14),
  },
  {
    id: 'tapu-014',
    listingId: '48.FT.0072',
    ada: '418',
    parsel: '3',
    alan: 1640,
    cins: 'arsa',
    imarDurumu: 'Konut + turizm, E:0.80, h_max:9.50m',
    risks: [{ type: 'temiz', severity: 'low', note: 'Tüm kayıtlar temiz' }],
    ocrConfidence: 0.92,
    uploadedAt: iso(17, 11),
  },
  {
    id: 'tapu-015',
    listingId: '10.AY.0192',
    ada: '128',
    parsel: '17',
    alan: 1280,
    cins: 'arsa',
    imarDurumu: 'Konut, E:1.20, h_max:6.50m',
    risks: [{ type: 'temiz', severity: 'low', note: 'Tüm kayıtlar temiz' }],
    ocrConfidence: 0.90,
    uploadedAt: iso(19, 9),
  },
  {
    id: 'tapu-016',
    listingId: '09.AL.0044',
    ada: '298',
    parsel: '9',
    alan: 1480,
    cins: 'arsa',
    imarDurumu: 'Konut + ticari, E:1.20, h_max:9.50m',
    risks: [{ type: 'temiz', severity: 'low', note: 'Tüm kayıtlar temiz' }],
    ocrConfidence: 0.93,
    uploadedAt: iso(21, 12),
  },
  {
    id: 'tapu-017',
    listingId: '10.AY.0231',
    ada: '174',
    parsel: '21',
    alan: 1140,
    cins: 'arsa',
    imarDurumu: 'Konut, E:1.20, h_max:6.50m',
    risks: [{ type: 'temiz', severity: 'low', note: 'Tüm kayıtlar temiz' }],
    ocrConfidence: 0.95,
    uploadedAt: iso(24, 14),
  },
  {
    id: 'tapu-018',
    listingId: '09.UR.0188',
    ada: '362',
    parsel: '4',
    alan: 4500,
    cins: 'tarla',
    imarDurumu: 'Tarım vasıflı (zeytinlik tescili)',
    risks: [{ type: 'temiz', severity: 'low', note: 'Tüm kayıtlar temiz' }],
    ocrConfidence: 0.89,
    uploadedAt: iso(28, 10),
  },
] as const
