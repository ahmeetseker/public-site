import type { Meta, StoryObj } from '@storybook/react'
import { CashflowChart } from './cashflow-chart'
import type { MonthlyCashflow } from '../types'

const meta = {
  title: 'Charts/CashflowChart',
  component: CashflowChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Area + dashed line composition — `tahsilat` (collections, emerald fill) and `komisyon` (commission, amber dashed).',
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
} satisfies Meta<typeof CashflowChart>

export default meta
type Story = StoryObj<typeof meta>

const SIX_MONTHS: MonthlyCashflow[] = [
  { month: 'Oca', tahsilat: 480_000, komisyon: 36_000, gider: 120_000, net: 324_000 },
  { month: 'Şub', tahsilat: 720_000, komisyon: 54_000, gider: 140_000, net: 526_000 },
  { month: 'Mar', tahsilat: 540_000, komisyon: 41_000, gider: 130_000, net: 369_000 },
  { month: 'Nis', tahsilat: 920_000, komisyon: 69_000, gider: 160_000, net: 691_000 },
  { month: 'May', tahsilat: 1_080_000, komisyon: 81_000, gider: 170_000, net: 829_000 },
  { month: 'Haz', tahsilat: 1_320_000, komisyon: 99_000, gider: 180_000, net: 1_041_000 },
]

export const Default: Story = { args: { data: SIX_MONTHS } }
