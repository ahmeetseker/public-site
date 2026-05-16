import type { Meta, StoryObj } from '@storybook/react'
import { lazy, Suspense } from 'react'
import type { MapListing } from './listings-map'

// Leaflet evaluates `window` at module load — dynamic-import so Storybook's
// docgen / SSR pass does not crash. Stories themselves run in the browser
// iframe, so the lazy chunk resolves normally there.
const ListingsMap = lazy(async () => {
  const mod = await import('./listings-map')
  await import('../styles/leaflet.css')
  return { default: mod.ListingsMap }
})

const SAMPLE: MapListing[] = [
  {
    id: '1',
    title: '4 dönüm Foça arsa',
    district: 'Foça',
    city: 'İzmir',
    type: 'İmarlı',
    status: 'Aktif',
    price: 8_500_000,
    size: 4000,
    lat: 38.6726,
    lng: 26.7572,
  },
  {
    id: '2',
    title: 'Çeşme zeytinlik',
    district: 'Çeşme',
    city: 'İzmir',
    type: 'Zeytinlik',
    status: 'Aktif',
    price: 12_400_000,
    size: 6500,
    lat: 38.3236,
    lng: 26.3037,
  },
  {
    id: '3',
    title: 'Urla villa arsası',
    district: 'Urla',
    city: 'İzmir',
    type: 'Villa Arsası',
    status: 'Taslak',
    price: 24_900_000,
    size: 2200,
    lat: 38.3236,
    lng: 26.7649,
  },
]

const meta = {
  title: 'Maps/ListingsMap',
  component: ListingsMap,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Leaflet-based listings map. Pulls `window`/DOM globals at module load → consumed only as a `client:only` island in Astro and **dynamic-imported** inside Storybook. Markers are custom divIcons keyed by `status`; `FitBounds` auto-frames to visible markers.',
      },
    },
  },
  // No autodocs tag — autodocs would render the lazy component during MDX
  // generation; we keep this story interactive-only.
  tags: [],
} satisfies Meta<typeof ListingsMap>

export default meta
type Story = StoryObj<typeof meta>

const Fallback = () => (
  <div className="grid h-[480px] w-full place-items-center bg-muted text-sm text-muted-foreground">
    Map yükleniyor…
  </div>
)

export const Default: Story = {
  args: { listings: SAMPLE, height: 480 },
  render: (args) => (
    <div className="p-8">
      <Suspense fallback={<Fallback />}>
        <ListingsMap {...args} />
      </Suspense>
    </div>
  ),
}

export const SinglePin: Story = {
  args: { listings: [SAMPLE[0]], height: 360 },
  render: (args) => (
    <div className="p-8">
      <Suspense fallback={<Fallback />}>
        <ListingsMap {...args} />
      </Suspense>
    </div>
  ),
}
