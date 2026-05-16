import type { Meta, StoryObj } from '@storybook/react'
import { ErrorState } from './error-state'

const meta = {
  title: 'Feedback/ErrorState',
  component: ErrorState,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Error placeholder. `role="alert"` for screen readers; pass `onRetry` to render a retry button; pass `error` to show diagnostic message in DEV builds only.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
} satisfies Meta<typeof ErrorState>

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

export const WithRetry: Story = {
  args: {
    onRetry: () => {
      // eslint-disable-next-line no-console
      console.log('retry clicked')
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
}

export const WithErrorDetail: Story = {
  args: {
    title: 'İlanlar yüklenemedi',
    description: 'Sunucuya ulaşılamadı. İnternetini kontrol edip tekrar dener misin?',
    error: new Error('NetworkError: failed to fetch /api/listings'),
    onRetry: () => {
      // eslint-disable-next-line no-console
      console.log('retry')
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
}
