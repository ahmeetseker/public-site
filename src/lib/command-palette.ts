/**
 * Wave F24.C — public-site command palette registry.
 *
 * Reuses the F16 atolye-admin pattern (actions / pages / entity search +
 * locale-aware persistence). Public-site differences from atolye-admin:
 *
 *  - **Locale awareness:** every label + URL has a TR/EN variant. The palette
 *    detects the active locale at runtime from `window.location.pathname`
 *    (see `detectLocale()`); pages compiled SSR can also pass a locale into
 *    `filteredSections(query, locale)`.
 *  - **Entities:** LISTINGS / OFFICES / REGIONS (no CUSTOMERS / TRANSACTIONS
 *    — those are atolye-admin scope).
 *  - **Storage key:** `arsam.public-command-palette.recent.v1` (separate from
 *    the atolye palette so the two apps don't share recent history).
 *
 * Lucide icon imports stay tree-shakeable via @landx/icons (same as F16).
 */
import {
  Building2,
  FileText,
  Globe2,
  Home,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Moon,
  PlusCircle,
  Search as SearchIcon,
  Star,
  type LucideIcon,
} from '@landx/icons'
import { LISTINGS, OFFICES, REGIONS } from '@landx/data'

export type Locale = 'tr' | 'en'

export type PaletteItemType =
  | 'action'
  | 'page'
  | 'listing'
  | 'office'
  | 'region'

export interface PaletteItem {
  id: string
  type: PaletteItemType
  label: string
  hint?: string
  shortcut?: string
  Icon: LucideIcon
  to?: string
  action?: () => void
}

export const RECENT_STORAGE_KEY = 'arsam.public-command-palette.recent.v1'
const RECENT_LIMIT = 5
const ENTITY_LIMIT = 6

/* ────────────────────────────────────────────────────────────────────── *
 * Locale helpers
 * ────────────────────────────────────────────────────────────────────── */

export function detectLocale(pathname: string = ''): Locale {
  if (!pathname && typeof window !== 'undefined') {
    pathname = window.location.pathname
  }
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'tr'
}

function prefix(locale: Locale): string {
  return locale === 'en' ? '/en' : ''
}

/* ────────────────────────────────────────────────────────────────────── *
 * Listing slug — duplicated from `pages/ilan/[slug].astro` so the palette
 * stays standalone (no cross-page import dance). If this slug helper ever
 * diverges from the route, both copies need to update — kept tiny on purpose.
 * ────────────────────────────────────────────────────────────────────── */

function slugifyListingTitle(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/* ────────────────────────────────────────────────────────────────────── *
 * Actions
 * ────────────────────────────────────────────────────────────────────── */

export function buildActions(locale: Locale): PaletteItem[] {
  const p = prefix(locale)
  if (locale === 'en') {
    return [
      {
        id: 'go-compare',
        type: 'action',
        label: 'Open compare',
        hint: 'Listing comparison',
        to: `${p}/karsilastir`,
        Icon: LayoutDashboard,
      },
      {
        id: 'go-favorites',
        type: 'action',
        label: 'Open favorites',
        hint: 'Account / favorites',
        to: `${p}/hesabim/favori`,
        Icon: Star,
      },
      {
        id: 'go-saved-searches',
        type: 'action',
        label: 'Open saved searches',
        hint: 'Account / searches',
        to: `${p}/hesabim/aramalar`,
        Icon: SearchIcon,
      },
      {
        id: 'new-listing',
        type: 'action',
        label: 'Post a listing',
        hint: 'New listing',
        to: `${p}/yardim/ilan-yayinla`,
        Icon: PlusCircle,
      },
      {
        id: 'theme-toggle',
        type: 'action',
        label: 'Toggle theme',
        hint: 'Account / settings',
        to: `${p}/hesabim/ayarlar#appearance`,
        Icon: Moon,
      },
      {
        id: 'sign-out',
        type: 'action',
        label: 'Sign out',
        to: `${p}/cikis`,
        Icon: LogOut,
      },
    ]
  }
  return [
    {
      id: 'go-compare',
      type: 'action',
      label: 'Karşılaştırmaya git',
      hint: 'İlan karşılaştırma',
      to: `${p}/karsilastir`,
      Icon: LayoutDashboard,
    },
    {
      id: 'go-favorites',
      type: 'action',
      label: 'Favorilerimi aç',
      hint: 'Hesabım · Favoriler',
      to: `${p}/hesabim/favori`,
      Icon: Star,
    },
    {
      id: 'go-saved-searches',
      type: 'action',
      label: 'Aramalarımı aç',
      hint: 'Hesabım · Aramalar',
      to: `${p}/hesabim/aramalar`,
      Icon: SearchIcon,
    },
    {
      id: 'new-listing',
      type: 'action',
      label: 'İlan ver',
      hint: 'Yeni ilan',
      to: `${p}/yardim/ilan-yayinla`,
      Icon: PlusCircle,
    },
    {
      id: 'theme-toggle',
      type: 'action',
      label: 'Tema değiştir',
      hint: 'Hesabım · Ayarlar',
      to: `${p}/hesabim/ayarlar#appearance`,
      Icon: Moon,
    },
    {
      id: 'sign-out',
      type: 'action',
      label: 'Çıkış yap',
      to: `${p}/cikis`,
      Icon: LogOut,
    },
  ]
}

/* ────────────────────────────────────────────────────────────────────── *
 * Pages (11 base routes — all have TR + EN companion under /en/)
 * ────────────────────────────────────────────────────────────────────── */

export function buildPages(locale: Locale): PaletteItem[] {
  const p = prefix(locale)
  if (locale === 'en') {
    return [
      { id: 'page-home', type: 'page', label: 'Home', to: `${p}/`, Icon: Home },
      { id: 'page-search', type: 'page', label: 'Search', to: `${p}/ara`, Icon: SearchIcon },
      { id: 'page-new-listing', type: 'page', label: 'Post a listing', to: `${p}/yardim/ilan-yayinla`, Icon: PlusCircle },
      { id: 'page-offices', type: 'page', label: 'Offices', to: `${p}/ofisler`, Icon: Building2 },
      { id: 'page-regions', type: 'page', label: 'Regions', to: `${p}/bolge`, Icon: MapPin },
      { id: 'page-blog', type: 'page', label: 'Blog', to: `${p}/blog`, Icon: FileText },
      { id: 'page-help', type: 'page', label: 'Help', to: `${p}/yardim`, Icon: FileText },
      { id: 'page-contact', type: 'page', label: 'Contact', to: `${p}/iletisim`, Icon: Mail },
      { id: 'page-about', type: 'page', label: 'About', to: `${p}/hakkimizda`, Icon: Globe2 },
      { id: 'page-compare', type: 'page', label: 'Compare', to: `${p}/karsilastir`, Icon: LayoutDashboard },
      { id: 'page-cookies', type: 'page', label: 'Cookie policy', to: `${p}/cerez-politikasi`, Icon: FileText },
    ]
  }
  return [
    { id: 'page-home', type: 'page', label: 'Anasayfa', to: `${p}/`, Icon: Home },
    { id: 'page-search', type: 'page', label: 'Ara', to: `${p}/ara`, Icon: SearchIcon },
    { id: 'page-new-listing', type: 'page', label: 'İlan ver', to: `${p}/yardim/ilan-yayinla`, Icon: PlusCircle },
    { id: 'page-offices', type: 'page', label: 'Ofisler', to: `${p}/ofisler`, Icon: Building2 },
    { id: 'page-regions', type: 'page', label: 'Bölgeler', to: `${p}/bolge`, Icon: MapPin },
    { id: 'page-blog', type: 'page', label: 'Blog', to: `${p}/blog`, Icon: FileText },
    { id: 'page-help', type: 'page', label: 'Yardım', to: `${p}/yardim`, Icon: FileText },
    { id: 'page-contact', type: 'page', label: 'İletişim', to: `${p}/iletisim`, Icon: Mail },
    { id: 'page-about', type: 'page', label: 'Hakkımızda', to: `${p}/hakkimizda`, Icon: Globe2 },
    { id: 'page-compare', type: 'page', label: 'Karşılaştır', to: `${p}/karsilastir`, Icon: LayoutDashboard },
    { id: 'page-cookies', type: 'page', label: 'Çerez politikası', to: `${p}/cerez-politikasi`, Icon: FileText },
  ]
}

/* ────────────────────────────────────────────────────────────────────── *
 * Locale-aware case-insensitive search (TR + EN locale collation).
 * ────────────────────────────────────────────────────────────────────── */

function includesCI(haystack: string, needle: string): boolean {
  return haystack.toLocaleLowerCase('tr-TR').includes(needle.toLocaleLowerCase('tr-TR'))
}

/* ────────────────────────────────────────────────────────────────────── *
 * Entity search — LISTINGS / OFFICES / REGIONS
 * ────────────────────────────────────────────────────────────────────── */

export function searchEntities(query: string, locale: Locale = 'tr'): PaletteItem[] {
  if (!query.trim()) return []
  const q = query.trim()
  const p = prefix(locale)
  const out: PaletteItem[] = []

  for (const l of LISTINGS) {
    if (out.length >= ENTITY_LIMIT) break
    if (includesCI(l.title, q) || includesCI(l.city, q) || includesCI(l.district, q)) {
      const slug = `${slugifyListingTitle(l.title)}-${l.id}`
      out.push({
        id: `listing-${l.id}`,
        type: 'listing',
        label: l.title,
        hint: `${l.city} · ${l.district}`,
        to: `${p}/ilan/${slug}`,
        Icon: Building2,
      })
    }
  }

  for (const o of OFFICES) {
    if (out.length >= ENTITY_LIMIT * 2) break
    if (includesCI(o.name, q) || includesCI(o.city, q)) {
      out.push({
        id: `office-${o.id}`,
        type: 'office',
        label: o.name,
        hint: `${o.city} · ${o.district}`,
        to: `${p}/ofis/${o.slug}`,
        Icon: Building2,
      })
    }
  }

  for (const r of REGIONS) {
    if (out.length >= ENTITY_LIMIT * 3) break
    if (includesCI(r.name, q) || includesCI(r.city, q)) {
      out.push({
        id: `region-${r.slug}`,
        type: 'region',
        label: r.name,
        hint: r.city,
        to: `${p}/bolge/${r.slug}`,
        Icon: MapPin,
      })
    }
  }

  return out
}

/* ────────────────────────────────────────────────────────────────────── *
 * Recent-search persistence
 * ────────────────────────────────────────────────────────────────────── */

export function readRecent(): string[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function pushRecent(query: string): string[] {
  const q = query.trim()
  if (!q) return readRecent()
  const current = readRecent()
  const next = [q, ...current.filter((v) => v !== q)].slice(0, RECENT_LIMIT)
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}

export function clearRecent(): void {
  try {
    localStorage.removeItem(RECENT_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/* ────────────────────────────────────────────────────────────────────── *
 * Flat sections — used by the React palette to render + flat-index navigate
 * ────────────────────────────────────────────────────────────────────── */

export interface FlatPaletteSection {
  label: string
  items: ReadonlyArray<PaletteItem>
}

export interface SectionLabels {
  actions: string
  pages: string
  results: string
}

export function getSectionLabels(locale: Locale): SectionLabels {
  if (locale === 'en') {
    return { actions: 'ACTIONS', pages: 'PAGES', results: 'RESULTS' }
  }
  return { actions: 'AKSİYONLAR', pages: 'SAYFALAR', results: 'SONUÇLAR' }
}

export function filteredSections(query: string, locale: Locale = 'tr'): FlatPaletteSection[] {
  const labels = getSectionLabels(locale)
  const actions = buildActions(locale)
  const pages = buildPages(locale)

  if (!query.trim()) {
    return [
      { label: labels.actions, items: actions },
      { label: labels.pages, items: pages },
    ]
  }

  const matchAction = actions.filter((a) => includesCI(a.label, query))
  const matchPage = pages.filter((p) => includesCI(p.label, query))
  const entities = searchEntities(query, locale)

  const sections: FlatPaletteSection[] = []
  if (matchAction.length) sections.push({ label: labels.actions, items: matchAction })
  if (matchPage.length) sections.push({ label: labels.pages, items: matchPage })
  if (entities.length) sections.push({ label: labels.results, items: entities })
  return sections
}
