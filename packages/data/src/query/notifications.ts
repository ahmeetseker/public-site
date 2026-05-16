/**
 * Notifications query hooks.
 *
 * Backend doesn't expose notification endpoints yet (Faz 12.x — LandX-API
 * survey). All hooks are mock-only via `apiOrMock(landxApi.notifications.*
 * — TODO, mockAsync(...))`. The mock path mutates an in-memory clone of
 * the seed array so optimistic updates land coherently across hooks in
 * the same session.
 *
 * Wave F3 / Agent-F3C — Faz 12.x mark-read + delete + bulk-mark.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NOTIFICATIONS, type Notification } from '../mock/notifications'
import { apiOrMock } from '../api'
import { mockAsync } from './mock-latency'

// Local in-memory store — keeps mutations coherent within a session.
// Seed once from the static mock array.
let store: Notification[] = NOTIFICATIONS.map((n) => ({ ...n }))

/** Test-only reset. Re-seeds the in-memory store from the static array. */
export function __resetNotificationsStore(): void {
  store = NOTIFICATIONS.map((n) => ({ ...n }))
}

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: () => [...notificationKeys.lists(), {}] as const,
}

export interface NotificationsQueryOptions {
  /** When true, only unread items are returned. */
  unreadOnly?: boolean
}

function applyFilter(rows: Notification[], opts?: NotificationsQueryOptions): Notification[] {
  if (opts?.unreadOnly) return rows.filter((n) => !n.read)
  return rows
}

export function useNotifications(opts?: NotificationsQueryOptions) {
  return useQuery({
    queryKey: [...notificationKeys.list(), opts ?? {}],
    queryFn: () =>
      apiOrMock<Notification[]>(
        // TODO(api): wire landxApi.notifications.list once the SDK exposes it.
        () => Promise.reject(new Error('notifications endpoint not implemented')),
        () => mockAsync(applyFilter(store, opts).map((n) => ({ ...n }))),
      ),
  })
}

/**
 * Mark a single notification as read.
 *
 * Optimistically flips `read=true` for the target id in cache; rolls back
 * on error; refetches on settle.
 */
export function useMarkAsRead() {
  const qc = useQueryClient()
  return useMutation<Notification, Error, string, { previous: Notification[] | undefined }>({
    mutationFn: (id) =>
      apiOrMock<Notification>(
        // TODO(api): landxApi.notifications.markRead(id)
        () => Promise.reject(new Error('notifications endpoint not implemented')),
        () => {
          const target = store.find((n) => n.id === id)
          if (!target) return Promise.reject(new Error(`Notification not found: ${id}`))
          target.read = true
          return mockAsync({ ...target }, 80)
        },
      ),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notificationKeys.all })
      const previous = qc.getQueryData<Notification[]>([...notificationKeys.list(), {}])
      qc.setQueriesData<Notification[]>({ queryKey: notificationKeys.all }, (old) =>
        old ? old.map((n) => (n.id === id ? { ...n, read: true } : n)) : old,
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData([...notificationKeys.list(), {}], ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

/** Bulk-mark every notification as read. */
export function useMarkAllAsRead() {
  const qc = useQueryClient()
  return useMutation<void, Error, void, { previous: Notification[] | undefined }>({
    mutationFn: () =>
      apiOrMock<void>(
        // TODO(api): landxApi.notifications.markAllRead()
        () => Promise.reject(new Error('notifications endpoint not implemented')),
        () => {
          store.forEach((n) => {
            n.read = true
          })
          return mockAsync(undefined, 120)
        },
      ),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationKeys.all })
      const previous = qc.getQueryData<Notification[]>([...notificationKeys.list(), {}])
      qc.setQueriesData<Notification[]>({ queryKey: notificationKeys.all }, (old) =>
        old ? old.map((n) => ({ ...n, read: true })) : old,
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData([...notificationKeys.list(), {}], ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

/** Delete a single notification. Removes from in-memory store + cache. */
export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation<void, Error, string, { previous: Notification[] | undefined }>({
    mutationFn: (id) =>
      apiOrMock<void>(
        // TODO(api): landxApi.notifications.remove(id)
        () => Promise.reject(new Error('notifications endpoint not implemented')),
        () => {
          store = store.filter((n) => n.id !== id)
          return mockAsync(undefined, 100)
        },
      ),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notificationKeys.all })
      const previous = qc.getQueryData<Notification[]>([...notificationKeys.list(), {}])
      qc.setQueriesData<Notification[]>({ queryKey: notificationKeys.all }, (old) =>
        old ? old.filter((n) => n.id !== id) : old,
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData([...notificationKeys.list(), {}], ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
