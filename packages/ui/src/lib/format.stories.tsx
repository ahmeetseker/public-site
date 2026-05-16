import type { Meta, StoryObj } from '@storybook/react'
import { formatTL, formatTLCompact, formatArea, timeAgo } from './format'

// Pure-helper stories — no real component. We render a small reference card
// so the Storybook viewer documents each output shape next to its sample
// input. This is the same pattern Stripe/Spectrum use for utility libs.
function Sample({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="grid grid-cols-[12rem_1fr] items-baseline gap-3 border-b border-border/60 py-1.5 text-sm">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

const meta = {
  title: 'Lib/Format',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Turkish-locale formatters: `formatTL` (₺ full precision), `formatTLCompact` (₺ 1.2M), `formatArea` (m²/bin m²), `timeAgo` (relative TR string).',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Currency: Story = {
  render: () => (
    <div className="w-[520px] rounded-2xl border border-border bg-card p-4">
      <Sample label="formatTL(1240)" value={formatTL(1_240)} />
      <Sample label="formatTL(1240000)" value={formatTL(1_240_000)} />
      <Sample label="formatTLCompact(1240000)" value={formatTLCompact(1_240_000)} />
      <Sample label="formatTLCompact(98_500_000)" value={formatTLCompact(98_500_000)} />
    </div>
  ),
}

export const Area: Story = {
  render: () => (
    <div className="w-[520px] rounded-2xl border border-border bg-card p-4">
      <Sample label="formatArea(420)" value={formatArea(420)} />
      <Sample label="formatArea(2_800)" value={formatArea(2_800)} />
      <Sample label="formatArea(18_400)" value={formatArea(18_400)} />
    </div>
  ),
}

export const RelativeTime: Story = {
  render: () => {
    const now = Date.now()
    return (
      <div className="w-[520px] rounded-2xl border border-border bg-card p-4">
        <Sample
          label="timeAgo(-30s)"
          value={timeAgo(new Date(now - 30 * 1000).toISOString())}
        />
        <Sample
          label="timeAgo(-12dk)"
          value={timeAgo(new Date(now - 12 * 60 * 1000).toISOString())}
        />
        <Sample
          label="timeAgo(-5sa)"
          value={timeAgo(new Date(now - 5 * 60 * 60 * 1000).toISOString())}
        />
        <Sample
          label="timeAgo(-3gün)"
          value={timeAgo(new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString())}
        />
      </div>
    )
  },
}
