import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  buildActions,
  buildPages,
  clearRecent,
  detectLocale,
  filteredSections,
  getSectionLabels,
  pushRecent,
  readRecent,
  searchEntities,
  RECENT_STORAGE_KEY,
} from '@/lib/command-palette'

describe('detectLocale', () => {
  it('returns "en" for /en and /en/* paths', () => {
    expect(detectLocale('/en')).toBe('en')
    expect(detectLocale('/en/')).toBe('en')
    expect(detectLocale('/en/ara')).toBe('en')
  })

  it('returns "tr" for the root + every non-/en path', () => {
    expect(detectLocale('/')).toBe('tr')
    expect(detectLocale('/ara')).toBe('tr')
    expect(detectLocale('/ilan/example')).toBe('tr')
  })
})

describe('buildActions / buildPages', () => {
  it('TR exposes at least 5 actions, all carrying a `to`', () => {
    const actions = buildActions('tr')
    expect(actions.length).toBeGreaterThanOrEqual(5)
    for (const a of actions) {
      expect(a.type).toBe('action')
      expect(typeof a.label).toBe('string')
      expect(typeof a.to).toBe('string')
      expect(a.to!.startsWith('/')).toBe(true)
    }
  })

  it('EN page links are prefixed with /en', () => {
    const pages = buildPages('en')
    expect(pages.length).toBeGreaterThanOrEqual(10)
    expect(pages.find((p) => p.id === 'page-home')?.to).toBe('/en/')
    expect(pages.find((p) => p.id === 'page-search')?.to).toBe('/en/ara')
    expect(pages.find((p) => p.id === 'page-compare')?.to).toBe('/en/karsilastir')
  })

  it('TR action `sign-out` routes to /cikis (no /en prefix)', () => {
    const trCikis = buildActions('tr').find((a) => a.id === 'sign-out')
    const enCikis = buildActions('en').find((a) => a.id === 'sign-out')
    expect(trCikis?.to).toBe('/cikis')
    expect(enCikis?.to).toBe('/en/cikis')
  })

  it('section labels switch language', () => {
    expect(getSectionLabels('tr').actions).toBe('AKSİYONLAR')
    expect(getSectionLabels('en').actions).toBe('ACTIONS')
    expect(getSectionLabels('en').results).toBe('RESULTS')
  })
})

describe('searchEntities', () => {
  it('returns empty list for empty/whitespace query', () => {
    expect(searchEntities('')).toEqual([])
    expect(searchEntities('   ')).toEqual([])
  })

  it('matches a city (TR locale, case-insensitive)', () => {
    const r = searchEntities('izmir', 'tr')
    expect(r.length).toBeGreaterThan(0)
    const types = new Set(r.map((x) => x.type))
    // Should at minimum find one listing or office or region for İzmir.
    expect(types.size).toBeGreaterThan(0)
  })

  it('locale-aware case-insensitive matching (TR uppercase folds to dotless ı)', () => {
    // 'AYVALIK' lowercases to 'ayvalık' under tr-TR (dotless I → dotless ı),
    // matching the canonical 'Ayvalık' in the dataset. The dotted-i variant
    // 'ayvalik' is a genuinely different string under TR collation and
    // SHOULD NOT match — that asymmetry is by design, not a bug.
    const upper = searchEntities('AYVALIK')
    const proper = searchEntities('Ayvalık')
    expect(upper.length).toBe(proper.length)
    expect(upper.length).toBeGreaterThan(0)
  })

  it('listing URLs honor locale prefix', () => {
    const trHits = searchEntities('arsa', 'tr').filter((r) => r.type === 'listing')
    const enHits = searchEntities('arsa', 'en').filter((r) => r.type === 'listing')
    if (trHits.length > 0) {
      expect(trHits[0]!.to!.startsWith('/ilan/')).toBe(true)
    }
    if (enHits.length > 0) {
      expect(enHits[0]!.to!.startsWith('/en/ilan/')).toBe(true)
    }
  })
})

describe('filteredSections', () => {
  it('empty query — TR shows AKSİYONLAR + SAYFALAR only', () => {
    const sections = filteredSections('', 'tr')
    expect(sections.map((s) => s.label)).toEqual(['AKSİYONLAR', 'SAYFALAR'])
  })

  it('empty query — EN shows ACTIONS + PAGES only', () => {
    const sections = filteredSections('', 'en')
    expect(sections.map((s) => s.label)).toEqual(['ACTIONS', 'PAGES'])
  })

  it('non-matching query collapses to empty list', () => {
    const sections = filteredSections('zzz-nope-zzz', 'tr')
    expect(sections).toEqual([])
  })

  it('query may include SONUÇLAR / RESULTS when entities match', () => {
    const sections = filteredSections('izmir', 'tr')
    expect(sections.some((s) => s.label === 'SONUÇLAR')).toBe(true)
    const enSections = filteredSections('izmir', 'en')
    expect(enSections.some((s) => s.label === 'RESULTS')).toBe(true)
  })

  it('action labels match against query string', () => {
    const sections = filteredSections('karşılaştır', 'tr')
    const action = sections
      .find((s) => s.label === 'AKSİYONLAR')
      ?.items.find((i) => i.id === 'go-compare')
    expect(action).toBeDefined()
  })
})

describe('recent-search persistence', () => {
  beforeEach(() => {
    clearRecent()
  })

  afterEach(() => {
    clearRecent()
  })

  it('readRecent returns empty list initially', () => {
    expect(readRecent()).toEqual([])
  })

  it('pushRecent stores queries in MRU order, max 5', () => {
    pushRecent('a')
    pushRecent('b')
    pushRecent('c')
    pushRecent('d')
    pushRecent('e')
    pushRecent('f')
    expect(readRecent()).toEqual(['f', 'e', 'd', 'c', 'b'])
  })

  it('pushRecent deduplicates and re-promotes existing entries', () => {
    pushRecent('alpha')
    pushRecent('beta')
    pushRecent('alpha')
    expect(readRecent()).toEqual(['alpha', 'beta'])
  })

  it('ignores empty / whitespace pushes', () => {
    pushRecent('')
    pushRecent('   ')
    expect(readRecent()).toEqual([])
  })

  it('writes to the documented storage key', () => {
    pushRecent('check-key')
    const raw = localStorage.getItem(RECENT_STORAGE_KEY)
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!)).toContain('check-key')
    expect(RECENT_STORAGE_KEY).toBe('arsam.public-command-palette.recent.v1')
  })

  it('clearRecent empties the store', () => {
    pushRecent('one')
    pushRecent('two')
    clearRecent()
    expect(readRecent()).toEqual([])
  })
})
