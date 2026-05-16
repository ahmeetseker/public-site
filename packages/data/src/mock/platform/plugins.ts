// Plugin Registry (K01)

export interface PlatformPlugin {
  id: string
  slug: string
  name: string
  version: string
  category: 'integration' | 'analytics' | 'compliance' | 'workflow' | 'ai'
  author: string
  status: 'active' | 'draft' | 'deprecated' | 'security-review'
  installedTenants: number
  lastUpdatedISO: string
  rating: number
  reviewCount: number
  description: string
}

export const PLATFORM_PLUGINS: PlatformPlugin[] = [
  { id: 'pl-sahibinden-sync', slug: 'sahibinden-sync', name: 'Sahibinden Sync', version: '1.4.2', category: 'integration', author: 'arsam.net', status: 'active', installedTenants: 6, lastUpdatedISO: '2026-04-22', rating: 4.6, reviewCount: 42, description: 'sahibinden.com\'a ilan otomatik yayını. KVKK uyumlu, 2-yönlü sync.' },
  { id: 'pl-claude-assistant', slug: 'claude-assistant', name: 'Claude Asistan', version: '0.9.1', category: 'ai', author: 'Anthropic', status: 'active', installedTenants: 8, lastUpdatedISO: '2026-05-08', rating: 4.9, reviewCount: 87, description: 'Atölye asistan motoru. İlan, müşteri, satış sorularına TR yanıt.' },
  { id: 'pl-tapu-takip', slug: 'tapu-takip', name: 'Tapu Takip', version: '2.1.0', category: 'workflow', author: 'arsam.net', status: 'active', installedTenants: 5, lastUpdatedISO: '2026-03-30', rating: 4.4, reviewCount: 21, description: 'Tapu randevu, harç hesaplama, satış sonrası takip otomasyonu.' },
  { id: 'pl-kvkk-vault', slug: 'kvkk-vault', name: 'KVKK Vault', version: '1.0.4', category: 'compliance', author: 'arsam.net', status: 'active', installedTenants: 7, lastUpdatedISO: '2026-04-12', rating: 4.7, reviewCount: 14, description: 'KVKK 11/13/15. madde otomatik yanıt, retention politikaları, açık rıza.' },
  { id: 'pl-listing-analytics', slug: 'listing-analytics', name: 'İlan Analytics+', version: '3.2.1', category: 'analytics', author: 'arsam.net', status: 'active', installedTenants: 4, lastUpdatedISO: '2026-04-05', rating: 4.3, reviewCount: 28, description: 'İlan görüntülenme, dönüşüm funnel, heatmap, A/B test sonuçları.' },
  { id: 'pl-whatsapp-bot', slug: 'whatsapp-bot', name: 'WhatsApp Bot', version: '0.6.0', category: 'integration', author: 'meta-partner-tr', status: 'security-review', installedTenants: 0, lastUpdatedISO: '2026-05-04', rating: 0, reviewCount: 0, description: 'WhatsApp Business API entegrasyonu. PII redaction güvenlik incelemesinde.' },
  { id: 'pl-imza-trk', slug: 'imza-trk', name: 'e-İmza TR', version: '1.2.0', category: 'workflow', author: 'kamusm-partner', status: 'draft', installedTenants: 0, lastUpdatedISO: '2026-05-09', rating: 0, reviewCount: 0, description: 'KamuSM ile uyumlu e-imza akışı. Sözleşme imza süreçleri için.' },
  { id: 'pl-old-sync', slug: 'old-sync-v1', name: 'Eski Sync v1', version: '0.4.5', category: 'integration', author: 'arsam.net', status: 'deprecated', installedTenants: 1, lastUpdatedISO: '2025-11-20', rating: 3.2, reviewCount: 8, description: 'Eski sync motoru. Sahibinden Sync v1 ile değiştirildi — 2026-Q3 kapatılacak.' },
]
