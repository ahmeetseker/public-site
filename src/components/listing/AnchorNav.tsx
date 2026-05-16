/**
 * AnchorNav — F37 Faz 3.
 *
 * `/ilan/[slug]` sayfasında üst header altında sticky horizontal chip-row.
 * 11 anchor (kimlik, harita, degerleme, serh, imar, tarla, risk, cevre,
 * chat, karsi, iletisim). IntersectionObserver ile scroll-spy: viewport
 * ortasındaki section vurgulu.
 *
 * Mobile: yatay scroll, snap-x, aktif chip auto-scroll ortaya gelir.
 *
 * Performance: scroll listener yok — native IntersectionObserver.
 *
 * a11y: nav role + aria-label, her chip `<a href="#id">`, klavye tab order
 * korunur.
 */
import { useEffect, useState, useRef, type ReactElement } from 'react'

const ANCHORS = [
  { id: 'kimlik', label: 'Kimlik' },
  { id: 'harita', label: 'Harita' },
  { id: 'degerleme', label: 'Değerleme' },
  { id: 'yatirim', label: 'Yatırım' },
  { id: 'serh', label: 'Şerh' },
  { id: 'imar', label: 'İmar' },
  { id: 'tarla', label: 'Tarla' },
  { id: 'risk', label: 'Risk' },
  { id: 'cevre', label: 'Çevre' },
  { id: 'gorsel', label: 'Görsel' },
  { id: 'chat', label: 'AI Chat' },
  { id: 'karsi', label: 'Karşılaştır' },
  { id: 'iletisim', label: 'İletişim' },
  { id: 'etkilesim', label: 'Etkileşim' },
] as const

type AnchorId = typeof ANCHORS[number]['id']

export interface AnchorNavProps {
  /** Yerelleştirme — 'tr' | 'en'. EN locale'de label'lar İngilizce. */
  locale?: 'tr' | 'en'
}

const EN_LABELS: Record<AnchorId, string> = {
  kimlik: 'Identity',
  harita: 'Map',
  degerleme: 'Valuation',
  yatirim: 'Investment',
  serh: 'Legal',
  imar: 'Zoning',
  tarla: 'Farmland',
  risk: 'Risk',
  cevre: 'Environment',
  gorsel: 'Visual',
  chat: 'AI Chat',
  karsi: 'Compare',
  iletisim: 'Contact',
  etkilesim: 'Engage',
}

export function AnchorNav({ locale = 'tr' }: AnchorNavProps): ReactElement {
  const [activeId, setActiveId] = useState<AnchorId>(ANCHORS[0].id)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const sections = ANCHORS
      .map((a) => document.getElementById(a.id))
      .filter((el): el is HTMLElement => el != null)

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) {
          setActiveId(visible[0].target.id as AnchorId)
        }
      },
      {
        rootMargin: '-30% 0px -50% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  // Aktif chip mobilde ekranın ortasına otomatik kaydırır.
  useEffect(() => {
    if (!navRef.current) return
    const list = navRef.current.querySelector<HTMLUListElement>('ul')
    // Sadece nav yatay taşıyorsa (mobile) merkeze al; desktop'ta no-op.
    const hasOverflow = list != null && list.scrollWidth > list.clientWidth
    if (!hasOverflow) return
    const activeChip = navRef.current.querySelector<HTMLAnchorElement>(
      `a[href="#${activeId}"]`,
    )
    if (activeChip) {
      activeChip.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [activeId])

  const labelFor = (a: typeof ANCHORS[number]) =>
    locale === 'en' ? EN_LABELS[a.id] : a.label

  return (
    <nav
      ref={navRef}
      aria-label={locale === 'en' ? 'Listing sections' : 'İlan bölümleri'}
      className="sticky top-16 z-20 -mx-4 border-b border-border bg-background/85 px-4 py-2 backdrop-blur"
    >
      <ul className="flex snap-x snap-mandatory gap-1 overflow-x-auto md:justify-center md:gap-2">
        {ANCHORS.map((a) => {
          const isActive = activeId === a.id
          return (
            <li key={a.id} className="snap-start">
              <a
                href={`#${a.id}`}
                aria-current={isActive ? 'true' : undefined}
                className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition ${
                  isActive
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {labelFor(a)}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
