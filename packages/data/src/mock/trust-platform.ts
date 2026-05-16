/**
 * Mock seed: super-admin (LandX trust ops) — moderation queue.
 * 25 öğe — 10 queued (bekleyen), 8 in_review/resolved (çözülmüş), 7 dismissed (reddedilmiş).
 */

import type { ModerationItem, ModerationItemKind, ModerationStatus } from '../types/trust'

function iso(daysAgo: number, hourOffset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(8 + hourOffset, 30, 0, 0)
  return d.toISOString()
}

const TENANTS = ['t-atolye-001', 't-egemar-002', 't-cunda-003', 't-aliaga-004', 't-bodrum-005']

interface SeedRow {
  daysAgo: number
  kind: ModerationItemKind
  status: ModerationStatus
  severity: 'low' | 'medium' | 'high'
  summary: string
  refId: string
  resolutionNote?: string
}

const ROWS: SeedRow[] = [
  // Queued (10)
  { daysAgo: 0, kind: 'report', status: 'queued', severity: 'high', summary: 'Sahte ilan — tapu doğrulanamadı', refId: 'RPT-2026-0098' },
  { daysAgo: 0, kind: 'dispute', status: 'queued', severity: 'high', summary: 'Dolandırıcılık şüphesi — kaparo iadesi yapılmadı', refId: 'DSP-2026-0008' },
  { daysAgo: 1, kind: 'flagged_listing', status: 'queued', severity: 'medium', summary: 'Yanıltıcı fiyat — piyasanın 5x altı', refId: 'L-3142' },
  { daysAgo: 1, kind: 'report', status: 'queued', severity: 'medium', summary: 'Tekrar eden ilan — 3 farklı kullanıcıdan aynı parsel', refId: 'RPT-2026-0097' },
  { daysAgo: 2, kind: 'user_flag', status: 'queued', severity: 'high', summary: 'Şüpheli hesap — 14 KYC belgesi reddedildi', refId: 'user-pln-1004' },
  { daysAgo: 2, kind: 'report', status: 'queued', severity: 'low', summary: 'Yanlış kategori — tarla "imarlı" olarak listelenmiş', refId: 'RPT-2026-0096' },
  { daysAgo: 3, kind: 'dispute', status: 'queued', severity: 'medium', summary: 'Görüntü uyumsuzluğu — başka mülkün fotoğrafı', refId: 'DSP-2026-0007' },
  { daysAgo: 3, kind: 'flagged_listing', status: 'queued', severity: 'low', summary: 'Açıklama eksik — 30 karakterden az', refId: 'L-2987' },
  { daysAgo: 4, kind: 'report', status: 'queued', severity: 'medium', summary: 'Uygunsuz dil — başlıkta hakaret', refId: 'RPT-2026-0095' },
  { daysAgo: 5, kind: 'user_flag', status: 'queued', severity: 'medium', summary: 'Otomatik bot şüphesi — 50+ ilan/saat', refId: 'user-pln-1006' },

  // Resolved (8)
  { daysAgo: 6, kind: 'report', status: 'resolved', severity: 'high', summary: 'Sahte ilan kaldırıldı', refId: 'RPT-2026-0094', resolutionNote: 'İlan kaldırıldı, satıcı uyarı aldı.' },
  { daysAgo: 7, kind: 'dispute', status: 'resolved', severity: 'medium', summary: 'Anlaşmazlık çözüldü — kısmi iade', refId: 'DSP-2026-0006', resolutionNote: 'Kısmi iade yapıldı, tarafların onayı alındı.' },
  { daysAgo: 8, kind: 'flagged_listing', status: 'resolved', severity: 'low', summary: 'Yanlış kategori düzeltildi', refId: 'L-2854', resolutionNote: 'Kategori "tarım" olarak güncellendi.' },
  { daysAgo: 9, kind: 'user_flag', status: 'resolved', severity: 'medium', summary: 'KYC kuyruğa alındı, hesap askıya alındı', refId: 'user-pln-1009', resolutionNote: 'Hesap KYC tamamlanana kadar askıda.' },
  { daysAgo: 11, kind: 'report', status: 'resolved', severity: 'high', summary: 'Dolandırıcılık raporu — hesap kapatıldı', refId: 'RPT-2026-0091', resolutionNote: 'Hesap kalıcı kapatıldı, yasal süreç başlatıldı.' },
  { daysAgo: 13, kind: 'dispute', status: 'resolved', severity: 'high', summary: 'Tapu uyumsuzluğu — para iade edildi', refId: 'DSP-2026-0005', resolutionNote: 'Alıcıya tam iade yapıldı.' },
  { daysAgo: 16, kind: 'flagged_listing', status: 'resolved', severity: 'medium', summary: 'Yanlış lokasyon koordinatı düzeltildi', refId: 'L-2611', resolutionNote: 'Koordinatlar satıcı ile birlikte güncellendi.' },
  { daysAgo: 21, kind: 'report', status: 'resolved', severity: 'low', summary: 'Açıklama uygunsuz dilden temizlendi', refId: 'RPT-2026-0084', resolutionNote: 'Açıklama satıcı tarafından düzenlendi.' },

  // Dismissed (7)
  { daysAgo: 9, kind: 'report', status: 'dismissed', severity: 'low', summary: 'Asılsız şikayet — ilan kuralllara uygun', refId: 'RPT-2026-0090', resolutionNote: 'Şikayetin dayanağı bulunamadı.' },
  { daysAgo: 12, kind: 'dispute', status: 'dismissed', severity: 'medium', summary: 'Pazarlık fiyatı kayıt altında değil', refId: 'DSP-2026-0002', resolutionNote: 'Sözlü pazarlık iddiası belgelenememiş.' },
  { daysAgo: 14, kind: 'flagged_listing', status: 'dismissed', severity: 'low', summary: 'Açıklama yeterince detaylı', refId: 'L-2398', resolutionNote: 'Otomatik flag yanlış pozitif.' },
  { daysAgo: 17, kind: 'user_flag', status: 'dismissed', severity: 'medium', summary: 'Bot iddiası — gerçek kullanıcı', refId: 'user-pln-1010', resolutionNote: 'Manuel doğrulama tamamlandı.' },
  { daysAgo: 19, kind: 'report', status: 'dismissed', severity: 'low', summary: 'Tekrar eden ilan — farklı parseller', refId: 'RPT-2026-0078', resolutionNote: 'İlanlar farklı koordinatlardaymış.' },
  { daysAgo: 24, kind: 'dispute', status: 'dismissed', severity: 'low', summary: 'Yanlış lokasyon iddiası', refId: 'DSP-2026-0004', resolutionNote: 'Koordinatlar doğru.' },
  { daysAgo: 30, kind: 'report', status: 'dismissed', severity: 'low', summary: 'Fiyat şikayeti — piyasa koşulu', refId: 'RPT-2026-0064', resolutionNote: 'Fiyat satıcının takdirinde, kural ihlali yok.' },
]

export const MODERATION_QUEUE: ModerationItem[] = ROWS.map((row, i) => {
  const tenantId = TENANTS[i % TENANTS.length]
  const item: ModerationItem = {
    id: `MOD-${(2000 - i * 13).toString().padStart(5, '0')}`,
    kind: row.kind,
    refId: row.refId,
    tenantId,
    summary: row.summary,
    severity: row.severity,
    status: row.status,
    createdAt: iso(row.daysAgo, i % 12),
  }
  if (row.status === 'in_review' || row.status === 'resolved') {
    item.assignedTo = `ops-${(i % 3) + 1}`
  }
  if (row.status === 'resolved' || row.status === 'dismissed') {
    item.resolvedAt = iso(Math.max(0, row.daysAgo - 1), (i + 3) % 12)
    if (row.resolutionNote !== undefined) item.resolutionNote = row.resolutionNote
  }
  return item
})
