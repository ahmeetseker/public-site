import type { Meta, StoryObj } from '@storybook/react'
import { EmptyState } from './empty-state'

const meta = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Empty-state placeholder. Default copy is in Turkish ("Burada henüz bir şey yok"). Pass an `action` slot for a CTA, e.g. "Yeni kayıt ekle" button.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
}

export const WithCustomCopy: Story = {
  args: {
    title: 'Hiç ilan yok',
    description: 'Bu kategoride henüz ilan paylaşılmadı. Filtrelerini değiştirmeyi dener misin?',
  },
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
}

export const WithAction: Story = {
  args: {
    title: 'Müşteri listen boş',
    description: 'Bir kayıt eklediğinde burada listelenecek.',
    action: (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background"
      >
        Yeni müşteri ekle
      </button>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
}
