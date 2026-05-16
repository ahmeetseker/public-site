import type { Meta, StoryObj } from '@storybook/react'
import * as radius from './radius'

// LandX radius tokens — visual swatch reference. Helps designers/devs
// pick the right token instead of hand-coding pixel values.

const TOKENS: ReadonlyArray<{ name: string; value: string; description: string }> = [
  { name: 'shell', value: 'var(--radius-shell)', description: 'Outer page shell + sticky header dock' },
  { name: 'surface', value: 'var(--radius-surface)', description: 'Cards, dialogs, large containers' },
  { name: 'container', value: 'var(--radius-container)', description: 'Default block container — generic panels' },
  { name: 'control', value: 'var(--radius-control)', description: 'Buttons, inputs, dropdown menus' },
  { name: 'chip', value: 'var(--radius-chip)', description: 'Pill-shaped chips & badges' },
]

function Swatch({
  name,
  value,
  description,
}: {
  name: string
  value: string
  description: string
}) {
  return (
    <div className="flex items-center gap-4 border-b border-border/60 py-3">
      <div
        aria-hidden
        className="h-16 w-16 shrink-0 bg-foreground/10"
        style={{ borderRadius: value }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {name}
          </span>
          <span className="font-mono text-[11px] tabular-nums text-foreground/70">{value}</span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

const meta = {
  title: 'Tokens/Radius',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Five-tier radius scale — concentric rule of thumb: outer surface > inner surface, never the other way around. Pair with `Squircle` for G2-continuous corners.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Scale: Story = {
  render: () => (
    <div className="w-[640px] rounded-2xl border border-border bg-card p-4">
      {TOKENS.map((t) => (
        <Swatch key={t.name} {...t} />
      ))}
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        radius.* export — {Object.keys(radius).length} adet
      </p>
    </div>
  ),
}

export const ConcentricExample: Story = {
  render: () => (
    <div className="grid place-items-center p-6">
      <div
        className="bg-foreground/[0.05] p-4"
        style={{ borderRadius: 'var(--radius-shell)' }}
      >
        <div
          className="bg-foreground/[0.06] p-4"
          style={{ borderRadius: 'var(--radius-surface)' }}
        >
          <div
            className="bg-foreground/[0.08] p-4"
            style={{ borderRadius: 'var(--radius-container)' }}
          >
            <div
              className="bg-foreground/10 p-3"
              style={{ borderRadius: 'var(--radius-control)' }}
            >
              <span
                className="inline-flex items-center bg-foreground/15 px-3 py-1 text-sm"
                style={{ borderRadius: 'var(--radius-chip)' }}
              >
                chip
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}
