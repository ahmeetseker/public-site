import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_PALETTE, CHART_TOOLTIP_STYLE } from './theme'
import type { SourceRow } from '../types'

interface Props {
  data: SourceRow[]
}

export function SourceDonut({ data }: Props) {
  const total = data.reduce((s, r) => s + r.count, 0)
  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="source"
            innerRadius="56%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, _name, item) => {
              const row = item?.payload as SourceRow | undefined
              return [
                `${value} müşteri · %${Math.round((row?.conversion ?? 0) * 100)} dönüşüm`,
                row?.source ?? '',
              ]
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Toplam müşteri
        </span>
        <span className="mt-0.5 font-serif text-2xl font-light tracking-tight">{total}</span>
      </div>
    </div>
  )
}
