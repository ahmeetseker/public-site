import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DEALS, STAGE_ORDER, dealsByStage, funnelData, stageStats } from '../mock/sales'
import type { Deal } from '../mock/sales'
import type { CustomerStage } from '../mock/types'
import { apiOrMock, landxApi } from '../api'
import { dealKeys } from './keys'
import { mockAsync } from './mock-latency'

// Wave 18 / Faz 12.12.b — SDK adoption. Hooks now go through `landxApi.deals.*`
// instead of raw apiGet/apiPost. The `apiOrMock` wrapper + mock fallback stay
// so unconfigured callers (tests, public-site preview) keep working.
//
// Type contract: api-types Deal is a structural subset of the domain Deal
// (the server route casts via `as unknown as Deal`). We hydrate the cache
// with the domain shape returned by the API envelope and let the consumer
// access the rich fields it always relied on (customerName, owner, …).
//
// Wave 19 / Faz 12.12.c — Cast survives. The contract Deal omits four
// load-bearing domain fields (customerName, listingTitle, owner, updatedAt)
// that the deals route serializes and the UI reads everywhere. Cast lifts
// the deliberately-narrowed wire payload back to the domain superset. Drop
// once the openapi Deal schema is widened (or projection helpers added in
// @landx/data/api).
export function useDeals() {
  return useQuery({
    queryKey: dealKeys.lists(),
    queryFn: () =>
      apiOrMock(
        // TODO faz19/openapi: api-types Deal missing customerName,
        // listingTitle, owner, updatedAt — add to openapi.yaml then drop.
        () => landxApi.deals.list().then((env) => env.data as unknown as Deal[]),
        () => mockAsync(DEALS),
      ),
  })
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: [...dealKeys.all, 'detail', id] as const,
    queryFn: () =>
      apiOrMock(
        // No dedicated `get` on the deals resource yet — fall back to filtering
        // the list response by id so the surface stays SDK-only. Once the
        // server exposes GET /deals/:id we'll swap to landxApi.deals.get(id).
        // TODO faz19/api-client: add deals.get(id) to the SDK + drop the
        // boundary cast (also waits on the api-types Deal widening above).
        () =>
          landxApi.deals
            .list()
            .then((env) => (env.data as unknown as Deal[]).find((d) => d.id === id) ?? null),
        () => mockAsync(DEALS.find((d) => d.id === id) ?? null),
      ),
    enabled: !!id,
  })
}

export function useDealsByStage(stage: CustomerStage) {
  return useQuery({
    queryKey: dealKeys.byStage(stage),
    queryFn: () =>
      apiOrMock(
        // The deals resource's `list` doesn't accept a stage param today; the
        // legacy fetch passed `?stage=…` but the server ignored it. Filter
        // client-side instead so the SDK adoption stays clean.
        // TODO faz19/api-client: extend deals.list({ stage }) once the
        // contract grows the optional query parameter.
        () =>
          landxApi.deals
            .list()
            .then((env) =>
              (env.data as unknown as Deal[]).filter((d) => d.stage === stage),
            ),
        () => mockAsync(dealsByStage(stage)),
      ),
  })
}

export function useFunnelData() {
  return useQuery({
    queryKey: dealKeys.funnel(),
    queryFn: () => mockAsync(funnelData()),
  })
}

export function useStageStats(stage: CustomerStage) {
  return useQuery({
    queryKey: dealKeys.stageStats(stage),
    queryFn: () => mockAsync(stageStats(stage)),
  })
}

export function useAllStageStats() {
  return useQuery({
    queryKey: [...dealKeys.all, 'all-stage-stats'] as const,
    queryFn: () =>
      mockAsync(STAGE_ORDER.map((stage) => ({ stage, ...stageStats(stage) }))),
  })
}

interface DealMoveInput {
  id: string
  toStage: CustomerStage
}

interface DealMoveContext {
  previous: Deal[] | undefined
}

export interface NewDealInput {
  customerName: string
  listingTitle: string
  value: number
  owner: string
  stage?: CustomerStage
  status?: Deal['status']
  customerId?: string
  listingId?: string
}

interface CreateDealContext {
  previous: Deal[] | undefined
  tempId: string
}

function buildCreatedDeal(input: NewDealInput): Deal {
  return {
    id: `D-${Date.now().toString().slice(-4)}`,
    customerId: input.customerId ?? `M-${Date.now().toString().slice(-4)}`,
    customerName: input.customerName,
    listingId: input.listingId ?? '',
    listingTitle: input.listingTitle,
    stage: input.stage ?? 'İlk temas',
    value: input.value,
    status: input.status ?? 'Aktif',
    owner: input.owner,
    updatedAt: new Date().toISOString(),
    daysInStage: 0,
  }
}

/**
 * Optimistic create. The server route does not yet expose POST /deals, so the
 * mutationFn is mock-only — it returns a freshly-synthesised Deal after the
 * standard latency. Optimistic flow mirrors `useCreateListing` /
 * `useCreateCustomer`: prepend to cache, roll back on error, invalidate on
 * settle. Wave-F3 (Wave 20) follow-up: wire to landxApi.deals.create() once
 * the SDK + server route land.
 */
export function useCreateDeal() {
  const qc = useQueryClient()
  return useMutation<Deal, Error, NewDealInput, CreateDealContext>({
    mutationFn: (input) => mockAsync(buildCreatedDeal(input), 250),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: dealKeys.lists() })
      const tempId = `TEMP.${Date.now()}`
      const previous = qc.getQueryData<Deal[]>(dealKeys.lists())
      const tempDeal: Deal = {
        ...buildCreatedDeal(input),
        id: tempId,
      }
      qc.setQueryData<Deal[]>(dealKeys.lists(), (old = []) => [tempDeal, ...old])
      return { previous, tempId }
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(dealKeys.lists(), ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: dealKeys.all })
    },
  })
}

export interface UpdateDealInput {
  id: string
  patch: Partial<
    Pick<
      Deal,
      | 'customerName'
      | 'listingTitle'
      | 'value'
      | 'stage'
      | 'status'
      | 'owner'
    >
  >
}

interface UpdateDealContext {
  previous: Deal[] | undefined
}

/**
 * Optimistic patch. Same caveat as `useCreateDeal` — server lacks PATCH
 * /deals/:id, so the mutationFn runs the patch against the cache's snapshot
 * via the mock seed. Optimistic onMutate keeps the Kanban responsive.
 */
export function useUpdateDeal() {
  const qc = useQueryClient()
  return useMutation<Deal, Error, UpdateDealInput, UpdateDealContext>({
    mutationFn: ({ id, patch }) => {
      const cached = qc.getQueryData<Deal[]>(dealKeys.lists()) ?? DEALS
      const current = cached.find((d) => d.id === id)
      if (!current) {
        return Promise.reject(new Error(`Deal not found: ${id}`))
      }
      const updated: Deal = {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString(),
      }
      return mockAsync(updated, 200)
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: dealKeys.lists() })
      const previous = qc.getQueryData<Deal[]>(dealKeys.lists())
      qc.setQueryData<Deal[]>(dealKeys.lists(), (old = []) =>
        old.map((d) =>
          d.id === id
            ? { ...d, ...patch, updatedAt: new Date().toISOString() }
            : d,
        ),
      )
      return { previous }
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(dealKeys.lists(), ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: dealKeys.all })
    },
  })
}

interface DeleteDealContext {
  previous: Deal[] | undefined
}

/**
 * Optimistic remove. Same caveat: server lacks DELETE /deals/:id, mock-only.
 * Optimistic onMutate filters the row out so the Kanban updates instantly.
 */
export function useDeleteDeal() {
  const qc = useQueryClient()
  return useMutation<void, Error, string, DeleteDealContext>({
    mutationFn: () => mockAsync(undefined, 150),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: dealKeys.lists() })
      const previous = qc.getQueryData<Deal[]>(dealKeys.lists())
      qc.setQueryData<Deal[]>(dealKeys.lists(), (old = []) =>
        old.filter((d) => d.id !== id),
      )
      return { previous }
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(dealKeys.lists(), ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: dealKeys.all })
    },
  })
}

// Optimistic move-deal mutation (Faz 8.1.c, fetch swap Faz 12.2.b, SDK adoption Faz 12.12.b).
// Pattern: setQueryData onMutate → rollback onError → invalidate onSettled.
// Cache is the single source of truth — no local mirror state needed in routes.
export function useDealMove() {
  const qc = useQueryClient()
  return useMutation<Deal, Error, DealMoveInput, DealMoveContext>({
    mutationFn: async ({ id, toStage }) =>
      apiOrMock<Deal>(
        // TODO faz19/openapi: same Deal field-widening prereq as useDeals().
        () =>
          landxApi.deals.move(id, toStage).then((env) => env.data as unknown as Deal),
        async () => {
          const deal = DEALS.find((d) => d.id === id)
          if (!deal) throw new Error(`Deal ${id} bulunamadı`)
          const updated: Deal = { ...deal, stage: toStage, daysInStage: 0 }
          return mockAsync(updated, 200)
        },
      ),
    onMutate: async ({ id, toStage }) => {
      await qc.cancelQueries({ queryKey: dealKeys.lists() })
      const previous = qc.getQueryData<Deal[]>(dealKeys.lists())
      qc.setQueryData<Deal[]>(dealKeys.lists(), (old = []) =>
        old.map((d) => (d.id === id ? { ...d, stage: toStage, daysInStage: 0 } : d)),
      )
      return { previous }
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(dealKeys.lists(), ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: dealKeys.lists() })
    },
  })
}
