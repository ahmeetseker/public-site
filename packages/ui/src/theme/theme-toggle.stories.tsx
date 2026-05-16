import type { Meta, StoryObj } from '@storybook/react'
import { ThemeToggle } from './theme-toggle'

const meta = {
  title: 'Theme/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Tri-state theme picker (Aydınlık / Karanlık / Sistem). Persists to localStorage via the `THEME_STORAGE_KEY`; toggles the `dark` class on `<html>` and writes `data-theme`.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    align: { control: 'inline-radio', options: ['start', 'end'] },
  },
} satisfies Meta<typeof ThemeToggle>

export default meta
type Story = StoryObj<typeof meta>

export const AlignedEnd: Story = {
  args: { align: 'end' },
  decorators: [
    (Story) => (
      <div className="flex h-[200px] w-[320px] items-start justify-end p-4">
        <Story />
      </div>
    ),
  ],
}

export const AlignedStart: Story = {
  args: { align: 'start' },
  decorators: [
    (Story) => (
      <div className="flex h-[200px] w-[320px] items-start justify-start p-4">
        <Story />
      </div>
    ),
  ],
}

export const InsideToolbar: Story = {
  args: { align: 'end' },
  render: (args) => (
    <div className="flex w-[480px] items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          SETTINGS
        </div>
        <div className="font-serif text-lg tracking-tight">Görünüm</div>
      </div>
      <ThemeToggle {...args} />
    </div>
  ),
}
