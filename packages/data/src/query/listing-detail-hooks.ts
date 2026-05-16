/**
 * TanStack Query v5 hooks — listing-detail domain (Wave F37 / Faz 1).
 *
 * Mock-only. F33/F34/F35 ile aynı pattern:
 *   - `mockAsync(value, latency)` ile gerçekçi gecikme
 *   - query key array — `['listing-detail', op, ...args]`
 *   - mutations: stale invalidation (optimistic gerekirse override)
 *
 * SSE yok — F33 kullanıcı kararı (basit AI response, 800ms delay).
 *
 * Hooks (12 toplam):
 *   - useListingExtended(listingId)        → query
 *   - useEncumbrances(listingId)           → query
 *   - useImarPlan(listingId)               → query
 *   - useFarmlandData(listingId)           → query (sadece tarım vasıflı)
 *   - useHazardScores(listingId)           → query
 *   - useEnvironmentPoi(listingId)         → query
 *   - useVerificationBadges(listingId)     → query
 *   - useListingChatThread(listingId)      → query (varolan thread veya null)
 *   - useAskListingChat()                  → mutation: { listingId, question }
 *   - useCompareSnapshot(listingId)        → query (3-col compare)
 *   - useTriggerPriceAlert()               → mutation (action chip)
 *   - useReportListing()                   → mutation (action chip)
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { generateMockResponse } from '../lib/ai-helpers'
import { ENVIRONMENT_POI } from '../mock/environment-poi'
import { FARMLAND_DATA } from '../mock/farmland-data'
import { HAZARD_SCORES } from '../mock/hazard-scores'
import { IMAR_PLANS } from '../mock/imar-plans'
import { LISTINGS } from '../mock/listings'
import { LISTING_EXTENDED } from '../mock/listing-extended'
import { TKGM_ENCUMBRANCES } from '../mock/tkgm-encumbrances'
import { VERIFICATION_BADGES } from '../mock/verification-badges'
import type {
  CompareRow,
  CompareSnapshot,
  CompareTone,
  EnvironmentPoi,
  Encumbrance,
  EncumbranceCategory,
  FarmlandData,
  HazardScore,
  ImarPlan,
  ListingChatMessage,
  ListingChatThread,
  ListingExtended,
  VerificationBadge,
} from '../types/listing-detail'
import { mockAsync } from './mock-latency'

// ─── Query keys ──────────────────────────────────────────────────────────────

export const listingDetailKeys = {
  all: ['listing-detail'] as const,
  extended: (listingId: string) => [...listingDetailKeys.all, 'extended', listingId] as const,
  encumbrances: (listingId: string) => [...listingDetailKeys.all, 'encumbrances', listingId] as const,
  imarPlan: (listingId: string) => [...listingDetailKeys.all, 'imar-plan', listingId] as const,
  farmland: (listingId: string) => [...listingDetailKeys.all, 'farmland', listingId] as const,
  hazard: (listingId: string) => [...listingDetailKeys.all, 'hazard', listingId] as const,
  environment: (listingId: string) => [...listingDetailKeys.all, 'environment', listingId] as const,
  badges: (listingId: string) => [...listingDetailKeys.all, 'badges', listingId] as const,
  chat: (listingId: string) => [...listingDetailKeys.all, 'chat', listingId] as const,
  compare: (listingId: string) => [...listingDetailKeys.all, 'compare', listingId] as const,
}

// ─── In-memory caches (id'siz domain'ler için) ───────────────────────────────
//
// `ListingExtended`, `ImarPlan`, `FarmlandData`, `HazardScore`,
// `EnvironmentPoi` hepsi `{listingId: string}` taşır ama `{id: string}`
// taşımaz → createLocalStore constraint'ine uymaz. Bu hook seti read-only
// olduğu için (write yok) basit Map cache + seed lookup yeterli.
//
// `Encumbrance` `{id: string}` taşır ama tek-listing scope (write yok),
// yine read-only — Map yeterli. `VerificationBadge` zaten Record map.

const EXTENDED_CACHE = new Map<string, ListingExtended>()
for (const e of LISTING_EXTENDED) EXTENDED_CACHE.set(e.listingId, e)

const IMAR_CACHE = new Map<string, ImarPlan>()
for (const p of IMAR_PLANS) IMAR_CACHE.set(p.listingId, p)

const FARMLAND_CACHE = new Map<string, FarmlandData>()
for (const f of FARMLAND_DATA) FARMLAND_CACHE.set(f.listingId, f)

const HAZARD_CACHE = new Map<string, HazardScore>()
for (const h of HAZARD_SCORES) HAZARD_CACHE.set(h.listingId, h)

const POI_CACHE = new Map<string, EnvironmentPoi>()
for (const p of ENVIRONMENT_POI) POI_CACHE.set(p.listingId, p)

const ENCUMBRANCE_INDEX = new Map<string, Encumbrance[]>()
for (const e of TKGM_ENCUMBRANCES) {
  const arr = ENCUMBRANCE_INDEX.get(e.listingId) ?? []
  arr.push(e)
  ENCUMBRANCE_INDEX.set(e.listingId, arr)
}

/**
 * AI Chat — `ListingChatThread` thread-per-listing. Per-page state, write var
 * (`useAskListingChat` mutation thread'e mesaj ekler). localStorage adapter
 * kullanmıyoruz çünkü `id` field thread-level (`{id: string}` constraint OK
 * aslında) ama tek-thread-per-listing semantiği için Map cache + getOrCreate
 * paterni daha temiz. Sayfa yenilenince cache reset (mock UX kabul edilebilir).
 */
const CHAT_CACHE = new Map<string, ListingChatThread>()

const DEFAULT_PROMPTS: readonly string[] = [
  'Buraya ev yapabilir miyim?',
  'Hisse durumu ne risk taşır?',
  'Komşu parsel satıldı mı?',
  'Tarım vasfı dönüştürülebilir mi?',
  'Bu fiyat piyasaya göre nasıl?',
  'Bağ evi izni alınabilir mi?',
] as const

function getOrCreateChatThread(listingId: string): ListingChatThread {
  const existing = CHAT_CACHE.get(listingId)
  if (existing) return existing
  const thread: ListingChatThread = {
    id: `chat-${listingId}`,
    listingId,
    messages: [
      {
        role: 'assistant',
        content:
          'Bu parsel hakkında 14 katmandaki tüm verilere erişimim var (tapu, imar, afet, çevre, emsal). Sormak istediğin konuyu yazabilirsin.',
        createdAt: new Date('2026-05-01T12:00:00.000Z').toISOString(),
      },
    ],
    suggestedPrompts: [...DEFAULT_PROMPTS],
  }
  CHAT_CACHE.set(listingId, thread)
  return thread
}

// ─── Listing Extended ────────────────────────────────────────────────────────

export function useListingExtended(listingId: string): UseQueryResult<ListingExtended | null> {
  return useQuery({
    queryKey: listingDetailKeys.extended(listingId),
    queryFn: () => {
      const found = EXTENDED_CACHE.get(listingId) ?? null
      // Defensive shallow clone (badges nested array)
      const cloned = found
        ? { ...found, badges: found.badges.map((b) => ({ ...b })) }
        : null
      return mockAsync(cloned, 200)
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!listingId,
  })
}

// ─── Encumbrances ────────────────────────────────────────────────────────────

export function useEncumbrances(listingId: string): UseQueryResult<Encumbrance[]> {
  return useQuery({
    queryKey: listingDetailKeys.encumbrances(listingId),
    queryFn: () => {
      const order: Record<EncumbranceCategory, number> = { temiz: 0, dikkat: 1, kritik: 2 }
      const list = (ENCUMBRANCE_INDEX.get(listingId) ?? [])
        .map((e) => ({ ...e }))
        .sort((a, b) => order[a.category] - order[b.category])
      return mockAsync(list, 250)
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!listingId,
  })
}

// ─── İmar Plan ───────────────────────────────────────────────────────────────

export function useImarPlan(listingId: string): UseQueryResult<ImarPlan | null> {
  return useQuery({
    queryKey: listingDetailKeys.imarPlan(listingId),
    queryFn: () => {
      const found = IMAR_CACHE.get(listingId)
      const cloned = found ? { ...found, cekme: { ...found.cekme } } : null
      return mockAsync(cloned, 250)
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!listingId,
  })
}

// ─── Farmland (sadece tarım vasıflı listing'ler) ─────────────────────────────

export function useFarmlandData(listingId: string): UseQueryResult<FarmlandData | null> {
  return useQuery({
    queryKey: listingDetailKeys.farmland(listingId),
    queryFn: () => {
      const found = FARMLAND_CACHE.get(listingId)
      const cloned = found
        ? {
            ...found,
            iklim: { ...found.iklim },
            ekimGecmisi: found.ekimGecmisi.map((e) => ({ ...e })),
            yatirimHesap: found.yatirimHesap.map((y) => ({ ...y })),
          }
        : null
      return mockAsync(cloned, 300)
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!listingId,
  })
}

// ─── Hazard Scores ───────────────────────────────────────────────────────────

export function useHazardScores(listingId: string): UseQueryResult<HazardScore | null> {
  return useQuery({
    queryKey: listingDetailKeys.hazard(listingId),
    queryFn: () => {
      const found = HAZARD_CACHE.get(listingId)
      const cloned = found
        ? {
            ...found,
            scores: { ...found.scores, deprem: { ...found.scores.deprem } },
            kaynaklar: [...found.kaynaklar],
          }
        : null
      return mockAsync(cloned, 250)
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!listingId,
  })
}

// ─── Environment / POI ───────────────────────────────────────────────────────

export function useEnvironmentPoi(listingId: string): UseQueryResult<EnvironmentPoi | null> {
  return useQuery({
    queryKey: listingDetailKeys.environment(listingId),
    queryFn: () => {
      const found = POI_CACHE.get(listingId)
      const cloned = found
        ? { ...found, poi: found.poi.map((p) => ({ ...p })) }
        : null
      return mockAsync(cloned, 250)
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!listingId,
  })
}

// ─── Verification Badges ─────────────────────────────────────────────────────

export function useVerificationBadges(listingId: string): UseQueryResult<VerificationBadge[]> {
  return useQuery({
    queryKey: listingDetailKeys.badges(listingId),
    queryFn: () => {
      const list = VERIFICATION_BADGES[listingId] ?? []
      const cloned = list.map((b) => ({ ...b }))
      return mockAsync(cloned, 200)
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!listingId,
  })
}

// ─── Listing Chat (J bölümü) ─────────────────────────────────────────────────

export function useListingChatThread(listingId: string): UseQueryResult<ListingChatThread> {
  return useQuery({
    queryKey: listingDetailKeys.chat(listingId),
    queryFn: () => {
      const thread = getOrCreateChatThread(listingId)
      // Defensive deep clone (mesajlar mutation ile uzar)
      const cloned: ListingChatThread = {
        ...thread,
        messages: thread.messages.map((m) => ({
          ...m,
          sources: m.sources ? [...m.sources] : undefined,
        })),
        suggestedPrompts: [...thread.suggestedPrompts],
      }
      return mockAsync(cloned, 150)
    },
    enabled: !!listingId,
  })
}

export interface AskListingChatInput {
  listingId: string
  question: string
}

export function useAskListingChat(): UseMutationResult<ListingChatThread, Error, AskListingChatInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ listingId, question }) => {
      const thread = getOrCreateChatThread(listingId)
      const now = new Date().toISOString()
      const aiAt = new Date(Date.now() + 800).toISOString()
      const userMsg: ListingChatMessage = {
        role: 'user',
        content: question,
        createdAt: now,
      }
      const aiMsg: ListingChatMessage = {
        role: 'assistant',
        content: generateMockResponse(question),
        // RAG citation mock — 1-2 katman referansı
        sources: ['TKGM tapu kaydı', 'AFAD risk haritası'],
        createdAt: aiAt,
      }
      thread.messages.push(userMsg, aiMsg)
      // 800ms skeleton (F33 kararı — SSE yok)
      const cloned: ListingChatThread = {
        ...thread,
        messages: thread.messages.map((m) => ({
          ...m,
          sources: m.sources ? [...m.sources] : undefined,
        })),
        suggestedPrompts: [...thread.suggestedPrompts],
      }
      return mockAsync(cloned, 800)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: listingDetailKeys.chat(vars.listingId) })
    },
  })
}

// ─── Compare Snapshot (K bölümü) ─────────────────────────────────────────────
//
// Bu listing + 2 random comparable (LISTINGS'ten city eşleşmesi tercih edilir)
// → 6 satır karşılaştırma. Tüm hesaplamalar deterministik (test-safe).

function pickComparables(listingId: string): [string, string] {
  const target = LISTINGS.find((l) => l.id === listingId)
  // Önce aynı şehirden, yoksa global ilk 2 (kendisi hariç)
  const sameCity = LISTINGS.filter((l) => l.id !== listingId && l.city === target?.city)
  const pool = sameCity.length >= 2 ? sameCity : LISTINGS.filter((l) => l.id !== listingId)
  const c1 = pool[0]?.id ?? listingId
  const c2 = pool[1]?.id ?? listingId
  return [c1, c2]
}

function fmtTL(kurusOrTl: number, isKurus: boolean): string {
  const tl = isKurus ? kurusOrTl / 100 : kurusOrTl
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(tl)
}

function buildCompareRows(
  thisId: string,
  c1Id: string,
  c2Id: string,
): CompareRow[] {
  const ids = [thisId, c1Id, c2Id] as const
  const listings = ids.map((id) => LISTINGS.find((l) => l.id === id))
  const exts = ids.map((id) => EXTENDED_CACHE.get(id))
  const hazards = ids.map((id) => HAZARD_CACHE.get(id))
  const imars = ids.map((id) => IMAR_CACHE.get(id))

  const sizes = listings.map((l) => l?.size ?? 0)
  const prices = listings.map((l) => l?.price ?? 0)
  const pricesPerM2 = sizes.map((s, i) => (s > 0 ? Math.round(prices[i] / s) : 0))

  function toneByValue(values: number[], idx: number, higherIsBetter: boolean): CompareTone {
    const sorted = [...values].sort((a, b) => (higherIsBetter ? b - a : a - b))
    const rank = sorted.indexOf(values[idx])
    if (rank === 0) return 'good'
    if (rank === sorted.length - 1) return 'risk'
    return 'warn'
  }

  // Risk skoru = deprem + sel + heyelan + yangın ortalaması (0-100)
  const riskScores = hazards.map((h) => {
    if (!h) return 0
    const s = h.scores
    return Math.round((s.deprem.skor + s.selSkor + s.heyelanSkor + s.yanginSkor) / 4)
  })

  // KAKS (imar)
  const kaksValues = imars.map((p) => p?.kaks ?? 0)

  return [
    {
      metric: 'Yüzölçümü',
      thisValue: `${sizes[0].toLocaleString('tr-TR')} m²`,
      comp1Value: `${sizes[1].toLocaleString('tr-TR')} m²`,
      comp2Value: `${sizes[2].toLocaleString('tr-TR')} m²`,
      thisTone: toneByValue(sizes, 0, true),
      comp1Tone: toneByValue(sizes, 1, true),
      comp2Tone: toneByValue(sizes, 2, true),
    },
    {
      metric: '₺/m²',
      thisValue: fmtTL(pricesPerM2[0], false),
      comp1Value: fmtTL(pricesPerM2[1], false),
      comp2Value: fmtTL(pricesPerM2[2], false),
      thisTone: toneByValue(pricesPerM2, 0, false),
      comp1Tone: toneByValue(pricesPerM2, 1, false),
      comp2Tone: toneByValue(pricesPerM2, 2, false),
    },
    {
      metric: 'Mülkiyet',
      thisValue: exts[0]?.mulkiyetTipi === 'mustakil' ? 'Müstakil' : `Hisseli ${exts[0]?.hisseOrani ? `(${(exts[0].hisseOrani * 100).toFixed(0)}%)` : ''}`,
      comp1Value: exts[1]?.mulkiyetTipi === 'mustakil' ? 'Müstakil' : `Hisseli`,
      comp2Value: exts[2]?.mulkiyetTipi === 'mustakil' ? 'Müstakil' : `Hisseli`,
      thisTone: exts[0]?.mulkiyetTipi === 'mustakil' ? 'good' : 'warn',
      comp1Tone: exts[1]?.mulkiyetTipi === 'mustakil' ? 'good' : 'warn',
      comp2Tone: exts[2]?.mulkiyetTipi === 'mustakil' ? 'good' : 'warn',
    },
    {
      metric: 'İmar (KAKS)',
      thisValue: kaksValues[0].toFixed(2),
      comp1Value: kaksValues[1].toFixed(2),
      comp2Value: kaksValues[2].toFixed(2),
      thisTone: toneByValue(kaksValues, 0, true),
      comp1Tone: toneByValue(kaksValues, 1, true),
      comp2Tone: toneByValue(kaksValues, 2, true),
    },
    {
      metric: 'Risk skoru',
      thisValue: `${riskScores[0]}/100`,
      comp1Value: `${riskScores[1]}/100`,
      comp2Value: `${riskScores[2]}/100`,
      thisTone: toneByValue(riskScores, 0, false),
      comp1Tone: toneByValue(riskScores, 1, false),
      comp2Tone: toneByValue(riskScores, 2, false),
    },
    {
      metric: 'AI değer farkı',
      // Mock — AI estimate'e göre değil, listing fiyat farkı baseline
      thisValue: '0%',
      comp1Value: prices[0] > 0 ? `${(((prices[1] - prices[0]) / prices[0]) * 100).toFixed(0)}%` : '—',
      comp2Value: prices[0] > 0 ? `${(((prices[2] - prices[0]) / prices[0]) * 100).toFixed(0)}%` : '—',
      thisTone: 'good',
      comp1Tone: prices[1] < prices[0] ? 'good' : 'warn',
      comp2Tone: prices[2] < prices[0] ? 'good' : 'warn',
    },
  ]
}

export function useCompareSnapshot(listingId: string): UseQueryResult<CompareSnapshot | null> {
  return useQuery({
    queryKey: listingDetailKeys.compare(listingId),
    queryFn: () => {
      const target = LISTINGS.find((l) => l.id === listingId)
      if (!target) return mockAsync(null, 200)
      const [c1, c2] = pickComparables(listingId)
      const snap: CompareSnapshot = {
        thisListingId: listingId,
        comparison1Id: c1,
        comparison2Id: c2,
        rows: buildCompareRows(listingId, c1, c2),
      }
      return mockAsync(snap, 350)
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!listingId,
  })
}

// ─── Action chip mutations ───────────────────────────────────────────────────

export interface TriggerPriceAlertInput {
  listingId: string
  /** Hedef fiyat (kuruş) — kullanıcı eşik. Undefined = "ilan fiyat değişirse haber ver". */
  targetPrice?: number
  channels?: ReadonlyArray<'email' | 'push' | 'sms'>
}

export interface TriggerPriceAlertResult {
  /** Mock — server tarafı alarm id. */
  alertId: string
  listingId: string
  enabled: boolean
}

export function useTriggerPriceAlert(): UseMutationResult<
  TriggerPriceAlertResult,
  Error,
  TriggerPriceAlertInput
> {
  return useMutation({
    mutationFn: ({ listingId }) => {
      // Mock — gerçek backend yok, optimistic OK döner.
      return mockAsync(
        {
          alertId: `pa-${listingId}-${Date.now().toString(36)}`,
          listingId,
          enabled: true,
        },
        300,
      )
    },
  })
}

export interface ReportListingInput {
  listingId: string
  /** Şikayet sebebi (örn. "Yanıltıcı fiyat", "Sahte ilan", "İçerik uygunsuz"). */
  reason: string
  /** İsteğe bağlı kullanıcı notu. */
  note?: string
}

export interface ReportListingResult {
  reportId: string
  listingId: string
  status: 'received'
}

export function useReportListing(): UseMutationResult<
  ReportListingResult,
  Error,
  ReportListingInput
> {
  return useMutation({
    mutationFn: ({ listingId }) => {
      return mockAsync(
        {
          reportId: `rp-${listingId}-${Date.now().toString(36)}`,
          listingId,
          status: 'received' as const,
        },
        400,
      )
    },
  })
}
