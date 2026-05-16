/**
 * SuccessSummary — /ilan-ver/tesekkurler island.
 *
 * Wave F4 / Agent-F4A.
 *
 * Reads `id` from the current URL's ?id= search param (set by IlanOnizleme's
 * submit handler). Falls back to a placeholder if the page is opened directly.
 * Wave F5.E: the primary CTA now lands on /hesabim/ilanlarim (close-the-loop),
 * locale-aware via the F5.B-added `locale` prop.
 */
import { useEffect, useState } from 'react'

const FALLBACK_REF = 'AT-2026-0042'

const LABELS = {
  tr: {
    eyebrow: 'Başarılı · yayın sürecine alındı',
    headingPre: 'Teşekkürler, ',
    headingAccent: 'ilanın',
    headingPost: ' yayında',
    body: 'Editör ekibimiz inceliyor. Genellikle ',
    bodyStrong: '24 saat içinde',
    bodyTail: ' aktif olur.',
    refLabel: 'İlan ID',
    copyAria: "İlan ID'sini kopyala",
    copy: 'Kopyala',
    copied: 'Kopyalandı',
    ctaListings: 'İlanlarımı gör',
    ctaNew: 'Yeni ilan ekle',
    ctaHome: 'Ana sayfa',
  },
  en: {
    eyebrow: 'Success · sent for review',
    headingPre: 'Thank you — your ',
    headingAccent: 'listing',
    headingPost: ' is being reviewed',
    body: 'Our editorial team is checking it. Usually ',
    bodyStrong: 'within 24 hours',
    bodyTail: ' it goes live.',
    refLabel: 'Listing ID',
    copyAria: 'Copy listing ID',
    copy: 'Copy',
    copied: 'Copied',
    ctaListings: 'View my listings',
    ctaNew: 'Add a new listing',
    ctaHome: 'Home',
  },
} as const

export interface SuccessSummaryProps {
  locale?: 'tr' | 'en'
}

export default function SuccessSummary({ locale = 'tr' }: SuccessSummaryProps = {}) {
  const L = LABELS[locale]
  const prefix = locale === 'en' ? '/en' : ''
  const [ref, setRef] = useState<string>(FALLBACK_REF)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      const id = sp.get('id')
      if (id && id.length > 0) setRef(id)
    } catch {
      /* ignore */
    }
    setMounted(true)
  }, [])

  function copy() {
    try {
      navigator.clipboard?.writeText(ref)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      data-ilan-success=""
      data-mounted={mounted ? 'true' : 'false'}
      data-ref={ref}
      className="mx-auto max-w-xl text-center"
    >
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-foreground/10 text-foreground"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {L.eyebrow}
      </div>
      <h1 className="mt-2 font-serif text-4xl font-normal tracking-tight md:text-5xl">
        {L.headingPre}<em className="font-serif italic font-normal">{L.headingAccent}</em>{L.headingPost}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground md:text-base">
        {L.body}
        <strong className="font-medium text-foreground">{L.bodyStrong}</strong>{L.bodyTail}
      </p>

      <div
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm"
        data-ilan-ref-card=""
      >
        <span className="text-muted-foreground">{L.refLabel}</span>
        <span className="font-mono text-foreground tabular-nums" data-ref-value="">
          {ref}
        </span>
        <button
          type="button"
          onClick={copy}
          data-ilan-copy=""
          aria-label={L.copyAria}
          className="ml-1 min-h-8 rounded-md border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          {copied ? L.copied : L.copy}
        </button>
      </div>

      <div className="mt-10 grid gap-3 md:grid-cols-3">
        <a
          href={`${prefix}/hesabim/ilanlarim`}
          data-ilan-cta-account=""
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {L.ctaListings}
        </a>
        <a
          href={`${prefix}/ilan-ver/`}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-foreground/5"
        >
          {L.ctaNew}
        </a>
        <a
          href={`${prefix}/`}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-foreground/5"
        >
          {L.ctaHome}
        </a>
      </div>
    </div>
  )
}
