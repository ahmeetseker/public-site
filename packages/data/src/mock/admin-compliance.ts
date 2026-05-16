/**
 * Mock seed — Compliance control matrisi (Wave F36 / Faz 1).
 *
 * 53 control, 5 framework:
 *   - KVKK 12 (m.4-m.16)
 *   - VERBİS 8 (kayıt zorunluluğu, başvuru)
 *   - GDPR 10 (Art.5-Art.35)
 *   - SOC2 15 (CC1-CC9 trust services criteria)
 *   - ISO27001 8 (Annex A clauses)
 *
 * Status karması (genel):
 *   - ~40% compliant
 *   - ~30% partial
 *   - ~25% missing
 *   - ~5% not_applicable
 *
 * `LANDX_COMPLIANCE_POSTURE` her framework için aggregate skor sağlar.
 * scorePct = compliant + 0.5 * partial / (total - not_applicable) * 100.
 *
 * Export ad'ları `LANDX_*` ve `Landx*` prefix'li — `mock/platform/compliance`
 * dosyasındaki eski `COMPLIANCE_CONTROLS`/`ComplianceControl` ile name
 * collision'ı önler.
 *
 * F36 Faz 2 (`/compliance` UI) bu seed üzerinde:
 *   - Framework filter + posture cards
 *   - Control matrix render
 *   - Evidence upload (mutation)
 * yapar.
 */

import type {
  LandxComplianceControl,
  LandxCompliancePosture,
  LandxComplianceEvidence,
  LandxComplianceStatus,
} from '../types/landxpanel-deepening'

const T_NOW = new Date('2026-05-15T10:00:00.000Z').getTime()

function isoOffset(days: number): string {
  return new Date(T_NOW - days * 86_400_000).toISOString()
}

function isoFuture(days: number): string {
  return new Date(T_NOW + days * 86_400_000).toISOString()
}

interface CtrlSeed {
  id: string
  framework: LandxComplianceControl['framework']
  controlNo: string
  name: string
  description: string
  status: LandxComplianceStatus
  owner: string
  evidence?: LandxComplianceEvidence[]
  reviewedDaysAgo: number
  nextDueDays: number
}

const SEEDS: ReadonlyArray<CtrlSeed> = [
  // ── KVKK (12) ──────────────────────────────────────────────────────────
  { id: 'ctrl-001', framework: 'KVKK', controlNo: 'KVKK-4', name: 'Genel İlkeler', description: 'Hukuka uygunluk, dürüstlük, doğruluk, belirli amaçla işleme.', status: 'compliant', owner: 'Compliance Team', evidence: [{ type: 'document', reference: 'kvkk-genel-ilkeler-v3.pdf', uploadedAt: isoOffset(45) }, { type: 'attestation', reference: 'Hukuk müşaviri 2026-03 onay', uploadedAt: isoOffset(60) }], reviewedDaysAgo: 30, nextDueDays: 60 },
  { id: 'ctrl-002', framework: 'KVKK', controlNo: 'KVKK-5', name: 'Açık Rıza', description: 'Veri sahibinin özgür iradeyle açık rıza beyanı.', status: 'compliant', owner: 'Product Team', evidence: [{ type: 'config', reference: 'consent-banner-config-prod', uploadedAt: isoOffset(20) }], reviewedDaysAgo: 15, nextDueDays: 75 },
  { id: 'ctrl-003', framework: 'KVKK', controlNo: 'KVKK-6', name: 'Özel Nitelikli Veri', description: 'Sağlık, cinsel hayat, biyometrik verilerde ek koruma.', status: 'partial', owner: 'Security', evidence: [{ type: 'document', reference: 'ozel-nitelik-prosedur.pdf', uploadedAt: isoOffset(90) }], reviewedDaysAgo: 90, nextDueDays: 0 },
  { id: 'ctrl-004', framework: 'KVKK', controlNo: 'KVKK-7', name: 'Silme/Yok Etme', description: 'Verinin işlenme amacının ortadan kalkması halinde silme.', status: 'partial', owner: 'Engineering', reviewedDaysAgo: 60, nextDueDays: 30 },
  { id: 'ctrl-005', framework: 'KVKK', controlNo: 'KVKK-8', name: 'Aktarım', description: 'Yurt içi ve dışı veri aktarım kontrolü.', status: 'compliant', owner: 'Compliance Team', evidence: [{ type: 'document', reference: 'aktarim-prosedur.pdf', uploadedAt: isoOffset(40) }], reviewedDaysAgo: 40, nextDueDays: 50 },
  { id: 'ctrl-006', framework: 'KVKK', controlNo: 'KVKK-9', name: 'Yurt Dışı Aktarım', description: 'AB ülkeleri dışına aktarımda Kurul izni veya BCR.', status: 'missing', owner: 'Legal', reviewedDaysAgo: 120, nextDueDays: -30 },
  { id: 'ctrl-007', framework: 'KVKK', controlNo: 'KVKK-10', name: 'Aydınlatma Yükümlülüğü', description: 'Veri sahibine işleme amacı, alıcı, hak bilgilendirme.', status: 'compliant', owner: 'Product Team', evidence: [{ type: 'document', reference: 'aydinlatma-metni-v5.pdf', uploadedAt: isoOffset(10) }], reviewedDaysAgo: 10, nextDueDays: 80 },
  { id: 'ctrl-008', framework: 'KVKK', controlNo: 'KVKK-11', name: 'Veri Sahibi Hakları', description: 'Erişim, düzeltme, silme, itiraz başvuruları.', status: 'compliant', owner: 'Compliance Team', evidence: [{ type: 'audit', reference: 'DSAR-FY25-Q4-audit', uploadedAt: isoOffset(25) }], reviewedDaysAgo: 25, nextDueDays: 65 },
  { id: 'ctrl-009', framework: 'KVKK', controlNo: 'KVKK-12', name: 'Veri Güvenliği', description: 'Teknik ve idari tedbirler.', status: 'partial', owner: 'Security', evidence: [{ type: 'config', reference: 'encryption-policy.yml', uploadedAt: isoOffset(50) }], reviewedDaysAgo: 50, nextDueDays: 40 },
  { id: 'ctrl-010', framework: 'KVKK', controlNo: 'KVKK-13', name: 'İhlal Bildirim', description: '72 saat içinde Kurul\'a bildirim.', status: 'compliant', owner: 'Security', evidence: [{ type: 'document', reference: 'ihlal-mudahale-plani.pdf', uploadedAt: isoOffset(35) }], reviewedDaysAgo: 35, nextDueDays: 55 },
  { id: 'ctrl-011', framework: 'KVKK', controlNo: 'KVKK-15', name: 'Sicil Kaydı', description: 'Veri Sorumluları Sicili kayıt.', status: 'missing', owner: 'Compliance Team', reviewedDaysAgo: 180, nextDueDays: -90 },
  { id: 'ctrl-012', framework: 'KVKK', controlNo: 'KVKK-16', name: 'Suç ve Cezalar', description: 'İdari para cezası riski izleme.', status: 'not_applicable', owner: 'Legal', reviewedDaysAgo: 90, nextDueDays: 90 },

  // ── VERBİS (8) ─────────────────────────────────────────────────────────
  { id: 'ctrl-013', framework: 'VERBİS', controlNo: 'VRB-1', name: 'Sicil Kaydı', description: 'Veri Sorumluları Sicili\'ne kayıt yükümlülüğü.', status: 'compliant', owner: 'Compliance Team', evidence: [{ type: 'document', reference: 'VERBIS-sicil-no-12345.pdf', uploadedAt: isoOffset(200) }], reviewedDaysAgo: 60, nextDueDays: 305 },
  { id: 'ctrl-014', framework: 'VERBİS', controlNo: 'VRB-2', name: 'İrtibat Kişisi', description: 'Atanmış irtibat kişisi bilgisinin güncelliği.', status: 'compliant', owner: 'Compliance Team', evidence: [{ type: 'document', reference: 'irtibat-kisi-2026.pdf', uploadedAt: isoOffset(15) }], reviewedDaysAgo: 15, nextDueDays: 350 },
  { id: 'ctrl-015', framework: 'VERBİS', controlNo: 'VRB-3', name: 'İşleme Amaçları', description: 'Tüm işleme amaçları sicilde beyan.', status: 'partial', owner: 'Compliance Team', reviewedDaysAgo: 100, nextDueDays: 20 },
  { id: 'ctrl-016', framework: 'VERBİS', controlNo: 'VRB-4', name: 'Veri Kategorileri', description: 'İşlenen veri kategorileri sicil güncellemesi.', status: 'partial', owner: 'Compliance Team', reviewedDaysAgo: 100, nextDueDays: 20 },
  { id: 'ctrl-017', framework: 'VERBİS', controlNo: 'VRB-5', name: 'Veri Sahibi Grupları', description: 'Veri sahibi kategorileri (müşteri/çalışan/tedarikçi).', status: 'compliant', owner: 'Compliance Team', evidence: [{ type: 'document', reference: 'veri-sahibi-grupları.xlsx', uploadedAt: isoOffset(120) }], reviewedDaysAgo: 50, nextDueDays: 130 },
  { id: 'ctrl-018', framework: 'VERBİS', controlNo: 'VRB-6', name: 'Saklama Süreleri', description: 'Kategori bazlı saklama süresi politikası.', status: 'missing', owner: 'Compliance Team', reviewedDaysAgo: 150, nextDueDays: -60 },
  { id: 'ctrl-019', framework: 'VERBİS', controlNo: 'VRB-7', name: 'Aktarım Bilgisi', description: 'Yurt içi/dışı aktarım sicil beyan.', status: 'compliant', owner: 'Compliance Team', evidence: [{ type: 'document', reference: 'aktarim-listesi.pdf', uploadedAt: isoOffset(80) }], reviewedDaysAgo: 80, nextDueDays: 100 },
  { id: 'ctrl-020', framework: 'VERBİS', controlNo: 'VRB-8', name: 'Teknik/İdari Tedbir', description: 'Sicil için tedbir özeti beyanı.', status: 'partial', owner: 'Security', reviewedDaysAgo: 70, nextDueDays: 20 },

  // ── GDPR (10) ──────────────────────────────────────────────────────────
  { id: 'ctrl-021', framework: 'GDPR', controlNo: 'Art.5', name: 'Principles of Processing', description: 'Lawfulness, fairness, transparency, purpose limitation.', status: 'compliant', owner: 'Compliance Team', evidence: [{ type: 'document', reference: 'gdpr-principles-policy.pdf', uploadedAt: isoOffset(60) }], reviewedDaysAgo: 60, nextDueDays: 305 },
  { id: 'ctrl-022', framework: 'GDPR', controlNo: 'Art.6', name: 'Lawful Basis', description: '6 lawful bases for processing.', status: 'compliant', owner: 'Legal', evidence: [{ type: 'document', reference: 'lawful-basis-matrix.xlsx', uploadedAt: isoOffset(45) }], reviewedDaysAgo: 45, nextDueDays: 320 },
  { id: 'ctrl-023', framework: 'GDPR', controlNo: 'Art.7', name: 'Consent', description: 'Conditions for valid consent.', status: 'partial', owner: 'Product Team', reviewedDaysAgo: 90, nextDueDays: 30 },
  { id: 'ctrl-024', framework: 'GDPR', controlNo: 'Art.13', name: 'Information to Data Subject', description: 'Privacy notice content requirements.', status: 'compliant', owner: 'Product Team', evidence: [{ type: 'document', reference: 'privacy-notice-en-v3.html', uploadedAt: isoOffset(20) }], reviewedDaysAgo: 20, nextDueDays: 345 },
  { id: 'ctrl-025', framework: 'GDPR', controlNo: 'Art.15', name: 'Right of Access', description: 'Data subject access request fulfillment.', status: 'compliant', owner: 'Compliance Team', evidence: [{ type: 'audit', reference: 'DSAR-2026-Q1', uploadedAt: isoOffset(40) }], reviewedDaysAgo: 40, nextDueDays: 50 },
  { id: 'ctrl-026', framework: 'GDPR', controlNo: 'Art.17', name: 'Right to Erasure', description: 'Right to be forgotten implementation.', status: 'partial', owner: 'Engineering', reviewedDaysAgo: 70, nextDueDays: 20 },
  { id: 'ctrl-027', framework: 'GDPR', controlNo: 'Art.25', name: 'Data Protection by Design', description: 'Privacy by design and by default.', status: 'partial', owner: 'Engineering', reviewedDaysAgo: 100, nextDueDays: 10 },
  { id: 'ctrl-028', framework: 'GDPR', controlNo: 'Art.30', name: 'Records of Processing', description: 'ROPA documentation.', status: 'missing', owner: 'Compliance Team', reviewedDaysAgo: 200, nextDueDays: -100 },
  { id: 'ctrl-029', framework: 'GDPR', controlNo: 'Art.33', name: 'Breach Notification', description: '72-hour breach notification to supervisory authority.', status: 'compliant', owner: 'Security', evidence: [{ type: 'document', reference: 'breach-runbook-v4.md', uploadedAt: isoOffset(30) }], reviewedDaysAgo: 30, nextDueDays: 60 },
  { id: 'ctrl-030', framework: 'GDPR', controlNo: 'Art.35', name: 'DPIA', description: 'Data Protection Impact Assessment.', status: 'missing', owner: 'Legal', reviewedDaysAgo: 250, nextDueDays: -150 },

  // ── SOC2 (15) ──────────────────────────────────────────────────────────
  { id: 'ctrl-031', framework: 'SOC2', controlNo: 'CC1.1', name: 'Control Environment', description: 'Demonstrates commitment to integrity and ethical values.', status: 'compliant', owner: 'CISO', evidence: [{ type: 'document', reference: 'code-of-conduct-v2.pdf', uploadedAt: isoOffset(120) }], reviewedDaysAgo: 60, nextDueDays: 305 },
  { id: 'ctrl-032', framework: 'SOC2', controlNo: 'CC1.4', name: 'Workforce Competence', description: 'Hiring and training procedures.', status: 'compliant', owner: 'HR', evidence: [{ type: 'document', reference: 'training-matrix-q1.xlsx', uploadedAt: isoOffset(40) }], reviewedDaysAgo: 40, nextDueDays: 50 },
  { id: 'ctrl-033', framework: 'SOC2', controlNo: 'CC2.1', name: 'Information Quality', description: 'Information quality for decision making.', status: 'partial', owner: 'CISO', reviewedDaysAgo: 80, nextDueDays: 10 },
  { id: 'ctrl-034', framework: 'SOC2', controlNo: 'CC3.1', name: 'Risk Assessment', description: 'Specifies objectives to identify risks.', status: 'partial', owner: 'CISO', reviewedDaysAgo: 100, nextDueDays: -10 },
  { id: 'ctrl-035', framework: 'SOC2', controlNo: 'CC4.1', name: 'Monitoring Activities', description: 'Ongoing and separate evaluations.', status: 'compliant', owner: 'SecOps', evidence: [{ type: 'config', reference: 'siem-rules.yml', uploadedAt: isoOffset(15) }], reviewedDaysAgo: 15, nextDueDays: 75 },
  { id: 'ctrl-036', framework: 'SOC2', controlNo: 'CC5.1', name: 'Logical Access', description: 'Logical access security controls.', status: 'compliant', owner: 'SecOps', evidence: [{ type: 'config', reference: 'iam-policy.json', uploadedAt: isoOffset(25) }], reviewedDaysAgo: 25, nextDueDays: 65 },
  { id: 'ctrl-037', framework: 'SOC2', controlNo: 'CC6.1', name: 'Logical Access — Auth', description: 'Authentication mechanisms.', status: 'compliant', owner: 'SecOps', evidence: [{ type: 'audit', reference: 'pentest-2026-Q1.pdf', uploadedAt: isoOffset(50) }], reviewedDaysAgo: 50, nextDueDays: 40 },
  { id: 'ctrl-038', framework: 'SOC2', controlNo: 'CC6.7', name: 'Data Transmission', description: 'Encryption in transit (TLS 1.2+).', status: 'compliant', owner: 'SecOps', evidence: [{ type: 'config', reference: 'tls-config.conf', uploadedAt: isoOffset(20) }], reviewedDaysAgo: 20, nextDueDays: 70 },
  { id: 'ctrl-039', framework: 'SOC2', controlNo: 'CC7.1', name: 'Vulnerability Mgmt', description: 'System vulnerabilities detection.', status: 'partial', owner: 'SecOps', reviewedDaysAgo: 35, nextDueDays: 55 },
  { id: 'ctrl-040', framework: 'SOC2', controlNo: 'CC7.2', name: 'Anomaly Detection', description: 'Monitor system anomalies.', status: 'partial', owner: 'SecOps', reviewedDaysAgo: 35, nextDueDays: 55 },
  { id: 'ctrl-041', framework: 'SOC2', controlNo: 'CC7.4', name: 'Incident Response', description: 'Incident response plan.', status: 'compliant', owner: 'SecOps', evidence: [{ type: 'document', reference: 'IR-runbook-v6.md', uploadedAt: isoOffset(30) }], reviewedDaysAgo: 30, nextDueDays: 60 },
  { id: 'ctrl-042', framework: 'SOC2', controlNo: 'CC8.1', name: 'Change Management', description: 'Change control procedures.', status: 'missing', owner: 'Engineering', reviewedDaysAgo: 180, nextDueDays: -90 },
  { id: 'ctrl-043', framework: 'SOC2', controlNo: 'CC9.1', name: 'Business Continuity', description: 'BCP/DR plans tested.', status: 'missing', owner: 'CISO', reviewedDaysAgo: 220, nextDueDays: -130 },
  { id: 'ctrl-044', framework: 'SOC2', controlNo: 'CC9.2', name: 'Vendor Mgmt', description: 'Third-party risk management.', status: 'partial', owner: 'Compliance Team', reviewedDaysAgo: 85, nextDueDays: 5 },
  { id: 'ctrl-045', framework: 'SOC2', controlNo: 'CC10.1', name: 'Data Disposal', description: 'Secure data disposal procedures.', status: 'not_applicable', owner: 'SecOps', reviewedDaysAgo: 90, nextDueDays: 90 },

  // ── ISO27001 (8) ───────────────────────────────────────────────────────
  { id: 'ctrl-046', framework: 'ISO27001', controlNo: 'A.5.1', name: 'Information Security Policies', description: 'Set of policies for information security.', status: 'compliant', owner: 'CISO', evidence: [{ type: 'document', reference: 'isms-policy-v3.pdf', uploadedAt: isoOffset(60) }], reviewedDaysAgo: 60, nextDueDays: 305 },
  { id: 'ctrl-047', framework: 'ISO27001', controlNo: 'A.6.1', name: 'Internal Organization', description: 'Roles and responsibilities defined.', status: 'compliant', owner: 'CISO', evidence: [{ type: 'document', reference: 'rbac-matrix.xlsx', uploadedAt: isoOffset(45) }], reviewedDaysAgo: 45, nextDueDays: 320 },
  { id: 'ctrl-048', framework: 'ISO27001', controlNo: 'A.8.1', name: 'Asset Management', description: 'Inventory of assets.', status: 'partial', owner: 'SecOps', reviewedDaysAgo: 110, nextDueDays: 0 },
  { id: 'ctrl-049', framework: 'ISO27001', controlNo: 'A.9.1', name: 'Access Control', description: 'Access control policy.', status: 'compliant', owner: 'SecOps', evidence: [{ type: 'config', reference: 'access-control.yml', uploadedAt: isoOffset(30) }], reviewedDaysAgo: 30, nextDueDays: 60 },
  { id: 'ctrl-050', framework: 'ISO27001', controlNo: 'A.10.1', name: 'Cryptography', description: 'Cryptographic controls policy.', status: 'compliant', owner: 'SecOps', evidence: [{ type: 'document', reference: 'crypto-policy.pdf', uploadedAt: isoOffset(40) }], reviewedDaysAgo: 40, nextDueDays: 50 },
  { id: 'ctrl-051', framework: 'ISO27001', controlNo: 'A.12.1', name: 'Operations Security', description: 'Operational procedures and responsibilities.', status: 'partial', owner: 'SecOps', reviewedDaysAgo: 75, nextDueDays: 15 },
  { id: 'ctrl-052', framework: 'ISO27001', controlNo: 'A.16.1', name: 'Incident Mgmt', description: 'Management of information security incidents.', status: 'missing', owner: 'CISO', reviewedDaysAgo: 200, nextDueDays: -110 },
  { id: 'ctrl-053', framework: 'ISO27001', controlNo: 'A.18.1', name: 'Compliance', description: 'Compliance with legal and contractual requirements.', status: 'partial', owner: 'Legal', reviewedDaysAgo: 90, nextDueDays: 0 },
]

export const LANDX_COMPLIANCE_CONTROLS: LandxComplianceControl[] = SEEDS.map(
  (s) => ({
    id: s.id,
    framework: s.framework,
    controlNo: s.controlNo,
    name: s.name,
    description: s.description,
    status: s.status,
    evidence: s.evidence ? s.evidence.map((e) => ({ ...e })) : [],
    lastReviewedAt: isoOffset(s.reviewedDaysAgo),
    nextReviewDue: isoFuture(s.nextDueDays),
    owner: s.owner,
  }),
)

function computePosture(
  framework: LandxComplianceControl['framework'],
): LandxCompliancePosture {
  const items = LANDX_COMPLIANCE_CONTROLS.filter((c) => c.framework === framework)
  const total = items.length
  const compliantCount = items.filter((c) => c.status === 'compliant').length
  const partialCount = items.filter((c) => c.status === 'partial').length
  const missingCount = items.filter((c) => c.status === 'missing').length
  const naCount = items.filter((c) => c.status === 'not_applicable').length
  const effective = Math.max(1, total - naCount)
  const scorePct = Math.round(
    ((compliantCount + 0.5 * partialCount) / effective) * 100,
  )
  return {
    framework,
    totalControls: total,
    compliantCount,
    partialCount,
    missingCount,
    scorePct,
  }
}

export const LANDX_COMPLIANCE_POSTURE: LandxCompliancePosture[] = (
  ['KVKK', 'VERBİS', 'GDPR', 'SOC2', 'ISO27001'] as const
).map((f) => computePosture(f))
