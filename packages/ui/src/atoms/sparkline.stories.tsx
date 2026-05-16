import type { Meta, StoryObj } from '@storybook/react'
import { Sparkline } from './sparkline'

const meta = {
  title: 'Atoms/Sparkline',
  component: Sparkline,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'SVG sparkline atom — used inside table rows and KPI cards. Stroke + fill color flip emerald/rose based on first-vs-last trend. No external chart lib (zero recharts dependency).',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sparkline>

export default meta
type Story = StoryObj<typeof meta>

const UP_TREND = [4, 6, 5, 7, 9, 8, 10, 12, 11, 14]
const DOWN_TREND = [14, 12, 13, 10, 11, 9, 8, 7, 5, 4]
const FLAT = [8, 8, 9, 8, 9, 8, 8, 9, 8, 9]

export const Upward: Story = {
  args: { data: UP_TREND, width: 120, height: 32 },
}

export const Downward: Story = {
  args: { data: DOWN_TREND, width: 120, height: 32 },
}

export const Sizes: Story = {
  args: { data: UP_TREND },
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Sparkline data={UP_TREND} width={60} height={18} />
      <Sparkline data={FLAT} width={120} height={32} />
      <Sparkline data={DOWN_TREND} width={200} height={48} />
    </div>
  ),
}
