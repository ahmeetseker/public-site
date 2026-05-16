// Prompt Library (A06 — /prompts)

export interface PromptTemplate {
  id: string
  slug: string
  name: string
  category: 'assistant' | 'classification' | 'extraction' | 'transformation' | 'system'
  description: string
  version: number
  currentRevisionId: string
  variables: string[]  // ['{tenant_name}', '{user_role}']
  modelHints: ('claude-sonnet-4.6' | 'claude-opus-4.7' | 'gpt-4o' | 'gemini-2.5-pro')[]
  usedByTenants: number
  callsThisMonth: number
  avgTokensInput: number
  avgTokensOutput: number
  createdBy: string
  lastUpdatedISO: string
  tags: string[]
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  { id: 'p-001', slug: 'atolye-assistant-system', name: 'Atölye Asistanı — Sistem Prompt', category: 'system', description: 'TR-native emlak asistanı. Domain bilgisi (zeytinlik/imarlı/tarla) + KVKK uyarısı + tool kullanım talimatları.', version: 14, currentRevisionId: 'rev-014', variables: ['{tenant_name}', '{user_role}', '{office_specialties}'], modelHints: ['claude-sonnet-4.6'], usedByTenants: 8, callsThisMonth: 12480, avgTokensInput: 2840, avgTokensOutput: 384, createdBy: 'ahmet@turksab.com', lastUpdatedISO: '2026-05-08', tags: ['production', 'tr', 'asistan'] },
  { id: 'p-002', slug: 'listing-summary', name: 'İlan Özeti Üretici', category: 'transformation', description: 'Tapu + imar + emlak bilgisi → public ilan açıklaması.', version: 7, currentRevisionId: 'rev-007', variables: ['{listing_raw}'], modelHints: ['claude-sonnet-4.6', 'gpt-4o'], usedByTenants: 6, callsThisMonth: 842, avgTokensInput: 1240, avgTokensOutput: 380, createdBy: 'ayse@turksab.com', lastUpdatedISO: '2026-04-22', tags: ['production', 'tr'] },
  { id: 'p-003', slug: 'customer-segment-classifier', name: 'Müşteri Segment Sınıflayıcı', category: 'classification', description: 'Müşteri konuşma geçmişi + bütçe + zaman → Sıcak/Ilık/Soğuk segment.', version: 4, currentRevisionId: 'rev-004', variables: ['{conversation_history}', '{customer_meta}'], modelHints: ['claude-sonnet-4.6'], usedByTenants: 5, callsThisMonth: 248, avgTokensInput: 1840, avgTokensOutput: 124, createdBy: 'berk@turksab.com', lastUpdatedISO: '2026-04-30', tags: ['production', 'tr'] },
  { id: 'p-004', slug: 'pii-redaction', name: 'PII Maskeleyici', category: 'transformation', description: 'TR TC kimlik no, telefon, IBAN, email pattern\'leri maskeler. KVKK uyumu.', version: 12, currentRevisionId: 'rev-012', variables: ['{text}'], modelHints: ['claude-sonnet-4.6'], usedByTenants: 8, callsThisMonth: 4200, avgTokensInput: 640, avgTokensOutput: 580, createdBy: 'ahmet@turksab.com', lastUpdatedISO: '2026-05-02', tags: ['production', 'compliance', 'tr'] },
  { id: 'p-005', slug: 'sales-coach', name: 'Satış Koçu', category: 'assistant', description: 'Pipeline aşamasına göre öneriler, müşteri itirazları için TR yanıt önerileri.', version: 2, currentRevisionId: 'rev-002', variables: ['{deal_stage}', '{customer_notes}', '{office_context}'], modelHints: ['claude-opus-4.7', 'claude-sonnet-4.6'], usedByTenants: 3, callsThisMonth: 142, avgTokensInput: 2240, avgTokensOutput: 840, createdBy: 'ceren@turksab.com', lastUpdatedISO: '2026-05-05', tags: ['beta', 'tr'] },
  { id: 'p-006', slug: 'listing-extract', name: 'İlan Bilgisi Çıkarıcı', category: 'extraction', description: 'Müşteri serbest metnden ilan ID/lokasyon/tip/fiyat çıkar.', version: 9, currentRevisionId: 'rev-009', variables: ['{user_message}'], modelHints: ['claude-sonnet-4.6'], usedByTenants: 8, callsThisMonth: 8420, avgTokensInput: 1240, avgTokensOutput: 240, createdBy: 'ahmet@turksab.com', lastUpdatedISO: '2026-05-08', tags: ['production', 'tr', 'tool-use'] },
]
