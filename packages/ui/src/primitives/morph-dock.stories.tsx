import type { Meta, StoryObj } from '@storybook/react'
import { MorphDock } from './morph-dock'
import type { DockIcon } from './liquid-glass'
import { GlassFilter } from './liquid-glass'

const meta = {
  title: 'Primitives/MorphDock',
  component: MorphDock,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'paper' },
    docs: {
      description: {
        component:
          'Apple Dynamic Island tarzı genişleyen dock. Aynı bileşen `orientation="horizontal"` ve `"vertical"` ile iki yönde de çalışır; hover + tap toggle, outside-tap + Escape kapatır.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MorphDock>

export default meta
type Story = StoryObj<typeof meta>

const ICONS: DockIcon[] = [
  { alt: 'Anasayfa', label: 'Anasayfa', icon: <span>🏠</span> },
  { alt: 'Arama', label: 'Arama', icon: <span>🔍</span>, active: true },
  { alt: 'Favoriler', label: 'Favoriler', icon: <span>★</span> },
  { alt: 'Profil', label: 'Profil', icon: <span>👤</span> },
]

export const Horizontal: Story = {
  render: () => (
    <div className="relative h-screen w-full bg-gradient-to-br from-amber-100 via-rose-50 to-sky-100">
      <GlassFilter />
      <MorphDock icons={ICONS} orientation="horizontal" />
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="relative h-screen w-full bg-gradient-to-br from-emerald-100 via-amber-50 to-rose-100">
      <GlassFilter />
      <MorphDock icons={ICONS} orientation="vertical" />
    </div>
  ),
}
