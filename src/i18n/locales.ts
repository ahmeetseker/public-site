// Locale configuration for public-site.
// Faz 9.13.b — Astro built-in i18n routing enabled (prefixDefaultLocale: false).
// TR is canonical at `/`, EN under `/en/*`. See docs/i18n.md.

export const LOCALES = ['tr', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'tr'

export const LOCALE_LABELS: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
}

export const LOCALE_FLAGS: Record<Locale, string> = {
  tr: '🇹🇷', // emoji is fine for MVP; future: SVG flag component
  en: '🇬🇧',
}

/**
 * BCP-47 tags for hreflang / JSON-LD `inLanguage`.
 */
export const LOCALE_BCP47: Record<Locale, string> = {
  tr: 'tr-TR',
  en: 'en-US',
}

/**
 * Map the current page URL to its equivalent in `targetLocale`.
 *
 * Strategy under Astro `prefixDefaultLocale: false`:
 *   TR routes live at `/<path>` (canonical)
 *   EN routes live at `/en/<path>` (mirrored when present)
 *
 * NOTE: This always returns the mirrored path. Whether that path actually
 * exists in the EN tree depends on per-page migration progress (top-5 pages
 * have hand-rolled EN companions; others rely on Astro fallback to TR).
 */
export function getAlternateUrl(currentPath: string, targetLocale: Locale): string {
  // Strip /en prefix to get the canonical TR path
  const trPath =
    currentPath === '/en' || currentPath === '/en/'
      ? '/'
      : currentPath.startsWith('/en/')
        ? currentPath.slice(3)
        : currentPath

  if (targetLocale === 'tr') return trPath

  // targetLocale === 'en'
  if (trPath === '/') return '/en/'
  return `/en${trPath}`
}

export function detectLocaleFromPath(pathname: string): Locale {
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en'
  return 'tr'
}
