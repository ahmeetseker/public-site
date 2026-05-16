import type { ReactElement } from 'react'
import type { Listing } from '@landx/data'

export interface KeyFactsVariantProps {
  listing: Listing
}

interface Fact {
  label: string
  value: string
}

function arsaFacts(l: Listing): Fact[] {
  return [
    { label: 'Yüzölçümü', value: `${l.size.toLocaleString('tr-TR')} m²` },
    { label: 'İmar', value: l.zoning ?? '?' },
    { label: 'Tapu', value: l.titleStatus ?? '?' },
    { label: 'Yola cephe', value: l.hasRoad ? 'Var' : 'Yok' },
  ]
}

function konutFacts(l: Listing): Fact[] {
  return [
    { label: 'Oda', value: l.rooms ?? '?' },
    { label: 'Brüt m²', value: l.size.toLocaleString('tr-TR') },
    { label: 'Bina yaşı', value: `${l.buildingAge ?? '?'} yıl` },
    { label: 'Kat', value: `${l.floor ?? '?'}/${l.totalFloors ?? '?'}` },
    { label: 'Aidat', value: `₺${(l.aidat ?? 0).toLocaleString('tr-TR')}` },
    { label: 'Krediye uygun', value: l.creditEligible ? '✓' : '—' },
  ]
}

function villaFacts(l: Listing): Fact[] {
  return [
    { label: 'Oda', value: l.rooms ?? '?' },
    { label: 'Brüt m²', value: l.size.toLocaleString('tr-TR') },
    { label: 'Havuz', value: l.siteAmenities?.includes('havuz') ? '✓' : '—' },
    { label: 'Bahçe', value: l.siteAmenities?.includes('yesil-alan') ? '✓' : '—' },
    { label: 'Kat', value: `${l.totalFloors ?? '?'}` },
    { label: 'Krediye uygun', value: l.creditEligible ? '✓' : '—' },
  ]
}

function isyeriFacts(l: Listing): Fact[] {
  return [
    { label: 'Brüt m²', value: l.size.toLocaleString('tr-TR') },
    { label: 'Net m²', value: (l.netSize ?? l.size).toLocaleString('tr-TR') },
    { label: 'Vitrin', value: l.hasShowcase ? '✓' : '—' },
    { label: 'Kullanım', value: l.commercialUsage?.join(', ') ?? '?' },
  ]
}

export function KeyFactsVariant({ listing }: KeyFactsVariantProps): ReactElement {
  const c = listing.category ?? 'arsa'
  const facts =
    c === 'arsa' ? arsaFacts(listing) :
      c === 'konut' ? konutFacts(listing) :
        c === 'villa' ? villaFacts(listing) :
          isyeriFacts(listing)

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="font-serif text-lg mb-3">Özellikler</h2>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        {facts.map((f) => (
          <div key={f.label}>
            <dt className="text-muted-foreground text-xs">{f.label}</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{f.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default KeyFactsVariant
