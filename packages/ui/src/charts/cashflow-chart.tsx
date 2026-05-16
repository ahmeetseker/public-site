import {
  Area,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from 'recharts'
import { CHART_AXIS, CHART_COLORS, CHART_GRID, CHART_TOOLTIP_STYLE } from './theme'
import type { MonthlyCashflow } from '../types'
import { formatTLCompact } from '../lib/format'

interface Props {
  data: MonthlyCashflow[]
}

export function CashflowChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="tahsilatFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.emerald} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_COLORS.emerald} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...CHART_GRID} vertical={false} />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: CHART_AXIS.stroke, fontSize: CHART_AXIS.fontSize, fontFamily: CHART_AXIS.fontFamily }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: CHART_AXIS.stroke, fontSize: CHART_AXIS.fontSize, fontFamily: CHART_AXIS.fontFamily }}
          tickFormatter={(v) => formatTLCompact(v).replace('₺ ', '')}
          width={70}
        />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={(value) => formatTLCompact(Number(value))}
          cursor={{ stroke: CHART_COLORS.primary, strokeOpacity: 0.1 }}
        />
        <Legend
          wrapperStyle={{
            fontSize: 11,
            fontFamily: CHART_AXIS.fontFamily,
            paddingTop: 8,
          }}
          iconType="circle"
        />
        <Area
          type="monotone"
          dataKey="tahsilat"
          name="Tahsilat"
          stroke={CHART_COLORS.emerald}
          strokeWidth={2}
          fill="url(#tahsilatFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="komisyon"
          name="Komisyon"
          stroke={CHART_COLORS.amber}
          strokeWidth={1.5}
          strokeDasharray="3 3"
          fill="transparent"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
