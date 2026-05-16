// ViewToggle — Wave F4.B.1
//
// Three-mode segmented control (list | split | map) for the /ara header.
// Split is hidden on mobile because a 50/50 layout doesn't fit a phone
// viewport — desktop users still see all three options.
import type { ViewMode } from '@/lib/use-view-mode'

export interface ViewToggleProps {
  mode: ViewMode
  onChange: (next: ViewMode) => void
  locale?: 'tr' | 'en'
}

export default function ViewToggle({ mode, onChange, locale = 'tr' }: ViewToggleProps) {
  const labels =
    locale === 'en'
      ? { list: 'List', map: 'Map', split: 'Split' }
      : { list: 'Liste', map: 'Harita', split: 'Bölünmüş' }
  const opts: ViewMode[] = ['list', 'split', 'map']

  return (
    <div
      role="tablist"
      aria-label={locale === 'en' ? 'View mode' : 'Görünüm modu'}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1"
      data-testid="view-toggle"
    >
      {opts.map((opt) => {
        const selected = mode === opt
        const hiddenOnMobile = opt === 'split'
        return (
          <button
            key={opt}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 ${
              selected ? 'bg-foreground text-background' : 'text-foreground hover:bg-accent'
            } ${hiddenOnMobile ? 'hidden md:inline-flex' : ''}`}
            data-testid={`view-toggle-${opt}`}
          >
            {labels[opt]}
          </button>
        )
      })}
    </div>
  )
}
