import type { Meta, StoryObj } from '@storybook/react'
import { RegionRankingBar } from './region-ranking-bar'
import type { RegionRow } from '../types'

const meta = {
  title: 'Charts/RegionRankingBar',
  component: RegionRankingBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Vertical bar ranking of districts by listing count. Sorts descending; tooltip surfaces active-buyer count from the same row.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-[360px] w-[520px] rounded-2xl border border-border bg-card p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RegionRankingBar>

export default meta
type Story = StoryObj<typeof meta>

const SAMPLE: RegionRow[] = [
  { district: 'Beylikdüzü', city: 'İstanbul', listings: 38, activeBuyers: 22, avgPricePerSqm: 18_400 },
  { district: 'Çeşme', city: 'İzmir', listings: 26, activeBuyers: 19, avgPricePerSqm: 32_100 },
  { district: 'Marmaris', city: 'Muğla', listings: 18, activeBuyers: 9, avgPricePerSqm: 24_900 },
  { district: 'Silivri', city: 'İstanbul', listings: 14, activeBuyers: 11, avgPricePerSqm: 9_600 },
  { district: 'Bodrum', city: 'Muğla', listings: 12, activeBuyers: 8, avgPricePerSqm: 41_200 },
]

export const Default: Story = { args: { data: SAMPLE } }

export const FewRegions: Story = {
  args: { data: SAMPLE.slice(0, 2) },
}
