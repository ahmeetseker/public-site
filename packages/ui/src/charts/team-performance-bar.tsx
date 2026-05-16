import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_AXIS, CHART_COLORS, CHART_GRID, CHART_PALETTE, CHART_TOOLTIP_STYLE } from './theme'
import type { TeamRow } from '../types'
import { formatTLCompact } from '../lib/format'

interface Props {
  data: TeamRow[]
}

export function TeamPerformanceBar({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
        <CartesianGrid {...CHART_GRID} vertical={false} />
        <XAxis
          dataKey="owner"
          axisLine={false}
          tickLine={false}
          tick={{ fill: CHART_AXIS.stroke, fontSize: CHART_AXIS.fontSize, fontFamily: CHART_AXIS.fontFamily }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: CHART_AXIS.stroke, fontSize: CHART_AXIS.fontSize, fontFamily: CHART_AXIS.fontFamily }}
          tickFormatter={(v) => formatTLCompact(v).replace('₺ ', '')}
          width={60}
        />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={(value) => formatTLCompact(Number(value))}
          cursor={{ fill: CHART_COLORS.primary, fillOpacity: 0.04 }}
        />
        <Bar dataKey="revenue" name="Ciro" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
