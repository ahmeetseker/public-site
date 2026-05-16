/**
 * HeroVariant — F37 Faz 4.B / P bölüm.
 *
 * `Listing.category` switch'i:
 *   - arsa → mevcut ListingDetailHero (delegate, hiç dokunma)
 *   - konut/villa/işyeri → kategori-özel başlık + chip set
 */
import type { ReactElement } from 'react'
import { ListingDetailHero } from '../ListingDetailHero'
import { ListingDetailQueryProvider } from '../_provider'
import type { Listing } from '@landx/data'

export interface HeroVariantProps {
  listing: Listing
}

function chips(listing: Listing): string[] {
  const c = listing.category ?? 'arsa'
  if (c === 'arsa') return []  // delegate path
  if (c === 'konut') {
    return [
      'Satılık',
      listing.subType ?? 'daire',
      `${listing.rooms ?? '?'}`,
      `${listing.size} m²`,
      listing.floor !== undefined ? `${listing.floor}/${listing.totalFloors ?? '?'}. kat` : '',
      listing.withinSite ? 'Site içi' : '',
    ].filter(Boolean)
  }
  if (c === 'villa') {
    return [
      'Satılık',
      'Villa',
      `${listing.size} m²`,
      `${listing.rooms ?? '?'}`,
      listing.siteAmenities?.includes('havuz') ? 'Havuzlu' : '',
      listing.siteAmenities?.includes('yesil-alan') ? 'Bahçeli' : '',
    ].filter(Boolean)
  }
  if (c === 'isyeri') {
    return [
      listing.commercialUsage?.includes('devren') ? 'Devren' : 'Satılık',
      listing.subType ?? 'ofis',
      `${listing.netSize ?? listing.size} m² net`,
      listing.hasShowcase ? 'Vitrin' : '',
    ].filter(Boolean)
  }
  return []
}

export function HeroVariant({ listing }: HeroVariantProps): ReactElement {
  const category = listing.category ?? 'arsa'
  if (category === 'arsa') {
    return (
      <ListingDetailQueryProvider>
        <ListingDetailHero listing={listing} />
      </ListingDetailQueryProvider>
    )
  }
  return (
    <header className="space-y-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        İLAN · {listing.id}
      </div>
      <h1 className="font-serif text-3xl font-light tracking-tight md:text-4xl">
        {listing.title}
      </h1>
      <div className="flex flex-wrap gap-1.5">
        {chips(listing).map((c) => (
          <span key={c} className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs">
            {c}
          </span>
        ))}
      </div>
      <div className="text-sm text-muted-foreground">
        {listing.district}, {listing.city}
      </div>
    </header>
  )
}

export default HeroVariant
