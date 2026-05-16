import type { Meta, StoryObj } from '@storybook/react'
import { SourceDonut } from './source-donut'
import type { SourceRow } from '../types'

const meta = {
  title: 'Charts/SourceDonut',
  component: SourceDonut,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Customer source donut — segments by acquisition channel. Center label shows total customers; recharts ResponsiveContainer requires a sized parent.',
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
} satisfies Meta<typeof SourceDonut>

export default meta
type Story = StoryObj<typeof meta>

const SAMPLE: SourceRow[] = [
  { source: 'Organik', count: 142, conversion: 0.34 },
  { source: 'Referral', count: 86, conversion: 0.42 },
  { source: 'Sosyal', count: 64, conversion: 0.18 },
  { source: 'Reklam', count: 38, conversion: 0.22 },
]

export const Default: Story = { args: { data: SAMPLE } }

export const SingleChannel: Story = {
  args: {
    data: [{ source: 'Organik', count: 200, conversion: 0.31 }],
  },
}

export const ManyChannels: Story = {
  args: {
    data: [
      { source: 'Organik', count: 142, conversion: 0.34 },
      { source: 'Referral', count: 86, conversion: 0.42 },
      { source: 'Sosyal', count: 64, conversion: 0.18 },
      { source: 'Reklam', count: 38, conversion: 0.22 },
      { source: 'Email', count: 27, conversion: 0.51 },
      { source: 'Diğer', count: 14, conversion: 0.12 },
    ],
  },
}
