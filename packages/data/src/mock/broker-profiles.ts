/**
 * Mock seed — broker profiles (Wave F34 / Faz 1B).
 *
 * 30 profil:
 *   - 6 broker-admin (3 ofis × 2 kişi)
 *   - 24 broker-agent (her ofise 8)
 *
 * Ofisler (3): Çeşme · Ayvalık · Datça (Ege kıyı bölgeleri).
 *
 * ID şeması:
 *   - Profile : `BR-USR-001..030`
 *   - Office  : `BR-OFC-001..003`
 *
 * NOT: aynı 30 kayıt `BROKER_TEAM` mock'unda (broker-team.ts) status alanı
 * eklenerek yeniden kullanılır — single source of truth burası.
 */

import type { BrokerProfile, BrokerSubRole } from '../types/broker'

interface OfficeMeta {
  id: string
  name: string
}

const OFFICES: readonly OfficeMeta[] = [
  { id: 'BR-OFC-001', name: 'LandX Çeşme' },
  { id: 'BR-OFC-002', name: 'LandX Ayvalık' },
  { id: 'BR-OFC-003', name: 'LandX Datça' },
] as const

export const BROKER_OFFICES = OFFICES

const FIRST_NAMES = [
  'Mehmet', 'Ayşe', 'Mustafa', 'Fatma', 'Ahmet', 'Zeynep', 'Ali', 'Elif',
  'Hüseyin', 'Hatice', 'Hasan', 'Emine', 'İbrahim', 'Merve', 'Ömer', 'Selin',
  'Yusuf', 'Esra', 'Murat', 'Sevgi', 'Burak', 'Pınar', 'Cem', 'Gül',
  'Onur', 'Deniz', 'Kerem', 'Aslı', 'Tolga', 'Beyza',
]

const LAST_NAMES = [
  'Aydın', 'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım',
  'Öztürk', 'Aslan', 'Doğan', 'Kılıç', 'Arslan', 'Polat', 'Özdemir', 'Türk',
  'Acar', 'Erdoğan', 'Korkmaz', 'Çetin', 'Aksoy', 'Bulut', 'Tekin', 'Güneş',
  'Sezer', 'Kaplan', 'Karaca', 'Aktaş', 'Topal', 'Avcı',
]

function pad(n: number, w: number): string {
  return String(n).padStart(w, '0')
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function makePhone(seed: number): string {
  const a = 530 + (seed % 50)
  const b = 100 + (seed * 13) % 900
  const c = 1000 + (seed * 71) % 9000
  return `+90 ${a} ${b} ${c}`
}

function buildProfiles(): BrokerProfile[] {
  const out: BrokerProfile[] = []
  // 2 broker-admin per office (6 total)
  for (let oIdx = 0; oIdx < OFFICES.length; oIdx++) {
    for (let aIdx = 0; aIdx < 2; aIdx++) {
      const num = oIdx * 2 + aIdx + 1
      const id = `BR-USR-${pad(num, 3)}`
      const first = FIRST_NAMES[(oIdx * 7 + aIdx * 3) % FIRST_NAMES.length]
      const last = LAST_NAMES[(oIdx * 11 + aIdx * 5) % LAST_NAMES.length]
      out.push({
        id,
        subRole: 'broker-admin',
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@landx.demo`
          .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
          .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u'),
        phone: makePhone(num),
        officeId: OFFICES[oIdx]!.id,
        officeName: OFFICES[oIdx]!.name,
        joinedAt: isoDaysAgo(800 + num * 5),
      })
    }
  }
  // 8 broker-agent per office (24 total)
  for (let oIdx = 0; oIdx < OFFICES.length; oIdx++) {
    for (let aIdx = 0; aIdx < 8; aIdx++) {
      const num = 6 + oIdx * 8 + aIdx + 1 // 7..30
      const id = `BR-USR-${pad(num, 3)}`
      const first = FIRST_NAMES[(num * 3) % FIRST_NAMES.length]
      const last = LAST_NAMES[(num * 7 + 2) % LAST_NAMES.length]
      // Vary sub-role: 1 of every 8 is plain 'broker', rest 'broker-agent'.
      const subRole: BrokerSubRole = aIdx === 0 ? 'broker' : 'broker-agent'
      out.push({
        id,
        subRole,
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${num}@landx.demo`
          .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
          .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u'),
        phone: makePhone(num),
        officeId: OFFICES[oIdx]!.id,
        officeName: OFFICES[oIdx]!.name,
        joinedAt: isoDaysAgo(60 + num * 7),
      })
    }
  }
  return out
}

export const BROKER_PROFILES: readonly BrokerProfile[] = buildProfiles()
