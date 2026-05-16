// VideoWalkthroughEmbed — Wave F24.A.
//
// Privacy-friendly walkthrough video. We deliberately use the
// `youtube-nocookie.com` host (no tracking cookie until the user
// interacts) and `loading="lazy"` so the iframe doesn't fire a request
// until the user scrolls into the tab. KVKK-compliant by default.
//
// The component is intentionally tiny: no thumbnail preroll, no custom
// poster — YouTube nocookie already lazy-loads its own poster image and
// the lazy iframe attribute defers the heavy embed bundle.

import { useId } from 'react'

interface Copy {
  title: string
}

const COPY: Record<'tr' | 'en', Copy> = {
  tr: { title: 'Video gezinti' },
  en: { title: 'Video walkthrough' },
}

export interface VideoWalkthroughEmbedProps {
  embedUrl: string
  locale?: 'tr' | 'en'
}

export default function VideoWalkthroughEmbed({
  embedUrl,
  locale = 'tr',
}: VideoWalkthroughEmbedProps) {
  const copy = COPY[locale]
  const labelId = useId()
  return (
    <section
      aria-labelledby={labelId}
      data-testid="video-walkthrough"
      className="space-y-2"
    >
      <h3
        id={labelId}
        className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
      >
        {copy.title}
      </h3>
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-card">
        <iframe
          src={embedUrl}
          title={copy.title}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full"
          data-testid="video-walkthrough-iframe"
        />
      </div>
    </section>
  )
}
