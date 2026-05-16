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
import type { RegionRow } from '../types'

interface Props {
  data: RegionRow[]
}

export function RegionRankingBar({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.listings - a.listings)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
      >
        <CartesianGrid {...CHART_GRID} horizontal={false} />
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{ fill: CHART_AXIS.stroke, fontSize: CHART_AXIS.fontSize, fontFamily: CHART_AXIS.fontFamily }}
        />
        <YAxis
          type="category"
          dataKey="district"
          axisLine={false}
          tickLine={false}
          width={120}
          tick={{ fill: CHART_AXIS.stroke, fontSize: CHART_AXIS.fontSize, fontFamily: CHART_AXIS.fontFamily }}
        />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          cursor={{ fill: CHART_COLORS.primary, fillOpacity: 0.04 }}
          formatter={(value, _name, item) => {
            const row = item?.payload as RegionRow | undefined
            return [
              `${value} ilan · ${row?.activeBuyers ?? 0} aktif alıcı`,
              row?.district ?? '',
            ]
          }}
        />
        <Bar dataKey="listings" radius={[0, 6, 6, 0]}>
          {sorted.map((_, i) => (
            <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
