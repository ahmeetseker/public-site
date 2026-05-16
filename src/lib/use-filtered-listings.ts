// use-filtered-listings — Wave F4.B.1
//
// Mirrors the server-side filter applied by `pages/ara.astro` so the React
// map island shows exactly the same result set the static list page shows.
// The /ara page reads these query params (see ara.astro § filter parsing):
//
//   q         keyword search across title / city / district / tags
//   tip       listing type ('Tümü' | İmarlı | Tarla | Zeytinlik | Villa Arsası)
//   il        city ('Tümü' | <city name>)
//   priceMax  upper bound on listing.price (number; 0/empty = no cap)
//
// Sort (`sort`) is intentionally not applied here — markers are unordered.
// If F4.B.2 wants the bottom-sheet list to honour `sort`, it can re-sort the
// returned array; this hook stays purely a filter.
import { useEffect, useState } from 'react'
import { LISTINGS, type Listing } from '@landx/data'

export interface FilteredListingsState {
  all: Listing[]
  filtered: Listing[]
}

function matchesKeyword(l: Listing, q: string): boolean {
  if (!q) return true
  const needle = q.toLocaleLowerCase('tr-TR')
  if (l.title.toLocaleLowerCase('tr-TR').includes(needle)) return true
  if (l.city.toLocaleLowerCase('tr-TR').includes(needle)) return true
  if (l.district.toLocaleLowerCase('tr-TR').includes(needle)) return true
  return l.tags.some((t) => t.toLocaleLowerCase('tr-TR').includes(needle))
}

export function applyFilters(listings: Listing[], sp: URLSearchParams): Listing[] {
  const q = (sp.get('q') ?? '').trim()
  const tip = sp.get('tip') ?? 'Tümü'
  const il = sp.get('il') ?? 'Tümü'
  const priceMaxRaw = sp.get('priceMax') ?? ''
  const priceMax = Number(priceMaxRaw)
  const priceCap = Number.isFinite(priceMax) && priceMax > 0 ? priceMax : Infinity

  return listings.filter((l) => {
    if (!matchesKeyword(l, q)) return false
    if (tip !== 'Tümü' && l.type !== tip) return false
    if (il !== 'Tümü' && l.city !== il) return false
    if (l.price > priceCap) return false
    return true
  })
}

/**
 * Stays in sync with URL search params via two signals:
 * - native `popstate` (back/forward navigation)
 * - custom `arsam:urlchange` event (siblings that call history.replace/pushState
 *   should dispatch this event after mutating the URL)
 *
 * Re-evaluates the filter against `LISTINGS` whenever either signal fires so
 * the map markers stay aligned with the URL filters. Components that already
 * have their own search-params source can call `applyFilters` directly
 * instead.
 */
export function useFilteredListings(): Listing[] {
  const [items, setItems] = useState<Listing[]>(() => {
    if (typeof window === 'undefined') return LISTINGS
    return applyFilters(LISTINGS, new URLSearchParams(window.location.search))
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    function refresh() {
      setItems(applyFilters(LISTINGS, new URLSearchParams(window.location.search)))
    }
    refresh()
    window.addEventListener('popstate', refresh)
    window.addEventListener('arsam:urlchange', refresh)
    return () => {
      window.removeEventListener('popstate', refresh)
      window.removeEventListener('arsam:urlchange', refresh)
    }
  }, [])

  return items
}
