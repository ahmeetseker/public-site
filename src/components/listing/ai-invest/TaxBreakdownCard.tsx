import { useMemo, type ReactElement } from 'react'
import { computeRoi } from '@landx/ai'

export interface TaxBreakdownCardProps {
  price: number
}

export function TaxBreakdownCard({ price }: TaxBreakdownCardProps): ReactElement {
  const { tax } = useMemo(() => computeRoi({ price, monthlyRent: 1 }), [price])

  const rows = [
    { label: 'Tapu harcı (%2 alıcı)', value: tax.tapuHarci },
    { label: 'KDV', value: tax.kdv },
    { label: 'Emlak beyan (yıllık)', value: tax.emlakBeyani },
    { label: 'Noter ücreti', value: tax.notarisFee },
  ]

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-serif text-base mb-3">Ek maliyet</h3>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-border/40 last:border-0">
              <td className="py-2 text-muted-foreground">{r.label}</td>
              <td className="py-2 text-right font-mono tabular-nums">
                ₺{r.value.toLocaleString('tr-TR')}
              </td>
            </tr>
          ))}
          <tr>
            <td className="py-2 font-medium">Toplam</td>
            <td className="py-2 text-right font-mono font-medium tabular-nums">
              ₺{tax.total.toLocaleString('tr-TR')}
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  )
}

export default TaxBreakdownCard
