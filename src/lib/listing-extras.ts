/**
 * Wave F24.0 — Per-listing media extras (virtual tour / floor plan / video).
 *
 * Deterministic mock — until the real CMS ships, each listing gets a stable
 * set of extras derived from its `id`. ~25% coverage per feature so the
 * empty state is exercised in the wild.
 *
 * Real assets:
 *   - Virtual tour panoramas are equirectangular images on CDN
 *   - Floor plan is a PDF/PNG; mock points to OG image as a placeholder
 *   - Video is a privacy-friendly youtube-nocookie embed
 *
 * URL'ler placeholder; gerçek backend gelince swap edilir.
 */

import type { Listing } from '@landx/data'

export interface ListingExtras {
  hasVirtualTour: boolean
  virtualTourUrl?: string
  hasFloorPlan: boolean
  floorPlanUrl?: string
  hasVideo: boolean
  videoEmbedUrl?: string
}

const SAMPLE_PANORAMAS = [
  'https://pannellum.org/images/alma.jpg',
  'https://pannellum.org/images/cerro-toco-0.jpg',
  'https://pannellum.org/images/jfk.jpg',
  'https://pannellum.org/images/bma-0.jpg',
] as const

const SAMPLE_VIDEOS = [
  'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
  'https://www.youtube-nocookie.com/embed/oHg5SJYRHA0',
  'https://www.youtube-nocookie.com/embed/CMNry4PE93Y',
] as const

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function bucket(value: number, mod: number): number {
  return value % mod
}

export function getListingExtras(listing: Listing): ListingExtras {
  const base = hashCode(listing.id)
  const hasVirtualTour = bucket(base, 4) === 0
  const hasFloorPlan = bucket(base + 7, 4) === 1
  const hasVideo = bucket(base + 13, 4) === 2

  const out: ListingExtras = {
    hasVirtualTour,
    hasFloorPlan,
    hasVideo,
  }
  if (hasVirtualTour) {
    out.virtualTourUrl = SAMPLE_PANORAMAS[bucket(base, SAMPLE_PANORAMAS.length)]
  }
  if (hasFloorPlan) {
    out.floorPlanUrl = `/og/listing/${listing.id}.png`
  }
  if (hasVideo) {
    out.videoEmbedUrl = SAMPLE_VIDEOS[bucket(base + 21, SAMPLE_VIDEOS.length)]
  }
  return out
}

export function summarizeExtrasCoverage(listings: ReadonlyArray<Listing>): {
  total: number
  virtualTour: number
  floorPlan: number
  video: number
  any: number
} {
  let virtualTour = 0
  let floorPlan = 0
  let video = 0
  let any = 0
  for (const l of listings) {
    const e = getListingExtras(l)
    if (e.hasVirtualTour) virtualTour++
    if (e.hasFloorPlan) floorPlan++
    if (e.hasVideo) video++
    if (e.hasVirtualTour || e.hasFloorPlan || e.hasVideo) any++
  }
  return { total: listings.length, virtualTour, floorPlan, video, any }
}
