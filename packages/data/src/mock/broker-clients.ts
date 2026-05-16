/**
 * Mock seed — broker clients (Wave F34 / Faz 1B).
 *
 * 800 client. Hepsi KVKK consent vermiş (mock — gerçek senaryoda bir kısmı
 * pending olur), her birinde en az 1 log girdisi: `consent_given`.
 *
 * Tip dağılımı:
 *   - individual ~%82
 *   - corporate  ~%18
 */

import type {
  BrokerClient,
  BrokerClientKvkkAction,
  BrokerClientType,
} from '../types/broker'
import { BROKER_PROFILES } from './broker-profiles'

const FIRSTS = [
  'Ali', 'Ayşe', 'Burak', 'Cansu', 'Deniz', 'Ela', 'Furkan', 'Gizem',
  'Hakan', 'İrem', 'Kaan', 'Leyla', 'Mert', 'Nehir', 'Ozan', 'Pelin',
  'Sinan', 'Tuğçe', 'Umut', 'Yasin', 'Zeynep', 'Ahmet', 'Esra', 'Murat',
]
const LASTS = [
  'Aksoy', 'Bulut', 'Coşkun', 'Demir', 'Eren', 'Fidan', 'Güneş', 'İnan',
  'Kaya', 'Levent', 'Murat', 'Naz', 'Özbek', 'Polat', 'Sezer', 'Tekin',
  'Uçar', 'Vatan', 'Yiğit', 'Zorlu',
]
const COMPANY_PREFIX = [
  'Ege Yapı', 'Kıyı İnşaat', 'Mavi Liman', 'Akropol Holding', 'Marmara Gayrimenkul',
  'Anadolu Yatırım', 'Sahil Geliştirme', 'Vadi Mimarlık', 'Tepe İnşaat', 'Berkay Yatırım',
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

function buildClients(): BrokerClient[] {
  const out: BrokerClient[] = []
  const profileIds = BROKER_PROFILES.map((p) => p.id)
  for (let i = 1; i <= 800; i++) {
    const id = `BR-CL-${pad(i, 4)}`
    const h = hash(id)
    const brokerId = profileIds[i % profileIds.length]!
    const isCorporate = (h % 100) < 18
    const type: BrokerClientType = isCorporate ? 'corporate' : 'individual'

    const first = FIRSTS[h % FIRSTS.length]!
    const last = LASTS[(h >> 3) % LASTS.length]!
    const companyName = COMPANY_PREFIX[(h >> 5) % COMPANY_PREFIX.length]!
    const name = isCorporate ? `${companyName} A.Ş.` : `${first} ${last}`
    const slug = (isCorporate ? companyName : `${first}.${last}`)
      .toLowerCase().replace(/\s+/g, '.').replace(/[çğıöşü]/g, (c) =>
        ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c] ?? c)

    const createdDays = 30 + (h % 720) // 30-750 gün önce
    const dealCount = h % 9 // 0-8

    // KVKK log: hepsi consent_given, %14'ünde data_accessed da var.
    const logs: { action: BrokerClientKvkkAction; at: string; actor: string }[] = [
      { action: 'consent_given', at: isoDaysAgo(createdDays), actor: brokerId },
    ]
    if ((h >> 7) % 100 < 14) {
      logs.push({
        action: 'data_accessed',
        at: isoDaysAgo(Math.max(1, createdDays - 30)),
        actor: brokerId,
      })
    }

    out.push({
      id,
      brokerId,
      name,
      email: `${slug}@${isCorporate ? 'kurumsal.demo' : 'mail.demo'}`,
      phone: `+90 5${30 + (h % 60)} ${100 + ((h >> 2) % 900)} ${1000 + ((h >> 4) % 9000)}`,
      taxId: isCorporate ? String(1000000000 + (h % 8999999999)) : undefined,
      type,
      kvkkConsent: true,
      kvkkLogs: logs,
      dealCount,
      createdAt: isoDaysAgo(createdDays),
    })
  }
  return out
}

export const BROKER_CLIENTS: readonly BrokerClient[] = buildClients()
