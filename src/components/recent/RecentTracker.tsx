// Invisible listing-detail tracker. Mounted via `client:idle` from
// `/ilan/[slug]` so it runs after LCP and writes the current listing to
// localStorage. Renders nothing.
import { useEffect } from 'react'
import { addRecent } from '@/lib/recent-views'

export interface RecentTrackerProps {
  slug: string
  title: string
  price: number
  image: string
}

export default function RecentTracker({ slug, title, price, image }: RecentTrackerProps) {
  useEffect(() => {
    addRecent({ slug, title, price, currency: 'TRY', image, addedAt: Date.now() })
  }, [slug, title, price, image])
  return null
}
