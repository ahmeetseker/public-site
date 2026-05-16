/**
 * TanStack Query v5 hooks — billing domain (Wave F32).
 *
 * Mock-only: backend henüz yok, hooks `createLocalStore` üzerinden CRUD yapar.
 * Mutations: optimistic update + invalidation. Mevcut packages/data pattern'i:
 * - `mockAsync(value, latency)` ile gerçekçi gecikme
 * - query key array — `[domain, op, ...args]`
 * - onMutate: cancel + snapshot + setQueryData
 * - onError: rollback to snapshot
 * - onSettled: invalidate
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { createLocalStore } from '../adapters/local-storage'
import { PAYMENTS_INDIVIDUAL } from '../mock/billing-payments'
import { INVOICES_INDIVIDUAL } from '../mock/billing-invoices'
import { TRANSACTIONS_INDIVIDUAL } from '../mock/billing-transactions'
import {
  OFFICE_BILLING_PROFILE,
  OFFICE_INVOICES,
  OFFICE_SUBSCRIPTION,
} from '../mock/billing-office'
import { PAYMENTS_PLATFORM, REFUND_REQUESTS } from '../mock/billing-platform'
import type {
  BillingProfile,
  Invoice,
  OfficeSubscription,
  Payment,
  Plan,
  RefundRequest,
} from '../types/billing'
import { mockAsync } from './mock-latency'

// ─── Stores ──────────────────────────────────────────────────────────────────

const paymentsStore = createLocalStore<Payment>('billing.payments', PAYMENTS_INDIVIDUAL)
const invoicesStore = createLocalStore<Invoice>('billing.invoices', INVOICES_INDIVIDUAL)
const officeInvoicesStore = createLocalStore<Invoice>('billing.office-invoices', OFFICE_INVOICES)
const officeSubscriptionStore = createLocalStore<OfficeSubscription>(
  'billing.office-subscription',
  [OFFICE_SUBSCRIPTION],
)
const billingProfileStore = createLocalStore<BillingProfile>(
  'billing.profile',
  [OFFICE_BILLING_PROFILE],
)
const platformPaymentsStore = createLocalStore<Payment>(
  'billing.platform-payments',
  PAYMENTS_PLATFORM,
)
const refundsStore = createLocalStore<RefundRequest>('billing.refunds', REFUND_REQUESTS)

// ─── Plans (static — UI vitrin) ──────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: 'plan-free',
    tier: 'free',
    name: 'Ücretsiz',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'TRY',
    tagline: 'Başlamak için yeterli',
    features: [
      { label: 'Aylık 3 ilan', included: true },
      { label: 'Temel istatistik', included: true },
      { label: 'Standart destek', included: true },
      { label: 'Öne çıkarma kredisi', included: false },
      { label: 'Premium analitik', included: false },
    ],
  },
  {
    id: 'plan-plus',
    tier: 'plus',
    name: 'Plus',
    monthlyPrice: 299_00,
    yearlyPrice: 2990_00,
    currency: 'TRY',
    tagline: 'Aktif satıcılar için',
    highlighted: true,
    features: [
      { label: 'Aylık 15 ilan', included: true },
      { label: '5 öne çıkarma kredisi/ay', included: true },
      { label: 'Gelişmiş istatistik', included: true },
      { label: 'Öncelikli destek', included: true },
      { label: 'Premium analitik', included: false },
    ],
  },
  {
    id: 'plan-pro',
    tier: 'pro',
    name: 'Pro',
    monthlyPrice: 1499_00,
    yearlyPrice: 14990_00,
    currency: 'TRY',
    tagline: 'Profesyonel emlakçılar için',
    features: [
      { label: 'Aylık 50 ilan', included: true },
      { label: '20 öne çıkarma kredisi/ay', included: true },
      { label: 'Gelişmiş istatistik + rakip analizi', included: true },
      { label: '7/24 destek', included: true },
      { label: 'Premium analitik', included: true },
    ],
  },
  {
    id: 'plan-business',
    tier: 'business',
    name: 'İşletme',
    monthlyPrice: 4999_00,
    yearlyPrice: 49990_00,
    currency: 'TRY',
    tagline: 'Emlak ofisleri için',
    features: [
      { label: 'Sınırsız ilan', included: true },
      { label: 'Sınırsız öne çıkarma', included: true },
      { label: 'Çoklu kullanıcı (5 koltuk)', included: true },
      { label: 'API erişimi + entegrasyonlar', included: true },
      { label: 'Atanmış hesap müdürü', included: true },
    ],
  },
]

// ─── Query keys ──────────────────────────────────────────────────────────────

export const billingKeys = {
  all: ['billing'] as const,
  plans: () => [...billingKeys.all, 'plans'] as const,
  payments: {
    all: () => [...billingKeys.all, 'payments'] as const,
    list: (filter?: { status?: Payment['status']; tenantId?: string }) =>
      [...billingKeys.payments.all(), 'list', filter ?? {}] as const,
    detail: (id: string) => [...billingKeys.payments.all(), 'detail', id] as const,
  },
  invoices: {
    all: () => [...billingKeys.all, 'invoices'] as const,
    detail: (id: string) => [...billingKeys.invoices.all(), 'detail', id] as const,
  },
  transactions: {
    all: () => [...billingKeys.all, 'transactions'] as const,
    list: () => [...billingKeys.transactions.all(), 'list'] as const,
  },
  officeSubscription: () => [...billingKeys.all, 'office-subscription'] as const,
  officeInvoices: () => [...billingKeys.all, 'office-invoices'] as const,
  billingProfile: () => [...billingKeys.all, 'billing-profile'] as const,
  platformPayments: (filter?: { status?: Payment['status']; tenantId?: string }) =>
    [...billingKeys.all, 'platform-payments', filter ?? {}] as const,
  refunds: {
    all: () => [...billingKeys.all, 'refunds'] as const,
    queue: () => [...billingKeys.refunds.all(), 'queue'] as const,
  },
}

// ─── Plans ───────────────────────────────────────────────────────────────────

export function usePlans(): UseQueryResult<Plan[]> {
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: () => mockAsync(PLANS, 80),
  })
}

// ─── Payments (bireysel) ─────────────────────────────────────────────────────

export interface CreatePaymentInput {
  amount: number
  method: Payment['method']
  description: string
  cardMasked?: string
}

export function useCreatePayment(): UseMutationResult<Payment, Error, CreatePaymentInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) => {
      const created = paymentsStore.create({
        userId: 'user-self',
        currency: 'TRY',
        status: 'pending',
        createdAt: new Date().toISOString(),
        ...input,
      })
      return mockAsync(created, 350)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: billingKeys.payments.all() })
      qc.invalidateQueries({ queryKey: billingKeys.transactions.all() })
    },
  })
}

export interface PaymentListFilter {
  status?: Payment['status']
}

export function useListPayments(filter: PaymentListFilter = {}): UseQueryResult<Payment[]> {
  return useQuery({
    queryKey: billingKeys.payments.list(filter),
    queryFn: () => {
      const all = paymentsStore.list()
      const filtered = filter.status ? all.filter((p) => p.status === filter.status) : all
      return mockAsync(filtered)
    },
  })
}

export function useGetPayment(id: string): UseQueryResult<Payment | null> {
  return useQuery({
    queryKey: billingKeys.payments.detail(id),
    queryFn: () => mockAsync(paymentsStore.get(id)),
    enabled: !!id,
  })
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export function useGetInvoice(id: string): UseQueryResult<Invoice | null> {
  return useQuery({
    queryKey: billingKeys.invoices.detail(id),
    queryFn: () => mockAsync(invoicesStore.get(id)),
    enabled: !!id,
  })
}

// ─── Transactions ────────────────────────────────────────────────────────────

const transactionsStore = createLocalStore('billing.transactions', TRANSACTIONS_INDIVIDUAL)

export function useListTransactions(): UseQueryResult<typeof TRANSACTIONS_INDIVIDUAL> {
  return useQuery({
    queryKey: billingKeys.transactions.list(),
    queryFn: () => mockAsync(transactionsStore.list()),
  })
}

// ─── Office subscription (atolye-admin) ──────────────────────────────────────

export function useOfficeSubscription(): UseQueryResult<OfficeSubscription | null> {
  return useQuery({
    queryKey: billingKeys.officeSubscription(),
    queryFn: () => {
      const list = officeSubscriptionStore.list()
      return mockAsync(list[0] ?? null)
    },
  })
}

export interface UpdateSubscriptionInput {
  planId?: string
  planName?: string
  seats?: number
  cycle?: OfficeSubscription['cycle']
  status?: OfficeSubscription['status']
}

interface UpdateSubscriptionContext {
  previous: OfficeSubscription | null | undefined
}

export function useUpdateSubscription(): UseMutationResult<
  OfficeSubscription,
  Error,
  UpdateSubscriptionInput,
  UpdateSubscriptionContext
> {
  const qc = useQueryClient()
  return useMutation<OfficeSubscription, Error, UpdateSubscriptionInput, UpdateSubscriptionContext>({
    mutationFn: (patch) => {
      const current = officeSubscriptionStore.list()[0]
      if (!current) return Promise.reject(new Error('Subscription not found'))
      const updated = officeSubscriptionStore.update(current.id, patch)
      if (!updated) return Promise.reject(new Error('Update failed'))
      return mockAsync(updated, 250)
    },
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: billingKeys.officeSubscription() })
      const previous = qc.getQueryData<OfficeSubscription | null>(billingKeys.officeSubscription())
      if (previous) {
        qc.setQueryData<OfficeSubscription | null>(billingKeys.officeSubscription(), {
          ...previous,
          ...patch,
        })
      }
      return { previous }
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(billingKeys.officeSubscription(), ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: billingKeys.officeSubscription() })
    },
  })
}

// ─── Office invoices (atolye-admin) ──────────────────────────────────────────

export function useListOfficeInvoices(): UseQueryResult<Invoice[]> {
  return useQuery({
    queryKey: billingKeys.officeInvoices(),
    queryFn: () => mockAsync(officeInvoicesStore.list()),
  })
}

// ─── Billing profile (atolye-admin) ──────────────────────────────────────────

export function useBillingProfile(): UseQueryResult<BillingProfile | null> {
  return useQuery({
    queryKey: billingKeys.billingProfile(),
    queryFn: () => {
      const list = billingProfileStore.list()
      return mockAsync(list[0] ?? null)
    },
  })
}

interface UpdateBillingProfileContext {
  previous: BillingProfile | null | undefined
}

export function useUpdateBillingProfile(): UseMutationResult<
  BillingProfile,
  Error,
  Partial<BillingProfile>,
  UpdateBillingProfileContext
> {
  const qc = useQueryClient()
  return useMutation<BillingProfile, Error, Partial<BillingProfile>, UpdateBillingProfileContext>({
    mutationFn: (patch) => {
      const current = billingProfileStore.list()[0]
      if (!current) return Promise.reject(new Error('Billing profile not found'))
      const updated = billingProfileStore.update(current.id, patch)
      if (!updated) return Promise.reject(new Error('Update failed'))
      return mockAsync(updated, 250)
    },
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: billingKeys.billingProfile() })
      const previous = qc.getQueryData<BillingProfile | null>(billingKeys.billingProfile())
      if (previous) {
        qc.setQueryData<BillingProfile | null>(billingKeys.billingProfile(), {
          ...previous,
          ...patch,
        })
      }
      return { previous }
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(billingKeys.billingProfile(), ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: billingKeys.billingProfile() })
    },
  })
}

// ─── Platform payments (super-admin) ─────────────────────────────────────────

export interface PlatformPaymentFilter {
  status?: Payment['status']
  tenantId?: string
}

export function useAllPayments(
  filter: PlatformPaymentFilter = {},
): UseQueryResult<Payment[]> {
  return useQuery({
    queryKey: billingKeys.platformPayments(filter),
    queryFn: () => {
      let rows = platformPaymentsStore.list()
      if (filter.status) rows = rows.filter((p) => p.status === filter.status)
      if (filter.tenantId) rows = rows.filter((p) => p.tenantId === filter.tenantId)
      return mockAsync(rows)
    },
  })
}

// ─── Refunds (super-admin) ───────────────────────────────────────────────────

export function useRefundQueue(): UseQueryResult<RefundRequest[]> {
  return useQuery({
    queryKey: billingKeys.refunds.queue(),
    queryFn: () => mockAsync(refundsStore.list()),
  })
}

interface ResolveRefundInput {
  id: string
  note?: string
}

interface RefundContext {
  previous: RefundRequest[] | undefined
}

export function useApproveRefund(): UseMutationResult<
  RefundRequest,
  Error,
  ResolveRefundInput,
  RefundContext
> {
  const qc = useQueryClient()
  return useMutation<RefundRequest, Error, ResolveRefundInput, RefundContext>({
    mutationFn: ({ id, note }) => {
      const updated = refundsStore.update(id, {
        status: 'approved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'ops-current',
        ...(note !== undefined ? { resolutionNote: note } : {}),
      })
      if (!updated) return Promise.reject(new Error(`Refund ${id} not found`))
      return mockAsync(updated, 200)
    },
    onMutate: async ({ id, note }) => {
      await qc.cancelQueries({ queryKey: billingKeys.refunds.all() })
      const previous = qc.getQueryData<RefundRequest[]>(billingKeys.refunds.queue())
      qc.setQueryData<RefundRequest[]>(billingKeys.refunds.queue(), (old = []) =>
        old.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'approved',
                resolvedAt: new Date().toISOString(),
                resolvedBy: 'ops-current',
                ...(note !== undefined ? { resolutionNote: note } : {}),
              }
            : r,
        ),
      )
      return { previous }
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(billingKeys.refunds.queue(), ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: billingKeys.refunds.all() })
    },
  })
}

export function useRejectRefund(): UseMutationResult<
  RefundRequest,
  Error,
  ResolveRefundInput,
  RefundContext
> {
  const qc = useQueryClient()
  return useMutation<RefundRequest, Error, ResolveRefundInput, RefundContext>({
    mutationFn: ({ id, note }) => {
      const updated = refundsStore.update(id, {
        status: 'rejected',
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'ops-current',
        ...(note !== undefined ? { resolutionNote: note } : {}),
      })
      if (!updated) return Promise.reject(new Error(`Refund ${id} not found`))
      return mockAsync(updated, 200)
    },
    onMutate: async ({ id, note }) => {
      await qc.cancelQueries({ queryKey: billingKeys.refunds.all() })
      const previous = qc.getQueryData<RefundRequest[]>(billingKeys.refunds.queue())
      qc.setQueryData<RefundRequest[]>(billingKeys.refunds.queue(), (old = []) =>
        old.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'rejected',
                resolvedAt: new Date().toISOString(),
                resolvedBy: 'ops-current',
                ...(note !== undefined ? { resolutionNote: note } : {}),
              }
            : r,
        ),
      )
      return { previous }
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(billingKeys.refunds.queue(), ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: billingKeys.refunds.all() })
    },
  })
}
