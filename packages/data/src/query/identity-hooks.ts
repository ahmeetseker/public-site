/**
 * TanStack Query v5 hooks — identity domain (Wave F32).
 *
 * Bireysel doğrulama, kurumsal doğrulama, KYC review queue, bildirim tercih.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { createLocalStore } from '../adapters/local-storage'
import {
  KYC_QUEUE,
  NOTIFICATION_PREFS,
  OFFICE_VERIFICATION,
  PUBLIC_PROFILES,
  VERIFICATION_REQUESTS,
} from '../mock/identity'
import type {
  KycReviewItem,
  NotificationPrefs,
  OfficeVerification,
  OfficeVerificationDoc,
  PublicProfile,
  VerificationRequest,
  VerificationType,
} from '../types/identity'
import { mockAsync } from './mock-latency'

// ─── Stores ──────────────────────────────────────────────────────────────────

interface PrefsRow {
  id: string
  prefs: NotificationPrefs
}

const profilesStore = createLocalStore<PublicProfile & { id: string }>(
  'identity.public-profiles',
  PUBLIC_PROFILES.map((p) => ({ ...p, id: p.username })),
)
const verificationStore = createLocalStore<VerificationRequest>(
  'identity.verifications',
  VERIFICATION_REQUESTS,
)
const prefsStore = createLocalStore<PrefsRow>('identity.notification-prefs', [
  { id: NOTIFICATION_PREFS.userId, prefs: NOTIFICATION_PREFS },
])
const officeVerificationStore = createLocalStore<OfficeVerification>(
  'identity.office-verification',
  [OFFICE_VERIFICATION],
)
const kycStore = createLocalStore<KycReviewItem>('identity.kyc-queue', KYC_QUEUE)

// ─── Query keys ──────────────────────────────────────────────────────────────

export const identityKeys = {
  all: ['identity'] as const,
  publicProfile: (username: string) =>
    [...identityKeys.all, 'public-profile', username] as const,
  verifications: {
    all: () => [...identityKeys.all, 'verifications'] as const,
    list: () => [...identityKeys.verifications.all(), 'list'] as const,
    byType: (type: VerificationType) => [...identityKeys.verifications.all(), 'type', type] as const,
  },
  prefs: (userId: string) => [...identityKeys.all, 'prefs', userId] as const,
  officeVerification: () => [...identityKeys.all, 'office-verification'] as const,
  kyc: {
    all: () => [...identityKeys.all, 'kyc'] as const,
    queue: (filter?: { status?: KycReviewItem['status'] }) =>
      [...identityKeys.kyc.all(), 'queue', filter ?? {}] as const,
  },
}

// ─── Public profile (bireysel) ───────────────────────────────────────────────

export function useGetPublicProfile(username: string): UseQueryResult<PublicProfile | null> {
  return useQuery({
    queryKey: identityKeys.publicProfile(username),
    queryFn: () => {
      const all = profilesStore.list()
      const found = all.find((p) => p.username === username)
      return mockAsync(found ?? null)
    },
    enabled: !!username,
  })
}

// ─── Verification (bireysel) ─────────────────────────────────────────────────

export interface StartVerificationInput {
  type: VerificationType
  targetMasked?: string
}

export function useStartVerification(): UseMutationResult<
  VerificationRequest,
  Error,
  StartVerificationInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) => {
      const created = verificationStore.create({
        userId: 'user-self',
        status: 'pending',
        sentAt: new Date().toISOString(),
        ...input,
      })
      return mockAsync(created, 300)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: identityKeys.verifications.all() })
    },
  })
}

export function useGetVerificationStatus(
  type?: VerificationType,
): UseQueryResult<VerificationRequest[]> {
  return useQuery({
    queryKey: type ? identityKeys.verifications.byType(type) : identityKeys.verifications.list(),
    queryFn: () => {
      const all = verificationStore.list()
      return mockAsync(type ? all.filter((v) => v.type === type) : all)
    },
  })
}

// ─── Notification preferences ────────────────────────────────────────────────

export function useNotificationPrefs(
  userId: string = 'user-self',
): UseQueryResult<NotificationPrefs | null> {
  return useQuery({
    queryKey: identityKeys.prefs(userId),
    queryFn: () => {
      const row = prefsStore.get(userId)
      return mockAsync(row?.prefs ?? null)
    },
  })
}

interface UpdatePrefsContext {
  previous: NotificationPrefs | null | undefined
}

export function useUpdateNotificationPrefs(
  userId: string = 'user-self',
): UseMutationResult<NotificationPrefs, Error, NotificationPrefs, UpdatePrefsContext> {
  const qc = useQueryClient()
  return useMutation<NotificationPrefs, Error, NotificationPrefs, UpdatePrefsContext>({
    mutationFn: (next) => {
      const updated = prefsStore.update(userId, { prefs: next })
      if (!updated) {
        // Yoksa create et
        const created = prefsStore.create({ id: userId, prefs: next } as Omit<PrefsRow, 'id'> & { id: string })
        return mockAsync(created.prefs, 200)
      }
      return mockAsync(updated.prefs, 200)
    },
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: identityKeys.prefs(userId) })
      const previous = qc.getQueryData<NotificationPrefs | null>(identityKeys.prefs(userId))
      qc.setQueryData<NotificationPrefs | null>(identityKeys.prefs(userId), next)
      return { previous }
    },
    onError: (_err, _next, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(identityKeys.prefs(userId), ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: identityKeys.prefs(userId) })
    },
  })
}

// ─── Office verification (atolye-admin) ──────────────────────────────────────

export function useOfficeVerification(): UseQueryResult<OfficeVerification | null> {
  return useQuery({
    queryKey: identityKeys.officeVerification(),
    queryFn: () => {
      const list = officeVerificationStore.list()
      return mockAsync(list[0] ?? null)
    },
  })
}

export interface SubmitVerificationDocInput {
  type: OfficeVerificationDoc['type']
  fileName: string
}

export function useSubmitVerificationDoc(): UseMutationResult<
  OfficeVerification,
  Error,
  SubmitVerificationDocInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ type, fileName }) => {
      const current = officeVerificationStore.list()[0]
      if (!current) return Promise.reject(new Error('Office verification not found'))
      const newDoc: OfficeVerificationDoc = {
        id: `DOC-${Date.now()}`,
        type,
        fileName,
        status: 'pending',
        uploadedAt: new Date().toISOString(),
      }
      // Aynı türden eski belgeyi değiştirme — sadece ekle
      const updated = officeVerificationStore.update(current.id, {
        documents: [...current.documents, newDoc],
        updatedAt: new Date().toISOString(),
        overallStatus: 'pending_review',
      })
      if (!updated) return Promise.reject(new Error('Update failed'))
      return mockAsync(updated, 400)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: identityKeys.officeVerification() })
    },
  })
}

// ─── KYC queue (super-admin) ─────────────────────────────────────────────────

export interface KycFilter {
  status?: KycReviewItem['status']
}

export function useKycQueue(filter: KycFilter = {}): UseQueryResult<KycReviewItem[]> {
  return useQuery({
    queryKey: identityKeys.kyc.queue(filter),
    queryFn: () => {
      let rows = kycStore.list()
      if (filter.status) rows = rows.filter((k) => k.status === filter.status)
      return mockAsync(rows)
    },
  })
}

interface KycResolveInput {
  id: string
  note?: string
}

interface KycContext {
  previous: KycReviewItem[] | undefined
}

export function useApproveKyc(): UseMutationResult<
  KycReviewItem,
  Error,
  KycResolveInput,
  KycContext
> {
  const qc = useQueryClient()
  return useMutation<KycReviewItem, Error, KycResolveInput, KycContext>({
    mutationFn: ({ id }) => {
      const updated = kycStore.update(id, {
        status: 'approved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'ops-current',
      })
      if (!updated) return Promise.reject(new Error(`KYC ${id} not found`))
      return mockAsync(updated, 200)
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: identityKeys.kyc.all() })
      const previous = qc.getQueryData<KycReviewItem[]>(identityKeys.kyc.queue({}))
      qc.setQueriesData<KycReviewItem[]>({ queryKey: identityKeys.kyc.all() }, (old) =>
        old
          ? old.map((k) =>
              k.id === id
                ? {
                    ...k,
                    status: 'approved',
                    resolvedAt: new Date().toISOString(),
                    resolvedBy: 'ops-current',
                  }
                : k,
            )
          : old,
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(identityKeys.kyc.queue({}), ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: identityKeys.kyc.all() })
    },
  })
}

export function useRejectKyc(): UseMutationResult<
  KycReviewItem,
  Error,
  KycResolveInput,
  KycContext
> {
  const qc = useQueryClient()
  return useMutation<KycReviewItem, Error, KycResolveInput, KycContext>({
    mutationFn: ({ id, note }) => {
      const updated = kycStore.update(id, {
        status: 'rejected',
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'ops-current',
        ...(note !== undefined ? { rejectionReason: note } : {}),
      })
      if (!updated) return Promise.reject(new Error(`KYC ${id} not found`))
      return mockAsync(updated, 200)
    },
    onMutate: async ({ id, note }) => {
      await qc.cancelQueries({ queryKey: identityKeys.kyc.all() })
      const previous = qc.getQueryData<KycReviewItem[]>(identityKeys.kyc.queue({}))
      qc.setQueriesData<KycReviewItem[]>({ queryKey: identityKeys.kyc.all() }, (old) =>
        old
          ? old.map((k) =>
              k.id === id
                ? {
                    ...k,
                    status: 'rejected',
                    resolvedAt: new Date().toISOString(),
                    resolvedBy: 'ops-current',
                    ...(note !== undefined ? { rejectionReason: note } : {}),
                  }
                : k,
            )
          : old,
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(identityKeys.kyc.queue({}), ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: identityKeys.kyc.all() })
    },
  })
}
