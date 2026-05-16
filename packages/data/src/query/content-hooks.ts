/**
 * TanStack Query v5 hooks — content & insights domain (Wave F32).
 *
 * Read-mostly: rehber, kullanıcı analitik özet, kategori arşivi.
 */

import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query'
import { createLocalStore } from '../adapters/local-storage'
import { CATEGORY_ARCHIVES, GUIDES, USER_ANALYTICS } from '../mock/content'
import type { CategoryArchive, Guide, GuideTag, UserAnalytics } from '../types/content'
import { mockAsync } from './mock-latency'

// ─── Stores ──────────────────────────────────────────────────────────────────

const guidesStore = createLocalStore<Guide & { id: string }>(
  'content.guides',
  GUIDES.map((g) => ({ ...g, id: g.slug })),
)
const analyticsStore = createLocalStore<UserAnalytics & { id: string }>(
  'content.user-analytics',
  [{ ...USER_ANALYTICS, id: USER_ANALYTICS.userId }],
)
const categoryStore = createLocalStore<CategoryArchive & { id: string }>(
  'content.categories',
  CATEGORY_ARCHIVES.map((c) => ({ ...c, id: c.slug })),
)

// ─── Query keys ──────────────────────────────────────────────────────────────

export const contentKeys = {
  all: ['content'] as const,
  guides: {
    all: () => [...contentKeys.all, 'guides'] as const,
    list: (tag?: GuideTag) => [...contentKeys.guides.all(), 'list', tag ?? null] as const,
    detail: (slug: string) => [...contentKeys.guides.all(), 'detail', slug] as const,
  },
  analytics: (userId: string) => [...contentKeys.all, 'analytics', userId] as const,
  categoryListings: (slug: string) =>
    [...contentKeys.all, 'category-listings', slug] as const,
}

// ─── User analytics ──────────────────────────────────────────────────────────

export function useUserAnalytics(
  userId: string = 'user-self',
): UseQueryResult<UserAnalytics | null> {
  return useQuery({
    queryKey: contentKeys.analytics(userId),
    queryFn: () => {
      const found = analyticsStore.list().find((a) => a.userId === userId)
      return mockAsync(found ?? null)
    },
  })
}

// ─── Guides ──────────────────────────────────────────────────────────────────

export function useGuide(slug: string): UseQueryResult<Guide | null> {
  return useQuery({
    queryKey: contentKeys.guides.detail(slug),
    queryFn: () => {
      const found = guidesStore.list().find((g) => g.slug === slug)
      return mockAsync(found ?? null, 80)
    },
    enabled: !!slug,
  })
}

export function useListGuides(tag?: GuideTag): UseQueryResult<Guide[]> {
  return useQuery({
    queryKey: contentKeys.guides.list(tag),
    queryFn: () => {
      const all = guidesStore
        .list()
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      const filtered = tag ? all.filter((g) => g.tags.includes(tag)) : all
      return mockAsync(filtered, 80)
    },
  })
}

// ─── Category listings ───────────────────────────────────────────────────────

export function useCategoryListings(slug: string): UseQueryResult<CategoryArchive | null> {
  return useQuery({
    queryKey: contentKeys.categoryListings(slug),
    queryFn: () => {
      const found = categoryStore.list().find((c) => c.slug === slug)
      return mockAsync(found ?? null)
    },
    enabled: !!slug,
  })
}
