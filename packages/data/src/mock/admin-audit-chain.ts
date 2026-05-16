/**
 * Mock seed — admin audit chain (Wave F35 / Faz 1C).
 *
 * 50 event, hash-chain'lenmiş (her event prevHash ile bir önceki event'e
 * bağlı, ilk event prevHash='GENESIS'). `mockHash()` deterministik hash
 * üretir (gerçek SHA-256 değil ama integrity verification testleri için
 * yeterli — Web Crypto API browser-only).
 *
 * Actor karması:
 *   - admin@landx.com  (~%32)
 *   - admin2@landx.com (~%18)
 *   - agent:doc-extractor (~%14)
 *   - agent:lead-scorer   (~%14)
 *   - system           (~%22)
 *
 * F35 Faz 2 `/audit-chain` route'u bu seed üzerinde:
 *   - listeleme (filter: actor / resource / date)
 *   - integrity verification (chain doğrulama)
 *   - meta inceleme (modal)
 * yapar.
 */

import type { AdminAuditEvent } from '../types/admin-agent'

interface ActionTemplate {
  actor: string
  action: string
  resourcePrefix: string
  meta?: Record<string, unknown>
}

const TEMPLATES: ReadonlyArray<ActionTemplate> = [
  { actor: 'admin@landx.com', action: 'user.login', resourcePrefix: 'session', meta: { ip: '85.103.42.18' } },
  { actor: 'admin@landx.com', action: 'listing.delete', resourcePrefix: 'listing', meta: { reason: 'spam' } },
  { actor: 'admin@landx.com', action: 'user.suspend', resourcePrefix: 'user', meta: { reason: 'KVKK ihlal şüphesi' } },
  { actor: 'admin@landx.com', action: 'workflow.approve', resourcePrefix: 'workflow', meta: { step: 'kyc-doc-review' } },
  { actor: 'admin2@landx.com', action: 'user.login', resourcePrefix: 'session', meta: { ip: '188.57.221.4' } },
  { actor: 'admin2@landx.com', action: 'billing.refund', resourcePrefix: 'payment', meta: { amount: 49000 } },
  { actor: 'admin2@landx.com', action: 'listing.feature', resourcePrefix: 'listing', meta: { duration: '7d' } },
  { actor: 'agent:doc-extractor', action: 'tapu.parse', resourcePrefix: 'document', meta: { ocrConfidence: 0.94 } },
  { actor: 'agent:doc-extractor', action: 'tapu.parse', resourcePrefix: 'document', meta: { ocrConfidence: 0.78 } },
  { actor: 'agent:lead-scorer', action: 'lead.score', resourcePrefix: 'lead', meta: { score: 84, temperature: 'hot' } },
  { actor: 'agent:lead-scorer', action: 'lead.score', resourcePrefix: 'lead', meta: { score: 32, temperature: 'cold' } },
  { actor: 'system', action: 'session.expire', resourcePrefix: 'session' },
  { actor: 'system', action: 'job.run', resourcePrefix: 'job', meta: { name: 'nightly-index-rebuild' } },
  { actor: 'system', action: 'backup.create', resourcePrefix: 'backup', meta: { sizeBytes: 12_847_200 } },
]

function pad(n: number, w: number): string {
  return String(n).padStart(w, '0')
}

function hashString(s: string): number {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 1_000_003
  return Math.abs(h)
}

/**
 * Deterministik mock hash — gerçek SHA-256 yerine basit FNV-1a + base16.
 * Aynı input → aynı çıktı. 64 karakter (SHA-256 görünümü).
 */
export function mockHash(input: string): string {
  let h = 0xcbf29ce4 // FNV-1a 32-bit init
  for (const c of input) {
    h ^= c.charCodeAt(0)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  // 8 hex'lik FNV çıktısını 8 kez tekrarlayıp ufak rotasyon → 64 karakter.
  const hex = h.toString(16).padStart(8, '0')
  let out = ''
  for (let i = 0; i < 8; i++) {
    const rotated = ((h * (i + 1)) >>> 0).toString(16).padStart(8, '0')
    out += rotated
  }
  // 64 karakter olmalı, defansif.
  return (out + hex).slice(0, 64)
}

function isoDaysAgo(days: number, secondsOffset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setSeconds(d.getSeconds() + secondsOffset)
  return d.toISOString()
}

function buildEvents(): ReadonlyArray<AdminAuditEvent> {
  const out: AdminAuditEvent[] = []
  let prevHash = 'GENESIS'

  for (let i = 1; i <= 50; i++) {
    const id = `AUD-${pad(i, 4)}`
    const tIdx = hashString(id) % TEMPLATES.length
    const template = TEMPLATES[tIdx]!
    const resourceNum = (hashString(id) % 9000) + 1000
    const resource = `${template.resourcePrefix}:${pad(resourceNum, 4)}`
    // 50 event ~ son 30 günde dağılır; daha yeni event'ler daha düşük index.
    const daysAgo = Math.floor((50 - i) * 0.6)
    const at = isoDaysAgo(daysAgo, hashString(id) % 86_400)

    const payload = `${id}|${template.actor}|${template.action}|${resource}|${at}|${prevHash}`
    const hash = mockHash(payload)

    out.push({
      id,
      actor: template.actor,
      action: template.action,
      resource,
      at,
      hash,
      prevHash,
      meta: template.meta,
    })

    prevHash = hash
  }
  return out
}

export const ADMIN_AUDIT_CHAIN: ReadonlyArray<AdminAuditEvent> = buildEvents()
