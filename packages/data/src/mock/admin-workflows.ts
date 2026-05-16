/**
 * Mock seed — admin orchestration workflows (Wave F35 / Faz 1C).
 *
 * 8 workflow:
 *   - 3 KYC İncelemesi
 *   - 2 Refund Onayı
 *   - 1 Broker Davet (yeni ofis)
 *   - 2 Dispute Resolution
 *
 * Her workflow 3-5 step. Step status karması:
 *   - workflow #1: tamamlanmış (tüm step'ler approved/done)
 *   - workflow #2-4: yarısı bekliyor
 *   - workflow #5-8: yeni başlamış (1-2 step done, kalan pending)
 *
 * F35 Faz 2 `/orchestration` route'u bu seed üzerinde:
 *   - aktif workflow listesi (filter: status, name)
 *   - step approval (mutation)
 *   - timeline render (her step + zaman damgası)
 * yapar.
 */

import type { AdminWorkflow, AdminWorkflowStep, AdminWorkflowStepStatus } from '../types/admin-agent'

interface WorkflowSeed {
  id: string
  name: string
  initiator: string
  daysAgo: number
  steps: ReadonlyArray<{
    id: string
    name: string
    status: AdminWorkflowStepStatus
    needsApproval: boolean
    approver?: string
    completedDaysAgo?: number
  }>
}

const SEEDS: ReadonlyArray<WorkflowSeed> = [
  {
    id: 'WF-KYC-0001',
    name: 'KYC İncelemesi — USR-001',
    initiator: 'admin@landx.com',
    daysAgo: 6,
    steps: [
      { id: 's1', name: 'Kimlik OCR', status: 'done', needsApproval: false, completedDaysAgo: 6 },
      { id: 's2', name: 'Selfie eşleştirme', status: 'done', needsApproval: false, completedDaysAgo: 6 },
      { id: 's3', name: 'Adres doğrulama', status: 'approved', needsApproval: true, approver: 'admin@landx.com', completedDaysAgo: 5 },
      { id: 's4', name: 'Manager onayı', status: 'approved', needsApproval: true, approver: 'admin2@landx.com', completedDaysAgo: 4 },
    ],
  },
  {
    id: 'WF-KYC-0002',
    name: 'KYC İncelemesi — USR-024',
    initiator: 'admin@landx.com',
    daysAgo: 3,
    steps: [
      { id: 's1', name: 'Kimlik OCR', status: 'done', needsApproval: false, completedDaysAgo: 3 },
      { id: 's2', name: 'Selfie eşleştirme', status: 'done', needsApproval: false, completedDaysAgo: 3 },
      { id: 's3', name: 'Adres doğrulama', status: 'pending', needsApproval: true },
      { id: 's4', name: 'Manager onayı', status: 'pending', needsApproval: true },
    ],
  },
  {
    id: 'WF-KYC-0003',
    name: 'KYC İncelemesi — USR-058',
    initiator: 'system',
    daysAgo: 1,
    steps: [
      { id: 's1', name: 'Kimlik OCR', status: 'done', needsApproval: false, completedDaysAgo: 1 },
      { id: 's2', name: 'Selfie eşleştirme', status: 'rejected', needsApproval: true, approver: 'admin@landx.com', completedDaysAgo: 0 },
    ],
  },
  {
    id: 'WF-RFD-0001',
    name: 'Refund Onayı — PAY-2026-04-1842',
    initiator: 'admin2@landx.com',
    daysAgo: 4,
    steps: [
      { id: 's1', name: 'Müşteri talebi alındı', status: 'done', needsApproval: false, completedDaysAgo: 4 },
      { id: 's2', name: 'Finansman incelemesi', status: 'done', needsApproval: false, completedDaysAgo: 3 },
      { id: 's3', name: 'Manager onayı (₺49.000)', status: 'pending', needsApproval: true },
      { id: 's4', name: 'Iyzico iade gönderimi', status: 'pending', needsApproval: false },
      { id: 's5', name: 'Müşteri bildirimi', status: 'pending', needsApproval: false },
    ],
  },
  {
    id: 'WF-RFD-0002',
    name: 'Refund Onayı — PAY-2026-05-0921',
    initiator: 'admin@landx.com',
    daysAgo: 0,
    steps: [
      { id: 's1', name: 'Müşteri talebi alındı', status: 'done', needsApproval: false, completedDaysAgo: 0 },
      { id: 's2', name: 'Finansman incelemesi', status: 'running', needsApproval: false },
      { id: 's3', name: 'Manager onayı', status: 'pending', needsApproval: true },
      { id: 's4', name: 'Iyzico iade', status: 'pending', needsApproval: false },
      { id: 's5', name: 'Müşteri bildirimi', status: 'pending', needsApproval: false },
    ],
  },
  {
    id: 'WF-INV-0001',
    name: 'Broker Ofis Davet — Bodrum Türkbükü',
    initiator: 'admin@landx.com',
    daysAgo: 2,
    steps: [
      { id: 's1', name: 'Davet e-postası gönderildi', status: 'done', needsApproval: false, completedDaysAgo: 2 },
      { id: 's2', name: 'Sözleşme imza beklemede', status: 'running', needsApproval: false },
      { id: 's3', name: 'Tenant provisioning', status: 'pending', needsApproval: false },
      { id: 's4', name: 'Manager onayı', status: 'pending', needsApproval: true },
    ],
  },
  {
    id: 'WF-DSP-0001',
    name: 'Uyuşmazlık — DSP-0042 (komisyon itirazı)',
    initiator: 'system',
    daysAgo: 5,
    steps: [
      { id: 's1', name: 'İtiraz alındı', status: 'done', needsApproval: false, completedDaysAgo: 5 },
      { id: 's2', name: 'Taraf 1 ifadesi', status: 'done', needsApproval: false, completedDaysAgo: 4 },
      { id: 's3', name: 'Taraf 2 ifadesi', status: 'done', needsApproval: false, completedDaysAgo: 3 },
      { id: 's4', name: 'Hakem incelemesi', status: 'running', needsApproval: false },
      { id: 's5', name: 'Karar onayı', status: 'pending', needsApproval: true },
    ],
  },
  {
    id: 'WF-DSP-0002',
    name: 'Uyuşmazlık — DSP-0048 (sahte ilan iddiası)',
    initiator: 'admin2@landx.com',
    daysAgo: 0,
    steps: [
      { id: 's1', name: 'İddia alındı', status: 'done', needsApproval: false, completedDaysAgo: 0 },
      { id: 's2', name: 'İlan dondurma (geçici)', status: 'done', needsApproval: false, completedDaysAgo: 0 },
      { id: 's3', name: 'Satıcı ifadesi', status: 'pending', needsApproval: false },
      { id: 's4', name: 'Tapu doğrulama', status: 'pending', needsApproval: false },
    ],
  },
]

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function buildWorkflows(): ReadonlyArray<AdminWorkflow> {
  return SEEDS.map((seed): AdminWorkflow => {
    const steps: AdminWorkflowStep[] = seed.steps.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      needsApproval: s.needsApproval,
      approver: s.approver,
      completedAt: s.completedDaysAgo !== undefined ? isoDaysAgo(s.completedDaysAgo) : undefined,
    }))
    return {
      id: seed.id,
      name: seed.name,
      steps,
      startedAt: isoDaysAgo(seed.daysAgo),
      initiator: seed.initiator,
    }
  })
}

export const ADMIN_WORKFLOWS: ReadonlyArray<AdminWorkflow> = buildWorkflows()
