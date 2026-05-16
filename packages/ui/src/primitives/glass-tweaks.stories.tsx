import type { Meta, StoryObj } from '@storybook/react'
import { GlassTweaks } from './glass-tweaks'

const meta = {
  title: 'Primitives/GlassTweaks',
  component: GlassTweaks,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'paper' },
    docs: {
      description: {
        component:
          'Runtime tuning panel for the Liquid Glass tokens (`--lq-halo-blur`, `--lq-halo-extend`, `--lq-halo-edge-fade`). Mounted floating bottom-right; values persist to localStorage (`lq-tweaks-v3`).',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GlassTweaks>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="relative h-screen w-full bg-gradient-to-br from-amber-100 via-rose-50 to-sky-100">
      <div className="absolute inset-0 grid place-items-center">
        <div className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur">
          <p className="text-sm text-muted-foreground">
            Sağ-alttaki gear ikonuna tıkla → halo blur/extend sliderları aç.
          </p>
        </div>
      </div>
      <GlassTweaks />
    </div>
  ),
}
