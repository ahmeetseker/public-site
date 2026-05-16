import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Dialog } from './dialog'

const meta = {
  title: 'Primitives/Dialog',
  component: Dialog,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Modal dialog with framer-motion fade + scale. ESC closes; overlay click closes. Concentric radii (panel = `--radius-surface`, close button = `--radius-control`). Size variants: sm | md | lg.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

function DialogDemo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="min-h-screen bg-background p-12">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Aç ({size})
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Yeni ilan oluştur"
        description="Aşağıdaki bilgileri doldurarak ilanı yayına al."
        size={size}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-1.5 text-sm"
              onClick={() => setOpen(false)}
            >
              Vazgeç
            </button>
            <button
              type="button"
              className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background"
            >
              Yayına al
            </button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Bu, Liquid Glass Dialog primitive'inin demo içeriğidir. Gerçek formlar
          burada render edilir.
        </p>
      </Dialog>
    </div>
  )
}

export const Default: Story = {
  args: {
    open: true,
    onClose: () => {},
    title: 'Default',
    children: null,
  },
  render: () => <DialogDemo size="md" />,
}

export const Small: Story = {
  args: { open: true, onClose: () => {}, title: 'Small', children: null },
  render: () => <DialogDemo size="sm" />,
}

export const Large: Story = {
  args: { open: true, onClose: () => {}, title: 'Large', children: null },
  render: () => <DialogDemo size="lg" />,
}
