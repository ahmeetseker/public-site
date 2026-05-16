import { type ReactElement } from 'react'

export interface MatterportEmbedProps {
  listingId: string
  embedUrl?: string
}

export function MatterportEmbed({ embedUrl }: MatterportEmbedProps): ReactElement {
  if (!embedUrl) {
    return (
      <article className="rounded-2xl border border-dashed border-border bg-card p-4 text-center">
        <h3 className="font-serif text-base mb-2">360° tur</h3>
        <p className="text-sm text-muted-foreground">
          360° tur henüz eklenmedi.
        </p>
      </article>
    )
  }
  return (
    <article className="rounded-2xl border border-border bg-card p-2">
      <iframe
        src={embedUrl}
        title="360° tur"
        loading="lazy"
        allowFullScreen
        className="aspect-[16/9] w-full rounded-xl"
      />
    </article>
  )
}

export default MatterportEmbed
