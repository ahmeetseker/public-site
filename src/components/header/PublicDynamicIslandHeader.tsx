/**
 * PublicDynamicIslandHeader — arsam.net adapter for the shared
 * `DynamicIslandHeader` primitive (Wave F32 / Task 6).
 *
 * Maps public-site nav structure (4 ana × 2-3 alt) onto the generic
 * header API, wires the public AI mock engine, and exposes locale +
 * theme + auth CTAs through the `extras` slot. Notifications mount the
 * function-form panel so link clicks can close the popover via the
 * `close` callback passed by the primitive.
 *
 * The legacy `SiteHeader.astro` stays mounted until Task 7 swaps
 * `RootLayout.astro` over to this component.
 */
import { useMemo, useState, useRef, useEffect } from 'react'
import { Search, MapPin, BookOpen, Building2, Sparkles, Layers } from '@landx/icons'
// Subpath import — `@landx/ui` barrel transitively re-exports
// `./maps/listings-map` (leaflet), which crashes Astro's SSR prerender
// because leaflet touches `window` at module init. Importing from the
// `./shell` subpath isolates the header from the map deps.
import { DynamicIslandHeader } from '@landx/ui/shell'
import { ThemeToggle } from '@landx/ui/theme'
import { t, type Locale } from '@/i18n'
import { BASE, stripBase } from '@/lib/with-base'
import { buildAnswer } from '@/lib/assistant/answer'
import {
  PUBLIC_AI_SUGGESTIONS_TR,
  PUBLIC_AI_SUGGESTIONS_EN,
  PUBLIC_AI_STAGES_TR,
  PUBLIC_AI_STAGES_EN,
} from '@/lib/assistant/suggestions'
import { LocalePickerInline } from '../i18n/LocalePickerInline'
import { NotificationBellPanel } from './NotificationBellPanel'
import RecentViewedDropdown from '../recent/RecentViewedDropdown'

export interface BreadcrumbSegment {
  label: string
  href?: string
}

interface Props {
  locale: Locale
  pathname: string
  /**
   * Sayfa-spesifik breadcrumb segmentleri. Verilirse pill'in "Şu an: …"
   * etiketi yerine tıklanabilir link zinciri olarak render edilir.
   */
  breadcrumb?: BreadcrumbSegment[]
}

function deriveActiveKey(pathname: string): string {
  const p = stripBase(pathname).replace(/^\/en/, '')
  if (p.startsWith('/ara')) return 'search'
  if (p.startsWith('/ofisler') || p.startsWith('/office')) return 'offices'
  if (p.startsWith('/bolge')) return 'regions'
  if (p.startsWith('/blog')) return 'blog'
  return 'home'
}

export default function PublicDynamicIslandHeader({ locale, pathname, breadcrumb }: Props) {
  const prefix = `${BASE}${locale === 'en' ? '/en' : ''}`
  const activeKey = deriveActiveKey(pathname)

  // Breadcrumb dropdown state — 3+ segment varsa ortayı "…" ile kısalt
  const [crumbOpen, setCrumbOpen] = useState(false)
  const crumbWrapRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!crumbOpen) return
    function onDocClick(e: MouseEvent) {
      if (crumbWrapRef.current && !crumbWrapRef.current.contains(e.target as Node)) {
        setCrumbOpen(false)
      }
    }
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') setCrumbOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [crumbOpen])

  // Render tek bir breadcrumb segment'i (link veya plain span)
  function renderSegment(seg: BreadcrumbSegment, isCurrent: boolean) {
    if (seg.href && !isCurrent) {
      return (
        <a
          href={seg.href}
          className="text-muted-foreground hover:text-foreground hover:underline"
        >
          {seg.label}
        </a>
      )
    }
    return (
      <span className={isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'}>
        {seg.label}
      </span>
    )
  }

  // Breadcrumb verilirse pill'in "Şu an: …" içeriğini link zinciri yap
  const statusChipContent = breadcrumb && breadcrumb.length > 0 ? (() => {
    const last = breadcrumb.length - 1
    // ≤2 segment: kompakt, hep tam göster
    // 3+ segment: ilk + … + son göster, … tıklanınca dropdown ile orta segment'ler açılır
    const useTruncate = breadcrumb.length >= 3
    const hidden = useTruncate ? breadcrumb.slice(1, last) : []
    return (
      <span ref={crumbWrapRef} className="relative inline-flex items-center gap-1">
        {/* İlk segment */}
        {renderSegment(breadcrumb[0], false)}
        {useTruncate ? (
          <>
            <span className="text-muted-foreground/70">›</span>
            <button
              type="button"
              aria-label={`${hidden.length} ara basamağı göster`}
              aria-expanded={crumbOpen}
              onClick={(e) => { e.stopPropagation(); setCrumbOpen((v) => !v) }}
              className="rounded px-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >…</button>
            <span className="text-muted-foreground/70">›</span>
            {renderSegment(breadcrumb[last], true)}
            {/* Dropdown */}
            {crumbOpen && (
              <span
                role="menu"
                className="absolute left-0 top-full z-50 mt-2 flex min-w-[200px] flex-col rounded-lg border border-border bg-background py-1 shadow-lg"
              >
                {breadcrumb.map((seg, i) => {
                  const isCurrent = i === last
                  const content = (
                    <span className="flex items-center gap-2 px-3 py-1.5 text-xs">
                      <span className={isCurrent ? 'text-emerald-600' : 'text-muted-foreground/50'}>
                        {isCurrent ? '✓' : '·'}
                      </span>
                      <span className={isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                        {seg.label}
                      </span>
                    </span>
                  )
                  return seg.href && !isCurrent ? (
                    <a
                      key={seg.label + i}
                      href={seg.href}
                      role="menuitem"
                      className="block hover:bg-muted"
                      onClick={() => setCrumbOpen(false)}
                    >
                      {content}
                    </a>
                  ) : (
                    <span key={seg.label + i} role="menuitem" className="block">
                      {content}
                    </span>
                  )
                })}
              </span>
            )}
          </>
        ) : (
          breadcrumb.slice(1).map((seg, i) => (
            <span key={seg.label + i} className="inline-flex items-center gap-1">
              <span className="text-muted-foreground/70">›</span>
              {renderSegment(seg, i === last - 1)}
            </span>
          ))
        )}
      </span>
    )
  })() : undefined

  const statusChipLabel = breadcrumb && breadcrumb.length > 0
    ? breadcrumb.map((s) => s.label).join(' › ')
    : undefined

  const navPages = useMemo(
    () => [
      { key: 'search', alt: t('nav.search', locale), icon: <Search className="h-5 w-5" /> },
      { key: 'offices', alt: t('nav.offices', locale), icon: <Building2 className="h-5 w-5" /> },
      { key: 'regions', alt: t('nav.regions', locale), icon: <MapPin className="h-5 w-5" /> },
      { key: 'blog', alt: t('nav.blog', locale), icon: <BookOpen className="h-5 w-5" /> },
    ],
    [locale],
  )

  const subNav = useMemo(
    () => ({
      search: [
        {
          key: 'list',
          label: t('nav.searchList', locale),
          icon: <Layers className="h-5 w-5" />,
          target: 'search',
          href: `${prefix}/ara`,
        },
        {
          key: 'map',
          label: t('nav.searchMap', locale),
          icon: <MapPin className="h-5 w-5" />,
          target: 'search',
          href: `${prefix}/ara/harita`,
        },
        {
          key: 'saved',
          label: t('nav.searchSaved', locale),
          icon: <BookOpen className="h-5 w-5" />,
          target: 'search',
          href: `${prefix}/hesabim/kayitli-aramalar`,
        },
      ],
      offices: [
        {
          key: 'all',
          label: t('nav.officesAll', locale),
          icon: <Layers className="h-5 w-5" />,
          target: 'offices',
          href: `${prefix}/ofisler`,
        },
        {
          key: 'cities',
          label: t('nav.officesCities', locale),
          icon: <MapPin className="h-5 w-5" />,
          target: 'offices',
          href: `${prefix}/ofisler`,
        },
      ],
      regions: [
        {
          key: 'popular',
          label: t('nav.regionsPopular', locale),
          icon: <Sparkles className="h-5 w-5" />,
          target: 'regions',
          href: `${prefix}/bolge`,
        },
        {
          key: 'all',
          label: t('nav.regionsAll', locale),
          icon: <Layers className="h-5 w-5" />,
          target: 'regions',
          href: `${prefix}/bolge`,
        },
      ],
      blog: [
        {
          key: 'latest',
          label: t('nav.blogLatest', locale),
          icon: <BookOpen className="h-5 w-5" />,
          target: 'blog',
          href: `${prefix}/blog`,
        },
        {
          key: 'categories',
          label: t('nav.blogCategories', locale),
          icon: <Layers className="h-5 w-5" />,
          target: 'blog',
          href: `${prefix}/blog`,
        },
      ],
    }),
    [locale, prefix],
  )

  const suggestions = locale === 'en' ? PUBLIC_AI_SUGGESTIONS_EN : PUBLIC_AI_SUGGESTIONS_TR
  const stages = locale === 'en' ? PUBLIC_AI_STAGES_EN : PUBLIC_AI_STAGES_TR

  return (
    <DynamicIslandHeader
      brandIcon={<Sparkles className="h-6 w-6 flex-none" />}
      brandLabel="arsam.net"
      activeKey={activeKey}
      statusChipLabel={statusChipLabel}
      statusChipContent={statusChipContent}
      navPages={navPages}
      subNav={subNav}
      aiSearch={{
        placeholder: t('ai.placeholder', locale),
        suggestions,
        answerFn: (q) => buildAnswer(q, locale),
        stageLabels: stages,
      }}
      notifications={{
        unreadCount: 0,
        panel: ({ close }) => <NotificationBellPanel locale={locale} onClose={close} />,
      }}
      extras={
        <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3">
          <LocalePickerInline locale={locale} pathname={pathname} />
          <ThemeToggle align="end" />
          <RecentViewedDropdown />
          <a
            href={`${prefix}/panel`}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
          >
            {t('nav.login', locale)}
          </a>
          <a
            href={`${prefix}/ilan-ver`}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90"
          >
            {t('nav.listProperty', locale)}
          </a>
        </div>
      }
      onNavigateHref={(href) => {
        window.location.href = href
      }}
    />
  )
}
