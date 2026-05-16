/**
 * PublishedListings — /hesabim/ilanlarim island (Wave F5.E).
 *
 * Reads `arsam.ilanlarim.v1` on mount, renders newest-first list with
 * edit/delete row actions and a confirm-before-delete prompt. Empty state
 * routes to /ilan-ver. Locale detected from `<html lang>`.
 *
 * No mutation cascades back to the wizard — `Edit` simply opens the wizard
 * landing (Step 1) preloaded with `?ref=` so a future patch can resume into a
 * draft populated from this entry. For now the wizard ignores `?ref` and the
 * user re-enters fields manually.
 */
import { useEffect, useState } from 'react'
import { SkeletonCard } from '@landx/ui/feedback'
import {
  getIlanlarim,
  removeIlan,
  type IlanlarimEntry,
} from '@/lib/ilanlarim'

function detectLocale(): 'tr' | 'en' {
  if (typeof document === 'undefined') return 'tr'
  // RootLayout sets `<html lang>` to `en-US` for /en/*. Accept any `en-*`.
  return document.documentElement.lang.startsWith('en') ? 'en' : 'tr'
}

function fmtPrice(p: number, locale: 'tr' | 'en'): string {
  const numLocale = locale === 'en' ? 'en-US' : 'tr-TR'
  return new Intl.NumberFormat(numLocale).format(p) + ' ₺'
}

const LABELS = {
  tr: {
    empty: 'Henüz ilan yayınlamadın.',
    emptyCta: 'İlan ver',
    edit: 'Düzenle',
    del: 'Sil',
    confirm: 'Emin misin? Bu ilan kalıcı olarak silinecek.',
    confirmYes: 'Evet, sil',
    confirmNo: 'İptal',
    status: { aktif: 'Aktif', pasif: 'Pasif', taslak: 'Taslak' },
    areaUnit: 'm²',
  },
  en: {
    empty: "You haven't published any listings yet.",
    emptyCta: 'Publish a listing',
    edit: 'Edit',
    del: 'Delete',
    confirm: 'Are you sure? This listing will be permanently deleted.',
    confirmYes: 'Yes, delete',
    confirmNo: 'Cancel',
    status: { aktif: 'Active', pasif: 'Inactive', taslak: 'Draft' },
    areaUnit: 'm²',
  },
} as const

export default function PublishedListings() {
  const [locale] = useState(detectLocale)
  const [items, setItems] = useState<IlanlarimEntry[]>([])
  const [mounted, setMounted] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    setItems(getIlanlarim())
    setMounted(true)
  }, [])

  function handleDelete(ref: string) {
    removeIlan(ref)
    setItems(getIlanlarim())
    setConfirmDelete(null)
  }

  const L = LABELS[locale]
  const prefix = locale === 'en' ? '/en' : ''

  if (!mounted) {
    // Avoid SSR/CSR mismatch flash — render skeleton placeholders so the
    // grid shape is reserved and CLS stays at 0.
    return (
      <div
        data-published-island=""
        data-mounted="false"
        data-testid="published-skeleton"
        className="flex flex-col gap-3"
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label={locale === 'en' ? 'Loading listings' : 'İlanlar yükleniyor'}
      >
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div
        data-published-island=""
        data-mounted="true"
        className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center"
        data-testid="published-empty"
      >
        <p className="text-sm text-muted-foreground">{L.empty}</p>
        <a
          href={`${prefix}/ilan-ver`}
          className="mt-4 inline-block rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition hover:opacity-90"
        >
          {L.emptyCta} →
        </a>
      </div>
    )
  }

  return (
    <ul
      data-published-island=""
      data-mounted="true"
      data-count={items.length}
      className="flex flex-col gap-3"
      data-testid="published-list"
    >
      {items.map((it) => (
        <li
          key={it.ref}
          className="rounded-2xl border border-border bg-card p-4"
          data-testid={`published-${it.ref}`}
          data-ref={it.ref}
        >
          <div className="flex items-start gap-3">
            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-foreground/5">
              {it.thumbnail ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <img
                  src={it.thumbnail}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  {it.ref.slice(-4)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {it.ref}
              </p>
              <h3 className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
                {it.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {[it.district, it.city].filter(Boolean).join(', ')} · {it.area}{' '}
                {L.areaUnit} · {fmtPrice(it.price, locale)}
              </p>
              <span
                className="mt-2 inline-block rounded-full bg-foreground/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-foreground"
                data-status={it.status}
              >
                {L.status[it.status]}
              </span>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <a
                href={`${prefix}/ilan-ver/1?ref=${encodeURIComponent(it.ref)}`}
                className="rounded-full border border-border bg-background px-3 py-1 text-center text-xs text-foreground transition hover:bg-foreground/5"
                data-testid={`edit-${it.ref}`}
              >
                {L.edit}
              </a>
              <button
                type="button"
                onClick={() => setConfirmDelete(it.ref)}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground transition hover:bg-foreground/5"
                data-testid={`del-${it.ref}`}
              >
                {L.del}
              </button>
            </div>
          </div>
          {confirmDelete === it.ref && (
            <div
              className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/[0.06] p-3 text-xs dark:border-rose-400/40 dark:bg-rose-400/[0.06]"
              data-testid={`confirm-${it.ref}`}
            >
              <p className="text-foreground">{L.confirm}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDelete(it.ref)}
                  className="rounded-full bg-rose-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-rose-700"
                  data-testid={`confirm-del-${it.ref}`}
                >
                  {L.confirmYes}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground transition hover:bg-foreground/5"
                  data-testid={`confirm-cancel-${it.ref}`}
                >
                  {L.confirmNo}
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
