// ReviewsList — Wave F6.B.
//
// Client island mounted on /ilan/[slug] (TR + EN). Renders:
//   - Average rating (large star + numeric value + count)
//   - Collapsed list of reviews (top 3 by default, "expand" toggle)
//   - "Yorum ekle" / "Add review" toggle → mounts AddReviewForm inline
//
// All data lives in localStorage via lib/reviews.ts. The first useEffect
// triggers seeding on the client (avoids SSR/localStorage mismatch).

import { useEffect, useState } from 'react'
import StarRating from './StarRating'
import AddReviewForm from './AddReviewForm'
import { getAverageRating, getReviews, type Review } from '@/lib/reviews'

export interface ReviewsListProps {
  listingId: string
  locale?: 'tr' | 'en'
}

interface Copy {
  heading: string
  avgLabel: (avg: string, count: number) => string
  noReviews: string
  toggleAdd: string
  expand: string
  collapse: string
  byAnon: string
  dateLocale: 'tr-TR' | 'en-US'
}

const COPY: Record<'tr' | 'en', Copy> = {
  tr: {
    heading: 'Yorumlar',
    avgLabel: (avg, count) => `${avg} / 5 · ${count} yorum`,
    noReviews: 'Henüz yorum yok.',
    toggleAdd: 'Yorum ekle',
    expand: 'Tümünü göster',
    collapse: 'Daha az göster',
    byAnon: 'Anonim',
    dateLocale: 'tr-TR',
  },
  en: {
    heading: 'Reviews',
    avgLabel: (avg, count) => `${avg} / 5 · ${count} reviews`,
    noReviews: 'No reviews yet.',
    toggleAdd: 'Add a review',
    expand: 'Show all',
    collapse: 'Show fewer',
    byAnon: 'Anonymous',
    dateLocale: 'en-US',
  },
}

const COLLAPSED_COUNT = 3

export default function ReviewsList({
  listingId,
  locale = 'tr',
}: ReviewsListProps) {
  const copy = COPY[locale]
  const [reviews, setReviews] = useState<Review[]>([])
  const [average, setAverage] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [ready, setReady] = useState(false)

  // Seed/read on mount only. SSR renders nothing (server-time localStorage
  // is empty in our jsdom polyfill anyway); the island fills in on hydration.
  useEffect(() => {
    const list = getReviews(listingId)
    setReviews(list)
    setAverage(getAverageRating(listingId))
    setReady(true)
  }, [listingId])

  function handleSubmitted(next: Review[]) {
    setReviews(next)
    setAverage(getAverageRating(listingId))
    setExpanded(true) // user just submitted — give them confirmation by showing it
    // Keep `addOpen` true so the AddReviewForm can render its own success
    // banner. The form auto-resets its inputs internally; the user can close
    // the form manually via the cancel button when they're done.
  }

  // Until first effect runs, render a skeleton so layout doesn't jump on
  // hydration. The seed always produces 3 entries so the steady-state UI
  // shows the heading + 3 cards.
  const visible = expanded ? reviews : reviews.slice(0, COLLAPSED_COUNT)
  const showExpandToggle = reviews.length > COLLAPSED_COUNT

  return (
    <section
      aria-label={copy.heading}
      className="rounded-2xl border border-border bg-card p-5"
      data-testid="reviews-list"
    >
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {copy.heading}
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <StarRating
              value={Math.round(average)}
              size="lg"
              ariaLabel={`${average} / 5`}
              testId="reviews-average"
            />
            <span
              className="font-mono text-xs tabular-nums text-muted-foreground"
              data-testid="reviews-avg-label"
            >
              {ready ? copy.avgLabel(average.toFixed(1), reviews.length) : ''}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="rounded-full border border-border bg-background px-3 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-foreground transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
          aria-expanded={addOpen}
          data-testid="reviews-toggle-add"
        >
          {copy.toggleAdd}
        </button>
      </header>

      {addOpen && (
        <AddReviewForm
          listingId={listingId}
          locale={locale}
          onSubmitted={handleSubmitted}
          onCancel={() => setAddOpen(false)}
        />
      )}

      {ready && reviews.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground" data-testid="reviews-empty">
          {copy.noReviews}
        </p>
      )}

      {ready && reviews.length > 0 && (
        <ul className="mt-5 space-y-3" data-testid="reviews-items">
          {visible.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-border bg-background p-3"
              data-testid="review-item"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {r.author || copy.byAnon}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <StarRating value={r.rating} size="sm" testId="review-stars" />
                    <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {formatDate(r.createdAt, copy.dateLocale)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{r.body}</p>
            </li>
          ))}
        </ul>
      )}

      {showExpandToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
          data-testid="reviews-expand"
        >
          {expanded ? copy.collapse : copy.expand}
        </button>
      )}
    </section>
  )
}

function formatDate(ms: number, locale: 'tr-TR' | 'en-US'): string {
  try {
    return new Date(ms).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })
  } catch {
    return ''
  }
}
