import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from './theme'
import { formatTLCompact } from '../lib/format'
import type { AgingBucket } from '../types'

const BUCKET_COLORS = [CHART_COLORS.emerald, CHART_COLORS.amber, CHART_COLORS.rose]

interface Props {
  data: AgingBucket[]
}

export function AgingDonut({ data }: Props) {
  const total = data.reduce((s, b) => s + b.amount, 0)
  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="label"
            innerRadius="58%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={BUCKET_COLORS[i] ?? CHART_COLORS.secondary} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, _name, item) => {
              const payload = item?.payload as AgingBucket | undefined
              return [
                `${formatTLCompact(Number(value))} · ${payload?.count ?? 0} işlem`,
                payload?.label ?? '',
              ]
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Toplam
        </span>
        <span className="mt-0.5 font-serif text-xl font-light tracking-tight">
          {formatTLCompact(total)}
        </span>
      </div>
    </div>
  )
}
