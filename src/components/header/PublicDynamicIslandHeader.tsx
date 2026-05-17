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
import { useMemo } from 'react'
import { Search, MapPin, BookOpen, Building2, Sparkles, Layers } from '@landx/icons'
// Subpath import — `@landx/ui` barrel transitively re-exports
// `./maps/listings-map` (leaflet), which crashes Astro's SSR prerender
// because leaflet touches `window` at module init. Importing from the
// `./shell` subpath isolates the header from the map deps.
import { DynamicIslandHeader } from '@landx/ui/shell'
import { ThemeToggle } from '@landx/ui/theme'
import { t, type Locale } from '@/i18n'
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
  const p = pathname.replace(/^\/en/, '')
  if (p.startsWith('/ara')) return 'search'
  if (p.startsWith('/ofisler') || p.startsWith('/office')) return 'offices'
  if (p.startsWith('/bolge')) return 'regions'
  if (p.startsWith('/blog')) return 'blog'
  return 'home'
}

export default function PublicDynamicIslandHeader({ locale, pathname, breadcrumb }: Props) {
  const prefix = locale === 'en' ? '/en' : ''
  const activeKey = deriveActiveKey(pathname)

  // Breadcrumb verilirse pill'in "Şu an: …" içeriğini link zinciri yap
  const statusChipContent = breadcrumb && breadcrumb.length > 0 ? (
    <span className="inline-flex items-center gap-1">
      {breadcrumb.map((seg, i) => (
        <span key={seg.label + i} className="inline-flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground/70">›</span>}
          {seg.href ? (
            <a
              href={seg.href}
              className={
                i === breadcrumb.length - 1
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:underline'
              }
            >
              {seg.label}
            </a>
          ) : (
            <span className={i === breadcrumb.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
              {seg.label}
            </span>
          )}
        </span>
      ))}
    </span>
  ) : undefined

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
