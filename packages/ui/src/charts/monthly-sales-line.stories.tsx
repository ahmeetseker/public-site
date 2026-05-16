import type { Meta, StoryObj } from '@storybook/react'
import { MonthlySalesLine } from './monthly-sales-line'
import type { MonthlyClose } from '../types'

const meta = {
  title: 'Charts/MonthlySalesLine',
  component: MonthlySalesLine,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dual-axis line chart — left axis: revenue (₺), right axis: closed-deal count. Used on the admin home dashboard.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-[280px] w-[680px] rounded-2xl border border-border bg-card p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MonthlySalesLine>

export default meta
type Story = StoryObj<typeof meta>

const TREND: MonthlyClose[] = [
  { month: 'Oca', count: 4, revenue: 1_200_000 },
  { month: 'Şub', count: 6, revenue: 1_850_000 },
  { month: 'Mar', count: 5, revenue: 1_440_000 },
  { month: 'Nis', count: 8, revenue: 2_420_000 },
  { month: 'May', count: 9, revenue: 2_870_000 },
  { month: 'Haz', count: 11, revenue: 3_420_000 },
]

export const Default: Story = { args: { data: TREND } }

export const Flat: Story = {
  args: {
    data: TREND.map((m) => ({ ...m, count: 5, revenue: 1_500_000 })),
  },
}
