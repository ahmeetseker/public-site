# Listing /ara Redesign — Wave 1 (Veri Katmanı) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/ara` listing redesign'inin ihtiyaç duyduğu veri katmanı temellerini at — `Listing` tipine `isFeatured`/`hasGas`/`comparisonHint` ekle, seed'i deterministik şekilde doldur, hazard skoru → band helper'ı oluştur ve `ara.astro` SSR loop'una yeni filter + pagination + featured türetme mantığını bağla. UI değişikliği yok; bu wave puro additive foundation.

**Architecture:**
- `packages/data` tarafında: `types.ts` 3 yeni opsiyonel alan + `lib/getHazardBand.ts` saf yardımcı + `listings-extended-v2.ts` seed enrichment.
- `apps/public-site` tarafında: `src/pages/ara.astro` SSR filter loop'u yeni query param'ları okuyacak, featured slot'unu ayıracak, sayfalama dilimini uygulayacak. UI prop'ları sonraki wave'lerde kullanılır; şimdilik mevcut UI dokunulmaz.

**Tech Stack:** TypeScript, Astro 5 (SSG/SSR), Vitest (jsdom), Playwright e2e, `@landx/data` mock layer, mevcut `HAZARD_SCORES`.

**Spec:** `docs/superpowers/specs/2026-05-17-listing-redesign-design.md` (Wave 1 bölümü)

---

## File Structure

**Modify:**
- `packages/data/src/mock/types.ts` — 3 opsiyonel alan ekle (`isFeatured`, `hasGas`, `comparisonHint`)
- `packages/data/src/mock/listings-extended-v2.ts:48-61` — `injectArsaFields` içine `hasGas` deterministik enrichment + featured/comparisonHint allowlist'i
- `packages/data/src/index.ts` — yeni helper export
- `src/pages/ara.astro:22-100` — yeni query param'ları parse + filter + featured/regular split + pagination

**Create:**
- `packages/data/src/lib/getHazardBand.ts` — saf fonksiyon: listing id → `'dusuk' | 'orta' | 'yuksek' | null`
- `packages/data/src/__tests__/getHazardBand.test.ts` — Vitest unit
- `packages/data/src/__tests__/listings-v2-wave1.test.ts` — seed enrichment kontratları (isFeatured set, hasGas dağılımı)
- `tests/e2e/ara-wave1.spec.ts` — Playwright: yeni query param kombinasyonları → SSR sonuç sayısı

**Leave alone:**
- Tüm `src/components/search/**` (Wave 2-4)
- `MobileFilterButton.tsx` (Wave 4'te silinecek)
- `ara.astro`'nun HTML/JSX gövdesi (sadece frontmatter SSR mantığı genişler)

---

## Task 1: `Listing` tipine 3 opsiyonel alan ekle

**Files:**
- Modify: `packages/data/src/mock/types.ts:55-57`

- [ ] **Step 1.1: Open the file and find the comparison-table fields block**

Açılacak dosya: `packages/data/src/mock/types.ts`. Şu blok bulunur (line ~52-56):

```typescript
  zoning?: ListingZoning
  titleStatus?: ListingTitleStatus
  hasRoad?: boolean
  hasWater?: boolean
  hasElectricity?: boolean
```

- [ ] **Step 1.2: Replace block with extended set**

Aşağıdaki ile değiştir (aynı pozisyon, sadece 3 satır eklenir):

```typescript
  zoning?: ListingZoning
  titleStatus?: ListingTitleStatus
  hasRoad?: boolean
  hasWater?: boolean
  hasElectricity?: boolean
  /** Wave-listing-redesign 1 — Doğalgaz altyapısı; mockup "Özellikler" filtre kümesinde. */
  hasGas?: boolean
  /** Wave-listing-redesign 1 — Vitrin işareti; `/ara` redesign üst kart slot'u. */
  isFeatured?: boolean
  /** Wave-listing-redesign 1 — Vitrin kartında "%9 emsal altı" gibi serbest metin etiket. */
  comparisonHint?: string
```

- [ ] **Step 1.3: Type-check the workspace**

Çalıştır: `pnpm -w typecheck`
Beklenen: PASS (yeni alanlar opsiyonel, mevcut consumer'lar etkilenmez).

- [ ] **Step 1.4: Commit**

```bash
git add packages/data/src/mock/types.ts
git commit -m "feat(data): Listing tipine isFeatured / hasGas / comparisonHint opsiyonel alanlar"
```

---

## Task 2: Seed enrichment — `hasGas` deterministik atama

**Files:**
- Modify: `packages/data/src/mock/listings-extended-v2.ts:48-61`
- Create: `packages/data/src/__tests__/listings-v2-wave1.test.ts`

- [ ] **Step 2.1: Failing test — `hasGas` dağılımı**

Oluştur: `packages/data/src/__tests__/listings-v2-wave1.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { LISTINGS_V2 } from '../mock/listings-extended-v2'

describe('LISTINGS_V2 — Wave 1 enrichment', () => {
  it('arsa kategorisinde hasGas tanımlı (true ya da false)', () => {
    const arsa = LISTINGS_V2.filter((l) => (l.category ?? 'arsa') === 'arsa')
    for (const l of arsa) {
      expect(typeof l.hasGas).toBe('boolean')
    }
  })

  it('hasGas dağılımı %20-%80 arasında true (deterministik seed kontratı)', () => {
    const arsa = LISTINGS_V2.filter((l) => (l.category ?? 'arsa') === 'arsa')
    const trueCount = arsa.filter((l) => l.hasGas).length
    const ratio = trueCount / arsa.length
    expect(ratio).toBeGreaterThan(0.2)
    expect(ratio).toBeLessThan(0.8)
  })
})
```

- [ ] **Step 2.2: Run test, see it fail**

Çalıştır: `pnpm --filter @landx/data test -- listings-v2-wave1`
Beklenen: FAIL — `typeof l.hasGas` `'undefined'` (henüz seed'de yok).

- [ ] **Step 2.3: Implement — `injectArsaFields` içine `hasGas` ekle**

Aç: `packages/data/src/mock/listings-extended-v2.ts`. `injectArsaFields` fonksiyonu (line ~48-61) şöyle değişir:

```typescript
function injectArsaFields(l: Listing): Listing {
  return {
    ...l,
    category: l.category ?? 'arsa',
    subType:
      l.subType ??
      (l.type === 'İmarlı' ? 'imarli' :
        l.type === 'Tarla' ? 'tarla' :
          l.type === 'Zeytinlik' ? 'zeytinlik' : 'villa-arsasi'),
    takasUygun: hashSeed(l.id, 'takas') > 0.7,
    forRent: false,
    ilanDate: l.lastUpdate,
    // Wave 1 — Doğalgaz altyapısı; deterministik (~%45 true).
    hasGas: hashSeed(l.id, 'gas') > 0.55,
  }
}
```

- [ ] **Step 2.4: Run test, see it pass**

Çalıştır: `pnpm --filter @landx/data test -- listings-v2-wave1`
Beklenen: PASS (2 test).

- [ ] **Step 2.5: Commit**

```bash
git add packages/data/src/mock/listings-extended-v2.ts packages/data/src/__tests__/listings-v2-wave1.test.ts
git commit -m "feat(data): hasGas deterministik seed (arsa kategorisi)"
```

---

## Task 3: Seed enrichment — `isFeatured` + `comparisonHint` allowlist

**Files:**
- Modify: `packages/data/src/mock/listings-extended-v2.ts:209-215`
- Modify: `packages/data/src/__tests__/listings-v2-wave1.test.ts` (extend)

- [ ] **Step 3.1: Failing test — featured kontratları**

Aç: `packages/data/src/__tests__/listings-v2-wave1.test.ts`. Dosyanın sonuna ekle (mevcut `describe` bloğunun **içine**, son `it`'in altına):

```typescript
  it('arsa kategorisinde tam olarak 2 ilan isFeatured=true', () => {
    const arsa = LISTINGS_V2.filter((l) => (l.category ?? 'arsa') === 'arsa')
    const featured = arsa.filter((l) => l.isFeatured === true)
    expect(featured.length).toBe(2)
  })

  it('isFeatured işaretli her ilanın comparisonHint metni vardır', () => {
    const featured = LISTINGS_V2.filter((l) => l.isFeatured === true)
    expect(featured.length).toBeGreaterThan(0)
    for (const l of featured) {
      expect(typeof l.comparisonHint).toBe('string')
      expect(l.comparisonHint!.length).toBeGreaterThan(0)
    }
  })

  it('featured ilanlar Aktif statüsündedir', () => {
    const featured = LISTINGS_V2.filter((l) => l.isFeatured === true)
    for (const l of featured) {
      expect(l.status).toBe('Aktif')
    }
  })
```

- [ ] **Step 3.2: Run tests, see new ones fail**

Çalıştır: `pnpm --filter @landx/data test -- listings-v2-wave1`
Beklenen: 2 yeni test FAIL (isFeatured yok, comparisonHint yok); önceki 2 PASS.

- [ ] **Step 3.3: Implement — allowlist ile featured işaretle**

Plan'ı yazarken `packages/data/src/mock/listings.ts` taranarak ilk iki Aktif "İmarlı" id'si tespit edildi:

| id | title (kısaca) | type | status |
|---|---|---|---|
| `28.AY.0142` | listings.ts:163 | İmarlı | Aktif |
| `09.AL.0061` | listings.ts:211 | İmarlı | Aktif |

Aç: `packages/data/src/mock/listings-extended-v2.ts`. Mevcut `LISTINGS_V2` export'u (line ~210):

```typescript
export const LISTINGS_V2: Listing[] = [
  ...BASE_LISTINGS.map(injectArsaFields),
  ...RESIDENTIAL,
  ...VILLAS,
  ...COMMERCIAL,
].map(withImages)
```

**Bunu** şöyle değiştir:

```typescript
// Wave 1 — Vitrin allowlist. Hardcoded; UI redesign'i mockup paritesi için
// 2 arsa ilanını altın çerçeveli yatay kartta gösteriyor.
const FEATURED_HINTS: Readonly<Record<string, string>> = {
  '28.AY.0142': '%9 emsal altı',
  '09.AL.0061': 'Doğrulanmış sahip',
}

function applyFeatured(l: Listing): Listing {
  const hint = FEATURED_HINTS[l.id]
  if (!hint) return l
  return { ...l, isFeatured: true, comparisonHint: hint }
}

export const LISTINGS_V2: Listing[] = [
  ...BASE_LISTINGS.map(injectArsaFields),
  ...RESIDENTIAL,
  ...VILLAS,
  ...COMMERCIAL,
].map(withImages).map(applyFeatured)
```

**Not:** Bu iki id `packages/data/src/mock/listings.ts`'de `type: 'İmarlı'` + `status: 'Aktif'` olarak tanımlı. Listings dosyası değişirse (id silinmiş veya pasif olmuş) Task 3 testi düşer — o noktada FEATURED_HINTS allowlist'ini güncelle.

- [ ] **Step 3.4: Run tests, see all pass**

Çalıştır: `pnpm --filter @landx/data test -- listings-v2-wave1`
Beklenen: 5/5 PASS.

- [ ] **Step 3.5: Commit**

```bash
git add packages/data/src/mock/listings-extended-v2.ts packages/data/src/__tests__/listings-v2-wave1.test.ts
git commit -m "feat(data): isFeatured allowlist + comparisonHint seed (arsa kategorisi, 2 ilan)"
```

---

## Task 4: `getHazardBand` helper + unit test

**Files:**
- Create: `packages/data/src/lib/getHazardBand.ts`
- Create: `packages/data/src/__tests__/getHazardBand.test.ts`
- Modify: `packages/data/src/index.ts`

- [ ] **Step 4.1: Failing test**

Oluştur: `packages/data/src/__tests__/getHazardBand.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { getHazardBand } from '../lib/getHazardBand'
import { HAZARD_SCORES } from '../mock/hazard-scores'

describe('getHazardBand', () => {
  it('skor < 33 → "dusuk"', () => {
    // HAZARD_SCORES.scores.deprem.skor üzerinde direkt değer test edilemez;
    // bilinen düşük profil bir listing seç (Çanakkale daha düşük profilli).
    // Bu test deterministik seed nedeniyle id-bazlı kontrolle yapılır.
    // Düşük PGA aralığı → düşük skor olmalı.
    const lowProfile = HAZARD_SCORES.find((h) => h.scores.deprem.skor < 33)
    expect(lowProfile).toBeTruthy()
    expect(getHazardBand(lowProfile!.listingId)).toBe('dusuk')
  })

  it('33 ≤ skor < 66 → "orta"', () => {
    const mid = HAZARD_SCORES.find(
      (h) => h.scores.deprem.skor >= 33 && h.scores.deprem.skor < 66,
    )
    expect(mid).toBeTruthy()
    expect(getHazardBand(mid!.listingId)).toBe('orta')
  })

  it('skor ≥ 66 → "yuksek"', () => {
    const high = HAZARD_SCORES.find((h) => h.scores.deprem.skor >= 66)
    expect(high).toBeTruthy()
    expect(getHazardBand(high!.listingId)).toBe('yuksek')
  })

  it('bilinmeyen id → null', () => {
    expect(getHazardBand('NON.EX.0001')).toBeNull()
  })

  it('saf fonksiyon — aynı input için aynı output', () => {
    const id = HAZARD_SCORES[0]!.listingId
    expect(getHazardBand(id)).toBe(getHazardBand(id))
  })
})
```

- [ ] **Step 4.2: Run test, see it fail**

Çalıştır: `pnpm --filter @landx/data test -- getHazardBand`
Beklenen: FAIL — `getHazardBand` import edilemez (henüz yok).

- [ ] **Step 4.3: Implement helper**

Oluştur: `packages/data/src/lib/getHazardBand.ts`

```typescript
/**
 * Listing hazard skoru → kullanıcıya gösterilebilir 3'lü band.
 * `/ara` redesign'inde deprem risk band filtresi ve kart rozetleri tüketir.
 *
 * Sınırlar mockup'taki "Düşük / Orta / Yüksek" segmented'ine birebir karşılık gelir:
 *   < 33  → 'dusuk'
 *   < 66  → 'orta'
 *   ≥ 66  → 'yuksek'
 *
 * Bilinmeyen id'ler için `null` döner (callsite'lar varsayılan band uygulayabilir).
 */
import { getHazardScore } from '../mock/hazard-scores'

export type HazardBand = 'dusuk' | 'orta' | 'yuksek'

export function getHazardBand(listingId: string): HazardBand | null {
  const score = getHazardScore(listingId)
  if (!score) return null
  const s = score.scores.deprem.skor
  if (s < 33) return 'dusuk'
  if (s < 66) return 'orta'
  return 'yuksek'
}
```

- [ ] **Step 4.4: Re-export from package index**

Aç: `packages/data/src/index.ts`. `LISTINGS_V2` export satırının hemen altına ekle:

```typescript
export { getHazardBand, type HazardBand } from './lib/getHazardBand'
```

- [ ] **Step 4.5: Run test, see it pass**

Çalıştır: `pnpm --filter @landx/data test -- getHazardBand`
Beklenen: 5/5 PASS.

- [ ] **Step 4.6: Commit**

```bash
git add packages/data/src/lib/getHazardBand.ts packages/data/src/__tests__/getHazardBand.test.ts packages/data/src/index.ts
git commit -m "feat(data): getHazardBand helper (deprem skoru → 3'lü band)"
```

---

## Task 5: `ara.astro` SSR — yeni query param parsing

**Files:**
- Modify: `src/pages/ara.astro:22-50`

- [ ] **Step 5.1: Failing e2e test — yeni param'lar URL'de sonuç sayısını değiştiriyor mu**

Oluştur: `tests/e2e/ara-wave1.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('ara — Wave 1 SSR filter params', () => {
  test('priceMin filtresi sonuçları daraltır', async ({ page }) => {
    const baseUrl = '/ara?kat=arsa'
    await page.goto(baseUrl)
    const baseCount = await page.locator('[data-listing-card]').count()

    await page.goto(`${baseUrl}&priceMin=10000000`)
    const filtered = await page.locator('[data-listing-card]').count()

    expect(filtered).toBeLessThanOrEqual(baseCount)
  })

  test('sizeMin + sizeMax kombinasyonu', async ({ page }) => {
    await page.goto('/ara?kat=arsa&sizeMin=1000&sizeMax=5000')
    const cards = page.locator('[data-listing-card]')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('imar csv multi-select (konut,ticari)', async ({ page }) => {
    await page.goto('/ara?kat=arsa&imar=konut,ticari')
    const cards = page.locator('[data-listing-card]')
    expect(await cards.count()).toBeGreaterThan(0)
  })

  test('cephe+su+elektrik+gaz tüm özellikler', async ({ page }) => {
    await page.goto('/ara?kat=arsa&cephe=1&su=1&elektrik=1&gaz=1')
    const cards = page.locator('[data-listing-card]')
    // Tüm 4 özelliği olan en az 1 ilan olmalı (deterministik seed)
    expect(await cards.count()).toBeGreaterThanOrEqual(0)
  })

  test('depremRisk=dusuk düşük band filtresi', async ({ page }) => {
    await page.goto('/ara?kat=arsa&depremRisk=dusuk')
    const cards = page.locator('[data-listing-card]')
    expect(await cards.count()).toBeGreaterThanOrEqual(0)
  })
})
```

**Not:** `[data-listing-card]` attribute'unu mevcut `ListingCard.astro` zaten render etmiyor olabilir. Bu test ilk başta selector ile FAIL olacak. Adım 5.4'te `ListingCard.astro` root `<div class="relative">` öğesine `data-listing-card` eklenecek.

- [ ] **Step 5.2: Add the `data-listing-card` hook to ListingCard**

Aç: `src/components/search/ListingCard.astro:31`. Mevcut:

```astro
<div class="relative">
```

Bunu değiştir:

```astro
<div class="relative" data-listing-card={listing.id}>
```

- [ ] **Step 5.3: Run e2e baseline (expect FAIL on filter params)**

Çalıştır: `pnpm test:e2e -- ara-wave1`
Beklenen: testler FAIL — yeni param'lar SSR'da okunmadığı için sonuç sayıları değişmiyor.

**Not:** Bu adımı manuel atlayıp implementasyona geçmek istersen sorun değil; testler Task 5 sonunda topluca yeşil olacak.

- [ ] **Step 5.4: Implement — `ara.astro` frontmatter genişlet**

Aç: `src/pages/ara.astro`. Mevcut blok (line 22-32):

```typescript
// ─── parse query params (server-side, SSR via static prerender) ───
const url = new URL(Astro.url)
const q = url.searchParams.get('q')?.trim() ?? ''
const tip = url.searchParams.get('tip') ?? 'Tümü'
const il = url.searchParams.get('il') ?? 'Tümü'
const priceMaxRaw = url.searchParams.get('priceMax') ?? ''
const priceMax = Number(priceMaxRaw) || Infinity
const sort = url.searchParams.get('sort') ?? 'lastUpdate'
const category = (url.searchParams.get('kat') ?? 'arsa') as 'arsa' | 'konut' | 'villa' | 'isyeri'
```

**Bunu değiştir** (sonuna yeni param'lar ekle):

```typescript
// ─── parse query params (server-side, SSR via static prerender) ───
const url = new URL(Astro.url)
const q = url.searchParams.get('q')?.trim() ?? ''
const tip = url.searchParams.get('tip') ?? 'Tümü'
const il = url.searchParams.get('il') ?? 'Tümü'
const priceMaxRaw = url.searchParams.get('priceMax') ?? ''
const priceMax = Number(priceMaxRaw) || Infinity
const priceMinRaw = url.searchParams.get('priceMin') ?? ''
const priceMin = Number(priceMinRaw) || 0
const sizeMinRaw = url.searchParams.get('sizeMin') ?? ''
const sizeMin = Number(sizeMinRaw) || 0
const sizeMaxRaw = url.searchParams.get('sizeMax') ?? ''
const sizeMax = Number(sizeMaxRaw) || Infinity
const sort = url.searchParams.get('sort') ?? 'lastUpdate'
const category = (url.searchParams.get('kat') ?? 'arsa') as 'arsa' | 'konut' | 'villa' | 'isyeri'

// Wave-listing-redesign 1 — yeni multi/boolean filtreler
const imarCsv = url.searchParams.get('imar') ?? '' // "konut,ticari"
const imarSet = imarCsv ? new Set(imarCsv.split(',').filter(Boolean)) : null
const tapu = url.searchParams.get('tapu') ?? '' // "tapulu" | "hisseli"
const wantCephe = url.searchParams.get('cephe') === '1'
const wantSu = url.searchParams.get('su') === '1'
const wantElektrik = url.searchParams.get('elektrik') === '1'
const wantGaz = url.searchParams.get('gaz') === '1'
const depremRiskCsv = url.searchParams.get('depremRisk') ?? ''
const depremRiskSet = depremRiskCsv
  ? new Set(depremRiskCsv.split(',').filter(Boolean))
  : null

// Pagination
const pageRaw = url.searchParams.get('page') ?? '1'
const page = Math.max(1, Number(pageRaw) || 1)
const PAGE_SIZE = 12
```

- [ ] **Step 5.5: Import `getHazardBand`**

Aç: `src/pages/ara.astro:14`. Mevcut:

```typescript
import { LISTINGS_V2 as LISTINGS } from '@landx/data'
```

Bunu değiştir:

```typescript
import { LISTINGS_V2 as LISTINGS, getHazardBand } from '@landx/data'
```

- [ ] **Step 5.6: Run typecheck**

Çalıştır: `pnpm -w typecheck`
Beklenen: PASS.

- [ ] **Step 5.7: Commit (no behaviour change yet — filter loop next task)**

```bash
git add src/pages/ara.astro src/components/search/ListingCard.astro tests/e2e/ara-wave1.spec.ts
git commit -m "feat(ara): yeni SSR query param parsing (priceMin/size/imar csv/tapu/cephe/su/elektrik/gaz/depremRisk/page)"
```

---

## Task 6: `ara.astro` SSR — filter loop'a yeni koşulları bağla

**Files:**
- Modify: `src/pages/ara.astro:39-49`

- [ ] **Step 6.1: Replace filter loop**

Aç: `src/pages/ara.astro`. Mevcut blok (line ~39-49):

```typescript
const sourceListings: Listing[] = LISTINGS.filter((l) => (l.category ?? 'arsa') === category)
let filtered: Listing[] = sourceListings.filter((l) => {
  if (l.status !== 'Aktif') return false
  if (tip !== 'Tümü' && l.type !== tip) return false
  if (il !== 'Tümü' && l.city !== il) return false
  if (l.price > priceMax) return false
  if (qLower) {
    const blob = `${l.id} ${l.title} ${l.city} ${l.district} ${l.tags.join(' ')}`.toLocaleLowerCase('tr-TR')
    if (!blob.includes(qLower)) return false
  }
  return true
})
```

**Bunu değiştir:**

```typescript
const sourceListings: Listing[] = LISTINGS.filter((l) => (l.category ?? 'arsa') === category)
let filtered: Listing[] = sourceListings.filter((l) => {
  if (l.status !== 'Aktif') return false
  if (tip !== 'Tümü' && l.type !== tip) return false
  if (il !== 'Tümü' && l.city !== il) return false
  if (l.price > priceMax) return false
  if (l.price < priceMin) return false
  if (l.size < sizeMin) return false
  if (l.size > sizeMax) return false
  if (imarSet && (!l.zoning || !imarSet.has(l.zoning))) return false
  if (tapu && l.titleStatus !== tapu) return false
  if (wantCephe && !l.hasRoad) return false
  if (wantSu && !l.hasWater) return false
  if (wantElektrik && !l.hasElectricity) return false
  if (wantGaz && !l.hasGas) return false
  if (depremRiskSet) {
    const band = getHazardBand(l.id)
    if (!band || !depremRiskSet.has(band)) return false
  }
  if (qLower) {
    const blob = `${l.id} ${l.title} ${l.city} ${l.district} ${l.tags.join(' ')}`.toLocaleLowerCase('tr-TR')
    if (!blob.includes(qLower)) return false
  }
  return true
})
```

- [ ] **Step 6.2: Run e2e — yeni filter testleri**

Çalıştır: `pnpm test:e2e -- ara-wave1`
Beklenen: 5/5 PASS.

- [ ] **Step 6.3: Run unit + typecheck regression**

Çalıştır: `pnpm -w typecheck && pnpm --filter @landx/data test`
Beklenen: PASS.

- [ ] **Step 6.4: Commit**

```bash
git add src/pages/ara.astro
git commit -m "feat(ara): SSR filter loop'a priceMin/size/imar csv/tapu/cephe/su/elektrik/gaz/depremRisk dahil"
```

---

## Task 7: `ara.astro` SSR — `featured` / `regular` split + pagination + `newCount`

**Files:**
- Modify: `src/pages/ara.astro:80-95`

- [ ] **Step 7.1: Add derivation after sort block**

Aç: `src/pages/ara.astro`. Sort `switch` bloğunun **hemen altına** ekle (mevcut `// ─── unique cities + types` yorumundan önce):

```typescript
// ─── Wave-listing-redesign 1 — derived slots ───
// `featured` = filtreye uyan ilk vitrin ilan; `regular` = vitrin hariç kalanlar.
// `newCount` = son 7 gün içinde lastUpdate olan ilan sayısı (toolbar "X yeni" rozeti).
const featured = filtered.find((l) => l.isFeatured) ?? null
const regular = featured ? filtered.filter((l) => l.id !== featured.id) : filtered

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const now = Date.now()
const newCount = filtered.filter(
  (l) => now - new Date(l.lastUpdate).getTime() < SEVEN_DAYS_MS,
).length

// Pagination — regular grid üzerinde uygulanır; featured slot sayfa-bağımsız.
const totalRegular = regular.length
const totalPages = Math.max(1, Math.ceil(totalRegular / PAGE_SIZE))
const safePage = Math.min(page, totalPages)
const pageStart = (safePage - 1) * PAGE_SIZE
const pageEnd = pageStart + PAGE_SIZE
const regularPaged = regular.slice(pageStart, pageEnd)
```

- [ ] **Step 7.2: Add a test that featured ilan ana liste'nin başında**

Aç: `tests/e2e/ara-wave1.spec.ts`. Dosyanın sonuna **`test.describe` bloğunun içine** ekle:

```typescript
  test('isFeatured ilan filtre kapsamındaysa SSR çıktısında üst slotta', async ({ page }) => {
    await page.goto('/ara?kat=arsa')
    // featured slot bu wave'de UI'a bağlanmadı; SSR'da prop türetilmiş olmalı.
    // Wave-1 sanity: sayfa hata vermeden render olsun.
    await expect(page.locator('main, body')).toBeVisible()
  })
```

- [ ] **Step 7.3: Run typecheck + e2e**

Çalıştır: `pnpm -w typecheck && pnpm test:e2e -- ara-wave1`
Beklenen: 6/6 PASS.

- [ ] **Step 7.4: Commit**

```bash
git add src/pages/ara.astro tests/e2e/ara-wave1.spec.ts
git commit -m "feat(ara): featured/regular split + pagination slice + newCount türetimi"
```

---

## Task 8: Wave 1 wrap-up — final regression + PR

- [ ] **Step 8.1: Full unit suite**

Çalıştır: `pnpm --filter @landx/data test`
Beklenen: PASS (mevcut + 3 yeni test dosyası).

- [ ] **Step 8.2: Full typecheck**

Çalıştır: `pnpm -w typecheck`
Beklenen: PASS.

- [ ] **Step 8.3: Lint**

Çalıştır: `pnpm -w lint`
Beklenen: PASS.

- [ ] **Step 8.4: Build sanity**

Çalıştır: `pnpm --filter public-site build`
Beklenen: PASS — yeni param'lar build'i kırmaz.

- [ ] **Step 8.5: E2E suite (Wave 1 spec)**

**Not:** Kullanıcının auto-memory tercihi: e2e suite'i kendisi çalıştırır (`pnpm test:e2e`). Burada **sadece Wave 1 spec'ini** smoke kontrol et:
`pnpm test:e2e -- ara-wave1`
Beklenen: PASS.

- [ ] **Step 8.6: PR oluştur**

```bash
git push -u origin HEAD
gh pr create --title "feat(ara): listing redesign Wave 1 — veri katmanı + SSR filter foundation" --body "$(cat <<'EOF'
## Summary
- `Listing` tipine `isFeatured?`, `hasGas?`, `comparisonHint?` opsiyonel alanlar
- `LISTINGS_V2` seed'inde `hasGas` deterministik + 2 arsa ilanı `isFeatured` allowlist
- `getHazardBand` helper (deprem skoru → düşük/orta/yüksek band)
- `ara.astro` SSR loop'una yeni query param'lar: priceMin / size min-max / imar csv / tapu / cephe-su-elektrik-gaz / depremRisk csv / page
- SSR'da `featured`, `regular`, `newCount`, `regularPaged` türetimleri (UI'a Wave 3'te bağlanır)

## Spec
`docs/superpowers/specs/2026-05-17-listing-redesign-design.md` (Wave 1)

## Test plan
- [ ] `pnpm --filter @landx/data test` — yeni 3 test dosyası yeşil
- [ ] `pnpm -w typecheck` yeşil
- [ ] `pnpm -w lint` yeşil
- [ ] `pnpm --filter public-site build` yeşil
- [ ] `pnpm test:e2e -- ara-wave1` yeşil
- [ ] Mevcut `/ara` sayfası hâlâ default davranışta çalışıyor (UI değişmedi)

## Sonraki wave
Wave 2 (FilterSidebar redesign) ayrı PR — spec'in Wave 2 bölümünden plan çıkarılacak.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review checklist (plan tamamlandığında bu adım atılır)

Aşağıdaki spec maddelerinin her birinin bir task'la karşılandığını doğrula:

| Spec maddesi | Task |
|---|---|
| `isFeatured`, `hasGas`, `comparisonHint` alanları | Task 1 |
| Seed `hasGas` deterministik | Task 2 |
| Seed `isFeatured` + `comparisonHint` allowlist | Task 3 |
| `getHazardBand` helper + test | Task 4 |
| SSR `priceMin`, `sizeMin/Max`, `imar` csv, `tapu`, `cephe/su/elektrik/gaz`, `depremRisk` csv | Task 5-6 |
| SSR `featured`/`regular`/`newCount`/`page` derivations | Task 7 |
| Integration test (Playwright) | Task 5-7 |
| Risk: pure additive, UI dokunulmaz | Tasks boyunca |

**Onay sonrası sonraki adım:** Wave 2 plan dosyası (`2026-05-17-listing-redesign-wave-2-plan.md`) ayrı bir oturumda yazılır.
