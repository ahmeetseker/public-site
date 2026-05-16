import type { Meta, StoryObj } from '@storybook/react'
import { AgingDonut } from './aging-donut'
import type { AgingBucket } from '../types'

const meta = {
  title: 'Charts/AgingDonut',
  component: AgingDonut,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Aging buckets donut — receivables bucketed by age, sums to center label. Recharts under the hood; container must give explicit height (ResponsiveContainer).',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-[320px] w-[420px] rounded-2xl border border-border bg-card p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AgingDonut>

export default meta
type Story = StoryObj<typeof meta>

const SAMPLE: AgingBucket[] = [
  { label: '0–30 gün', count: 18, amount: 1_240_000 },
  { label: '31–60 gün', count: 7, amount: 460_000 },
  { label: '60+ gün', count: 3, amount: 180_000 },
]

export const Default: Story = {
  args: { data: SAMPLE },
}

export const Healthy: Story = {
  args: {
    data: [
      { label: '0–30 gün', count: 24, amount: 1_900_000 },
      { label: '31–60 gün', count: 2, amount: 80_000 },
      { label: '60+ gün', count: 0, amount: 0 },
    ],
  },
}

export const Distressed: Story = {
  args: {
    data: [
      { label: '0–30 gün', count: 3, amount: 120_000 },
      { label: '31–60 gün', count: 9, amount: 540_000 },
      { label: '60+ gün', count: 14, amount: 1_320_000 },
    ],
  },
}
