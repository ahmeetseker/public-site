/**
 * TanStack Query v5 hooks — broker domain (Wave F34 / Faz 1B).
 *
 * Mock-only — backend yok. Pattern (F32/F33 ile aynı):
 *   - `mockAsync(value, latency)` ile gerçekçi gecikme
 *   - query key array — `['broker', op, ...args]`
 *   - mutations: stale invalidation
 *
 * Sub-role guard: hooks bilinçli olarak sub-role kontrolü YAPMIYOR. App
 * tarafında `useAuth().subRole` ile route'lar gizlenir; hooks her zaman
 * ham veri döner. Faz 3'te server tarafı yetkilendirme eklenir.
 *
 * Hooks (16 toplam):
 *   1. useBrokerProfile()
 *   2. useBrokerKpis(brokerId)
 *   3. useBrokerPortfolio(brokerId)
 *   4. useBulkUpdatePortfolio()       ← mutation
 *   5. useBrokerLeads(filter?)
 *   6. useScoreLeads()                ← mutation (AI scorer batch)
 *   7. useUpdateLead()                ← mutation
 *   8. useBrokerClients()
 *   9. useDeleteClientData()          ← mutation (KVKK DSAR)
 *  10. useBrokerCommissions(filter?)
 *  11. useGenerateCommissionInvoice() ← mutation (pdf-lib mock)
 *  12. useBrokerShowcase(brokerId)
 *  13. useUpdateShowcase()            ← mutation
 *  14. useBrokerTeam(officeId)
 *  15. useInviteTeamMember()          ← mutation
 *  16. useRemoveTeamMember()          ← mutation
 *  + useBrokerAiTool(toolId)          ← generic AI tool runner (description /
 *                                        valuation / segment / prioritizer)
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { createLocalStore } from '../adapters/local-storage'
import { generateMockResponse } from '../lib/ai-helpers'
import { BROKER_CLIENTS } from '../mock/broker-clients'
import { BROKER_COMMISSIONS } from '../mock/broker-commissions'
import { BROKER_LEADS } from '../mock/broker-leads'
import { BROKER_PORTFOLIO } from '../mock/broker-portfolio'
import { BROKER_PROFILES } from '../mock/broker-profiles'
import { BROKER_SHOWCASES } from '../mock/broker-showcases'
import { BROKER_TEAM } from '../mock/broker-team'
import type {
  BrokerClient,
  BrokerClientKvkkLog,
  BrokerCommission,
  BrokerCommissionStatus,
  BrokerKpis,
  BrokerLead,
  BrokerLeadStatus,
  BrokerLeadTemperature,
  BrokerPortfolioItem,
  BrokerProfile,
  BrokerShowcase,
  BrokerSubRole,
  BrokerTeamMember,
  BrokerTeamStatus,
} from '../types/broker'
import { mockAsync } from './mock-latency'

// ─── Stores (id'li domainler için createLocalStore) ──────────────────────────
//
// `BrokerProfile`, `BrokerLead`, `BrokerClient`, `BrokerCommission`,
// `BrokerPortfolioItem`, `BrokerTeamMember` hepsi `{id: string}` taşıyor —
// localStorage adapter direkt çalışır.

const profilesStore = createLocalStore<BrokerProfile>(
  'broker.profiles',
  [...BROKER_PROFILES],
)
const leadsStore = createLocalStore<BrokerLead>('broker.leads', [...BROKER_LEADS])
const clientsStore = createLocalStore<BrokerClient>(
  'broker.clients',
  [...BROKER_CLIENTS],
)
const commissionsStore = createLocalStore<BrokerCommission>(
  'broker.commissions',
  [...BROKER_COMMISSIONS],
)
const portfolioStore = createLocalStore<BrokerPortfolioItem>(
  'broker.portfolio',
  [...BROKER_PORTFOLIO],
)
const teamStore = createLocalStore<BrokerTeamMember>('broker.team', [...BROKER_TEAM])

// `BrokerShowcase` `id` taşımıyor (key: `brokerId`). In-memory cache + tek
// kayıt için manuel get/set wrapper — F33 `notification-prefs` paterni.
const SHOWCASE_CACHE = new Map<string, BrokerShowcase>()
for (const s of BROKER_SHOWCASES) SHOWCASE_CACHE.set(s.brokerId, s)

// `BrokerKpis` deterministik — her broker için on-the-fly hesaplanır
// (portfolio/leads/commissions üzerinden agrege). Cache opsiyonel.
const KPIS_CACHE = new Map<string, BrokerKpis>()

// ─── Query keys ──────────────────────────────────────────────────────────────

export const brokerKeys = {
  all: ['broker'] as const,
  profile: () => [...brokerKeys.all, 'profile'] as const,
  kpis: (brokerId: string) => [...brokerKeys.all, 'kpis', brokerId] as const,
  portfolio: {
    all: () => [...brokerKeys.all, 'portfolio'] as const,
    list: (brokerId: string) => [...brokerKeys.portfolio.all(), brokerId] as const,
  },
  leads: {
    all: () => [...brokerKeys.all, 'leads'] as const,
    list: (filter?: BrokerLeadFilter) => [...brokerKeys.leads.all(), filter ?? {}] as const,
  },
  clients: {
    all: () => [...brokerKeys.all, 'clients'] as const,
    list: () => [...brokerKeys.clients.all(), 'list'] as const,
  },
  commissions: {
    all: () => [...brokerKeys.all, 'commissions'] as const,
    list: (filter?: BrokerCommissionFilter) =>
      [...brokerKeys.commissions.all(), filter ?? {}] as const,
  },
  showcase: (brokerId: string) => [...brokerKeys.all, 'showcase', brokerId] as const,
  team: (officeId: string) => [...brokerKeys.all, 'team', officeId] as const,
  aiTool: (toolId: string) => [...brokerKeys.all, 'ai-tool', toolId] as const,
}

// ─── 1. useBrokerProfile ─────────────────────────────────────────────────────

const DEMO_PROFILE_ID = 'BR-USR-001'

export function useBrokerProfile(): UseQueryResult<BrokerProfile | null> {
  return useQuery({
    queryKey: brokerKeys.profile(),
    queryFn: () => {
      const profile = profilesStore.get(DEMO_PROFILE_ID) ?? null
      return mockAsync(profile, 120)
    },
  })
}

// ─── 2. useBrokerKpis ────────────────────────────────────────────────────────

function computeKpis(brokerId: string): BrokerKpis {
  const cached = KPIS_CACHE.get(brokerId)
  if (cached) return cached

  const portfolio = portfolioStore.list().filter((p) => p.brokerId === brokerId)
  const leads = leadsStore.list().filter((l) => l.brokerId === brokerId)
  const commissions = commissionsStore.list().filter((c) => c.brokerId === brokerId)

  const now = Date.now()
  const monthAgo = now - 30 * 24 * 3600 * 1000
  const monthlyDeals = commissions.filter(
    (c) => c.status === 'paid' && Date.parse(c.paymentDate ?? c.createdAt) >= monthAgo,
  )

  const closedDeals = commissions.filter((c) => c.status === 'paid')
  const avgDays = closedDeals.length === 0
    ? 0
    : Math.round(
        closedDeals.reduce(
          (acc, c) =>
            acc +
            Math.max(
              1,
              Math.round(
                (Date.parse(c.paymentDate ?? c.createdAt) - Date.parse(c.createdAt)) /
                  (24 * 3600 * 1000),
              ),
            ),
          0,
        ) / closedDeals.length,
      )

  const kpis: BrokerKpis = {
    brokerId,
    totalListings: portfolio.length,
    activeListings: portfolio.filter((p) => p.status === 'active').length,
    monthlyDeals: monthlyDeals.length,
    monthlyRevenue: monthlyDeals.reduce((sum, c) => sum + c.commissionAmount, 0),
    pendingLeads: leads.filter((l) => l.status === 'new' || l.status === 'contacted').length,
    hotLeads: leads.filter((l) => l.aiTemperature === 'hot').length,
    avgDaysToClose: avgDays,
  }
  KPIS_CACHE.set(brokerId, kpis)
  return kpis
}

export function useBrokerKpis(brokerId: string): UseQueryResult<BrokerKpis> {
  return useQuery({
    queryKey: brokerKeys.kpis(brokerId),
    queryFn: () => mockAsync(computeKpis(brokerId), 250),
    enabled: !!brokerId,
    staleTime: 60 * 1000,
  })
}

// ─── 3. useBrokerPortfolio ───────────────────────────────────────────────────

export function useBrokerPortfolio(brokerId: string): UseQueryResult<BrokerPortfolioItem[]> {
  return useQuery({
    queryKey: brokerKeys.portfolio.list(brokerId),
    queryFn: () => {
      const items = portfolioStore.list().filter((p) => p.brokerId === brokerId)
      return mockAsync(items, 200)
    },
    enabled: !!brokerId,
  })
}

// ─── 4. useBulkUpdatePortfolio ───────────────────────────────────────────────

export interface BulkUpdatePortfolioInput {
  ids: string[]
  patch: Partial<Pick<BrokerPortfolioItem, 'status'>>
}

export function useBulkUpdatePortfolio(): UseMutationResult<
  { updated: number },
  Error,
  BulkUpdatePortfolioInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids, patch }) => {
      let updated = 0
      const now = new Date().toISOString()
      for (const id of ids) {
        const result = portfolioStore.update(id, { ...patch, lastEdit: now })
        if (result) updated++
      }
      KPIS_CACHE.clear()
      return mockAsync({ updated }, 400)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brokerKeys.portfolio.all() })
      qc.invalidateQueries({ queryKey: brokerKeys.all })
    },
  })
}

// ─── 5. useBrokerLeads ───────────────────────────────────────────────────────

export interface BrokerLeadFilter {
  brokerId?: string
  status?: BrokerLeadStatus
  temperature?: BrokerLeadTemperature
  search?: string
}

export function useBrokerLeads(filter?: BrokerLeadFilter): UseQueryResult<BrokerLead[]> {
  return useQuery({
    queryKey: brokerKeys.leads.list(filter),
    queryFn: () => {
      let items = leadsStore.list()
      if (filter?.brokerId) items = items.filter((l) => l.brokerId === filter.brokerId)
      if (filter?.status) items = items.filter((l) => l.status === filter.status)
      if (filter?.temperature)
        items = items.filter((l) => l.aiTemperature === filter.temperature)
      if (filter?.search) {
        const s = filter.search.toLowerCase()
        items = items.filter(
          (l) =>
            l.clientName.toLowerCase().includes(s) ||
            l.clientPhone.toLowerCase().includes(s) ||
            l.notes.toLowerCase().includes(s),
        )
      }
      // En aktif olanlardan başla.
      items.sort((a, b) => (a.lastActivity < b.lastActivity ? 1 : -1))
      return mockAsync(items, 200)
    },
  })
}

// ─── 6. useScoreLeads (AI scorer batch) ──────────────────────────────────────

export interface ScoreLeadsInput {
  /** Yeniden skorlanacak lead id'leri. Boş ise tüm lead'ler. */
  ids?: string[]
}

function temperatureFromScore(score: number): BrokerLeadTemperature {
  if (score >= 75) return 'hot'
  if (score >= 45) return 'warm'
  return 'cold'
}

export function useScoreLeads(): UseMutationResult<
  { rescored: number },
  Error,
  ScoreLeadsInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids }) => {
      const all = leadsStore.list()
      const target = ids && ids.length > 0
        ? all.filter((l) => ids.includes(l.id))
        : all
      let rescored = 0
      for (const lead of target) {
        // Mock: skoru ±15 puan jitter, kontrast korunsun.
        const jitter = (Date.parse(lead.lastActivity) % 31) - 15
        const next = Math.max(0, Math.min(100, lead.aiScore + jitter))
        const updated = leadsStore.update(lead.id, {
          aiScore: next,
          aiTemperature: temperatureFromScore(next),
        })
        if (updated) rescored++
      }
      KPIS_CACHE.clear()
      return mockAsync({ rescored }, 800)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brokerKeys.leads.all() })
      qc.invalidateQueries({ queryKey: brokerKeys.all })
    },
  })
}

// ─── 7. useUpdateLead ────────────────────────────────────────────────────────

export interface UpdateLeadInput {
  id: string
  patch: Partial<Pick<BrokerLead, 'status' | 'notes' | 'lastActivity'>>
}

export function useUpdateLead(): UseMutationResult<BrokerLead, Error, UpdateLeadInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }) => {
      const updated = leadsStore.update(id, {
        ...patch,
        lastActivity: patch.lastActivity ?? new Date().toISOString(),
      })
      if (!updated) return Promise.reject(new Error(`Lead ${id} not found`))
      KPIS_CACHE.clear()
      return mockAsync(updated, 200)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brokerKeys.leads.all() })
      qc.invalidateQueries({ queryKey: brokerKeys.all })
    },
  })
}

// ─── 8. useBrokerClients ─────────────────────────────────────────────────────

export function useBrokerClients(brokerId?: string): UseQueryResult<BrokerClient[]> {
  return useQuery({
    queryKey: [...brokerKeys.clients.list(), brokerId ?? 'all'],
    queryFn: () => {
      let items = clientsStore.list()
      if (brokerId) items = items.filter((c) => c.brokerId === brokerId)
      items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      return mockAsync(items, 200)
    },
  })
}

// ─── 9. useDeleteClientData (KVKK DSAR) ──────────────────────────────────────

export interface DeleteClientDataInput {
  clientId: string
  /** Aksiyonu yapan operatör id'si (audit log'a yazılır). */
  actor: string
}

export function useDeleteClientData(): UseMutationResult<
  { id: string },
  Error,
  DeleteClientDataInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ clientId, actor }) => {
      // KVKK DSAR — gerçek delete YERİNE log + PII'yi mask et.
      const current = clientsStore.get(clientId)
      if (!current) return Promise.reject(new Error(`Client ${clientId} not found`))
      const log: BrokerClientKvkkLog = {
        action: 'data_deleted',
        at: new Date().toISOString(),
        actor,
      }
      const masked = clientsStore.update(clientId, {
        name: '[silindi]',
        email: '[silindi]',
        phone: '[silindi]',
        taxId: undefined,
        kvkkConsent: false,
        kvkkLogs: [...current.kvkkLogs, log],
      })
      if (!masked) return Promise.reject(new Error('Mask failed'))
      return mockAsync({ id: clientId }, 600)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brokerKeys.clients.all() })
    },
  })
}

// ─── 10. useBrokerCommissions ────────────────────────────────────────────────

export interface BrokerCommissionFilter {
  brokerId?: string
  status?: BrokerCommissionStatus
  /** ISO 8601 (ay başı). Sadece bu aya ait kayıtlar. */
  month?: string
}

export function useBrokerCommissions(
  filter?: BrokerCommissionFilter,
): UseQueryResult<BrokerCommission[]> {
  return useQuery({
    queryKey: brokerKeys.commissions.list(filter),
    queryFn: () => {
      let items = commissionsStore.list()
      if (filter?.brokerId) items = items.filter((c) => c.brokerId === filter.brokerId)
      if (filter?.status) items = items.filter((c) => c.status === filter.status)
      if (filter?.month) {
        const ym = filter.month.slice(0, 7)
        items = items.filter((c) => (c.paymentDate ?? c.createdAt).slice(0, 7) === ym)
      }
      items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      return mockAsync(items, 200)
    },
  })
}

// ─── 11. useGenerateCommissionInvoice (pdf-lib mock) ─────────────────────────

export interface GenerateInvoiceInput {
  commissionId: string
}

export function useGenerateCommissionInvoice(): UseMutationResult<
  BrokerCommission,
  Error,
  GenerateInvoiceInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ commissionId }) => {
      const current = commissionsStore.get(commissionId)
      if (!current) return Promise.reject(new Error(`Commission ${commissionId} not found`))
      // Mock — gerçek pdf üretimi F34 Faz 2'de pdf-lib ile.
      const updated = commissionsStore.update(commissionId, {
        status: current.status === 'pending' ? 'invoiced' : current.status,
        receiptUrl: `mock://receipts/${commissionId}.pdf`,
      })
      if (!updated) return Promise.reject(new Error('Invoice update failed'))
      return mockAsync(updated, 1200)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brokerKeys.commissions.all() })
    },
  })
}

// ─── 12. useBrokerShowcase ───────────────────────────────────────────────────

export function useBrokerShowcase(brokerId: string): UseQueryResult<BrokerShowcase | null> {
  return useQuery({
    queryKey: brokerKeys.showcase(brokerId),
    queryFn: () => {
      const showcase = SHOWCASE_CACHE.get(brokerId) ?? null
      return mockAsync(showcase, 150)
    },
    enabled: !!brokerId,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── 13. useUpdateShowcase ───────────────────────────────────────────────────

export interface UpdateShowcaseInput {
  brokerId: string
  patch: Partial<Omit<BrokerShowcase, 'brokerId' | 'slug'>>
}

export function useUpdateShowcase(): UseMutationResult<
  BrokerShowcase,
  Error,
  UpdateShowcaseInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ brokerId, patch }) => {
      const current = SHOWCASE_CACHE.get(brokerId)
      if (!current) return Promise.reject(new Error(`Showcase for ${brokerId} not found`))
      const next: BrokerShowcase = { ...current, ...patch }
      SHOWCASE_CACHE.set(brokerId, next)
      return mockAsync(next, 300)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: brokerKeys.showcase(vars.brokerId) })
    },
  })
}

// ─── 14. useBrokerTeam ───────────────────────────────────────────────────────

export function useBrokerTeam(officeId: string): UseQueryResult<BrokerTeamMember[]> {
  return useQuery({
    queryKey: brokerKeys.team(officeId),
    queryFn: () => {
      const items = teamStore.list().filter((t) => t.brokerId === officeId)
      return mockAsync(items, 200)
    },
    enabled: !!officeId,
  })
}

// ─── 15. useInviteTeamMember ─────────────────────────────────────────────────

export interface InviteTeamMemberInput {
  officeId: string
  email: string
  name: string
  subRole: BrokerSubRole
}

export function useInviteTeamMember(): UseMutationResult<
  BrokerTeamMember,
  Error,
  InviteTeamMemberInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ officeId, email, name, subRole }) => {
      const status: BrokerTeamStatus = 'invited'
      const created = teamStore.create({
        brokerId: officeId,
        email,
        name,
        subRole,
        status,
        invitedAt: new Date().toISOString(),
      })
      return mockAsync(created, 400)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: brokerKeys.team(vars.officeId) })
    },
  })
}

// ─── 16. useRemoveTeamMember ─────────────────────────────────────────────────

export interface RemoveTeamMemberInput {
  id: string
  officeId: string
}

export function useRemoveTeamMember(): UseMutationResult<
  { id: string },
  Error,
  RemoveTeamMemberInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }) => {
      teamStore.remove(id)
      return mockAsync({ id }, 250)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: brokerKeys.team(vars.officeId) })
    },
  })
}

// ─── Bonus: useBrokerAiTool (generic AI tool runner) ─────────────────────────

export type BrokerAiToolId =
  | 'description'
  | 'valuation'
  | 'segment'
  | 'prioritizer'

export interface BrokerAiToolResult {
  toolId: BrokerAiToolId
  output: string
  /** ISO 8601. */
  generatedAt: string
}

export interface RunAiToolInput {
  toolId: BrokerAiToolId
  prompt: string
}

/**
 * Hook + mutation hibridi: argümanlı çalışma için `mutateAsync`'i tercih edin.
 * Geçici sonucu cache'ler — Faz 2 widget'lar useQuery patterni kullanırsa
 * kolayca geçilebilir.
 */
export function useBrokerAiTool(): UseMutationResult<BrokerAiToolResult, Error, RunAiToolInput> {
  return useMutation({
    mutationFn: async ({ toolId, prompt }) => {
      const output = generateMockResponse(`${toolId}: ${prompt}`)
      const result: BrokerAiToolResult = {
        toolId,
        output,
        generatedAt: new Date().toISOString(),
      }
      return mockAsync(result, 900)
    },
  })
}
