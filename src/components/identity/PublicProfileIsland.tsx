/**
 * PublicProfileIsland — `/profil/[username]` React island (client:idle).
 *
 * Wave F32 / W3A. Header: avatar + isim + üyelik tarihi + rating (★ + N
 * değerlendirme). Tabs: "Aktif İlanlar" + "Hakkında". TanStack Query üzerinden
 * `useGetPublicProfile` hook'u tüketir.
 */
import { useState, useTransition } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Star, MapPin, BadgeCheck } from '@landx/icons'
import { useGetPublicProfile } from '@landx/data'

interface Props {
  username: string
  locale?: 'tr' | 'en'
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: false },
  },
})

const LABELS = {
  tr: {
    member: 'Üye',
    activeListings: 'Aktif İlanlar',
    about: 'Hakkında',
    reviews: 'değerlendirme',
    notFound: 'Profil bulunamadı.',
    backToListings: 'İlanlara dön',
    bioMissing: 'Bu kullanıcı henüz bir biyografi eklememiş.',
    location: 'Konum',
    verified: 'Doğrulanmış',
    activeListingsCount: (n: number) => `${n} aktif ilan`,
    noActiveListings: 'Şu anda yayında ilan yok.',
  },
  en: {
    member: 'Member since',
    activeListings: 'Active listings',
    about: 'About',
    reviews: 'reviews',
    notFound: 'Profile not found.',
    backToListings: 'Back to listings',
    bioMissing: 'This user has not added a bio yet.',
    location: 'Location',
    verified: 'Verified',
    activeListingsCount: (n: number) => `${n} active listings`,
    noActiveListings: 'No active listings.',
  },
}

function formatTLCompact(amount: number): string {
  return `₺ ${new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)}`
}

function formatJoined(iso: string, locale: 'tr' | 'en'): string {
  return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'tr-TR', {
    month: 'long',
    year: 'numeric',
  })
}

function ProfileBody({ username, locale }: Required<Props>) {
  const labels = LABELS[locale]
  const [tab, setTab] = useState<'listings' | 'about'>('listings')
  const [, startTransition] = useTransition()
  const { data, isPending, error } = useGetPublicProfile(username)

  if (isPending) {
    return (
      <div
        role="status"
        aria-busy="true"
        data-testid="public-profile-loading"
        className="mx-auto max-w-[1080px] animate-pulse px-4 py-10"
      >
        <div className="mb-6 h-32 rounded-2xl bg-foreground/5" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="h-40 rounded-2xl bg-foreground/5" />
          <div className="h-40 rounded-2xl bg-foreground/5" />
          <div className="h-40 rounded-2xl bg-foreground/5" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-16 text-center">
        <h2 className="font-serif text-2xl tracking-tight">{labels.notFound}</h2>
        <a
          href={locale === 'en' ? '/en/ofisler' : '/ofisler'}
          className="mt-4 inline-flex rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-foreground/5"
        >
          {labels.backToListings}
        </a>
      </div>
    )
  }

  const initials = data.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-8 md:py-12" data-testid="public-profile-island">
      {/* Header */}
      <header className="mb-8 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-foreground/10 font-serif text-2xl font-medium tracking-tight"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-3xl tracking-tight">{data.displayName}</h1>
              {data.verified && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                  data-testid="profile-verified-badge"
                >
                  <BadgeCheck className="h-3 w-3" />
                  {labels.verified}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {labels.member} {formatJoined(data.memberSince, locale)}
              {data.city ? (
                <>
                  {' · '}
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {data.city}
                  </span>
                </>
              ) : null}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-1.5" data-testid="profile-rating">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-mono text-sm font-medium tabular-nums">
                  {data.rating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  · {data.reviewCount} {labels.reviews}
                </span>
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {labels.activeListingsCount(data.activeListings)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div role="tablist" aria-label={labels.activeListings} className="mb-4 flex gap-2">
        {(['listings', 'about'] as const).map((k) => {
          const active = tab === k
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`profile-tab-${k}`}
              onClick={() => startTransition(() => setTab(k))}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {k === 'listings' ? labels.activeListings : labels.about}
            </button>
          )
        })}
      </div>

      {tab === 'listings' ? (
        data.listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
            {labels.noActiveListings}
          </div>
        ) : (
          <ul
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            data-testid="profile-listings"
          >
            {data.listings.map((l) => (
              <li
                key={l.id}
                data-testid={`profile-listing-${l.id}`}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-foreground/20 hover:shadow-sm"
              >
                <div className="relative flex h-32 items-center justify-center bg-foreground/5">
                  <span className="font-serif text-2xl font-normal text-foreground/30">
                    {l.district}
                  </span>
                  <div className="absolute right-3 top-3 rounded-full bg-background/85 px-2 py-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {l.id}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="line-clamp-2 font-serif text-base leading-snug tracking-tight">
                    {l.title}
                  </h3>
                  <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    {l.city} · {l.district}
                  </div>
                  <div className="mt-auto pt-2 font-serif text-lg font-medium tracking-tight">
                    {formatTLCompact(l.price)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <article className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-3 font-serif text-xl tracking-tight">{labels.about}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {data.bio ?? labels.bioMissing}
          </p>
          {data.reviews.length > 0 && (
            <section className="mt-6 border-t border-border pt-4">
              <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {labels.reviews}
              </h3>
              <ul className="space-y-3" data-testid="profile-reviews">
                {data.reviews.map((r) => (
                  <li key={r.id} className="rounded-xl border border-border bg-background/50 p-3">
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-foreground/20'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-xs text-muted-foreground">{r.authorName}</span>
                    </div>
                    <p className="mt-2 text-sm">{r.comment}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      )}
    </div>
  )
}

export default function PublicProfileIsland({ username, locale = 'tr' }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileBody username={username} locale={locale} />
    </QueryClientProvider>
  )
}
