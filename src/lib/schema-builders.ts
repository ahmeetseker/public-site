/**
 * Wave F22.0 — Type-safe JSON-LD builders for arsam.net Schema.org coverage.
 *
 * Every builder returns a plain object — pages embed it via
 * `<script type="application/ld+json">{JSON.stringify(...)}</script>`. The
 * helpers never emit empty/undefined fields so output stays tidy and
 * validates against schema.org's Rich Results test.
 */

const CONTEXT = 'https://schema.org' as const

export interface BreadcrumbItem {
  name: string
  url: string
}

export function breadcrumbListSchema(items: ReadonlyArray<BreadcrumbItem>): object {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export interface RealEstateListingInput {
  name: string
  description?: string
  url: string
  image?: string | ReadonlyArray<string>
  price?: number
  priceCurrency?: string
  area?: number             // m²
  city?: string
  district?: string
  latitude?: number
  longitude?: number
  datePosted?: string       // ISO
  zoning?: string
}

export function realEstateListingSchema(input: RealEstateListingInput): object {
  const offers = input.price
    ? {
        '@type': 'Offer',
        price: input.price,
        priceCurrency: input.priceCurrency ?? 'TRY',
        availability: 'https://schema.org/InStock',
      }
    : undefined

  const geo =
    input.latitude !== undefined && input.longitude !== undefined
      ? {
          '@type': 'GeoCoordinates',
          latitude: input.latitude,
          longitude: input.longitude,
        }
      : undefined

  const address =
    input.city || input.district
      ? {
          '@type': 'PostalAddress',
          addressCountry: 'TR',
          addressLocality: input.district ?? undefined,
          addressRegion: input.city ?? undefined,
        }
      : undefined

  const out: Record<string, unknown> = {
    '@context': CONTEXT,
    '@type': 'RealEstateListing',
    name: input.name,
    url: input.url,
  }
  if (input.description) out.description = input.description
  if (input.image) out.image = input.image
  if (offers) out.offers = offers
  if (geo) out.geo = geo
  if (address) out.address = address
  if (input.area !== undefined) {
    out.floorSize = { '@type': 'QuantitativeValue', value: input.area, unitCode: 'MTK' }
  }
  if (input.datePosted) out.datePosted = input.datePosted
  if (input.zoning) out.additionalType = input.zoning
  return out
}

export interface LocalBusinessInput {
  name: string
  url: string
  description?: string
  image?: string
  telephone?: string
  email?: string
  city?: string
  district?: string
  street?: string
  postalCode?: string
  latitude?: number
  longitude?: number
  openingHours?: ReadonlyArray<string>
  priceRange?: string
}

export function localBusinessSchema(input: LocalBusinessInput): object {
  const out: Record<string, unknown> = {
    '@context': CONTEXT,
    '@type': 'RealEstateAgent',
    name: input.name,
    url: input.url,
  }
  if (input.description) out.description = input.description
  if (input.image) out.image = input.image
  if (input.telephone) out.telephone = input.telephone
  if (input.email) out.email = input.email
  if (input.priceRange) out.priceRange = input.priceRange
  if (input.openingHours && input.openingHours.length > 0) {
    out.openingHours = input.openingHours
  }
  if (input.city || input.district || input.street) {
    out.address = {
      '@type': 'PostalAddress',
      addressCountry: 'TR',
      addressRegion: input.city ?? undefined,
      addressLocality: input.district ?? undefined,
      streetAddress: input.street ?? undefined,
      postalCode: input.postalCode ?? undefined,
    }
  }
  if (input.latitude !== undefined && input.longitude !== undefined) {
    out.geo = {
      '@type': 'GeoCoordinates',
      latitude: input.latitude,
      longitude: input.longitude,
    }
  }
  return out
}

export interface FaqItem {
  q: string
  a: string
}

export function faqPageSchema(items: ReadonlyArray<FaqItem>): object {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }
}

export interface ArticleSchemaInput {
  headline: string
  url: string
  description?: string
  image?: string
  datePublished?: string
  dateModified?: string
  author?: string
  body?: string
}

export function articleSchema(input: ArticleSchemaInput): object {
  const out: Record<string, unknown> = {
    '@context': CONTEXT,
    '@type': 'Article',
    headline: input.headline,
    url: input.url,
    mainEntityOfPage: input.url,
  }
  if (input.description) out.description = input.description
  if (input.image) out.image = input.image
  if (input.datePublished) out.datePublished = input.datePublished
  if (input.dateModified) out.dateModified = input.dateModified
  if (input.author) out.author = { '@type': 'Person', name: input.author }
  if (input.body) out.articleBody = input.body
  return out
}

export interface PlaceSchemaInput {
  name: string
  url: string
  description?: string
  city?: string
  district?: string
  region?: string
  latitude?: number
  longitude?: number
}

export function placeSchema(input: PlaceSchemaInput): object {
  const out: Record<string, unknown> = {
    '@context': CONTEXT,
    '@type': 'Place',
    name: input.name,
    url: input.url,
  }
  if (input.description) out.description = input.description
  if (input.city || input.district || input.region) {
    out.address = {
      '@type': 'PostalAddress',
      addressCountry: 'TR',
      addressRegion: input.region ?? input.city ?? undefined,
      addressLocality: input.district ?? undefined,
    }
  }
  if (input.latitude !== undefined && input.longitude !== undefined) {
    out.geo = {
      '@type': 'GeoCoordinates',
      latitude: input.latitude,
      longitude: input.longitude,
    }
  }
  return out
}

export function organizationSchema(origin = 'https://arsam.net'): object {
  return {
    '@context': CONTEXT,
    '@type': 'Organization',
    name: 'Arsam',
    url: origin,
    logo: `${origin}/og/home.png`,
    sameAs: [
      'https://www.linkedin.com/company/arsam',
    ],
  }
}

/**
 * Convenience: serialise a builder result to the exact string shape that
 * `<script type="application/ld+json">` expects (newlines stripped to keep
 * the DOM clean; rich-results tester accepts both).
 */
export function toJsonLd(value: object): string {
  return JSON.stringify(value)
}
