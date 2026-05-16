import { useState } from 'react'

import { t } from '@/i18n'
import { triggerPrint } from '@/lib/compare-pdf'

export interface CompareShareButtonProps {
  ids: string[]
  locale: 'tr' | 'en'
  /** Wave F9.A — "only differences" toggle state, owned by parent island. */
  onlyDiff?: boolean
  /** Wave F9.A — flip the only-differences filter. */
  onToggleOnlyDiff?: () => void
}

export default function CompareShareButton({
  ids,
  locale,
  onlyDiff = false,
  onToggleOnlyDiff,
}: CompareShareButtonProps) {
  const [toast, setToast] = useState('')

  async function copy() {
    const url = new URL(window.location.href)
    url.searchParams.set('ids', ids.join(','))
    try {
      await navigator.clipboard.writeText(url.toString())
      setToast(locale === 'en' ? 'Link copied ✓' : 'Kopyalandı ✓')
      setTimeout(() => setToast(''), 1200)
    } catch {
      setToast(locale === 'en' ? 'Copy failed' : 'Kopyalanamadı')
      setTimeout(() => setToast(''), 1200)
    }
  }

  function printPage() {
    triggerPrint()
  }

  const pdfLabel = t('compare.advanced.pdfCta', locale)
  const inversionLabel = t('compare.advanced.inversionToggle', locale)

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="compare-actions"
      data-print-hide=""
    >
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        data-testid="compare-share"
      >
        {locale === 'en' ? 'Share' : 'Paylaş'}
      </button>
      <button
        type="button"
        onClick={printPage}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        data-testid="compare-print"
      >
        {locale === 'en' ? 'Print' : 'Yazdır'}
      </button>
      <button
        type="button"
        onClick={printPage}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground px-3 py-1.5 text-xs font-medium text-background transition hover:bg-foreground/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        data-testid="compare-pdf"
        title={t('compare.advanced.pdfHint', locale)}
      >
        {pdfLabel}
      </button>
      {onToggleOnlyDiff && (
        <label
          className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent"
          data-testid="compare-inversion-label"
        >
          <input
            type="checkbox"
            checked={onlyDiff}
            onChange={onToggleOnlyDiff}
            className="h-3.5 w-3.5 cursor-pointer accent-foreground"
            data-testid="compare-inversion-toggle"
            aria-label={inversionLabel}
          />
          <span>{inversionLabel}</span>
        </label>
      )}
      {toast && (
        <span
          className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground"
          data-testid="compare-toast"
        >
          {toast}
        </span>
      )}
    </div>
  )
}
