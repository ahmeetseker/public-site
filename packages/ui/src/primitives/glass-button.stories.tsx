import type { Meta, StoryObj } from '@storybook/react'
import { GlassButton } from './glass-button'

const meta = {
  title: 'Primitives/GlassButton',
  component: GlassButton,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'paper' },
    docs: {
      description: {
        component:
          'Apple Liquid Glass button. Wrapper has `--radius-chip` squircle radius; inner CSS uses 9999px pill (anayasa "ezme" rule). Variants: size = default | sm | lg | icon.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
} satisfies Meta<typeof GlassButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { size: 'default', children: 'Glass button' },
}

export const Small: Story = {
  args: { size: 'sm', children: 'Small action' },
}

export const Large: Story = {
  args: { size: 'lg', children: 'Önemli işlem' },
}

export const Sizes: Story = {
  args: { children: 'Default' },
  render: () => (
    <div className="flex items-center gap-4">
      <GlassButton size="sm">Small</GlassButton>
      <GlassButton size="default">Default</GlassButton>
      <GlassButton size="lg">Large</GlassButton>
    </div>
  ),
}
