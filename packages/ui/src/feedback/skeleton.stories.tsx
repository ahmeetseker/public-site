import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton, SkeletonCard, SkeletonChart, SkeletonRow, SkeletonTable } from './skeleton'

const meta = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Loading skeletons. All use `bg-foreground/[0.06]` token + `animate-pulse`. Variants compose primitives → SkeletonRow → SkeletonTable → SkeletonChart / SkeletonCard.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Primitive: Story = {
  args: { className: 'h-6 w-48' },
}

export const Table: Story = {
  render: () => (
    <div className="w-[640px] rounded-2xl border border-border bg-card">
      <SkeletonTable rows={5} cells={5} />
    </div>
  ),
}

export const Card: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  ),
}

export const Chart: Story = {
  render: () => (
    <div className="w-[480px]">
      <SkeletonChart />
    </div>
  ),
}

export const Row: Story = {
  render: () => (
    <div className="w-[640px] rounded-2xl border border-border bg-card">
      <SkeletonRow cells={4} />
    </div>
  ),
}
