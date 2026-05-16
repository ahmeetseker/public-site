import { useEffect, useMemo, useRef, useState } from 'react'
import { CommandPaletteBase, type PaletteItem as BasePaletteItem } from '@landx/ui/command'
import {
  detectLocale,
  filteredSections,
  pushRecent,
  readRecent,
  type Locale,
  type PaletteItem,
} from '@/lib/command-palette'
import { announce, trapFocus } from '@/lib/a11y'

interface Props {
  open: boolean
  onClose: () => void
  /**
   * Optional locale override. When omitted (the default), the palette
   * snapshots the locale at mount-time from `window.location.pathname`
   * — sufficient because the host (CommandPaletteMount) unmounts +
   * re-mounts between locale-different page swaps.
   */
  locale?: Locale
}

export function CommandPalette({ open, onClose, locale: localeProp }: Props) {
  const locale: Locale = useMemo(() => localeProp ?? detectLocale(), [localeProp])

  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<string[]>([])
  const cardRef = useRef<HTMLDivElement | null>(null)

  const sections = useMemo(() => filteredSections(query, locale), [query, locale])

  // Open lifecycle: reset query, hydrate recent, install focus trap +
  // announce the palette open event for screen readers (F23.0 live-region
  // reuse). Base owns activeIndex + autofocus.
  useEffect(() => {
    if (!open) return
    setQuery('')
    setRecent(readRecent())

    let unmountTrap = () => {}
    if (cardRef.current) {
      unmountTrap = trapFocus(cardRef.current, {
        initialFocus: cardRef.current.querySelector<HTMLInputElement>(
          '[data-testid="command-palette-input"]',
        ),
        restoreFocus: true,
      })
    }
    announce(
      locale === 'en' ? 'Command palette opened' : 'Komut paleti açıldı',
      'polite',
    )

    return () => {
      unmountTrap()
    }
  }, [open, locale])

  function activate(item: BasePaletteItem) {
    if (query.trim()) pushRecent(query)
    onClose()
    const full = item as PaletteItem
    if (full.action) {
      full.action()
      return
    }
    if (full.to) {
      // Astro 5 ClientRouter intercepts same-origin `location.href` writes —
      // SPA navigation when supported, full reload otherwise. No router
      // dependency needed here.
      window.location.href = full.to
    }
  }

  const dialogLabel = locale === 'en' ? 'Command palette' : 'Komut paleti'
  const placeholder =
    locale === 'en'
      ? 'Search commands, pages or records…'
      : 'Komut, sayfa veya kayıt ara…'
  const recentLabel = locale === 'en' ? 'RECENT' : 'SON ARAMALAR'
  const emptyLabel = locale === 'en' ? 'No results.' : 'Sonuç bulunamadı.'
  const closeLabel = locale === 'en' ? 'Close' : 'Kapat'
  const ariaSearchLabel = locale === 'en' ? 'Search' : 'Arama'
  const navHint = locale === 'en' ? 'navigate' : 'gez'
  const openHint = locale === 'en' ? 'open' : 'aç'
  const closeHint = locale === 'en' ? 'close' : 'kapat'

  return (
    <CommandPaletteBase
      open={open}
      onClose={onClose}
      query={query}
      onQueryChange={setQuery}
      sections={sections}
      recent={recent}
      onActivate={activate}
      cardRef={cardRef}
      ariaLabel={dialogLabel}
      ariaSearchLabel={ariaSearchLabel}
      placeholder={placeholder}
      closeLabel={closeLabel}
      recentLabel={recentLabel}
      emptyLabel={emptyLabel}
      navHint={navHint}
      openHint={openHint}
      closeHint={closeHint}
      brand="arsam"
    />
  )
}

export default CommandPalette
