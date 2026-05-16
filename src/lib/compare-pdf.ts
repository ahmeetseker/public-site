// Wave F9.A — /karsilastir PDF export helpers.
//
// PDF export here means "trigger the browser's native print dialog with a
// print-stylesheet that lays the comparison out on A4 landscape". No third
// party library — `window.print()` + `styles/print.css` already give us the
// "Save as PDF" target on every modern browser. The helpers in this file
// stay pure so they're unit-testable from jsdom (no DOM mutation, no
// network).
//
// Public surface:
//   - formatComparisonDate(locale, now?)
//     Returns the localized date string used in the print footer
//     ("Karşılaştırma tarihi: 14 Mayıs 2026" / "Comparison date: 14 May 2026").
//     `now` is optional so tests can pin the clock.
//
//   - triggerPrint(win?)
//     Calls `window.print()` defensively (returns false when the global is
//     missing, e.g. during SSR/unit tests). Returns true on a successful
//     invocation so callers can chain analytics or fallback UI without
//     reading the global themselves.

import type { Locale } from '@/i18n'

export const COMPARISON_DATE_FORMATTERS: Record<Locale, Intl.DateTimeFormat> = {
  tr: new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }),
  en: new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }),
}

/**
 * Localized comparison date (used by the print-only footer in
 * <CompareTable>). Falls back to ISO-ish output when Intl is unavailable
 * (defensive for very old Node test runtimes).
 */
export function formatComparisonDate(
  locale: Locale,
  now: Date = new Date(),
): string {
  try {
    return COMPARISON_DATE_FORMATTERS[locale].format(now)
  } catch {
    return now.toISOString().slice(0, 10)
  }
}

/**
 * Print dialog trigger. Decoupled from React so the share button can call
 * it and tests can spy on it without rendering. Accepts an injected window
 * for testability — defaults to the real `window` when present.
 */
export function triggerPrint(
  win: Pick<Window, 'print'> | undefined = typeof window !== 'undefined'
    ? window
    : undefined,
): boolean {
  if (!win || typeof win.print !== 'function') return false
  try {
    win.print()
    return true
  } catch {
    return false
  }
}
