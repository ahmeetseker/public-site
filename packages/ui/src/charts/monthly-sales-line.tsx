import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_AXIS, CHART_COLORS, CHART_GRID, CHART_TOOLTIP_STYLE } from './theme'
import type { MonthlyClose } from '../types'
import { formatTLCompact } from '../lib/format'

interface Props {
  data: MonthlyClose[]
}

export function MonthlySalesLine({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
        <CartesianGrid {...CHART_GRID} vertical={false} />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: CHART_AXIS.stroke, fontSize: CHART_AXIS.fontSize, fontFamily: CHART_AXIS.fontFamily }}
        />
        <YAxis
          yAxisId="left"
          axisLine={false}
          tickLine={false}
          tick={{ fill: CHART_AXIS.stroke, fontSize: CHART_AXIS.fontSize, fontFamily: CHART_AXIS.fontFamily }}
          tickFormatter={(v) => formatTLCompact(v).replace('₺ ', '')}
          width={60}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          axisLine={false}
          tickLine={false}
          tick={{ fill: CHART_AXIS.stroke, fontSize: CHART_AXIS.fontSize, fontFamily: CHART_AXIS.fontFamily }}
          width={30}
        />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={(value, name) =>
            name === 'Ciro'
              ? formatTLCompact(Number(value))
              : `${value} kapanan`
          }
          cursor={{ stroke: CHART_COLORS.primary, strokeOpacity: 0.1 }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="revenue"
          name="Ciro"
          stroke={CHART_COLORS.emerald}
          strokeWidth={2.5}
          dot={{ r: 4, strokeWidth: 0, fill: CHART_COLORS.emerald }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="count"
          name="Kapanan"
          stroke={CHART_COLORS.amber}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={{ r: 3, strokeWidth: 0, fill: CHART_COLORS.amber }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
