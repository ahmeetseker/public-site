/**
 * Content & Insights domain types — Wave F32.
 *
 * Rehber makaleleri (blog), kullanıcı analitik özet (görüntülenme/tıklama),
 * kategori arşiv sayfaları için seed.
 */

// ─── Guides (rehber makaleleri) ──────────────────────────────────────────────

export type GuideTag =
  | 'satis'
  | 'kira'
  | 'yatirim'
  | 'imar'
  | 'tapu'
  | 'vergi'
  | 'hukuk'

export interface Guide {
  /** URL slug — `/rehber/[slug]`. */
  slug: string
  title: string
  subtitle: string
  /** Kapak görseli URL'i (public/ altında veya CDN). */
  cover: string
  /** Markdown body — `react-markdown` veya Astro `<Content />` ile render. */
  body: string
  author: string
  /** ISO 8601. */
  publishedAt: string
  tags: GuideTag[]
  /** İlişkili makale slug'ları — alt bileşen. */
  related: string[]
  /** Tahmini okuma süresi (dakika). */
  readingMinutes: number
}

// ─── User analytics (bireysel /hesabim/analitik) ─────────────────────────────

export interface AnalyticsTotals {
  /** Toplam görüntülenme. */
  views: number
  /** Detay tıklamaları. */
  clicks: number
  /** Mesaj sayısı. */
  messages: number
  /** Tıklama oranı (clicks/views). 0-1 arası float. */
  ctr: number
}

export interface AnalyticsDailyPoint {
  /** ISO date (YYYY-MM-DD). */
  date: string
  views: number
  clicks: number
  messages: number
}

export interface AnalyticsTopListing {
  id: string
  title: string
  views: number
}

export interface UserAnalytics {
  userId: string
  range: {
    /** ISO date. */
    from: string
    /** ISO date. */
    to: string
  }
  totals: AnalyticsTotals
  daily: AnalyticsDailyPoint[]
  topListings: AnalyticsTopListing[]
}

// ─── Category archive (`/kategori/[slug]`) ───────────────────────────────────

export interface CategoryArchive {
  slug: string
  title: string
  /** Açıklama metni (SEO + page header). */
  description: string
  /** Kategoriye ait ilan id listesi — listings mock'undan referans. */
  listingIds: string[]
  /** Kapak görseli. */
  cover?: string
  /** İlgili filtre URL'i (`/ara?type=...`). */
  filterHref: string
}
