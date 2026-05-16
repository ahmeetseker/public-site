import { describe, expect, it } from 'vitest'
import {
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
  localBusinessSchema,
  organizationSchema,
  placeSchema,
  realEstateListingSchema,
  toJsonLd,
} from '@/lib/schema-builders'

const CONTEXT = 'https://schema.org'

describe('breadcrumbListSchema', () => {
  it('emits BreadcrumbList with positional items', () => {
    const out = breadcrumbListSchema([
      { name: 'Anasayfa', url: 'https://arsam.net/' },
      { name: 'İlanlar', url: 'https://arsam.net/ara' },
    ]) as any
    expect(out['@context']).toBe(CONTEXT)
    expect(out['@type']).toBe('BreadcrumbList')
    expect(out.itemListElement[0].position).toBe(1)
    expect(out.itemListElement[1].position).toBe(2)
  })
})

describe('realEstateListingSchema', () => {
  it('includes offers when price is supplied', () => {
    const out = realEstateListingSchema({
      name: 'Ada arsa',
      url: 'https://arsam.net/ilan/ada',
      price: 1_500_000,
    }) as any
    expect(out.offers.price).toBe(1_500_000)
    expect(out.offers.priceCurrency).toBe('TRY')
  })

  it('omits offers / geo / address when not supplied', () => {
    const out = realEstateListingSchema({
      name: 'Naked',
      url: 'https://arsam.net/x',
    }) as any
    expect(out.offers).toBeUndefined()
    expect(out.geo).toBeUndefined()
    expect(out.address).toBeUndefined()
  })

  it('emits PostalAddress when city/district supplied', () => {
    const out = realEstateListingSchema({
      name: 'X',
      url: 'https://arsam.net/x',
      city: 'Balıkesir',
      district: 'Ayvalık',
    }) as any
    expect(out.address.addressLocality).toBe('Ayvalık')
    expect(out.address.addressRegion).toBe('Balıkesir')
  })

  it('emits GeoCoordinates when lat+lng supplied', () => {
    const out = realEstateListingSchema({
      name: 'X',
      url: 'https://arsam.net/x',
      latitude: 39.3,
      longitude: 26.7,
    }) as any
    expect(out.geo['@type']).toBe('GeoCoordinates')
    expect(out.geo.latitude).toBe(39.3)
  })

  it('emits floorSize when area supplied', () => {
    const out = realEstateListingSchema({
      name: 'X',
      url: 'https://arsam.net/x',
      area: 1200,
    }) as any
    expect(out.floorSize.value).toBe(1200)
    expect(out.floorSize.unitCode).toBe('MTK')
  })
})

describe('localBusinessSchema', () => {
  it('uses @type RealEstateAgent', () => {
    const out = localBusinessSchema({
      name: 'Ofis',
      url: 'https://arsam.net/ofis/test',
    }) as any
    expect(out['@type']).toBe('RealEstateAgent')
  })

  it('includes opening hours when supplied', () => {
    const out = localBusinessSchema({
      name: 'Ofis',
      url: 'https://arsam.net/ofis/test',
      openingHours: ['Mo-Fr 09:00-18:00'],
    }) as any
    expect(out.openingHours).toEqual(['Mo-Fr 09:00-18:00'])
  })
})

describe('faqPageSchema', () => {
  it('emits FAQPage with Question + Answer mapping', () => {
    const out = faqPageSchema([
      { q: 'Soru 1?', a: 'Cevap 1.' },
      { q: 'Soru 2?', a: 'Cevap 2.' },
    ]) as any
    expect(out['@type']).toBe('FAQPage')
    expect(out.mainEntity[0]['@type']).toBe('Question')
    expect(out.mainEntity[0].acceptedAnswer.text).toBe('Cevap 1.')
  })
})

describe('articleSchema', () => {
  it('binds mainEntityOfPage to url', () => {
    const out = articleSchema({
      headline: 'Yazı',
      url: 'https://arsam.net/blog/yazi',
    }) as any
    expect(out.mainEntityOfPage).toBe('https://arsam.net/blog/yazi')
  })

  it('includes Person author when supplied', () => {
    const out = articleSchema({
      headline: 'X',
      url: 'https://arsam.net/x',
      author: 'Ahmet',
    }) as any
    expect(out.author).toEqual({ '@type': 'Person', name: 'Ahmet' })
  })
})

describe('placeSchema', () => {
  it('emits Place with region + locality', () => {
    const out = placeSchema({
      name: 'Ayvalık',
      url: 'https://arsam.net/bolge/ayvalik',
      city: 'Balıkesir',
      district: 'Ayvalık',
    }) as any
    expect(out['@type']).toBe('Place')
    expect(out.address.addressRegion).toBe('Balıkesir')
  })
})

describe('organizationSchema', () => {
  it('uses arsam.net default origin + name', () => {
    const out = organizationSchema() as any
    expect(out['@type']).toBe('Organization')
    expect(out.url).toBe('https://arsam.net')
  })
})

describe('toJsonLd', () => {
  it('serialises to a stable JSON string', () => {
    const out = toJsonLd({ a: 1, b: 'x' })
    expect(JSON.parse(out)).toEqual({ a: 1, b: 'x' })
  })
})
