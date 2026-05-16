import { useMemo, type ReactElement } from 'react'

export interface SolarPotentialCardProps {
  listingId: string
  sizeM2: number
}

function hashSeed(id: string, salt: string): number {
  let h = 5381
  const c = `${id}|${salt}`
  for (let i = 0; i < c.length; i++) h = ((h << 5) + h + c.charCodeAt(i)) >>> 0
  return (h % 10000) / 10000
}

export function SolarPotentialCard({
  listingId,
  sizeM2,
}: SolarPotentialCardProps): ReactElement {
  const data = useMemo(() => {
    const annualKwhPerM2 = 270 + hashSeed(listingId, 's1') * 60
    const usableAreaPct = 0.4
    const yearlyKwh = Math.round(sizeM2 * usableAreaPct * annualKwhPerM2)
    const pricePerKwh = 2.5
    const yearlyIncome = Math.round(yearlyKwh * pricePerKwh)
    const rating: 'düşük' | 'orta' | 'yüksek' | 'çok yüksek' =
      annualKwhPerM2 > 320 ? 'çok yüksek' :
        annualKwhPerM2 > 295 ? 'yüksek' :
          annualKwhPerM2 > 275 ? 'orta' : 'düşük'
    return { annualKwhPerM2: Math.round(annualKwhPerM2), yearlyKwh, yearlyIncome, rating }
  }, [listingId, sizeM2])

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-serif text-base mb-3">Solar potansiyel</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Verim</div>
          <div className="mt-0.5 tabular-nums">{data.annualKwhPerM2} kWh/m²/yıl</div>
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Sınıf</div>
          <div className="mt-0.5 font-medium">{data.rating}</div>
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Tahmini üretim</div>
          <div className="mt-0.5 tabular-nums">{data.yearlyKwh.toLocaleString('tr-TR')} kWh/yıl</div>
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Tahmini gelir</div>
          <div className="mt-0.5 font-medium tabular-nums">₺{data.yearlyIncome.toLocaleString('tr-TR')}</div>
        </div>
      </div>
    </article>
  )
}

export default SolarPotentialCard
