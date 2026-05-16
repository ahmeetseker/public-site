// Wave-10 / Agent-46 / Faz-13.i — Listing image metadata helpers.
//
// Thin wrapper over the `listingImages` content collection. Keeping these in
// a single helper lets components (`ResponsiveListingImage.astro`, future
// gallery lightbox, OG-image renderer) share the same lookup + sort rules.
import { getCollection, type CollectionEntry } from 'astro:content'

export type ListingImageEntry = CollectionEntry<'listingImages'>
export type ListingImageRecord = ListingImageEntry['data']['images'][number]

/**
 * Find the metadata entry for a given listing.
 * Returns `null` when no JSON file exists (i.e. listing still uses placeholders).
 */
export async function getListingImageMeta(
  listingId: string,
): Promise<ListingImageEntry['data'] | null> {
  const all = await getCollection('listingImages')
  const entry = all.find((e) => e.data.listingId === listingId)
  return entry?.data ?? null
}

/**
 * Sorted image list — hero first, then by `order` ascending.
 * Returns `[]` when no metadata exists.
 */
export async function getListingImages(
  listingId: string,
): Promise<ListingImageRecord[]> {
  const meta = await getListingImageMeta(listingId)
  if (!meta) return []
  return [...meta.images].sort((a, b) => {
    if (a.isHero && !b.isHero) return -1
    if (!a.isHero && b.isHero) return 1
    return a.order - b.order
  })
}

/**
 * Pick image #N (1-based) for a listing. Hero is always #1.
 * Returns `undefined` when index is out of range.
 */
export async function getListingImage(
  listingId: string,
  index: number,
): Promise<ListingImageRecord | undefined> {
  const images = await getListingImages(listingId)
  return images[index - 1]
}

/**
 * Build the canonical source path under `src/assets/listings/`. Useful when
 * pairing with `import.meta.glob('/src/assets/listings/*.webp')` to resolve
 * the actual `ImageMetadata` module for Astro's `<Image>` / `<Picture>`.
 */
export function buildAssetPath(filename: string): string {
  return `/src/assets/listings/${filename}`
}
