import type { Meta, StoryObj } from '@storybook/react'
import { GlassDock, GlassDockVertical, GlassFilter, type DockIcon } from './liquid-glass'

const meta = {
  title: 'Primitives/LiquidGlass',
  component: GlassDock,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'paper' },
    docs: {
      description: {
        component:
          'Apple iOS 26 Liquid Glass primitive. Renders a backdrop refraction layer (Chromium-only SVG filter; gracefully degrades elsewhere to standard backdrop-blur). Pair with `<GlassFilter />` once per page.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GlassDock>

export default meta
type Story = StoryObj<typeof meta>

const ICONS: DockIcon[] = [
  { alt: 'Anasayfa', label: 'Anasayfa', icon: <span>🏠</span> },
  { alt: 'Arama', label: 'Arama', icon: <span>🔍</span> },
  { alt: 'Favoriler', label: 'Favoriler', icon: <span>★</span>, active: true },
  { alt: 'Profil', label: 'Profil', icon: <span>👤</span> },
]

export const HorizontalDock: Story = {
  render: () => (
    <div className="relative grid h-[320px] w-[520px] place-items-end justify-center rounded-3xl border border-border bg-gradient-to-br from-amber-200/40 via-rose-100/30 to-sky-200/40 p-6">
      <GlassFilter />
      <GlassDock icons={ICONS} />
    </div>
  ),
}

export const VerticalDock: Story = {
  render: () => (
    <div className="relative grid h-[420px] w-[420px] place-items-center justify-end rounded-3xl border border-border bg-gradient-to-br from-emerald-200/40 via-amber-100/30 to-rose-200/40 p-6">
      <GlassFilter />
      <GlassDockVertical icons={ICONS} />
    </div>
  ),
}
