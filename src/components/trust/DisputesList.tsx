/**
 * DisputesList — /hesabim/anlasmazliklar island (Wave F32 W2A).
 *
 * Status tabs (Açık/Çözüldü/Reddedildi), card list, and a "Yeni anlaşmazlık aç"
 * modal form. Reads `useListDisputes` and writes via `useCreateDispute`.
 * Wraps a local QueryClientProvider since public-site has no global one.
 */
import { useMemo, useState, type FormEvent } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  queryClient,
  useCreateDispute,
  useListDisputes,
  type CreateDisputeInput,
  type Dispute,
} from '@landx/data'

type Locale = 'tr' | 'en'
type TabKey = 'open' | 'resolved' | 'rejected'

const LABELS = {
  tr: {
    newCta: 'Yeni anlaşmazlık aç',
    tabs: { open: 'Açık', resolved: 'Çözüldü', rejected: 'Reddedildi' } as Record<
      TabKey,
      string
    >,
    empty: {
      open: 'Henüz açık anlaşmazlığın yok.',
      resolved: 'Çözülmüş anlaşmazlığın yok.',
      rejected: 'Reddedilen anlaşmazlığın yok.',
    } as Record<TabKey, string>,
    loading: 'Anlaşmazlıklar yükleniyor…',
    cats: {
      fraud: 'Dolandırıcılık',
      inappropriate: 'Uygunsuz',
      incorrect: 'Yanlış bilgi',
      other: 'Diğer',
    } as Record<Dispute['category'], string>,
    statusBadge: {
      open: 'Açık',
      investigating: 'İnceleniyor',
      resolved: 'Çözüldü',
      rejected: 'Reddedildi',
    } as Record<Dispute['status'], string>,
    lastUpdate: 'Son güncelleme',
    modal: {
      title: 'Yeni anlaşmazlık',
      intro: 'Sorunu özetle, ilgili ilan ID\'sini ekle. Destek ekibimiz 48 saat içinde dönüş yapar.',
      listingLabel: 'İlgili ilan ID (opsiyonel)',
      listingPlaceholder: 'örn. LST-2026-0042',
      counterpartyLabel: 'Karşı taraf kullanıcı ID (opsiyonel)',
      counterpartyPlaceholder: 'örn. user-123',
      categoryLabel: 'Kategori',
      descriptionLabel: 'Açıklama',
      descriptionPlaceholder: 'Sorunun detayı (en az 30 karakter)…',
      descriptionError: 'Açıklama en az 30 karakter olmalı.',
      submit: 'Gönder',
      submitting: 'Gönderiliyor…',
      cancel: 'Vazgeç',
    },
  },
  en: {
    newCta: 'New dispute',
    tabs: { open: 'Open', resolved: 'Resolved', rejected: 'Rejected' } as Record<
      TabKey,
      string
    >,
    empty: {
      open: 'No open disputes.',
      resolved: 'No resolved disputes.',
      rejected: 'No rejected disputes.',
    } as Record<TabKey, string>,
    loading: 'Loading disputes…',
    cats: {
      fraud: 'Fraud',
      inappropriate: 'Inappropriate',
      incorrect: 'Incorrect',
      other: 'Other',
    } as Record<Dispute['category'], string>,
    statusBadge: {
      open: 'Open',
      investigating: 'In review',
      resolved: 'Resolved',
      rejected: 'Rejected',
    } as Record<Dispute['status'], string>,
    lastUpdate: 'Last update',
    modal: {
      title: 'New dispute',
      intro: 'Summarize the issue and include the listing ID. Support replies within 48h.',
      listingLabel: 'Related listing ID (optional)',
      listingPlaceholder: 'e.g. LST-2026-0042',
      counterpartyLabel: 'Counterparty user ID (optional)',
      counterpartyPlaceholder: 'e.g. user-123',
      categoryLabel: 'Category',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Issue details (min 30 chars)…',
      descriptionError: 'Description must be at least 30 characters.',
      submit: 'Submit',
      submitting: 'Submitting…',
      cancel: 'Cancel',
    },
  },
} as const

function detectLocale(): Locale {
  if (typeof document === 'undefined') return 'tr'
  return document.documentElement.lang.startsWith('en') ? 'en' : 'tr'
}

function statusToTab(status: Dispute['status']): TabKey {
  if (status === 'resolved') return 'resolved'
  if (status === 'rejected') return 'rejected'
  return 'open'
}

const STATUS_TONES: Record<Dispute['status'], string> = {
  open: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  investigating: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  resolved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  rejected: 'border-border bg-foreground/[0.06] text-muted-foreground',
}

export default function DisputesList() {
  return (
    <QueryClientProvider client={queryClient}>
      <Inner />
    </QueryClientProvider>
  )
}

function Inner() {
  const [locale] = useState<Locale>(() => detectLocale())
  const [tab, setTab] = useState<TabKey>('open')
  const [createOpen, setCreateOpen] = useState(false)
  const { data, isLoading } = useListDisputes()

  const L = LABELS[locale]

  const grouped = useMemo(() => {
    const all = data ?? []
    return {
      open: all.filter((d) => statusToTab(d.status) === 'open'),
      resolved: all.filter((d) => statusToTab(d.status) === 'resolved'),
      rejected: all.filter((d) => statusToTab(d.status) === 'rejected'),
    }
  }, [data])

  const list = grouped[tab]

  function formatDate(iso: string): string {
    try {
      return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  return (
    <div data-disputes-list="" data-tab={tab}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Anlaşmazlık durumu"
          className="inline-flex rounded-xl border border-border bg-card p-1"
        >
          {(['open', 'resolved', 'rejected'] as TabKey[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={
                tab === key
                  ? 'rounded-lg bg-foreground px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-background'
                  : 'rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground'
              }
            >
              {L.tabs[key]}{' '}
              <span className="ml-1 text-xs opacity-70">({grouped[key].length})</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          data-disputes-new=""
          className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {L.newCta}
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          {L.loading}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <p className="font-serif text-lg text-muted-foreground">{L.empty[tab]}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((d) => {
            const lastUpdate = d.updates[d.updates.length - 1]
            return (
              <li
                key={d.id}
                data-dispute={d.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ' +
                      STATUS_TONES[d.status]
                    }
                  >
                    {L.statusBadge[d.status]}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {L.cats[d.category]}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    {d.id}
                  </span>
                </div>
                <h3 className="font-serif text-base tracking-tight">
                  {d.description.length > 100
                    ? d.description.slice(0, 100) + '…'
                    : d.description}
                </h3>
                {lastUpdate && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {L.lastUpdate}: {formatDate(lastUpdate.at)} ·{' '}
                    {lastUpdate.author === 'support' ? 'destek' : 'sen'}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {createOpen && (
        <CreateDisputeModal
          locale={locale}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  )
}

function CreateDisputeModal({
  locale,
  onClose,
}: {
  locale: Locale
  onClose: () => void
}) {
  const L = LABELS[locale].modal
  const cats = LABELS[locale].cats
  const [listingId, setListingId] = useState('')
  const [counterpartyId, setCounterpartyId] = useState('')
  const [category, setCategory] = useState<Dispute['category']>('fraud')
  const [description, setDescription] = useState('')
  const [touched, setTouched] = useState(false)
  const mutation = useCreateDispute()

  const descriptionError = description.trim().length < 30

  function submit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (descriptionError) return
    const input: CreateDisputeInput = {
      category,
      description: description.trim(),
      listingId: listingId.trim() || undefined,
      counterpartyId: counterpartyId.trim() || undefined,
    }
    mutation.mutate(input, {
      onSuccess: onClose,
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispute-create-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <form
        onSubmit={submit}
        className="relative w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-xl"
        noValidate
      >
        <h3
          id="dispute-create-title"
          className="font-serif text-2xl tracking-tight"
        >
          {L.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{L.intro}</p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {L.listingLabel}
            </label>
            <input
              type="text"
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              placeholder={L.listingPlaceholder}
              className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {L.counterpartyLabel}
            </label>
            <input
              type="text"
              value={counterpartyId}
              onChange={(e) => setCounterpartyId(e.target.value)}
              placeholder={L.counterpartyPlaceholder}
              className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </div>
        </div>

        <fieldset className="mt-4">
          <legend className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {L.categoryLabel}
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(['fraud', 'inappropriate', 'incorrect', 'other'] as const).map((c) => (
              <label
                key={c}
                className={
                  category === c
                    ? 'flex cursor-pointer items-center gap-2 rounded-xl border border-foreground/20 bg-foreground/5 px-3 py-2 text-sm transition'
                    : 'flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm transition hover:bg-foreground/5'
                }
              >
                <input
                  type="radio"
                  name="dispute-category"
                  value={c}
                  checked={category === c}
                  onChange={() => setCategory(c)}
                  className="h-3.5 w-3.5"
                />
                <span>{cats[c]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4">
          <label
            htmlFor="dispute-description"
            className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground"
          >
            {L.descriptionLabel}
          </label>
          <textarea
            id="dispute-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder={L.descriptionPlaceholder}
            aria-invalid={touched && descriptionError}
            className="mt-1.5 w-full rounded-xl border border-border bg-card p-3 text-sm leading-relaxed outline-none focus:border-foreground"
          />
          {touched && descriptionError && (
            <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
              {L.descriptionError}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-foreground/5"
          >
            {L.cancel}
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {mutation.isPending ? L.submitting : L.submit}
          </button>
        </div>
      </form>
    </div>
  )
}
