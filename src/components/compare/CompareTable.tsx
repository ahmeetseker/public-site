import type { Listing } from '@landx/data'

import { t } from '@/i18n'
import { findDiffs, type CompareRow } from '@/lib/compare-diff'
import { formatComparisonDate } from '@/lib/compare-pdf'

export interface CompareTableProps {
  listings: Listing[]
  locale: 'tr' | 'en'
}

interface RowDef {
  key: string
  label: string
  get: (l: Listing) => unknown
  fmt?: (v: unknown) => string
}

const PRICE_FMT = new Intl.NumberFormat('tr-TR')

const ROW_DEFS_TR: RowDef[] = [
  {
    key: 'price',
    label: 'Fiyat',
    get: (l) => l.price,
    fmt: (v) => `${PRICE_FMT.format(Number(v))} ₺`,
  },
  {
    key: 'size',
    label: 'Alan (m²)',
    get: (l) => l.size,
    fmt: (v) => `${v} m²`,
  },
  {
    key: 'pricePerSqm',
    label: 'Fiyat / m²',
    get: (l) => Math.round(l.price / l.size),
    fmt: (v) => `${PRICE_FMT.format(Number(v))} ₺/m²`,
  },
  {
    key: 'district',
    label: 'Bölge',
    get: (l) => `${l.district}, ${l.city}`,
  },
  {
    key: 'zoning',
    label: 'İmar',
    get: (l) => l.zoning ?? null,
    fmt: (v) => (v ? String(v) : '—'),
  },
  {
    key: 'titleStatus',
    label: 'Tapu',
    get: (l) => l.titleStatus ?? null,
    fmt: (v) => (v ? String(v) : '—'),
  },
  {
    key: 'hasRoad',
    label: 'Yol',
    get: (l) => l.hasRoad ?? null,
    fmt: (v) => (v === true ? '✓' : v === false ? '—' : '?'),
  },
  {
    key: 'hasWater',
    label: 'Su',
    get: (l) => l.hasWater ?? null,
    fmt: (v) => (v === true ? '✓' : v === false ? '—' : '?'),
  },
  {
    key: 'hasElectricity',
    label: 'Elektrik',
    get: (l) => l.hasElectricity ?? null,
    fmt: (v) => (v === true ? '✓' : v === false ? '—' : '?'),
  },
]

const EN_LABELS: Record<string, string> = {
  price: 'Price',
  size: 'Size (m²)',
  pricePerSqm: 'Price / m²',
  district: 'Region',
  zoning: 'Zoning',
  titleStatus: 'Title',
  hasRoad: 'Road',
  hasWater: 'Water',
  hasElectricity: 'Electricity',
}

const ROW_DEFS_EN: RowDef[] = ROW_DEFS_TR.map((r) => ({
  ...r,
  label: EN_LABELS[r.key] ?? r.label,
}))

export default function CompareTable({ listings, locale }: CompareTableProps) {
  const rows = locale === 'en' ? ROW_DEFS_EN : ROW_DEFS_TR
  const compareRows: CompareRow[] = rows.map((r) => ({
    key: r.key,
    values: listings.map(r.get),
  }))
  const diffs = findDiffs(compareRows)

  // Wave F9.A — print footer (only visible via print stylesheet) carrying
  // the localized date so a PDF reader can date the artifact.
  const footerDateTpl = t('compare.advanced.footerDate', locale)
  const footerDate = footerDateTpl.replace(
    '{date}',
    formatComparisonDate(locale),
  )

  return (
    <div data-compare-table-wrapper>
      <table
        className="hidden w-full table-fixed border-collapse text-sm md:table"
        data-testid="compare-table"
        data-compare-count={listings.length}
      >
        <thead>
          <tr>
            <th className="border-b border-border p-2 text-left font-medium text-muted-foreground">
              {t('compare.advanced.fieldLabel', locale)}
            </th>
            {listings.map((l) => (
              <th
                key={l.id}
                className="border-b border-border p-2 text-left font-medium text-foreground"
              >
                {l.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const isDiff = diffs.has(row.key)
            const values = compareRows[idx]?.values ?? []
            return (
              <tr
                key={row.key}
                className={isDiff ? 'bg-foreground/5' : ''}
                data-row-key={row.key}
                data-diff={isDiff ? 'true' : 'false'}
              >
                <td
                  className="border-b border-border p-2 text-muted-foreground"
                  title={
                    isDiff
                      ? locale === 'en'
                        ? 'This row differs'
                        : 'Bu satırda farklılaşıyor'
                      : undefined
                  }
                >
                  {row.label}
                </td>
                {listings.map((l, i) => {
                  const raw = values[i]
                  return (
                    <td
                      key={l.id}
                      className={`border-b border-border p-2 ${
                        isDiff
                          ? 'font-medium text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {row.fmt ? row.fmt(raw) : String(raw ?? '—')}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      {/* Wave F9.A — print-only footer; hidden on screen via print.css. */}
      <p
        className="compare-print-footer hidden font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground"
        data-testid="compare-print-footer"
      >
        {footerDate}
      </p>
    </div>
  )
}
