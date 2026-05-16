import { useState, type ReactElement } from 'react'
import { ListingGallery } from './ListingGallery'
import { cn } from '../lib/cn'

export interface GalleryTab {
  key: string
  label: string
  images?: readonly string[]
}

export interface ListingGalleryTabsProps {
  tabs: readonly GalleryTab[]
  alt?: string
}

export function ListingGalleryTabs({
  tabs,
  alt,
}: ListingGalleryTabsProps): ReactElement | null {
  const available = tabs.filter((t) => (t.images?.length ?? 0) > 0)
  const [activeKey, setActiveKey] = useState(available[0]?.key ?? null)

  if (available.length === 0) return null
  const active = available.find((t) => t.key === activeKey) ?? available[0]!

  return (
    <div className="space-y-3">
      {available.length > 1 && (
        <div
          role="tablist"
          aria-label="Galeri kategorileri"
          className="flex flex-wrap items-center gap-1.5"
        >
          {available.map((t) => {
            const isActive = t.key === active.key
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveKey(t.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5',
                  'font-mono text-[11px] uppercase tracking-[0.16em] transition',
                  isActive
                    ? 'bg-foreground text-background'
                    : 'border border-border bg-background text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
                <span className="tabular-nums opacity-70">
                  {t.images?.length ?? 0}
                </span>
              </button>
            )
          })}
        </div>
      )}
      <ListingGallery images={active.images ?? []} alt={alt} />
    </div>
  )
}

export default ListingGalleryTabs
