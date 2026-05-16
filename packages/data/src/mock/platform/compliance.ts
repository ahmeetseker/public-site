// Compliance Framework (D03 KVKK/GDPR/SOC2)

export interface ComplianceFramework {
  id: 'kvkk' | 'gdpr' | 'soc2-type1' | 'soc2-type2' | 'iso27001'
  name: string
  region: 'TR' | 'EU' | 'Global'
  controlCount: number
  passingCount: number
  inProgressCount: number
  failingCount: number
  lastAssessmentISO: string
  nextDueISO: string
  certificate?: { issuedISO: string; expiresISO: string; pdfUrl?: string }
}

export const COMPLIANCE_FRAMEWORKS: ComplianceFramework[] = [
  { id: 'kvkk', name: 'KVKK', region: 'TR', controlCount: 24, passingCount: 22, inProgressCount: 2, failingCount: 0, lastAssessmentISO: '2026-04-18', nextDueISO: '2026-10-18', certificate: { issuedISO: '2025-10-20', expiresISO: '2026-10-20' } },
  { id: 'gdpr', name: 'GDPR', region: 'EU', controlCount: 32, passingCount: 28, inProgressCount: 3, failingCount: 1, lastAssessmentISO: '2026-04-20', nextDueISO: '2026-10-20' },
  { id: 'soc2-type1', name: 'SOC 2 Type I', region: 'Global', controlCount: 64, passingCount: 0, inProgressCount: 18, failingCount: 0, lastAssessmentISO: '2026-05-01', nextDueISO: '2026-09-01' },
]

export interface ComplianceControl {
  id: string
  frameworkId: ComplianceFramework['id']
  controlNumber: string
  title: string
  status: 'pass' | 'fail' | 'in-progress' | 'not-applicable'
  evidence: string
  lastReviewedISO: string
  owner: string
}

export const COMPLIANCE_CONTROLS: ComplianceControl[] = [
  { id: 'ctrl-001', frameworkId: 'kvkk', controlNumber: 'KVKK-04', title: 'Açık rıza alma mekanizması', status: 'pass', evidence: 'Onboarding flow\'unda rıza checkbox\'ı, audit log\'a yazılıyor. Son test 2026-04-18.', lastReviewedISO: '2026-04-18', owner: 'compliance@turksab.com' },
  { id: 'ctrl-002', frameworkId: 'kvkk', controlNumber: 'KVKK-08', title: 'Veri minimizasyonu — toplama sınırı', status: 'pass', evidence: 'Listing kayıt formu sadece zorunlu alanlar. TC ve doğum tarihi opsiyonel, ayrı şifrelenmiş tabloda.', lastReviewedISO: '2026-04-18', owner: 'compliance@turksab.com' },
  { id: 'ctrl-003', frameworkId: 'kvkk', controlNumber: 'KVKK-12', title: 'Veri sahibi başvuru yanıt süresi (30 gün)', status: 'in-progress', evidence: 'Otomatik ticket akışı tasarlandı, dev ortamında. Üretim deploy Mayıs sonu.', lastReviewedISO: '2026-05-02', owner: 'compliance@turksab.com' },
  { id: 'ctrl-004', frameworkId: 'kvkk', controlNumber: 'KVKK-15', title: 'Yurt dışına veri transferi denetimi', status: 'pass', evidence: 'Tüm DB Frankfurt (AB), CDN edge\'leri sadece içerik. KVKK Kurul kararı uyumlu.', lastReviewedISO: '2026-04-15', owner: 'kvkk@turksab.com' },
  { id: 'ctrl-005', frameworkId: 'kvkk', controlNumber: 'KVKK-19', title: 'Veri sorumlusu sicil bilgi formu (VERBİS)', status: 'pass', evidence: 'VERBİS kaydı aktif, 2026 yıllık güncelleme yapıldı.', lastReviewedISO: '2026-03-30', owner: 'compliance@turksab.com' },
  { id: 'ctrl-006', frameworkId: 'gdpr', controlNumber: 'GDPR-15', title: 'Right to access (Article 15)', status: 'pass', evidence: 'Self-service data export panel. Son talep 2026-05-06 yanıtlandı (6 gün içinde).', lastReviewedISO: '2026-05-06', owner: 'compliance@turksab.com' },
  { id: 'ctrl-007', frameworkId: 'gdpr', controlNumber: 'GDPR-17', title: 'Right to erasure (Article 17)', status: 'pass', evidence: 'Hard-delete + 30 gün retention buffer. Audit log\'da delete işareti.', lastReviewedISO: '2026-04-20', owner: 'compliance@turksab.com' },
  { id: 'ctrl-008', frameworkId: 'gdpr', controlNumber: 'GDPR-25', title: 'Data protection by design and default', status: 'in-progress', evidence: 'Threat model 2026-Q1 hazır, mitigation %72. Geriye 9 kontrol kaldı.', lastReviewedISO: '2026-04-28', owner: 'guvenlik@turksab.com' },
  { id: 'ctrl-009', frameworkId: 'gdpr', controlNumber: 'GDPR-32', title: 'Security of processing (encryption at rest)', status: 'fail', evidence: 'Backup\'lar şifrelenmemiş eski bucket\'ta — taşıma planlandı (2026-05-25).', lastReviewedISO: '2026-05-04', owner: 'guvenlik@turksab.com' },
  { id: 'ctrl-010', frameworkId: 'gdpr', controlNumber: 'GDPR-33', title: 'Breach notification (72 saat)', status: 'pass', evidence: 'Incident playbook, PagerDuty alerting, compliance@ otomatik bildirim.', lastReviewedISO: '2026-04-20', owner: 'guvenlik@turksab.com' },
  { id: 'ctrl-011', frameworkId: 'soc2-type1', controlNumber: 'CC1.1', title: 'Code of conduct and ethics', status: 'in-progress', evidence: 'Doküman hazır, çalışan onayları toplanıyor (8/12).', lastReviewedISO: '2026-05-01', owner: 'ik@turksab.com' },
  { id: 'ctrl-012', frameworkId: 'soc2-type1', controlNumber: 'CC6.1', title: 'Logical access — MFA on all admin accounts', status: 'in-progress', evidence: 'Super-admin %100, tenant admin %78. SSO entegrasyonu Mayıs sonu.', lastReviewedISO: '2026-05-05', owner: 'guvenlik@turksab.com' },
  { id: 'ctrl-013', frameworkId: 'soc2-type1', controlNumber: 'CC7.2', title: 'System monitoring and alerting', status: 'in-progress', evidence: 'PostHog + Sentry kurulu, SLO alerting Faz 11.1 ile geliyor.', lastReviewedISO: '2026-05-01', owner: 'guvenlik@turksab.com' },
  { id: 'ctrl-014', frameworkId: 'soc2-type1', controlNumber: 'CC8.1', title: 'Change management — code review enforcement', status: 'in-progress', evidence: 'GitHub branch protection aktif, en az 1 reviewer zorunlu.', lastReviewedISO: '2026-04-30', owner: 'cto@turksab.com' },
  { id: 'ctrl-015', frameworkId: 'soc2-type1', controlNumber: 'CC9.1', title: 'Risk mitigation — vendor risk register', status: 'not-applicable', evidence: 'Tek satıcı (Cloudflare). Type II için gerekecek.', lastReviewedISO: '2026-05-01', owner: 'compliance@turksab.com' },
]
