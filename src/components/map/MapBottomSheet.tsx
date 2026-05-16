// MapBottomSheet — Wave F4.B.1
//
// Mobile-only 40vh sheet anchored to the bottom of the viewport, listing the
// filtered results while the map fills the rest of the screen. On md+ the
// component renders as `hidden` so desktop layouts can use the sidebar grid
// instead.
import type { Listing } from '@landx/data'

export interface MapBottomSheetProps {
  listings: Listing[]
  locale?: 'tr' | 'en'
}

function fmtPrice(p: number): string {
  return new Intl.NumberFormat('tr-TR').format(p) + ' ₺'
}

export default function MapBottomSheet({ listings, locale = 'tr' }: MapBottomSheetProps) {
  return (
    <aside
      aria-label={locale === 'en' ? 'Results' : 'Sonuçlar'}
      className="fixed inset-x-0 bottom-0 z-20 h-[40vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-3 shadow-lg md:hidden"
      data-testid="map-bottom-sheet"
    >
      <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-foreground/20" aria-hidden="true" />
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
        {listings.length} {locale === 'en' ? 'results' : 'sonuç'}
      </p>
      <ul className="space-y-2">
        {listings.map((l) => (
          <li key={l.id}>
            <a
              href={`/ilan/${l.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-background p-2 transition hover:bg-accent"
            >
              <div className="h-14 w-20 shrink-0 rounded-md bg-stone-200" aria-hidden="true" />
              <div className="min-w-0">
                <p className="line-clamp-1 text-xs font-medium text-foreground">{l.title}</p>
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  {l.district}, {l.city}
                </p>
                <p className="mt-1 text-xs font-medium text-foreground">{fmtPrice(l.price)}</p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
