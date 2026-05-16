import type { Meta, StoryObj } from '@storybook/react'
import { PageShell } from './page-shell'

const meta = {
  title: 'Shell/PageShell',
  component: PageShell,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Standard admin/page chrome — eyebrow + serif title + description + optional action slot. Max-width 1280px, generous top/bottom padding.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageShell>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    title: (
      <>
        İlanlarım <em className="font-serif italic font-light">— 42 aktif</em>
      </>
    ),
    description: 'Yayında, taslak ve pasif ilanların burada listelenir.',
    children: (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Sayfa içeriği — tablo, grid veya custom layout buraya gelir.
      </div>
    ),
  },
}

export const WithEyebrowAndActions: Story = {
  args: {
    eyebrow: 'PORTFÖY',
    title: 'Müşteriler',
    description: 'Pipeline\'daki tüm müşteri kayıtları.',
    actions: (
      <>
        <button
          type="button"
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
        >
          İçeri aktar
        </button>
        <button
          type="button"
          className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background"
        >
          Yeni müşteri
        </button>
      </>
    ),
    children: (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl border border-border bg-card" />
        ))}
      </div>
    ),
  },
}

export const Minimal: Story = {
  args: {
    title: 'Ayarlar',
    children: <div className="text-sm text-muted-foreground">Form içeriği.</div>,
  },
}
