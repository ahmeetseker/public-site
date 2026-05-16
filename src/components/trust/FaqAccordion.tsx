/**
 * FaqAccordion — /destek FAQ hub island (Wave F32 W2A).
 *
 * Renders FAQ entries from `useListFaq` with category filter chips and an
 * accordion (one open at a time). Wraps a local QueryClientProvider since
 * public-site does not have a global one.
 */
import { useMemo, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient, useListFaq, type FaqEntry } from '@landx/data'

type Locale = 'tr' | 'en'

const LABELS = {
  tr: {
    all: 'Tümü',
    empty: 'Bu kategoride soru yok.',
    loading: 'Sorular yükleniyor…',
    cats: {
      hesap: 'Hesap',
      odeme: 'Ödeme',
      ilan: 'İlan',
      guvenlik: 'Güvenlik',
      iletisim: 'İletişim',
      genel: 'Genel',
    } as Record<FaqEntry['category'], string>,
  },
  en: {
    all: 'All',
    empty: 'No questions in this category yet.',
    loading: 'Loading questions…',
    cats: {
      hesap: 'Account',
      odeme: 'Payment',
      ilan: 'Listing',
      guvenlik: 'Security',
      iletisim: 'Contact',
      genel: 'General',
    } as Record<FaqEntry['category'], string>,
  },
} as const

function detectLocale(): Locale {
  if (typeof document === 'undefined') return 'tr'
  return document.documentElement.lang.startsWith('en') ? 'en' : 'tr'
}

export default function FaqAccordion() {
  return (
    <QueryClientProvider client={queryClient}>
      <Inner />
    </QueryClientProvider>
  )
}

function Inner() {
  const [locale] = useState<Locale>(() => detectLocale())
  const [category, setCategory] = useState<FaqEntry['category'] | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const { data, isLoading } = useListFaq()

  const L = LABELS[locale]

  const filtered = useMemo(() => {
    const list = data ?? []
    if (category === 'all') return list
    return list.filter((f) => f.category === category)
  }, [data, category])

  const categories: Array<FaqEntry['category']> = useMemo(() => {
    const set = new Set<FaqEntry['category']>()
    ;(data ?? []).forEach((f) => set.add(f.category))
    return Array.from(set)
  }, [data])

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
        {L.loading}
      </div>
    )
  }

  return (
    <div data-faq-accordion="" data-count={filtered.length}>
      <div
        role="tablist"
        aria-label="Kategori filtresi"
        className="mb-5 flex flex-wrap gap-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={category === 'all'}
          onClick={() => setCategory('all')}
          className={
            category === 'all'
              ? 'rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background'
              : 'rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground'
          }
        >
          {L.all}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={category === cat}
            onClick={() => setCategory(cat)}
            className={
              category === cat
                ? 'rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background'
                : 'rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground'
            }
          >
            {L.cats[cat]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          {L.empty}
        </div>
      ) : (
        <ul className="flex flex-col gap-2" data-faq-list="">
          {filtered.map((f) => {
            const isOpen = openId === f.id
            return (
              <li
                key={f.id}
                data-faq-entry={f.id}
                data-faq-open={isOpen}
                className="rounded-2xl border border-border bg-card"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenId(isOpen ? null : f.id)}
                  className="flex w-full items-start justify-between gap-3 p-4 text-left transition hover:bg-foreground/5"
                >
                  <span className="flex flex-col gap-1">
                    <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {L.cats[f.category]}
                    </span>
                    <span className="font-serif text-base tracking-tight text-foreground">
                      {f.question}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={
                      isOpen
                        ? 'mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xs transition'
                        : 'mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs transition'
                    }
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-border px-4 py-3 text-sm leading-relaxed text-foreground/85">
                    <p className="whitespace-pre-line">{f.answer}</p>
                    {f.relatedGuideSlug && (
                      <a
                        href={`/yardim/${f.relatedGuideSlug}`}
                        className="mt-3 inline-block font-mono text-xs uppercase tracking-[0.14em] text-foreground underline underline-offset-4"
                      >
                        Detaylı rehber →
                      </a>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
