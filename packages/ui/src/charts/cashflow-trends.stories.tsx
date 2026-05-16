// Additional CashflowChart vignettes — extends the base story with three
// realistic scenarios so the chart reads correctly under healthy / mixed /
// distressed mock data shapes.

import type { Meta, StoryObj } from '@storybook/react'
import { CashflowChart } from './cashflow-chart'
import type { MonthlyCashflow } from '../types'

const meta = {
  title: 'Charts/CashflowChart (Senaryolar)',
  component: CashflowChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Aynı `<CashflowChart />` componenti — yatay olarak farklı veri profilleriyle senaryoları görselleştir.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-[360px] w-[560px] rounded-2xl border border-border bg-card p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CashflowChart>

export default meta
type Story = StoryObj<typeof meta>

const HEALTHY: MonthlyCashflow[] = [
  { month: 'Oca', tahsilat: 980_000, komisyon: 120_000, gider: 320_000, net: 540_000 },
  { month: 'Şub', tahsilat: 1_120_000, komisyon: 140_000, gider: 360_000, net: 620_000 },
  { month: 'Mar', tahsilat: 1_280_000, komisyon: 160_000, gider: 380_000, net: 740_000 },
  { month: 'Nis', tahsilat: 1_410_000, komisyon: 180_000, gider: 400_000, net: 830_000 },
]

const MIXED: MonthlyCashflow[] = [
  { month: 'Oca', tahsilat: 980_000, komisyon: 120_000, gider: 320_000, net: 540_000 },
  { month: 'Şub', tahsilat: 720_000, komisyon: 90_000, gider: 380_000, net: 250_000 },
  { month: 'Mar', tahsilat: 1_280_000, komisyon: 160_000, gider: 420_000, net: 700_000 },
  { month: 'Nis', tahsilat: 640_000, komisyon: 80_000, gider: 460_000, net: 100_000 },
]

const DISTRESSED: MonthlyCashflow[] = [
  { month: 'Oca', tahsilat: 480_000, komisyon: 60_000, gider: 520_000, net: -100_000 },
  { month: 'Şub', tahsilat: 380_000, komisyon: 45_000, gider: 540_000, net: -205_000 },
  { month: 'Mar', tahsilat: 410_000, komisyon: 50_000, gider: 560_000, net: -200_000 },
  { month: 'Nis', tahsilat: 320_000, komisyon: 40_000, gider: 580_000, net: -300_000 },
]

export const Healthy: Story = { args: { data: HEALTHY } }
export const Mixed: Story = { args: { data: MIXED } }
export const Distressed: Story = { args: { data: DISTRESSED } }
