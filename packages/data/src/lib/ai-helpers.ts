/**
 * AI helpers — Wave F33 / Faz 1A.
 *
 * Mock-only deterministic generators. Backend yokken hooks bunları çağırır:
 *   - `generateMockResponse(prompt)` → kural-bazlı TR cevap
 *   - `generateValuation(listingId)` → LISTINGS mock'tan random walk valuation
 *   - `delay(ms)` → Promise<void>
 *
 * Kullanım örneği (hooks):
 *   const v = generateValuation('28.AY.0142')
 *   const reply = generateMockResponse('Çeşme arsa fiyatları nasıl?')
 */

import { LISTINGS } from '../mock/listings'
import type { AiValuation, AiValuationFactor } from '../types/ai'

/** Promise<void> after `ms` milliseconds. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Mock chat response ──────────────────────────────────────────────────────

interface ResponseTemplate {
  /** Lowercased keyword'ler — herhangi biri prompt'ta geçerse template eşleşir. */
  triggers: string[]
  /** Yanıt — `${q}` placeholder'ı orijinal prompt ile değişir. */
  reply: string
}

const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  {
    triggers: ['merhaba', 'selam', 'günaydın', 'iyi akşamlar'],
    reply:
      'Merhaba! Sana arsa arama, fiyat analizi, tapu kontrolü ve bölge raporları konusunda yardımcı olabilirim. Nereden başlayalım?',
  },
  {
    triggers: ['çeşme', 'cesme'],
    reply:
      'Çeşme bölgesinde son 6 ayda metrekare birim fiyatı ortalama %18 yükselmiş. İmarlı parseller 12.000-22.000 TL/m² aralığında. Belirli bir mahalle (Alaçatı, Ovacık, Dalyan) için detay ister misin?',
  },
  {
    triggers: ['ayvalık', 'ayvalik', 'cunda'],
    reply:
      'Ayvalık ve özellikle Cunda tarafında deniz manzaralı parseller hızlı satılıyor. Ortalama m² fiyatı 6.500-9.500 TL aralığında, son 12 ayda %22 yükseldi. Bütçeni paylaşır mısın?',
  },
  {
    triggers: ['datça', 'datca'],
    reply:
      'Datça yarımadasında villa imarlı parseller 5.500-8.000 TL/m². Bölgenin imar planı yenilendiği için arz sınırlı. Ekim 2026 itibarıyla aktif 47 ilan var.',
  },
  {
    triggers: ['fiyat', 'değer', 'kaç para', 'ne kadar', 'eder mi'],
    reply:
      'Fiyat değerlendirmesi için ilan numarasını ya da bölgeyi paylaşır mısın? Karşılaştırılabilir 3-5 ilan üzerinden tahmini değer aralığı (±%12 güven) hesaplayabilirim.',
  },
  {
    triggers: ['tapu', 'ipotek', 'haciz', 'şerh', 'serh'],
    reply:
      'Tapu OCR aracını kullanabiliriz. Tapu fotoğrafını ya da PDF\'ini yükle; ada/parsel, alan, cins, imar durumu ve ipotek/haciz/şerh risklerini 30 saniyede çıkarırım. OCR güven skoru da raporda olacak.',
  },
  {
    triggers: ['imar', 'plan', 'ruhsat'],
    reply:
      'İmar planı sorgulaması için ada/parsel numaranı paylaşır mısın? Belediyenin son onaylı planına göre kullanım sınıfı (konut/ticari/turizm), yapılaşma koşulları (E, h_max, TAKS/KAKS) ve plan değişikliği geçmişini özetleyebilirim.',
  },
  {
    triggers: ['kredi', 'banka', 'finansman', 'taksit'],
    reply:
      'Arsa kredisi için 5 büyük bankada güncel oran %3.49-3.89 (24 ay). Peşinat tipik olarak %50 — kentsel imarlı parseller için bazı bankalar %40\'a düşürüyor. Hangi bankayı denemek istersin?',
  },
  {
    triggers: ['yatırım', 'getiri', 'kira'],
    reply:
      'Arsa yatırımında likidite düşüktür ama rant yüksek olabilir. Son 24 ayda Ege kıyı bölgelerinde reel getiri %32-58 arası. Kira getirisi yok — değer artışına oynuyorsun. Hedef vade ve risk profilini paylaşır mısın?',
  },
  {
    triggers: ['arıyorum', 'aramak', 'bul', 'göster'],
    reply:
      'Sana 12 aktif ilan arasından filtreleme yapabilirim. Kriterler: bölge, m² aralığı, bütçe, imar durumu (konut/ticari/tarım/sanayi/turizm). Hangisinden başlayalım?',
  },
  {
    triggers: ['risk', 'tehlike', 'sorunlu'],
    reply:
      'En sık karşılaşılan riskler: (1) İpotek/haciz tapuda görünür, (2) İmar planı değişikliği, (3) Hisseli tapu (ortak mülkiyet karmaşası), (4) Yola cephesi olmayan parsel. Hangisini detaylandırayım?',
  },
  {
    triggers: ['sat', 'ilan ver', 'satılık'],
    reply:
      'İlan vermek için 4 adım: (1) Konum + parsel bilgisi, (2) Fotoğraflar (en az 5), (3) Tapu yükle (OCR otomatik doldurur), (4) Fiyat — sana AI değerleme aralığı önerebilirim. Başlamaya hazır mısın?',
  },
]

const FALLBACK_RESPONSE =
  'Bu konuda yardımcı olmaya çalışayım. Daha fazla bilgi verirsen (bölge, ilan numarası, bütçe gibi) daha kesin yanıtlar üretebilirim.'

/** Lowercase'leyip trigger eşleştirir — hiç eşleşme yoksa fallback döner. */
export function generateMockResponse(prompt: string): string {
  const lower = prompt.toLowerCase()
  for (const template of RESPONSE_TEMPLATES) {
    if (template.triggers.some((t) => lower.includes(t))) {
      return template.reply
    }
  }
  return FALLBACK_RESPONSE
}

// ─── Mock valuation generator ────────────────────────────────────────────────

const DEFAULT_FACTORS: ReadonlyArray<Omit<AiValuationFactor, 'impact'> & { range: [number, number] }> = [
  {
    name: 'Bölge talep trendi',
    description: 'Son 6 ayda bölgedeki arama hacmi ve görüntüleme oranı.',
    range: [0.08, 0.24],
  },
  {
    name: 'İmar durumu',
    description: 'Konut/ticari imar parsele kıyasla tarım vs. sınıflandırma etkisi.',
    range: [0.12, 0.34],
  },
  {
    name: 'Yola cephe',
    description: 'Asfalt yola cephesi olan parsellerin pazarlık avantajı.',
    range: [-0.06, 0.14],
  },
  {
    name: 'Altyapı (su/elektrik)',
    description: 'Bağlantısı hazır parsellerin maliyet avantajı.',
    range: [0.04, 0.18],
  },
  {
    name: 'Sahile/merkeze mesafe',
    description: 'Yürüme/araçla erişilebilirlik faktörü.',
    range: [-0.08, 0.22],
  },
  {
    name: 'Pazarlık geçmişi',
    description: 'Benzer ilanlardaki ortalama indirim oranı.',
    range: [-0.12, -0.02],
  },
  {
    name: 'Mevsimsellik',
    description: 'Yaz aylarında kıyı bölgelerinde fiyat yükselişi.',
    range: [0.02, 0.12],
  },
]

/** Deterministik string-hash (mock seed sabit kalsın diye). */
function hashSeed(input: string): number {
  let h = 0
  for (const c of input) h = (h * 31 + c.charCodeAt(0)) % 1_000_003
  return Math.abs(h)
}

/** [0, 1) deterministik rastgele — `key` ve `salt` kombinasyonu. */
function deterministicRandom(key: string, salt: string): number {
  const h = hashSeed(`${key}::${salt}`)
  return (h % 10_000) / 10_000
}

/**
 * `LISTINGS` mock'tan deterministik valuation üret.
 * Aynı listingId → aynı sonuç (test snapshot uyumlu).
 */
export function generateValuation(listingId: string): AiValuation {
  const listing = LISTINGS.find((l) => l.id === listingId)
  // Düşme durumunda safe fallback — UI hiç crash etmesin.
  const basePrice = listing?.price ?? 5_000_000
  // listings.price TL cinsinden — kuruşa çevir.
  const baseKurus = basePrice * 100

  // ±%6-12 aralığında salınım
  const swing = 0.06 + deterministicRandom(listingId, 'swing') * 0.06
  const lo = Math.round(baseKurus * (1 - swing))
  const hi = Math.round(baseKurus * (1 + swing))
  const estimate = Math.round((lo + hi) / 2)

  // Confidence 0.62-0.92 arası
  const confidence = 0.62 + deterministicRandom(listingId, 'conf') * 0.30

  // 4-6 faktör seç
  const factorCount = 4 + (hashSeed(listingId) % 3)
  const factors: AiValuationFactor[] = DEFAULT_FACTORS.slice(0, factorCount).map((f, i) => {
    const t = deterministicRandom(listingId, `f${i}`)
    const impact = f.range[0] + (f.range[1] - f.range[0]) * t
    return {
      name: f.name,
      description: f.description,
      impact: Number(impact.toFixed(3)),
    }
  })

  // 3-4 comparable seç (kendisi hariç)
  const others = LISTINGS.filter((l) => l.id !== listingId)
  const compCount = 3 + (hashSeed(`${listingId}-c`) % 2)
  const comparables = others.slice(0, compCount).map((l, i) => ({
    listingId: l.id,
    similarity: Number((0.62 + deterministicRandom(listingId, `s${i}`) * 0.32).toFixed(2)),
    price: l.price * 100,
  }))

  return {
    listingId,
    estimate,
    range: [lo, hi],
    confidence: Number(confidence.toFixed(2)),
    factors,
    comparables,
    generatedAt: new Date().toISOString(),
  }
}
