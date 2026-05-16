// i18n dictionary loader for public-site (Faz 9.13).
// Pages opt in by calling t('homepage.hero.headline', locale) or useDict('homepage.hero', locale).
// No Astro built-in i18n routing — see docs/i18n.md.

import { tr } from './tr'
import { en } from './en'
import type { Locale } from './locales'

const DICTIONARIES = { tr, en } as const

/**
 * Get a translation by dotted path: t('homepage.hero.headline', 'tr').
 * Returns the dotted path itself if the key is not found (debug-friendly fallback).
 */
export function t(path: string, locale: Locale = 'tr'): string {
  const dict = DICTIONARIES[locale]
  const segments = path.split('.')
  let cur: unknown = dict
  for (const seg of segments) {
    if (typeof cur !== 'object' || cur === null) return path
    cur = (cur as Record<string, unknown>)[seg]
    if (cur === undefined) return path
  }
  return typeof cur === 'string' ? cur : path
}

/**
 * Get an entire localized namespace. Useful when a component needs many strings.
 * Example: const hero = useDict('homepage.hero', 'en') as Record<string, string>
 * Returns {} (empty object) if the path is missing — callers should null-check.
 */
export function useDict(path: string, locale: Locale = 'tr'): unknown {
  const dict = DICTIONARIES[locale]
  const segments = path.split('.')
  let cur: unknown = dict
  for (const seg of segments) {
    if (typeof cur !== 'object' || cur === null) return {}
    cur = (cur as Record<string, unknown>)[seg]
    if (cur === undefined) return {}
  }
  return cur
}

/**
 * Interpolate placeholders in a template string like 'Hello {name}'.
 * Unmatched placeholders are preserved verbatim (e.g. `{missing}`).
 */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`))
}

export {
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  LOCALE_FLAGS,
  LOCALE_BCP47,
  getAlternateUrl,
  detectLocaleFromPath,
} from './locales'
export type { Locale } from './locales'
