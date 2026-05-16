/**
 * Mock seed — agent memory layers (Wave F35 / Faz 1C).
 *
 * 4 layer × ~25 entry = ~100 entry. Her entry 8-boyut deterministik embedding
 * (UMAP/t-SNE projeksiyonu için). Aynı entry id → aynı embedding.
 *
 * Layer'lar:
 *   - short      → son 24 saat conversation context (FIFO ~25)
 *   - long       → kullanıcı tercihleri / bilinen pattern'ler
 *   - episodic   → spesifik etkileşim anıları (siteye giriş, ilan oluşturma)
 *   - procedural → tool kullanım kuralları, format kalıpları
 *
 * F35 Faz 2 `/agent-memory` route'u bu seed üzerinde:
 *   - layer kartları + entry listesi
 *   - UMAP scatter plot (8d → 2d projeksiyon)
 *   - entry detail modal (content + meta)
 * yapar.
 */

import type { AgentMemoryEntry, AgentMemoryLayer, AgentMemoryLayerType } from '../types/admin-agent'

interface LayerConfig {
  type: AgentMemoryLayerType
  description: string
  count: number
  contentTemplates: ReadonlyArray<string>
  agentIds: ReadonlyArray<string>
}

const LAYER_CONFIGS: ReadonlyArray<LayerConfig> = [
  {
    type: 'short',
    description: 'Son 24 saat conversation context — FIFO buffer.',
    count: 25,
    contentTemplates: [
      'Kullanıcı Çeşme Alaçatı imarlı arsa sordu (5-8M TL)',
      'Tapu OCR sonucu güven 0.94, ipotek yok',
      'Arama: "ayvalık deniz manzaralı" 47 sonuç',
      'Lead form: ad="Burcu", phone, intent=buy',
      'Filter: region=datca, price<6M, area>1500m²',
      'Reply: "İmarlı parsellerin %18\'i son 6 ayda satıldı"',
      'Tool call: get_market_report(region="cesme")',
      'Tool result: report id=MR-2026-05-001',
      'Kullanıcı bütçeyi 12M\'ye yükseltti',
      'Yeni mesaj: "Banka kredisi alabilir miyim?"',
    ],
    agentIds: ['agent:chat-default', 'agent:lead-scorer'],
  },
  {
    type: 'long',
    description: 'Kullanıcı tercihleri ve uzun vadeli pattern\'ler.',
    count: 25,
    contentTemplates: [
      'USR-001: Ege bölgesi tercih, 5-15M TL bütçe segmenti',
      'USR-001: Hafta sonu görüşme tercihi (Cmt 10:00-13:00)',
      'USR-024: Kurumsal yatırımcı (5+ dönüm parsel arar)',
      'USR-024: Tapu sorgulamasını her zaman talep eder',
      'USR-058: Banka kredisi ile alım yapıyor (Garanti BBVA)',
      'Pattern: Çeşme aramaları %42 hafta sonu yapılıyor',
      'Pattern: Tapu OCR güveni 0.85 altında ise %78 reddedilir',
      'Pattern: Lead\'ler ortalama 14 günde dönüştürülür (broker)',
      'Pattern: Datça bölgesi imar planı değişikliği yakın',
      'Pattern: KVKK silme talepleri %95 7 gün içinde gelir',
    ],
    agentIds: ['agent:chat-default', 'agent:lead-scorer', 'agent:doc-extractor'],
  },
  {
    type: 'episodic',
    description: 'Spesifik etkileşim anıları — onboarding, ilk arama, tetikleyici olaylar.',
    count: 25,
    contentTemplates: [
      'USR-024 ilk girişi: 2025-11-04, kayıt sebebi "broker davet"',
      'LST-9821 oluşturuldu: 2026-04-12, owner USR-024',
      'USR-058 KYC reddi: 2026-05-10, sebep "selfie uyumsuz"',
      'Workflow WF-RFD-0001 başladı: müşteri itiraz e-postası',
      'Tapu OCR hatası: TAP-2026-04-128, görüntü blur',
      'Lead BR-LD-0042 hot → cold (3 gün sessizlik)',
      'Listing LST-3214 boost: 7 gün featured',
      'Dispute DSP-0042 açıldı: komisyon yanlış hesaplandı',
      'Audit verify ilk başarılı çalışma: 2026-03-01',
      'Yeni broker ofisi onaylandı: Bodrum Türkbükü',
    ],
    agentIds: ['agent:chat-default', 'agent:doc-extractor'],
  },
  {
    type: 'procedural',
    description: 'Tool kullanım kuralları ve format kalıpları.',
    count: 25,
    contentTemplates: [
      'Tapu OCR: güven < 0.7 ise her zaman manuel doğrulama iste',
      'Lead score: AI score 75+ → temperature=hot, broker bildir',
      'Search: filter\'a region eklemeden önce slug doğrula',
      'Refund: tutar > 10K TL → manager onayı zorunlu',
      'KVKK delete: PII mask sonrası audit log eklemek zorunlu',
      'Chat: Türkçe yanıt — kullanıcı İngilizce yazsa bile',
      'Format: para = formatTL(amount) — ham sayı gösterme',
      'Format: tarih = timeAgo() veya formatDate — ISO ham gösterme',
      'Tool retry: max 3 deneme, exponential backoff (1s, 2s, 4s)',
      'Audit: chain integrity hatası → derhal admin\'e bildir',
    ],
    agentIds: ['agent:chat-default', 'agent:lead-scorer', 'agent:doc-extractor'],
  },
]

function pad(n: number, w: number): string {
  return String(n).padStart(w, '0')
}

function hashString(s: string): number {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 1_000_003
  return Math.abs(h)
}

function isoHoursAgo(hours: number): string {
  const d = new Date()
  d.setHours(d.getHours() - hours)
  return d.toISOString()
}

/** 8-boyut deterministik embedding (-1..1 aralığı). */
function buildEmbedding(seed: string): ReadonlyArray<number> {
  const base = hashString(seed)
  const out: number[] = []
  for (let i = 0; i < 8; i++) {
    const j = (base + i * 131) % 1_000_003
    const norm = (j % 2001 - 1000) / 1000
    out.push(Number(norm.toFixed(3)))
  }
  return out
}

function buildEntries(cfg: LayerConfig): ReadonlyArray<AgentMemoryEntry> {
  const out: AgentMemoryEntry[] = []
  for (let i = 1; i <= cfg.count; i++) {
    const id = `MEM-${cfg.type.toUpperCase().slice(0, 4)}-${pad(i, 3)}`
    const h = hashString(id)
    const content = cfg.contentTemplates[h % cfg.contentTemplates.length]!
    const agentId = cfg.agentIds[(h >> 3) % cfg.agentIds.length]!
    // Short layer son 24 saat, long/episodic/procedural daha eski.
    const ageHours =
      cfg.type === 'short'
        ? h % 24
        : cfg.type === 'long'
          ? 24 + (h % (24 * 60))
          : cfg.type === 'episodic'
            ? 24 + (h % (24 * 90))
            : 24 + (h % (24 * 30))
    const accessAge = h % Math.max(1, ageHours)
    const tokens = 32 + (h % 96)
    const accessCount = 1 + (h % 14)

    out.push({
      id,
      layerType: cfg.type,
      content,
      embedding: buildEmbedding(id),
      tokens,
      createdAt: isoHoursAgo(ageHours),
      lastAccessedAt: isoHoursAgo(accessAge),
      accessCount,
      agentId,
    })
  }
  return out
}

function buildLayers(): ReadonlyArray<AgentMemoryLayer> {
  return LAYER_CONFIGS.map((cfg): AgentMemoryLayer => {
    const entries = buildEntries(cfg)
    const totalTokens = entries.reduce((sum, e) => sum + e.tokens, 0)
    return {
      type: cfg.type,
      description: cfg.description,
      entries,
      totalTokens,
    }
  })
}

export const AGENT_MEMORY_LAYERS: ReadonlyArray<AgentMemoryLayer> = buildLayers()
