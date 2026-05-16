import type { Meta, StoryObj } from '@storybook/react'
import { Squircle } from './squircle'

const meta = {
  title: 'Primitives/Squircle',
  component: Squircle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Apple G2-continuity smooth-corner primitive. Uses native CSS `corner-shape: squircle` where supported, gracefully degrades to a circular arc elsewhere. Pass a radius token (shell/surface/container/control/chip) or any CSS length.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    radius: {
      control: 'select',
      options: ['shell', 'surface', 'container', 'control', 'chip'],
    },
  },
} satisfies Meta<typeof Squircle>

export default meta
type Story = StoryObj<typeof meta>

export const Surface: Story = {
  args: { radius: 'surface' },
  render: (args) => (
    <Squircle
      {...args}
      className="flex h-32 w-64 items-center justify-center bg-card text-foreground border border-border"
    >
      <span className="font-serif text-lg">surface (24px)</span>
    </Squircle>
  ),
}

export const ControlVsChip: Story = {
  args: { radius: 'control' },
  render: () => (
    <div className="flex items-center gap-6">
      <Squircle
        radius="control"
        className="flex h-12 w-32 items-center justify-center bg-foreground text-background"
      >
        control (8px)
      </Squircle>
      <Squircle
        radius="chip"
        className="flex h-8 w-24 items-center justify-center bg-muted text-foreground"
      >
        chip
      </Squircle>
    </div>
  ),
}

export const Stack: Story = {
  args: { radius: 'shell' },
  render: () => (
    <Squircle
      radius="shell"
      className="flex h-60 w-80 flex-col gap-3 bg-background p-6 border border-border"
    >
      <Squircle
        radius="surface"
        className="flex flex-1 items-center justify-center bg-card text-muted-foreground"
      >
        surface
      </Squircle>
      <div className="flex gap-2">
        <Squircle
          radius="control"
          className="flex h-10 flex-1 items-center justify-center bg-foreground text-background text-sm"
        >
          control
        </Squircle>
        <Squircle
          radius="chip"
          className="flex h-10 w-20 items-center justify-center bg-muted text-foreground text-sm"
        >
          chip
        </Squircle>
      </div>
    </Squircle>
  ),
}
