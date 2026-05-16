import type { Meta, StoryObj } from '@storybook/react'
import { AnimatedGrid } from './animated-grid'
import { PageShell } from './page-shell'

const meta = {
  title: 'Shell/AnimatedGrid',
  component: AnimatedGrid,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'transparent' },
    docs: {
      description: {
        component:
          'Animated SVG grid background — parallax to pointer + slow vertical drift. Renders fixed-position behind content; pointer-events: none. Page-level decoration only — never inside a card.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AnimatedGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="relative min-h-screen">
      <AnimatedGrid />
      <PageShell
        title="Animated grid demo"
        description="Fareyi sayfada hareket ettir — grid parallax + sürekli aşağı kayan drift."
      >
        <div className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur">
          <p className="text-sm text-muted-foreground">
            Grid sayfa arkaplanı için tasarlandı; içerik üzerinde
            <code className="mx-1 font-mono">bg-card/80 + backdrop-blur</code>
            ile okunabilirlik kazanır.
          </p>
        </div>
      </PageShell>
    </div>
  ),
}

export const Standalone: Story = {
  render: () => (
    <div className="relative h-screen">
      <AnimatedGrid />
    </div>
  ),
}

export const InsideCard: Story = {
  render: () => (
    <div className="grid min-h-screen place-items-center bg-background p-8">
      <div className="relative h-[420px] w-[640px] overflow-hidden rounded-2xl border border-border bg-card">
        <AnimatedGrid />
        <div className="relative z-10 flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Demo: animated grid inside a clipped card.
          </p>
        </div>
      </div>
    </div>
  ),
}
