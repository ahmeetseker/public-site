import { type ReactElement } from 'react'

export interface DroneVideoSlotProps {
  listingId: string
  videoUrl?: string
}

export function DroneVideoSlot({ videoUrl }: DroneVideoSlotProps): ReactElement {
  if (!videoUrl) {
    return (
      <article className="rounded-2xl border border-dashed border-border bg-card p-4 text-center">
        <h3 className="font-serif text-base mb-2">Drone çekim</h3>
        <p className="text-sm text-muted-foreground">
          Bu ilan için drone çekim henüz eklenmedi.
        </p>
      </article>
    )
  }
  return (
    <article className="rounded-2xl border border-border bg-card p-2">
      <video controls className="w-full rounded-xl" preload="metadata">
        <source src={videoUrl} type="video/mp4" />
      </video>
    </article>
  )
}

export default DroneVideoSlot
