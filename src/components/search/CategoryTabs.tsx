/**
 * CategoryTabs — F37 Faz 4.0.
 *
 * /ara sayfasının üstünde 4-tab kategori picker (arsa | konut | villa | isyeri).
 * URL `?kat=` query'sini günceller; sayfa yenilemeden filtre bloğu değişir
 * (basit page reload).
 */
import { useEffect, useState, type ReactElement } from 'react'

const TABS = [
  { id: 'arsa', label: 'Arsa' },
  { id: 'konut', label: 'Konut' },
  { id: 'villa', label: 'Villa' },
  { id: 'isyeri', label: 'İşyeri' },
] as const

export type Category = typeof TABS[number]['id']

export interface CategoryTabsProps {
  /** Default kategori — URL'de yoksa */
  defaultCategory?: Category
}

export function CategoryTabs({ defaultCategory = 'arsa' }: CategoryTabsProps): ReactElement {
  const [active, setActive] = useState<Category>(defaultCategory)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const kat = params.get('kat') as Category | null
    if (kat && TABS.some((t) => t.id === kat)) {
      setActive(kat)
    }
  }, [])

  const handleClick = (id: Category) => {
    setActive(id)
    const url = new URL(window.location.href)
    url.searchParams.set('kat', id)
    // Diğer kategori-spesifik filtre query'lerini temizle (geçişte tutarsızlığı önle)
    const KATEGORI_SPESIFIK_PARAMS = ['odalar', 'binaYasi', 'isitma', 'kat-floor', 'asansor', 'site-ici']
    KATEGORI_SPESIFIK_PARAMS.forEach((p) => url.searchParams.delete(p))
    window.location.href = url.toString()
  }

  return (
    <div role="tablist" aria-label="Kategori" className="flex gap-1 border-b border-border pb-2">
      {TABS.map((t) => {
        const isActive = active === t.id
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleClick(t.id)}
            className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition ${
              isActive
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

export default CategoryTabs
