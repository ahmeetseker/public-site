import type { AiAnswer } from '@landx/ui'
import type { Locale } from '@/i18n'

const LOCATIONS_TR = ['çanakkale', 'bodrum', 'ayvalık', 'datça', 'antalya', 'i̇stanbul', 'istanbul', 'i̇zmir', 'izmir']
const LOCATIONS_EN = ['canakkale', 'bodrum', 'ayvalik', 'datca', 'antalya', 'istanbul', 'izmir']
const TYPES_TR = ['villa', 'zeytinlik', 'imarlı', 'tarla', 'arsa', 'deniz manzaralı']
const TYPES_EN = ['villa', 'olive grove', 'zoned', 'farmland', 'land', 'sea view']

function pick(q: string, list: string[]): string | null {
  const lower = q.toLowerCase()
  for (const k of list) {
    if (lower.includes(k)) return k
  }
  return null
}

const MOCK_CHART_TR = {
  title: 'Bölgesel ilan dağılımı',
  data: [
    { label: 'Pzt', value: 18 },
    { label: 'Sal', value: 24 },
    { label: 'Çar', value: 31, suffix: '↗' },
    { label: 'Per', value: 28 },
    { label: 'Cum', value: 42, suffix: '↗' },
  ],
}

const MOCK_CHART_EN = {
  title: 'Regional listings (this week)',
  data: [
    { label: 'Mon', value: 18 },
    { label: 'Tue', value: 24 },
    { label: 'Wed', value: 31, suffix: '↗' },
    { label: 'Thu', value: 28 },
    { label: 'Fri', value: 42, suffix: '↗' },
  ],
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function buildAnswer(query: string, locale: Locale): AiAnswer {
  const isEn = locale === 'en'
  const location = pick(query, isEn ? LOCATIONS_EN : LOCATIONS_TR)
  const type = pick(query, isEn ? TYPES_EN : TYPES_TR)

  if (location && type) {
    const text = isEn
      ? `Found 12 listings matching ${capitalize(location)} - ${type}. Top 3 listings had a notable view spike this week.`
      : `${capitalize(location)} bölgesinde ${type} aramasına 12 sonuç bulundu. Bu hafta en çok görüntülenen 3 ilan öne çıkıyor.`
    return { text, chart: isEn ? MOCK_CHART_EN : MOCK_CHART_TR }
  }

  if (location) {
    const text = isEn
      ? `${capitalize(location)} region: 47 active listings, average view rate up 18% this week.`
      : `${capitalize(location)} bölgesinde 47 aktif ilan var; bu hafta görüntülenme oranı %18 artmış.`
    return { text, chart: isEn ? MOCK_CHART_EN : MOCK_CHART_TR }
  }

  const text = isEn
    ? `No exact match for "${query}". Try a city name or property type.`
    : `"${query}" için doğrudan sonuç bulunamadı. Şehir adı veya ilan türü deneyebilirsin.`
  return { text }
}
