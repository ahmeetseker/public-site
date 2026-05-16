// SimilarListingsIsland — Wave F6.B → F24.B.
//
// React island that replaces the static SimilarListings.astro rendering.
// Pulls LISTINGS from @landx/data, runs scoreRelatedListings() (F24.0) with
// the page's current listing, and renders the top 6 results.
//
// Wave F24.B — swapped from the legacy single-axis findSimilar() weighting to
// the multi-factor scoreRelatedListings() helper from @/lib/related-algorithm.
// It returns a stable `{ listing, score, reasons }` triple per candidate so we
// can surface the score as a small badge and explain *why* each card was
// surfaced through a `title=` tooltip built from the reasons array. The
// visual shell (eyebrow + serif heading + card list) is unchanged.

import { LISTINGS, type Listing } from '@landx/data'
import { formatTLCompact } from '@landx/ui/lib'
import {
  scoreRelatedListings,
  type RelatedScore,
} from '@/lib/related-algorithm'

export interface SimilarListingsIslandProps {
  /** The current listing being viewed (full object, serialised by Astro). */
  current: Listing
  /** UI locale for the surrounding labels. */
  locale?: 'tr' | 'en'
  /** Max items to show. */
  count?: number
}

interface Copy {
  eyebrow: string
  heading: string
  headingEm: string
  emptyMsg: string
  ariaLabel: string
  scoreLabel: string
}

const COPY: Record<'tr' | 'en', Copy> = {
  tr: {
    eyebrow: 'Benzer ilanlar',
    heading: 'Aynı bölgede',
    headingEm: 'başka ilanlar',
    emptyMsg: 'Bu ilana benzeyen başka aktif kayıt bulunamadı.',
    ariaLabel: 'Benzer ilanlar',
    scoreLabel: 'Benzerlik skoru',
  },
  en: {
    eyebrow: 'Similar listings',
    heading: 'Other lots',
    headingEm: 'in this region',
    emptyMsg: 'No similar listings to surface right now.',
    ariaLabel: 'Similar listings',
    scoreLabel: 'Similarity score',
  },
}

function slugify(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function SimilarListingsIsland({
  current,
  locale = 'tr',
  count = 6,
}: SimilarListingsIslandProps) {
  const copy = COPY[locale]
  const related: RelatedScore[] = scoreRelatedListings(current, LISTINGS, {
    limit: count,
    minScore: 30,
  })
  const prefix = locale === 'en' ? '/en' : ''
  const sizeLocale = locale === 'en' ? 'en-US' : 'tr-TR'

  if (related.length === 0) {
    return (
      <section
        aria-label={copy.ariaLabel}
        className="rounded-2xl border border-border bg-card p-5"
        data-testid="similar-listings"
      >
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {copy.eyebrow}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{copy.emptyMsg}</p>
      </section>
    )
  }

  return (
    <section
      aria-label={copy.ariaLabel}
      className="rounded-2xl border border-border bg-card p-5"
      data-testid="similar-listings"
    >
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {copy.eyebrow}
      </div>
      <h2 className="mt-1 font-serif text-lg font-medium tracking-tight">
        {copy.heading} <em className="not-italic font-normal">{copy.headingEm}</em>
      </h2>

      <ul className="mt-4 space-y-3" data-testid="similar-items">
        {related.map(({ listing: l, score, reasons }) => {
          const reasonText = reasons
            .filter((r) => r.weight > 0)
            .map((r) => r.label)
            .join(' · ')
          return (
            <li
              key={l.id}
              data-testid="similar-item"
              data-listing-id={l.id}
              data-related-score={score}
            >
              <a
                href={`${prefix}/ilan/${slugify(l.title)}-${l.id}`}
                className="block rounded-xl border border-border bg-background p-3 transition hover:border-foreground/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {l.title}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {l.district} · {l.size.toLocaleString(sizeLocale)} m²
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <div className="font-serif text-sm tabular-nums">
                      {formatTLCompact(l.price)}
                    </div>
                    <span
                      title={reasonText || copy.scoreLabel}
                      aria-label={`${copy.scoreLabel}: ${score}%`}
                      className="rounded-full border border-border bg-card px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground"
                      data-testid="similar-score"
                    >
                      %{score}
                    </span>
                  </div>
                </div>
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
