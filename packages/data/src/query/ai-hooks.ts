/**
 * TanStack Query v5 hooks — AI domain (Wave F33 / Faz 1A).
 *
 * Mock-only — backend henüz yok. Pattern (F32 ile aynı):
 *   - `mockAsync(value, latency)` ile gerçekçi gecikme
 *   - query key array — `['ai', op, ...args]`
 *   - mutations: stale invalidation (optimistic gerekirse override)
 *
 * SSE yok — kullanıcı kararı (basit response). Asistan cevapları
 * `generateMockResponse` ile üretilir, 800ms gecikme verilir.
 *
 * Hooks (toplam 14):
 *   - useAiValuation, useAiQa, useAskAiQa, useApproveAiQa
 *   - useMarketReport, useTapuRisk, useUploadTapu
 *   - useListAiConversations, useGetAiConversation,
 *     useCreateAiConversation, useAppendAiMessage, useDeleteAiConversation
 *   - useAiNotificationPrefs, useUpdateAiNotificationPrefs
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { createLocalStore } from '../adapters/local-storage'
import { generateMockResponse, generateValuation } from '../lib/ai-helpers'
import { AI_CONVERSATIONS } from '../mock/ai-conversations'
import { AI_NOTIFICATION_PREFS_DEFAULT } from '../mock/ai-notification-prefs'
import { AI_QA_THREADS } from '../mock/ai-qa-threads'
import { AI_VALUATIONS } from '../mock/ai-valuations'
import { MARKET_REPORTS } from '../mock/market-reports'
import { TAPU_EXTRACTS } from '../mock/tapu-extracts'
import type {
  AiConversation,
  AiMessage,
  AiNotificationPref,
  AiQaThread,
  AiValuation,
  MarketReport,
  TapuExtract,
} from '../types/ai'
import { mockAsync } from './mock-latency'

// ─── Stores ──────────────────────────────────────────────────────────────────

const conversationsStore = createLocalStore<AiConversation>('ai.conversations', AI_CONVERSATIONS)
const qaThreadsStore = createLocalStore<AiQaThread>('ai.qa-threads', AI_QA_THREADS)
const tapuStore = createLocalStore<TapuExtract>('ai.tapu', TAPU_EXTRACTS)

/**
 * `AiValuation` ve `AiNotificationPref` `{id: string}` constraint'ine uymuyor
 * (synthetic id eklemek API'yi kirletir). Bu ikisi için createLocalStore
 * yerine modül-içi mutable cache + manual LS persist kullanıyoruz.
 *
 * - Valuations runtime'da `generateValuation()` ile üretilebilir
 *   (deterministik), bu yüzden persist şart değil — sadece in-memory cache.
 * - Notification prefs tek kayıt → basit get/set wrapper.
 */

const VALUATION_CACHE = new Map<string, AiValuation>()
for (const v of AI_VALUATIONS) VALUATION_CACHE.set(v.listingId, v)

const NOTIF_PREFS_KEY = 'landx:v1:ai.notification-prefs'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readNotifPrefs(): AiNotificationPref {
  if (!isBrowser()) return AI_NOTIFICATION_PREFS_DEFAULT
  try {
    const raw = window.localStorage.getItem(NOTIF_PREFS_KEY)
    if (raw == null) return AI_NOTIFICATION_PREFS_DEFAULT
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as AiNotificationPref
    return AI_NOTIFICATION_PREFS_DEFAULT
  } catch {
    return AI_NOTIFICATION_PREFS_DEFAULT
  }
}

function writeNotifPrefs(prefs: AiNotificationPref): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Quota / private mode — defensive swallow.
  }
}

// ─── Query keys ──────────────────────────────────────────────────────────────

export const aiKeys = {
  all: ['ai'] as const,
  valuation: (listingId: string) => [...aiKeys.all, 'valuation', listingId] as const,
  qa: {
    all: () => [...aiKeys.all, 'qa'] as const,
    list: (listingId: string) => [...aiKeys.qa.all(), 'list', listingId] as const,
  },
  marketReport: (regionSlug: string) => [...aiKeys.all, 'market-report', regionSlug] as const,
  tapu: (listingId: string) => [...aiKeys.all, 'tapu', listingId] as const,
  conversations: {
    all: () => [...aiKeys.all, 'conversations'] as const,
    list: () => [...aiKeys.conversations.all(), 'list'] as const,
    detail: (id: string) => [...aiKeys.conversations.all(), 'detail', id] as const,
  },
  notificationPrefs: (userId: string) =>
    [...aiKeys.all, 'notification-prefs', userId] as const,
}

// ─── AI Valuation ────────────────────────────────────────────────────────────

export function useAiValuation(listingId: string): UseQueryResult<AiValuation> {
  return useQuery({
    queryKey: aiKeys.valuation(listingId),
    queryFn: async () => {
      const cached = VALUATION_CACHE.get(listingId)
      const value = cached ?? generateValuation(listingId)
      if (!cached) VALUATION_CACHE.set(listingId, value)
      return mockAsync(value, 800) // skeleton göster
    },
    staleTime: 5 * 60 * 1000, // 5 dk
    enabled: !!listingId,
  })
}

// ─── AI Q&A ──────────────────────────────────────────────────────────────────

export function useAiQa(listingId: string): UseQueryResult<AiQaThread[]> {
  return useQuery({
    queryKey: aiKeys.qa.list(listingId),
    queryFn: () => {
      const threads = qaThreadsStore.list().filter((t) => t.listingId === listingId)
      return mockAsync(threads, 200)
    },
    enabled: !!listingId,
  })
}

export interface AskAiQaInput {
  listingId: string
  question: string
  /** Soruyu soran kullanıcı id'si — tipik olarak demo-user. */
  userId?: string
}

export function useAskAiQa(): UseMutationResult<AiQaThread, Error, AskAiQaInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input) => {
      // AI cevap üretimi (basit kural-bazlı, 800ms gecikme).
      const aiAnswer = generateMockResponse(input.question)
      const created = qaThreadsStore.create({
        listingId: input.listingId,
        userId: input.userId ?? 'demo-user',
        question: input.question,
        aiAnswer,
        sellerApproved: null,
        createdAt: new Date().toISOString(),
      })
      return mockAsync(created, 800)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: aiKeys.qa.list(vars.listingId) })
    },
  })
}

export interface ApproveAiQaInput {
  id: string
  listingId: string
  approved: boolean
  sellerNote?: string
}

export function useApproveAiQa(): UseMutationResult<AiQaThread, Error, ApproveAiQaInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, approved, sellerNote }) => {
      const updated = qaThreadsStore.update(id, {
        sellerApproved: approved,
        approvedAt: new Date().toISOString(),
        ...(sellerNote !== undefined ? { sellerNote } : {}),
      })
      if (!updated) return Promise.reject(new Error(`QA thread ${id} not found`))
      return mockAsync(updated, 250)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: aiKeys.qa.list(vars.listingId) })
    },
  })
}

// ─── Market Report ───────────────────────────────────────────────────────────

export function useMarketReport(regionSlug: string): UseQueryResult<MarketReport | null> {
  return useQuery({
    queryKey: aiKeys.marketReport(regionSlug),
    queryFn: () => {
      const report = MARKET_REPORTS.find((r) => r.regionSlug === regionSlug) ?? null
      return mockAsync(report, 400)
    },
    staleTime: 10 * 60 * 1000, // 10 dk
    enabled: !!regionSlug,
  })
}

// ─── Tapu OCR ────────────────────────────────────────────────────────────────

export function useTapuRisk(listingId: string): UseQueryResult<TapuExtract | null> {
  return useQuery({
    queryKey: aiKeys.tapu(listingId),
    queryFn: () => {
      const extract = tapuStore.list().find((t) => t.listingId === listingId) ?? null
      return mockAsync(extract, 300)
    },
    enabled: !!listingId,
  })
}

export interface UploadTapuInput {
  listingId: string
  /** Mock — gerçek upload yok, dosya adı bilgilendirme amaçlı. */
  fileName: string
  /**
   * Önceden bilinen alanlar (form prefill için). Eksiklerse mock OCR
   * makul varsayımlarla doldurur.
   */
  hints?: Partial<Pick<TapuExtract, 'ada' | 'parsel' | 'alan' | 'cins' | 'imarDurumu'>>
}

export function useUploadTapu(): UseMutationResult<TapuExtract, Error, UploadTapuInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input) => {
      // OCR simülasyonu — 1.5sn (gerçekçi). Mock değerler hint > default.
      const created = tapuStore.create({
        listingId: input.listingId,
        ada: input.hints?.ada ?? '0',
        parsel: input.hints?.parsel ?? '0',
        alan: input.hints?.alan ?? 1000,
        cins: input.hints?.cins ?? 'arsa',
        imarDurumu: input.hints?.imarDurumu ?? 'Konut, E:1.20',
        risks: [
          { type: 'temiz', severity: 'low', note: `${input.fileName} — tüm kayıtlar temiz` },
        ],
        ocrConfidence: 0.86,
        uploadedAt: new Date().toISOString(),
      })
      return mockAsync(created, 1500)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: aiKeys.tapu(vars.listingId) })
    },
  })
}

// ─── Conversations ───────────────────────────────────────────────────────────

export function useListAiConversations(): UseQueryResult<AiConversation[]> {
  return useQuery({
    queryKey: aiKeys.conversations.list(),
    queryFn: () => {
      // En son güncellenenden başla.
      const sorted = conversationsStore
        .list()
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      return mockAsync(sorted, 150)
    },
  })
}

export function useGetAiConversation(id: string): UseQueryResult<AiConversation | null> {
  return useQuery({
    queryKey: aiKeys.conversations.detail(id),
    queryFn: () => mockAsync(conversationsStore.get(id), 150),
    enabled: !!id,
  })
}

export interface CreateAiConversationInput {
  title: string
  firstMessage: string
  userId?: string
}

export function useCreateAiConversation(): UseMutationResult<
  AiConversation,
  Error,
  CreateAiConversationInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input) => {
      const now = new Date().toISOString()
      const aiAt = new Date(Date.now() + 800).toISOString()
      const created = conversationsStore.create({
        userId: input.userId ?? 'demo-user',
        title: input.title,
        createdAt: now,
        updatedAt: aiAt,
        messages: [
          { role: 'user', content: input.firstMessage, createdAt: now },
          {
            role: 'assistant',
            content: generateMockResponse(input.firstMessage),
            createdAt: aiAt,
          },
        ],
      })
      return mockAsync(created, 800)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiKeys.conversations.all() })
    },
  })
}

export interface AppendAiMessageInput {
  conversationId: string
  /** Kullanıcı mesajı — assistant cevabı otomatik üretilir. */
  content: string
}

export function useAppendAiMessage(): UseMutationResult<
  AiConversation,
  Error,
  AppendAiMessageInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ conversationId, content }) => {
      const current = conversationsStore.get(conversationId)
      if (!current) return Promise.reject(new Error(`Conversation ${conversationId} not found`))

      const now = new Date().toISOString()
      const aiAt = new Date(Date.now() + 800).toISOString()
      const userMsg: AiMessage = { role: 'user', content, createdAt: now }
      const aiMsg: AiMessage = {
        role: 'assistant',
        content: generateMockResponse(content),
        createdAt: aiAt,
      }
      const updated = conversationsStore.update(conversationId, {
        updatedAt: aiAt,
        messages: [...current.messages, userMsg, aiMsg],
      })
      if (!updated) return Promise.reject(new Error(`Append failed for ${conversationId}`))
      return mockAsync(updated, 800)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: aiKeys.conversations.detail(vars.conversationId) })
      qc.invalidateQueries({ queryKey: aiKeys.conversations.list() })
    },
  })
}

export function useDeleteAiConversation(): UseMutationResult<{ id: string }, Error, string> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      conversationsStore.remove(id)
      return mockAsync({ id }, 150)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiKeys.conversations.all() })
    },
  })
}

// ─── Notification Prefs ──────────────────────────────────────────────────────

export function useAiNotificationPrefs(userId: string): UseQueryResult<AiNotificationPref> {
  return useQuery({
    queryKey: aiKeys.notificationPrefs(userId),
    queryFn: () => {
      const prefs = readNotifPrefs()
      // userId mismatch durumunda default'a fallback (mock — tek user senaryosu).
      const result = prefs.userId === userId ? prefs : { ...prefs, userId }
      return mockAsync(result, 120)
    },
    enabled: !!userId,
  })
}

export interface UpdateAiNotificationPrefsInput {
  userId: string
  patch: Partial<Omit<AiNotificationPref, 'userId'>>
}

export function useUpdateAiNotificationPrefs(): UseMutationResult<
  AiNotificationPref,
  Error,
  UpdateAiNotificationPrefsInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, patch }) => {
      const current = readNotifPrefs()
      const next: AiNotificationPref = {
        ...current,
        ...patch,
        userId,
        // perEvent merge — tüm key'leri koru, sadece patch'lenenleri override et.
        perEvent: {
          ...current.perEvent,
          ...(patch.perEvent ?? {}),
        },
      }
      writeNotifPrefs(next)
      return mockAsync(next, 200)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: aiKeys.notificationPrefs(vars.userId) })
    },
  })
}
