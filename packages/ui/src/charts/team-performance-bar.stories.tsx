import type { Meta, StoryObj } from '@storybook/react'
import { TeamPerformanceBar } from './team-performance-bar'
import type { TeamRow } from '../types'

const meta = {
  title: 'Charts/TeamPerformanceBar',
  component: TeamPerformanceBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Per-owner revenue bar chart. Y-axis uses compact TL formatting (`formatTLCompact`). Color palette rotates from `CHART_PALETTE`.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-[320px] w-[560px] rounded-2xl border border-border bg-card p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TeamPerformanceBar>

export default meta
type Story = StoryObj<typeof meta>

const SAMPLE: TeamRow[] = [
  { owner: 'Ayşe', closed: 12, active: 4, revenue: 1_240_000, conversion: 0.42 },
  { owner: 'Mehmet', closed: 9, active: 6, revenue: 980_000, conversion: 0.36 },
  { owner: 'Selin', closed: 7, active: 3, revenue: 720_000, conversion: 0.29 },
  { owner: 'Burak', closed: 4, active: 5, revenue: 410_000, conversion: 0.22 },
]

export const Default: Story = { args: { data: SAMPLE } }

export const SinglePerson: Story = {
  args: {
    data: [
      { owner: 'Ayşe', closed: 12, active: 4, revenue: 1_240_000, conversion: 0.42 },
    ],
  },
}
