import { getAlternateUrl, LOCALE_FLAGS, LOCALE_LABELS, type Locale } from '@/i18n'

interface Props {
  locale: Locale
  pathname: string
}

/**
 * React mirror of LocalePicker.astro for client-side mount inside the
 * shared DynamicIslandHeader extras slot. The Astro version still exists
 * for SSR-rendered pages that don't ship the header island.
 *
 * URL semantics delegate to `getAlternateUrl()` (the same helper the Astro
 * version uses), so `/` ↔ `/en/` and `/ara` ↔ `/en/ara` mappings stay
 * canonical. Query string + hash are preserved for clean locale swaps
 * (e.g. `/ara?q=foo#x` → `/en/ara?q=foo#x`) — a small enhancement over
 * the Astro `<a href>` version, no regression.
 */
export function LocalePickerInline({ locale, pathname }: Props) {
  const switchTo = (target: Locale) => {
    if (target === locale) return
    const nextPath = getAlternateUrl(pathname, target)
    const search = typeof window !== 'undefined' ? window.location.search : ''
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    window.location.href = `${nextPath}${search}${hash}`
  }

  const ariaLabel = locale === 'tr' ? 'Dil seç' : 'Choose language'

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-background/40 p-0.5"
    >
      {(['tr', 'en'] as const).map((loc) => {
        const isActive = loc === locale
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            aria-pressed={isActive}
            aria-current={isActive ? 'true' : undefined}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-mono uppercase tracking-wider transition ${
              isActive
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title={LOCALE_LABELS[loc]}
          >
            <span aria-hidden="true">{LOCALE_FLAGS[loc]}</span>
            <span>{loc.toUpperCase()}</span>
          </button>
        )
      })}
    </div>
  )
}
