/**
 * Mock seed — agent workflow runs (Wave F35 / Faz 1C).
 *
 * 12 run, plan-execute-reflect step'li (3 step her zaman, bazıları yarım kalmış).
 * Status karması:
 *   - completed (~%33)
 *   - reflecting (~%17)
 *   - running (~%25)
 *   - pending (~%17)
 *   - failed (~%8)
 *
 * `needsHumanApproval` → reflect output insan onayı bekliyor.
 *
 * F35 Faz 2 `/agent-memory` veya `/agent-workflows` route'u bu seed üzerinde
 * timeline + approval butonu render eder.
 */

import type { AgentWorkflowPhase, AgentWorkflowRun, AgentWorkflowRunStatus, AgentWorkflowRunStep } from '../types/admin-agent'

interface RunSeed {
  id: string
  workflowId: string
  agentId: string
  status: AgentWorkflowRunStatus
  needsHumanApproval: boolean
  hoursAgo: number
  steps: ReadonlyArray<{
    phase: AgentWorkflowPhase
    output: string
    /** Run başından kaç dakika sonra. */
    minutesAfterStart: number
  }>
}

const SEEDS: ReadonlyArray<RunSeed> = [
  {
    id: 'RUN-0001',
    workflowId: 'AWF-LEAD-SCORE',
    agentId: 'agent:lead-scorer',
    status: 'completed',
    needsHumanApproval: false,
    hoursAgo: 8,
    steps: [
      { phase: 'plan', output: '120 lead skorlama planı: paralel 12 grup', minutesAfterStart: 0 },
      { phase: 'execute', output: '120 lead skorlandı, ortalama latency 240ms/lead', minutesAfterStart: 6 },
      { phase: 'reflect', output: 'Hot/warm dağılımı dengeli, manuel inceleme gerekmedi', minutesAfterStart: 7 },
    ],
  },
  {
    id: 'RUN-0002',
    workflowId: 'AWF-TAPU-OCR',
    agentId: 'agent:doc-extractor',
    status: 'completed',
    needsHumanApproval: false,
    hoursAgo: 12,
    steps: [
      { phase: 'plan', output: 'Tapu OCR: 8 görüntü, vision model + NER pipeline', minutesAfterStart: 0 },
      { phase: 'execute', output: '8 görüntü işlendi, ortalama güven 0.91', minutesAfterStart: 4 },
      { phase: 'reflect', output: '1 görüntü güven < 0.7 — manuel review marked', minutesAfterStart: 5 },
    ],
  },
  {
    id: 'RUN-0003',
    workflowId: 'AWF-MARKET-REPORT',
    agentId: 'agent:chat-default',
    status: 'completed',
    needsHumanApproval: false,
    hoursAgo: 22,
    steps: [
      { phase: 'plan', output: 'Çeşme bölgesi haftalık rapor: 6 alt bölge agregat', minutesAfterStart: 0 },
      { phase: 'execute', output: 'Rapor üretildi (4200 token), 12 trend tespit', minutesAfterStart: 2 },
      { phase: 'reflect', output: 'İmar değişikliği bölümü için kaynak doğrulandı', minutesAfterStart: 3 },
    ],
  },
  {
    id: 'RUN-0004',
    workflowId: 'AWF-LEAD-SCORE',
    agentId: 'agent:lead-scorer',
    status: 'reflecting',
    needsHumanApproval: true,
    hoursAgo: 1,
    steps: [
      { phase: 'plan', output: 'Yeni 45 lead skorlama planı', minutesAfterStart: 0 },
      { phase: 'execute', output: '45 lead skorlandı', minutesAfterStart: 3 },
      { phase: 'reflect', output: 'Hot lead oranı %42 — eşik aşıldı, insan onayı isteniyor', minutesAfterStart: 4 },
    ],
  },
  {
    id: 'RUN-0005',
    workflowId: 'AWF-NOTIF-ROUTE',
    agentId: 'agent:notification-router',
    status: 'reflecting',
    needsHumanApproval: true,
    hoursAgo: 2,
    steps: [
      { phase: 'plan', output: 'Push notification: 320 kullanıcı, fiyat değişikliği', minutesAfterStart: 0 },
      { phase: 'execute', output: '320 push gönderildi, 18 başarısız', minutesAfterStart: 1 },
      { phase: 'reflect', output: 'Başarısız oran %5.6 — tipik %2 üstü, insan onayı', minutesAfterStart: 2 },
    ],
  },
  {
    id: 'RUN-0006',
    workflowId: 'AWF-TAPU-OCR',
    agentId: 'agent:doc-extractor',
    status: 'running',
    needsHumanApproval: false,
    hoursAgo: 0,
    steps: [
      { phase: 'plan', output: 'Tapu OCR: 12 görüntü, vision pipeline', minutesAfterStart: 0 },
      { phase: 'execute', output: '7/12 görüntü işlendi, ortalama güven 0.88', minutesAfterStart: 3 },
    ],
  },
  {
    id: 'RUN-0007',
    workflowId: 'AWF-MARKET-REPORT',
    agentId: 'agent:chat-default',
    status: 'running',
    needsHumanApproval: false,
    hoursAgo: 0,
    steps: [
      { phase: 'plan', output: 'Datça bölgesi 30-günlük rapor', minutesAfterStart: 0 },
      { phase: 'execute', output: 'Veri toplama: 14/22 alt bölge', minutesAfterStart: 1 },
    ],
  },
  {
    id: 'RUN-0008',
    workflowId: 'AWF-LEAD-SCORE',
    agentId: 'agent:lead-scorer',
    status: 'running',
    needsHumanApproval: false,
    hoursAgo: 0,
    steps: [
      { phase: 'plan', output: '90 lead batch skorlama', minutesAfterStart: 0 },
      { phase: 'execute', output: '38/90 lead skorlandı', minutesAfterStart: 2 },
    ],
  },
  {
    id: 'RUN-0009',
    workflowId: 'AWF-NOTIF-ROUTE',
    agentId: 'agent:notification-router',
    status: 'pending',
    needsHumanApproval: false,
    hoursAgo: 0,
    steps: [
      { phase: 'plan', output: 'Yeni ilan bildirim planı: 1240 hedef kullanıcı', minutesAfterStart: 0 },
    ],
  },
  {
    id: 'RUN-0010',
    workflowId: 'AWF-TAPU-OCR',
    agentId: 'agent:doc-extractor',
    status: 'pending',
    needsHumanApproval: false,
    hoursAgo: 0,
    steps: [
      { phase: 'plan', output: 'Tapu OCR backlog: 4 görüntü', minutesAfterStart: 0 },
    ],
  },
  {
    id: 'RUN-0011',
    workflowId: 'AWF-LEAD-SCORE',
    agentId: 'agent:lead-scorer',
    status: 'failed',
    needsHumanApproval: true,
    hoursAgo: 4,
    steps: [
      { phase: 'plan', output: '60 lead skorlama planı', minutesAfterStart: 0 },
      { phase: 'execute', output: 'Vector DB timeout (3 retry başarısız)', minutesAfterStart: 2 },
      { phase: 'reflect', output: 'FAIL: Vector DB sağlığı kontrol edilmeli, insan müdahalesi', minutesAfterStart: 3 },
    ],
  },
  {
    id: 'RUN-0012',
    workflowId: 'AWF-MARKET-REPORT',
    agentId: 'agent:chat-default',
    status: 'completed',
    needsHumanApproval: false,
    hoursAgo: 36,
    steps: [
      { phase: 'plan', output: 'Bodrum bölgesi aylık rapor', minutesAfterStart: 0 },
      { phase: 'execute', output: 'Rapor üretildi (3800 token)', minutesAfterStart: 3 },
      { phase: 'reflect', output: 'Tüm bölge verileri tutarlı', minutesAfterStart: 4 },
    ],
  },
]

function isoOffset(hoursAgo: number, minutesAfterStart: number): string {
  const d = new Date()
  d.setHours(d.getHours() - hoursAgo)
  d.setMinutes(d.getMinutes() + minutesAfterStart)
  return d.toISOString()
}

function isoHoursAgo(hoursAgo: number): string {
  const d = new Date()
  d.setHours(d.getHours() - hoursAgo)
  return d.toISOString()
}

function buildRuns(): ReadonlyArray<AgentWorkflowRun> {
  return SEEDS.map((seed): AgentWorkflowRun => {
    const steps: AgentWorkflowRunStep[] = seed.steps.map((s) => ({
      phase: s.phase,
      output: s.output,
      at: isoOffset(seed.hoursAgo, s.minutesAfterStart),
    }))
    return {
      id: seed.id,
      workflowId: seed.workflowId,
      agentId: seed.agentId,
      status: seed.status,
      steps,
      needsHumanApproval: seed.needsHumanApproval,
      createdAt: isoHoursAgo(seed.hoursAgo),
    }
  })
}

export const AGENT_WORKFLOW_RUNS: ReadonlyArray<AgentWorkflowRun> = buildRuns()
