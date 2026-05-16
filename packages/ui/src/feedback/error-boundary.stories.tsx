import type { Meta, StoryObj } from '@storybook/react'
import { ErrorBoundary } from './error-boundary'

const meta = {
  title: 'Feedback/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Class-based React error boundary. Wrap routes / shells with it; pass `onError` for telemetry. The default fallback ships with a Turkish copy + retry button.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ErrorBoundary>

export default meta
type Story = StoryObj<typeof meta>

function Boom(): never {
  throw new Error('Boom — simulated render failure for the Storybook fallback demo.')
}

export const DefaultFallback: Story = {
  render: () => (
    <div className="w-[640px]">
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    </div>
  ),
}

export const CustomFallback: Story = {
  render: () => (
    <div className="w-[640px]">
      <ErrorBoundary
        fallback={(error, reset) => (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-700">
              ÖZEL FALLBACK
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Hata: <span className="font-mono">{error.message}</span>
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-3 rounded-xl border border-border bg-card px-3 py-1.5 text-sm"
            >
              Sıfırla
            </button>
          </div>
        )}
      >
        <Boom />
      </ErrorBoundary>
    </div>
  ),
}

export const Healthy: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          MUTLU YOL
        </div>
        <p className="mt-2 text-sm">Çocuk render başarılı → boundary hiç görünmez.</p>
      </div>
    </ErrorBoundary>
  ),
}
