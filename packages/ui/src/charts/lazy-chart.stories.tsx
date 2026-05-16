import type { Meta, StoryObj } from '@storybook/react'
import { LazyChart } from './lazy-chart'

const meta = {
  title: 'Charts/LazyChart',
  component: LazyChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Suspense boundary tailored for lazy-loaded chart bundles. Skeleton mimics a bar chart so the loading state matches the eventual content geometry.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LazyChart>

export default meta
type Story = StoryObj<typeof meta>

export const SkeletonFallback: Story = {
  render: () => (
    <div className="w-[420px]">
      <LazyChart>
        <Hanging />
      </LazyChart>
    </div>
  ),
}

export const Tall: Story = {
  render: () => (
    <div className="w-[420px]">
      <LazyChart height={320}>
        <Hanging />
      </LazyChart>
    </div>
  ),
}

// Component that never resolves — keeps the skeleton visible for the demo.
function Hanging(): never {
  throw new Promise(() => {
    /* perpetual suspend */
  })
}
