// Wave F8 / Agent-F8A — Blog content collection helpers.
//
// Thin wrapper over Astro's `astro:content` API for the `blog` collection.
// Keeping the lookup + sort + filter logic in one place lets:
//   - Listing page (`/blog`) reuse `getAllPosts(locale)` for both TR and EN.
//   - Post page (`/blog/[slug]`) reuse `getPostBySlug(slug, locale)`.
//   - Related-posts section reuse `getRelatedPosts(post, n)` (same category,
//     most recent first, excludes the post itself).
//
// Slug convention: each post is stored under `src/content/blog/<locale>/<slug>.md`.
// Astro's `glob` loader assigns IDs as `<locale>/<slug>` — we expose just the
// trailing `slug` to consumers and re-derive `<locale>/<slug>` internally.
//
// Categories are constrained at the schema layer (zod enum); the BLOG_CATEGORIES
// constant below is the single source of truth for ordering in chip filters.

import { getCollection, type CollectionEntry } from 'astro:content'
import type { Locale } from '@/i18n'

export type BlogPost = CollectionEntry<'blog'>
export type BlogCategory = BlogPost['data']['category']

/** Stable display order for category chip filter (UI). */
export const BLOG_CATEGORIES: readonly BlogCategory[] = [
  'rehber',
  'duyuru',
  'analiz',
  'hikaye',
] as const

/**
 * Extract the trailing slug from an entry id like `tr/arsam-net-nasil-calisir`.
 * Returns the id unchanged if there is no `/` (defensive).
 */
export function postSlug(entry: BlogPost): string {
  const parts = entry.id.split('/')
  return parts.length > 1 ? parts.slice(1).join('/') : entry.id
}

/**
 * All published posts for a locale, sorted newest-first.
 *
 * Filtering is keyed on the `locale` field of the frontmatter rather than the
 * folder name so that future content can live anywhere on disk without
 * changing this helper.
 */
export async function getAllPosts(locale: Locale = 'tr'): Promise<BlogPost[]> {
  const all = await getCollection('blog')
  return all
    .filter((p) => p.data.locale === locale)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
}

/**
 * Look up a single post by its trailing slug + locale.
 * Returns `undefined` when no matching post exists (caller decides 404).
 */
export async function getPostBySlug(
  slug: string,
  locale: Locale = 'tr',
): Promise<BlogPost | undefined> {
  const all = await getAllPosts(locale)
  return all.find((p) => postSlug(p) === slug)
}

/**
 * Related posts within the same category, newest first, excluding the
 * provided post itself. Caps at `n` (default 3 per spec §4).
 */
export async function getRelatedPosts(
  post: BlogPost,
  n: number = 3,
): Promise<BlogPost[]> {
  const peers = await getAllPosts(post.data.locale)
  return peers
    .filter((p) => p.id !== post.id && p.data.category === post.data.category)
    .slice(0, n)
}

/**
 * Posts grouped by category for the listing page chip filter.
 * Categories with zero posts are still present (empty array) so the UI can
 * render a stable set of chips.
 */
export async function getPostsByCategory(
  locale: Locale = 'tr',
): Promise<Record<BlogCategory, BlogPost[]>> {
  const all = await getAllPosts(locale)
  const grouped: Record<BlogCategory, BlogPost[]> = {
    rehber: [],
    duyuru: [],
    analiz: [],
    hikaye: [],
  }
  for (const post of all) {
    grouped[post.data.category].push(post)
  }
  return grouped
}

/**
 * Rough English-reading-time estimate (words / 200 wpm), rounded up to the
 * nearest minute with a 1 minute floor. The post body is plain markdown, so a
 * whitespace split is good enough; punctuation tokens slightly inflate but the
 * UI claim is "X dk okuma" / "X min read" — fuzzy by design.
 */
export function estimateReadTimeMinutes(body: string): number {
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

/**
 * Build the locale-aware blog href for a slug. Used by cards, related posts
 * and breadcrumbs to keep route prefixing in one place.
 */
export function blogHref(slug: string, locale: Locale = 'tr'): string {
  return locale === 'en' ? `/en/blog/${slug}` : `/blog/${slug}`
}

/** Hub href (`/blog` or `/en/blog`). */
export function blogHubHref(locale: Locale = 'tr'): string {
  return locale === 'en' ? '/en/blog' : '/blog'
}
