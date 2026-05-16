import type { ReactElement } from 'react'
import { IdentityCard } from '../IdentityCard'
import { ListingDetailQueryProvider } from '../_provider'
import type { Listing } from '@landx/data'

function ArsaIdentity({ listingId }: { listingId: string }): ReactElement {
  return (
    <ListingDetailQueryProvider>
      <IdentityCard listingId={listingId} />
    </ListingDetailQueryProvider>
  )
}

export interface IdentityCardVariantProps {
  listing: Listing
}

function ResidentialIdentity({ listing }: { listing: Listing }): ReactElement {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="font-serif text-lg mb-3">Bina bilgisi</h2>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">Yapı yaşı</dt>
          <dd className="tabular-nums">{listing.buildingAge ?? '?'} yıl</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Kat</dt>
          <dd className="tabular-nums">{listing.floor ?? '?'} / {listing.totalFloors ?? '?'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Asansör</dt>
          <dd>{listing.hasElevator ? 'Var' : 'Yok'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Isıtma</dt>
          <dd>{listing.heating ?? '?'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Otopark</dt>
          <dd>{listing.parking ?? '?'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Aidat</dt>
          <dd className="tabular-nums">₺{(listing.aidat ?? 0).toLocaleString('tr-TR')}/ay</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Krediye uygun</dt>
          <dd>{listing.creditEligible ? 'Evet ✓' : 'Hayır'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Enerji sınıfı</dt>
          <dd>{listing.energyClass ?? '?'}</dd>
        </div>
      </dl>
    </section>
  )
}

function CommercialIdentity({ listing }: { listing: Listing }): ReactElement {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="font-serif text-lg mb-3">İşyeri bilgisi</h2>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">Tip</dt>
          <dd>{listing.subType ?? 'ofis'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Brüt m²</dt>
          <dd className="tabular-nums">{listing.size}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Net m²</dt>
          <dd className="tabular-nums">{listing.netSize ?? '?'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Vitrin</dt>
          <dd>{listing.hasShowcase ? 'Var' : 'Yok'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Kullanım</dt>
          <dd>{listing.commercialUsage?.join(', ') ?? '?'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Krediye uygun</dt>
          <dd>{listing.creditEligible ? 'Evet ✓' : 'Hayır'}</dd>
        </div>
      </dl>
    </section>
  )
}

export function IdentityCardVariant({ listing }: IdentityCardVariantProps): ReactElement {
  const c = listing.category ?? 'arsa'
  if (c === 'arsa') return <ArsaIdentity listingId={listing.id} />
  if (c === 'konut' || c === 'villa') return <ResidentialIdentity listing={listing} />
  if (c === 'isyeri') return <CommercialIdentity listing={listing} />
  return <ArsaIdentity listingId={listing.id} />
}

export default IdentityCardVariant
