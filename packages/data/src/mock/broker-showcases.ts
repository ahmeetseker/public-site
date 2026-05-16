/**
 * Mock seed — broker showcases (Wave F34 / Faz 1B).
 *
 * 6 ofis showcase — broker-admin profillerle eşleşir (BR-USR-001..006).
 * Her ofis için bio, sertifika, sosyal link, deneyim/rating bilgileri.
 *
 * `slug` formatı: `landx-<sehir>-<sayac>` (örn. `landx-cesme-1`).
 * Public-site `/ofis/[slug]` route'unda render edilir.
 */

import type { BrokerShowcase } from '../types/broker'
import { BROKER_PROFILES, BROKER_OFFICES } from './broker-profiles'

interface ShowcaseTemplate {
  bio: string
  experience: number
  totalDeals: number
  rating: number
  reviewCount: number
}

const TEMPLATES: ReadonlyArray<ShowcaseTemplate> = [
  {
    bio: 'Çeşme yarımadasında 12 yıllık deneyim. İmarlı parsel ve villa arsa odaklı.',
    experience: 12, totalDeals: 287, rating: 4.7, reviewCount: 156,
  },
  {
    bio: 'Alaçatı ve Ovacık bölgelerinde uzman. Yatırım danışmanlığı + tapu süreç yönetimi.',
    experience: 9, totalDeals: 198, rating: 4.6, reviewCount: 124,
  },
  {
    bio: 'Ayvalık ve Cunda Adası deniz manzaralı parsel uzmanı. 8 yıl, 200+ portföy.',
    experience: 8, totalDeals: 201, rating: 4.8, reviewCount: 178,
  },
  {
    bio: 'Sarımsaklı ve çevresi tatil bölgesi gayrimenkul danışmanlığı. KVKK + tapu güvencesi.',
    experience: 6, totalDeals: 142, rating: 4.5, reviewCount: 89,
  },
  {
    bio: 'Datça yarımadasında sınırlı imar bilgisiyle 10 yıllık birikim. Villa & turizm parselleri.',
    experience: 10, totalDeals: 174, rating: 4.9, reviewCount: 143,
  },
  {
    bio: 'Knidos & Mesudiye bölgesi özel parsel uzmanı. Hisseli tapu konusunda deneyimli.',
    experience: 7, totalDeals: 119, rating: 4.4, reviewCount: 67,
  },
]

function buildShowcases(): BrokerShowcase[] {
  const out: BrokerShowcase[] = []
  // Sadece ilk 6 broker-admin'i eşle (BR-USR-001..006).
  const admins = BROKER_PROFILES.filter((p) => p.subRole === 'broker-admin').slice(0, 6)

  admins.forEach((admin, idx) => {
    const tpl = TEMPLATES[idx]!
    const office = BROKER_OFFICES.find((o) => o.id === admin.officeId)!
    const cityKey = office.name.toLowerCase().split(' ').slice(-1)[0]!
      .replace(/[çğıöşü]/g, (c) =>
        ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c] ?? c)
    // 2 admin per office: counter starts at 1 for first, 2 for second.
    const counter = (idx % 2) + 1

    out.push({
      brokerId: admin.id,
      slug: `landx-${cityKey}-${counter}`,
      coverUrl: `/mock/showcase/cover-${idx + 1}.jpg`,
      logoUrl: `/mock/showcase/logo-${idx + 1}.svg`,
      bio: tpl.bio,
      certificates: [
        { name: 'Yetkili Emlak Müşaviri (TURYAP)', issuer: 'TURYAP', year: 2026 - tpl.experience + 2 },
        { name: 'Tapu ve Kadastro Eğitimi', issuer: 'TKGM', year: 2026 - tpl.experience + 4 },
        { name: 'KVKK Uyum Sertifikası', issuer: 'KVKK Akademi', year: 2024 },
      ],
      socials: [
        { platform: 'website', url: `https://landx.com.tr/ofis/landx-${cityKey}-${counter}` },
        { platform: 'instagram', url: `https://instagram.com/landx.${cityKey}` },
        { platform: 'linkedin', url: `https://linkedin.com/company/landx-${cityKey}` },
      ],
      yearsOfExperience: tpl.experience,
      totalDeals: tpl.totalDeals,
      rating: tpl.rating,
      reviewCount: tpl.reviewCount,
    })
  })

  return out
}

export const BROKER_SHOWCASES: readonly BrokerShowcase[] = buildShowcases()
