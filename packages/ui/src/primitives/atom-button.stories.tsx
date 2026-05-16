import type { Meta, StoryObj } from '@storybook/react'
import { AtomButton } from './atom-button'

const meta = {
  title: 'Primitives/AtomButton',
  component: AtomButton,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'paper' },
    docs: {
      description: {
        component:
          'Atom-style action button — orbiting electrons + lightning-bolt hover effect. Pure presentation; pass `onClick` for the actual side-effect.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AtomButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="grid h-[280px] w-[280px] place-items-center">
      <AtomButton onClick={() => undefined} />
    </div>
  ),
}

export const OnDarkSurface: Story = {
  render: () => (
    <div className="grid h-[280px] w-[280px] place-items-center rounded-3xl bg-stone-900">
      <AtomButton onClick={() => undefined} />
    </div>
  ),
}
