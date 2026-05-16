// Super-admin platform-level mocks — Tenants.
// Platform-wide (cross-tenant) mocks — distinct from tenant-scoped data.
// Will be replaced by real APIs in I01 Tenant Lifecycle.

export interface Tenant {
  id: string
  name: string
  city: string
  plan: 'Free' | 'Pro' | 'Enterprise'
  mrr: number          // monthly recurring revenue, TL
  listingCount: number
  userCount: number
  lastActiveISO: string
  status: 'Aktif' | 'Trial' | 'Askıda' | 'Churned'
  createdISO: string
}

export const TENANTS: Tenant[] = [
  { id: 'atolye-ayv', name: 'Atölye Emlak Ayvalık', city: 'Balıkesir', plan: 'Pro', mrr: 4900, listingCount: 24, userCount: 6, lastActiveISO: '2026-05-10T14:20:00Z', status: 'Aktif', createdISO: '2024-03-12T00:00:00Z' },
  { id: 'cesme-ars', name: 'Çeşme Arsa Merkezi', city: 'İzmir', plan: 'Enterprise', mrr: 14900, listingCount: 38, userCount: 9, lastActiveISO: '2026-05-11T09:42:00Z', status: 'Aktif', createdISO: '2023-11-04T00:00:00Z' },
  { id: 'datca-koy', name: 'Datça Koy Arsa', city: 'Muğla', plan: 'Pro', mrr: 4900, listingCount: 12, userCount: 3, lastActiveISO: '2026-05-09T18:00:00Z', status: 'Aktif', createdISO: '2024-08-22T00:00:00Z' },
  { id: 'fethiye-pa', name: 'Fethiye Panorama', city: 'Muğla', plan: 'Pro', mrr: 4900, listingCount: 19, userCount: 5, lastActiveISO: '2026-05-11T06:14:00Z', status: 'Aktif', createdISO: '2024-01-18T00:00:00Z' },
  { id: 'bodrum-em', name: 'Bodrum Emlak Network', city: 'Muğla', plan: 'Enterprise', mrr: 19900, listingCount: 64, userCount: 14, lastActiveISO: '2026-05-11T11:05:00Z', status: 'Aktif', createdISO: '2023-06-30T00:00:00Z' },
  { id: 'kemer-vi', name: 'Kemer Villa Group', city: 'Antalya', plan: 'Pro', mrr: 4900, listingCount: 8, userCount: 4, lastActiveISO: '2026-05-08T22:30:00Z', status: 'Trial', createdISO: '2026-04-28T00:00:00Z' },
  { id: 'edremit-a', name: 'Edremit Arsa Ofisi', city: 'Balıkesir', plan: 'Free', mrr: 0, listingCount: 3, userCount: 2, lastActiveISO: '2026-05-05T13:10:00Z', status: 'Trial', createdISO: '2026-04-15T00:00:00Z' },
  { id: 'gocek-ya', name: 'Göcek Yat Mülk', city: 'Muğla', plan: 'Pro', mrr: 4900, listingCount: 14, userCount: 4, lastActiveISO: '2026-04-22T16:45:00Z', status: 'Askıda', createdISO: '2024-09-10T00:00:00Z' },
]

export const TOTAL_MRR = TENANTS.reduce((s, t) => s + t.mrr, 0)
export const ACTIVE_TENANT_COUNT = TENANTS.filter((t) => t.status === 'Aktif').length
