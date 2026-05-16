import type { Meta, StoryObj } from '@storybook/react'
import { SegmentChip, StageChip, StatusChip, TypeChip } from './chips'

const meta = {
  title: 'Atoms/Chips',
  component: StatusChip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Domain status chips — listing status (Aktif/Pasif/Taslak), listing type (İmarlı/Tarla/...), customer segment (Sıcak/Ilık/Soğuk), and pipeline stage (İlk temas → Tapu). Tones are token-driven via the LandX `--background`/`--foreground` palette plus semantic emerald/amber/rose accents.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatusChip>

export default meta
type Story = StoryObj<typeof meta>

export const Status: Story = {
  args: { status: 'Aktif' },
  argTypes: {
    status: { control: 'inline-radio', options: ['Aktif', 'Pasif', 'Taslak'] },
  },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <StatusChip {...args} />
      <StatusChip status="Aktif" />
      <StatusChip status="Pasif" />
      <StatusChip status="Taslak" />
    </div>
  ),
}

export const Segments: Story = {
  args: { status: 'Aktif' },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <SegmentChip segment="Sıcak" />
      <SegmentChip segment="Ilık" />
      <SegmentChip segment="Soğuk" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Customer segment chips. Sıcak = active opportunity, Ilık = engaged, Soğuk = follow-up.',
      },
    },
  },
}

export const Types: Story = {
  args: { status: 'Aktif' },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <TypeChip type="İmarlı" />
      <TypeChip type="Tarla" />
      <TypeChip type="Zeytinlik" />
      <TypeChip type="Villa Arsası" />
    </div>
  ),
}

export const Stage: Story = {
  args: { status: 'Aktif' },
  render: () => (
    <div className="flex flex-col gap-2">
      <StageChip stage="İlk temas" />
      <StageChip stage="Görüşme" />
      <StageChip stage="Teklif" />
      <StageChip stage="Kaparo" />
      <StageChip stage="Tapu" />
    </div>
  ),
}
