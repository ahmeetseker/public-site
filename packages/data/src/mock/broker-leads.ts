/**
 * Mock seed — broker leads (Wave F34 / Faz 1B).
 *
 * 1200 lead, brokerlere round-robin dağıtılır. Status ve source kombinasyonları
 * dengelenmiş, AI scoring deterministik (lead id'sinden hash).
 *
 * AI temperature dağılımı (kabaca):
 *   - hot   (75-100) ~%18
 *   - warm  (45-74)  ~%34
 *   - cold  (0-44)   ~%48
 *
 * Status dağılımı:
 *   - new       ~%28
 *   - contacted ~%22
 *   - visit     ~%18
 *   - offer     ~%14
 *   - closed    ~%10
 *   - lost      ~%8
 */

import type {
  BrokerLead,
  BrokerLeadIntent,
  BrokerLeadSource,
  BrokerLeadStatus,
  BrokerLeadTemperature,
} from '../types/broker'
import { BROKER_PROFILES } from './broker-profiles'

const STATUSES: ReadonlyArray<BrokerLeadStatus> = [
  'new', 'new', 'new', 'contacted', 'contacted', 'visit', 'visit', 'offer',
  'closed', 'lost',
]
const SOURCES: ReadonlyArray<BrokerLeadSource> = ['website', 'phone', 'referral', 'social']
const INTENTS: ReadonlyArray<BrokerLeadIntent> = ['buy', 'sell', 'rent']

const REGIONS = [
  'Çeşme', 'Alaçatı', 'Ovacık', 'Dalyan', 'Ayvalık', 'Cunda', 'Sarımsaklı',
  'Datça', 'Knidos', 'Mesudiye', 'Bodrum', 'Yalıkavak', 'Türkbükü',
] as const

const CLIENT_FIRST = [
  'Ali', 'Ayşe', 'Burak', 'Cansu', 'Deniz', 'Ela', 'Furkan', 'Gizem',
  'Hakan', 'İrem', 'Jale', 'Kaan', 'Leyla', 'Mert', 'Nehir', 'Ozan',
  'Pelin', 'Rüya', 'Sinan', 'Tuğçe', 'Umut', 'Vural', 'Yasin', 'Zara',
]
const CLIENT_LAST = [
  'Aksoy', 'Bulut', 'Coşkun', 'Demir', 'Eren', 'Fidan', 'Güneş', 'Hızır',
  'İnan', 'Kaya', 'Levent', 'Murat', 'Naz', 'Özbek', 'Polat', 'Rıza',
  'Sezer', 'Tekin', 'Uçar', 'Vatan', 'Yiğit', 'Zorlu',
]

const NOTES_TEMPLATES = [
  'Yatırım amaçlı, denize yakın parsel arıyor.',
  'İmarlı arsa, peşin ödeme yapabilir.',
  'Tatil için yaz evi düşünüyor.',
  'Kurumsal yatırım, 5+ dönüm aralığında.',
  '6 ay içinde alım yapmak istiyor.',
  'Banka kredisi onaylı, hızlı kapanış.',
  'İlk kez arsa alıyor, danışmanlık istedi.',
  'Mevcut arsayı satıp daha büyük parsele geçecek.',
  'Yola cephe ve elektrik şart.',
  'Alaçatı/Ovacık öncelikli.',
]

function pad(n: number, w: number): string {
  return String(n).padStart(w, '0')
}

function hash(s: string): number {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 1_000_003
  return Math.abs(h)
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function temperatureFromScore(score: number): BrokerLeadTemperature {
  if (score >= 75) return 'hot'
  if (score >= 45) return 'warm'
  return 'cold'
}

function buildLeads(): BrokerLead[] {
  const out: BrokerLead[] = []
  const profileIds = BROKER_PROFILES.map((p) => p.id)
  for (let i = 1; i <= 1200; i++) {
    const id = `BR-LD-${pad(i, 4)}`
    const h = hash(id)
    const brokerId = profileIds[i % profileIds.length]!
    const status = STATUSES[h % STATUSES.length]!
    const source = SOURCES[(h >> 3) % SOURCES.length]!
    const intent = INTENTS[(h >> 5) % INTENTS.length]!
    const aiScore = h % 101
    const first = CLIENT_FIRST[(h >> 7) % CLIENT_FIRST.length]!
    const last = CLIENT_LAST[(h >> 9) % CLIENT_LAST.length]!
    const minBudget = (1 + ((h >> 11) % 8)) * 1_000_000 // 1-8M TL
    const maxBudget = minBudget + ((h >> 13) % 5 + 1) * 1_000_000
    const region1 = REGIONS[(h >> 15) % REGIONS.length]!
    const region2 = REGIONS[(h >> 17) % REGIONS.length]!
    const note = NOTES_TEMPLATES[(h >> 19) % NOTES_TEMPLATES.length]!

    const lastActivityDays = h % 90
    const createdDays = lastActivityDays + ((h >> 21) % 60)

    out.push({
      id,
      brokerId,
      clientName: `${first} ${last}`,
      clientPhone: `+90 5${30 + (h % 60)} ${100 + ((h >> 2) % 900)} ${1000 + ((h >> 4) % 9000)}`,
      intent,
      status,
      aiScore,
      aiTemperature: temperatureFromScore(aiScore),
      source,
      budget: intent === 'sell' ? undefined : { min: minBudget, max: maxBudget, currency: 'TRY' },
      preferredRegions: region1 === region2 ? [region1] : [region1, region2],
      notes: note,
      lastActivity: isoDaysAgo(lastActivityDays),
      createdAt: isoDaysAgo(createdDays),
    })
  }
  return out
}

export const BROKER_LEADS: readonly BrokerLead[] = buildLeads()
