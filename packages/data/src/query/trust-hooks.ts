/**
 * TanStack Query v5 hooks — trust & safety domain (Wave F32).
 *
 * Pattern: localStorage CRUD + optimistic mutations.
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
  DISPUTES_INDIVIDUAL,
  FAQ_ENTRIES,
  SUPPORT_TICKETS,
} from '../mock/trust-disputes'
import { MODERATION_QUEUE } from '../mock/trust-platform'
import type {
  Dispute,
  FaqEntry,
  ModerationItem,
  Report,
  SupportTicket,
  TicketMessage,
} from '../types/trust'
import { mockAsync } from './mock-latency'

// ─── Stores ──────────────────────────────────────────────────────────────────

const faqStore = createLocalStore<FaqEntry>('trust.faq', FAQ_ENTRIES)
const disputesStore = createLocalStore<Dispute>('trust.disputes', DISPUTES_INDIVIDUAL)
const reportsStore = createLocalStore<Report>('trust.reports', [])
const ticketsStore = createLocalStore<SupportTicket>('trust.tickets', SUPPORT_TICKETS)
const moderationStore = createLocalStore<ModerationItem>('trust.moderation', MODERATION_QUEUE)

// ─── Query keys ──────────────────────────────────────────────────────────────

export const trustKeys = {
  all: ['trust'] as const,
  faq: {
    all: () => [...trustKeys.all, 'faq'] as const,
    list: (category?: FaqEntry['category']) =>
      [...trustKeys.faq.all(), 'list', category ?? null] as const,
  },
  disputes: {
    all: () => [...trustKeys.all, 'disputes'] as const,
    list: () => [...trustKeys.disputes.all(), 'list'] as const,
    detail: (id: string) => [...trustKeys.disputes.all(), 'detail', id] as const,
    cross: (filter?: { status?: Dispute['status'] }) =>
      [...trustKeys.disputes.all(), 'cross', filter ?? {}] as const,
  },
  reports: {
    all: () => [...trustKeys.all, 'reports'] as const,
    list: () => [...trustKeys.reports.all(), 'list'] as const,
  },
  tickets: {
    all: () => [...trustKeys.all, 'tickets'] as const,
    detail: (id: string) => [...trustKeys.tickets.all(), 'detail', id] as const,
  },
  moderation: {
    all: () => [...trustKeys.all, 'moderation'] as const,
    queue: (filter?: { status?: ModerationItem['status'] }) =>
      [...trustKeys.moderation.all(), 'queue', filter ?? {}] as const,
  },
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

export function useListFaq(category?: FaqEntry['category']): UseQueryResult<FaqEntry[]> {
  return useQuery({
    queryKey: trustKeys.faq.list(category),
    queryFn: () => {
      const all = faqStore.list().sort((a, b) => b.order - a.order)
      const filtered = category ? all.filter((f) => f.category === category) : all
      return mockAsync(filtered, 80)
    },
  })
}

// ─── Reports (anonim ilan şikayet) ───────────────────────────────────────────

export interface CreateReportInput {
  listingId: string
  reason: Report['reason']
  description?: string
  contactEmail?: string
}

export function useCreateReport(): UseMutationResult<Report, Error, CreateReportInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) => {
      const created = reportsStore.create({
        ...input,
        status: 'new',
        createdAt: new Date().toISOString(),
      })
      return mockAsync(created, 250)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: trustKeys.reports.all() })
    },
  })
}

// ─── Disputes (bireysel) ─────────────────────────────────────────────────────

export function useListDisputes(): UseQueryResult<Dispute[]> {
  return useQuery({
    queryKey: trustKeys.disputes.list(),
    queryFn: () => mockAsync(disputesStore.list()),
  })
}

export interface CreateDisputeInput {
  listingId?: string
  counterpartyId?: string
  category: Dispute['category']
  description: string
}

export function useCreateDispute(): UseMutationResult<Dispute, Error, CreateDisputeInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) => {
      const created = disputesStore.create({
        userId: 'user-self',
        status: 'open',
        createdAt: new Date().toISOString(),
        updates: [
          {
            author: 'user',
            text: input.description,
            at: new Date().toISOString(),
          },
        ],
        ...input,
      })
      return mockAsync(created, 300)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: trustKeys.disputes.all() })
    },
  })
}

// ─── Tickets (bireysel) ──────────────────────────────────────────────────────

export function useGetTicket(id: string): UseQueryResult<SupportTicket | null> {
  return useQuery({
    queryKey: trustKeys.tickets.detail(id),
    queryFn: () => mockAsync(ticketsStore.get(id)),
    enabled: !!id,
  })
}

export interface ReplyTicketInput {
  ticketId: string
  text: string
}

interface ReplyTicketContext {
  previous: SupportTicket | null | undefined
}

export function useReplyTicket(): UseMutationResult<
  SupportTicket,
  Error,
  ReplyTicketInput,
  ReplyTicketContext
> {
  const qc = useQueryClient()
  return useMutation<SupportTicket, Error, ReplyTicketInput, ReplyTicketContext>({
    mutationFn: ({ ticketId, text }) => {
      const ticket = ticketsStore.get(ticketId)
      if (!ticket) return Promise.reject(new Error(`Ticket ${ticketId} not found`))
      const newMessage: TicketMessage = {
        id: `${ticketId}-msg-${Date.now()}`,
        author: 'user',
        authorName: 'Ahmet Şeker',
        text,
        at: new Date().toISOString(),
      }
      const updated = ticketsStore.update(ticketId, {
        messages: [...ticket.messages, newMessage],
        updatedAt: new Date().toISOString(),
        status: 'open',
      })
      if (!updated) return Promise.reject(new Error(`Ticket ${ticketId} not found`))
      return mockAsync(updated, 250)
    },
    onMutate: async ({ ticketId, text }) => {
      await qc.cancelQueries({ queryKey: trustKeys.tickets.detail(ticketId) })
      const previous = qc.getQueryData<SupportTicket | null>(trustKeys.tickets.detail(ticketId))
      if (previous) {
        const optimistic: SupportTicket = {
          ...previous,
          messages: [
            ...previous.messages,
            {
              id: `optimistic-${Date.now()}`,
              author: 'user',
              authorName: 'Ahmet Şeker',
              text,
              at: new Date().toISOString(),
            },
          ],
          updatedAt: new Date().toISOString(),
        }
        qc.setQueryData(trustKeys.tickets.detail(ticketId), optimistic)
      }
      return { previous }
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(trustKeys.tickets.detail(vars.ticketId), ctx.previous)
      }
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: trustKeys.tickets.detail(vars.ticketId) })
    },
  })
}

// ─── Moderation queue (super-admin) ──────────────────────────────────────────

export interface ModerationFilter {
  status?: ModerationItem['status']
}

export function useModerationQueue(
  filter: ModerationFilter = {},
): UseQueryResult<ModerationItem[]> {
  return useQuery({
    queryKey: trustKeys.moderation.queue(filter),
    queryFn: () => {
      let rows = moderationStore.list()
      if (filter.status) rows = rows.filter((m) => m.status === filter.status)
      return mockAsync(rows)
    },
  })
}

interface ResolveModerationInput {
  id: string
  resolution: 'resolved' | 'dismissed'
  note?: string
}

interface ModerationContext {
  previous: ModerationItem[] | undefined
}

export function useResolveModeration(): UseMutationResult<
  ModerationItem,
  Error,
  ResolveModerationInput,
  ModerationContext
> {
  const qc = useQueryClient()
  return useMutation<ModerationItem, Error, ResolveModerationInput, ModerationContext>({
    mutationFn: ({ id, resolution, note }) => {
      const updated = moderationStore.update(id, {
        status: resolution,
        resolvedAt: new Date().toISOString(),
        ...(note !== undefined ? { resolutionNote: note } : {}),
      })
      if (!updated) return Promise.reject(new Error(`Moderation ${id} not found`))
      return mockAsync(updated, 200)
    },
    onMutate: async ({ id, resolution, note }) => {
      await qc.cancelQueries({ queryKey: trustKeys.moderation.all() })
      const previous = qc.getQueryData<ModerationItem[]>(trustKeys.moderation.queue({}))
      qc.setQueriesData<ModerationItem[]>(
        { queryKey: trustKeys.moderation.all() },
        (old) =>
          old
            ? old.map((m) =>
                m.id === id
                  ? {
                      ...m,
                      status: resolution,
                      resolvedAt: new Date().toISOString(),
                      ...(note !== undefined ? { resolutionNote: note } : {}),
                    }
                  : m,
              )
            : old,
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(trustKeys.moderation.queue({}), ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: trustKeys.moderation.all() })
    },
  })
}

// ─── Cross-tenant disputes (super-admin) ─────────────────────────────────────

export interface CrossDisputeFilter {
  status?: Dispute['status']
}

export function useAllDisputes(
  filter: CrossDisputeFilter = {},
): UseQueryResult<Dispute[]> {
  return useQuery({
    queryKey: trustKeys.disputes.cross(filter),
    queryFn: () => {
      let rows = disputesStore.list()
      if (filter.status) rows = rows.filter((d) => d.status === filter.status)
      return mockAsync(rows)
    },
  })
}

export interface ResolveDisputeInput {
  id: string
  resolution: 'resolved' | 'rejected'
  note: string
}

interface DisputeResolveContext {
  previous: Dispute[] | undefined
}

export function useResolveDispute(): UseMutationResult<
  Dispute,
  Error,
  ResolveDisputeInput,
  DisputeResolveContext
> {
  const qc = useQueryClient()
  return useMutation<Dispute, Error, ResolveDisputeInput, DisputeResolveContext>({
    mutationFn: ({ id, resolution, note }) => {
      const dispute = disputesStore.get(id)
      if (!dispute) return Promise.reject(new Error(`Dispute ${id} not found`))
      const updated = disputesStore.update(id, {
        status: resolution,
        updates: [
          ...dispute.updates,
          {
            author: 'support',
            text: note,
            at: new Date().toISOString(),
          },
        ],
      })
      if (!updated) return Promise.reject(new Error(`Dispute ${id} update failed`))
      return mockAsync(updated, 250)
    },
    onMutate: async ({ id, resolution, note }) => {
      await qc.cancelQueries({ queryKey: trustKeys.disputes.all() })
      const previous = qc.getQueryData<Dispute[]>(trustKeys.disputes.cross({}))
      qc.setQueriesData<Dispute[]>({ queryKey: trustKeys.disputes.all() }, (old) =>
        old
          ? old.map((d) =>
              d.id === id
                ? {
                    ...d,
                    status: resolution,
                    updates: [
                      ...d.updates,
                      { author: 'support', text: note, at: new Date().toISOString() },
                    ],
                  }
                : d,
            )
          : old,
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(trustKeys.disputes.cross({}), ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: trustKeys.disputes.all() })
    },
  })
}
