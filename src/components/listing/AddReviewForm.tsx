// AddReviewForm — Wave F6.B.
//
// Local-only review submission. Validation rules (matched in plan/spec):
//   - rating: 1..5 (required)
//   - body: ≥10 chars
//   - author: ≥2 chars (defaults to "Anonim" / "Anonymous" on submit if blank)
// On submit:
//   - Persist via addReview() → arsam.reviews.v1
//   - Show a brief inline confirmation
//   - Call onSubmitted(reviewList) so the parent ReviewsList refreshes
//
// No network. No third-party. Token-only styling.

import { useState } from 'react'
import StarRating from './StarRating'
import {
  addReview,
  makeReviewId,
  type Review,
  type ReviewRating,
} from '@/lib/reviews'

export interface AddReviewFormProps {
  listingId: string
  locale?: 'tr' | 'en'
  onSubmitted?: (reviews: Review[]) => void
  onCancel?: () => void
}

interface Copy {
  heading: string
  ratingLabel: string
  ratingHint: string
  authorLabel: string
  authorPlaceholder: string
  bodyLabel: string
  bodyPlaceholder: string
  submit: string
  cancel: string
  thanks: string
  errors: {
    ratingMissing: string
    bodyTooShort: string
  }
  anonymous: string
}

const COPY: Record<'tr' | 'en', Copy> = {
  tr: {
    heading: 'Yorumunu ekle',
    ratingLabel: 'Puan',
    ratingHint: '1 - 5 yıldız',
    authorLabel: 'Adın',
    authorPlaceholder: 'Adın (zorunlu değil)',
    bodyLabel: 'Yorum',
    bodyPlaceholder: 'Deneyimini birkaç cümleyle anlat (en az 10 karakter)',
    submit: 'Yorumu yayınla',
    cancel: 'Vazgeç',
    thanks: 'Teşekkürler! Yorumun yayında ✓',
    errors: {
      ratingMissing: 'Lütfen bir puan seç (1 - 5).',
      bodyTooShort: 'Yorum en az 10 karakter olmalı.',
    },
    anonymous: 'Anonim',
  },
  en: {
    heading: 'Add your review',
    ratingLabel: 'Rating',
    ratingHint: '1 to 5 stars',
    authorLabel: 'Your name',
    authorPlaceholder: 'Your name (optional)',
    bodyLabel: 'Review',
    bodyPlaceholder: 'Share a few words about your experience (min 10 chars)',
    submit: 'Publish review',
    cancel: 'Cancel',
    thanks: 'Thanks! Your review is live ✓',
    errors: {
      ratingMissing: 'Please choose a rating (1 to 5).',
      bodyTooShort: 'Review must be at least 10 characters.',
    },
    anonymous: 'Anonymous',
  },
}

export default function AddReviewForm({
  listingId,
  locale = 'tr',
  onSubmitted,
  onCancel,
}: AddReviewFormProps) {
  const copy = COPY[locale]
  const [rating, setRating] = useState<ReviewRating | 0>(0)
  const [author, setAuthor] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function validate(): string | null {
    if (rating < 1 || rating > 5) return copy.errors.ratingMissing
    if (body.trim().length < 10) return copy.errors.bodyTooShort
    return null
  }

  function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    const review: Review = {
      id: makeReviewId(),
      listingId,
      author: author.trim().length >= 2 ? author.trim() : copy.anonymous,
      rating: rating as ReviewRating,
      body: body.trim(),
      createdAt: Date.now(),
    }
    const next = addReview(review)
    setError(null)
    setDone(true)
    setRating(0)
    setAuthor('')
    setBody('')
    onSubmitted?.(next)
    // Auto-hide the success banner after a short delay.
    window.setTimeout(() => setDone(false), 1800)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-4 rounded-2xl border border-border bg-background p-4"
      aria-label={copy.heading}
      data-testid="add-review-form"
    >
      <div className="flex items-end justify-between gap-2">
        <h3 className="font-serif text-base font-medium tracking-tight">{copy.heading}</h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
            data-testid="add-review-cancel"
          >
            {copy.cancel}
          </button>
        )}
      </div>

      <div className="space-y-1">
        <label className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {copy.ratingLabel}
        </label>
        <div>
          <StarRating
            value={rating}
            max={5}
            interactive
            size="lg"
            ariaLabel={copy.ratingLabel}
            onChange={(v) => {
              setRating(v as ReviewRating)
              if (error) setError(null)
            }}
            testId="add-review-rating"
          />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground/80">
          {copy.ratingHint}
        </p>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="add-review-author"
          className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
        >
          {copy.authorLabel}
        </label>
        <input
          id="add-review-author"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder={copy.authorPlaceholder}
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          maxLength={64}
          data-testid="add-review-author"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="add-review-body"
          className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
        >
          {copy.bodyLabel}
        </label>
        <textarea
          id="add-review-body"
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            if (error) setError(null)
          }}
          placeholder={copy.bodyPlaceholder}
          rows={4}
          className="w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          maxLength={800}
          data-testid="add-review-body"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-50/60 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
          data-testid="add-review-error"
        >
          {error}
        </p>
      )}

      {done && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-xl border border-emerald-500/40 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
          data-testid="add-review-success"
        >
          {copy.thanks}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-background transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
          data-testid="add-review-submit"
        >
          {copy.submit}
        </button>
      </div>
    </form>
  )
}
