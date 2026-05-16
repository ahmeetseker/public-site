// Memory Layer (A04 — /memory-layer)

export interface MemoryRecord {
  id: string
  tenantId: string
  agentId: string
  scope: 'session' | 'persistent' | 'shared'
  category: 'preference' | 'fact' | 'feedback' | 'project' | 'reference'
  content: string
  embedding: { dim: number; model: string }
  createdISO: string
  lastAccessedISO: string
  accessCount: number
}

export const MEMORY_RECORDS: MemoryRecord[] = [
  { id: 'mem-1', tenantId: 'atolye-ayv', agentId: 'atolye-assistant', scope: 'persistent', category: 'preference', content: 'Kullanıcı Ahmet Cunda parselleri ile daha çok ilgileniyor, Datça ile değil.', embedding: { dim: 1536, model: 'text-embedding-3-small' }, createdISO: '2026-04-22T10:00:00Z', lastAccessedISO: '2026-05-11T08:30:00Z', accessCount: 24 },
  { id: 'mem-2', tenantId: 'cesme-ars', agentId: 'sales-coach', scope: 'persistent', category: 'fact', content: 'Alaçatı içi ticari imarlı parsellerin m² fiyatı 18.000 TL ortalama.', embedding: { dim: 1536, model: 'text-embedding-3-small' }, createdISO: '2026-04-08T15:20:00Z', lastAccessedISO: '2026-05-10T14:15:00Z', accessCount: 38 },
  { id: 'mem-3', tenantId: 'atolye-ayv', agentId: 'atolye-assistant', scope: 'session', category: 'project', content: 'Şu an müşteri X için Cunda denize 80m parseline aktif teklif var.', embedding: { dim: 1536, model: 'text-embedding-3-small' }, createdISO: '2026-05-11T07:00:00Z', lastAccessedISO: '2026-05-11T11:30:00Z', accessCount: 6 },
  { id: 'mem-4', tenantId: 'bodrum-em', agentId: 'sales-coach', scope: 'persistent', category: 'feedback', content: 'Geçen ay Yalıkavak villa sunumlarında "fotoğraf kalitesi düşük" şikayeti 3 müşteriden geldi.', embedding: { dim: 1536, model: 'text-embedding-3-small' }, createdISO: '2026-04-14T09:10:00Z', lastAccessedISO: '2026-05-09T11:05:00Z', accessCount: 19 },
  { id: 'mem-5', tenantId: 'cesme-ars', agentId: 'atolye-assistant', scope: 'shared', category: 'reference', content: "Çeşme'de tarla vasfından imarlıya dönüşüm prosedürü 8-14 ay; tapu harcı %4.", embedding: { dim: 1536, model: 'text-embedding-3-small' }, createdISO: '2026-03-02T12:00:00Z', lastAccessedISO: '2026-05-11T07:42:00Z', accessCount: 64 },
  { id: 'mem-6', tenantId: 'datca-koy', agentId: 'atolye-assistant', scope: 'persistent', category: 'preference', content: 'Müşteri "Kale Bey" sadece deniz görür parsel istiyor, iç bölge gösterme.', embedding: { dim: 1536, model: 'text-embedding-3-small' }, createdISO: '2026-04-30T14:00:00Z', lastAccessedISO: '2026-05-10T16:20:00Z', accessCount: 11 },
  { id: 'mem-7', tenantId: 'fethiye-pa', agentId: 'sales-coach', scope: 'persistent', category: 'fact', content: 'Ölüdeniz hattı imarlı arsa stoğu 2025 sonunda %38 azaldı.', embedding: { dim: 1536, model: 'text-embedding-3-small' }, createdISO: '2026-02-18T10:00:00Z', lastAccessedISO: '2026-05-07T09:30:00Z', accessCount: 27 },
  { id: 'mem-8', tenantId: 'bodrum-em', agentId: 'atolye-assistant', scope: 'session', category: 'project', content: "Aktif arama: Türkbükü 1500m² + deniz görür + 8M TL altı; 4 sonuç var.", embedding: { dim: 1536, model: 'text-embedding-3-small' }, createdISO: '2026-05-11T08:00:00Z', lastAccessedISO: '2026-05-11T11:50:00Z', accessCount: 4 },
  { id: 'mem-9', tenantId: 'cesme-ars', agentId: 'sales-coach', scope: 'shared', category: 'reference', content: "İmar planı değişikliği başvurusu için belediye randevu süresi ortalama 3 hafta.", embedding: { dim: 1536, model: 'text-embedding-3-small' }, createdISO: '2026-01-25T11:00:00Z', lastAccessedISO: '2026-05-08T15:10:00Z', accessCount: 52 },
  { id: 'mem-10', tenantId: 'atolye-ayv', agentId: 'sales-coach', scope: 'persistent', category: 'feedback', content: 'Sahibinden export sonrası ilanların %12\'si 24 saat içinde "fiyat çok yüksek" mesajı aldı — pricing review öner.', embedding: { dim: 1536, model: 'text-embedding-3-small' }, createdISO: '2026-04-02T13:30:00Z', lastAccessedISO: '2026-05-05T10:00:00Z', accessCount: 14 },
]

export const MEMORY_STATS = {
  totalRecords: 12480,
  totalTenants: 8,
  totalAgents: 14,
  storageGB: 4.2,
  monthlyWritesK: 28.4,
  monthlyReadsK: 142.8,
}
