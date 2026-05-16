/**
 * Mock seed — broker team members (Wave F34 / Faz 1B).
 *
 * 30 team member — `BROKER_PROFILES` ile aynı kayıt seti, ek olarak
 * davet/aktif/askıda statü bilgisi taşıyor.
 *
 * Status dağılımı:
 *   - active    ~%80 (24)
 *   - invited   ~%13 (4)
 *   - suspended ~%7 (2)
 *
 * Not: id şeması broker profil id'sine eşit (`BR-USR-001..030`) — kasıtlı,
 * upstream join'lerde aynı kişiyi temsil eder. Eğer tek bir liste yetmezse
 * `BR-TM-001..030` alias'ı eklenebilir; F34 Faz 2 hooks'ta gerek olursa.
 */

import type { BrokerTeamMember, BrokerTeamStatus } from '../types/broker'
import { BROKER_PROFILES } from './broker-profiles'

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function statusFor(idx: number): BrokerTeamStatus {
  if (idx === 5 || idx === 22) return 'suspended'
  if (idx === 11 || idx === 17 || idx === 24 || idx === 28) return 'invited'
  return 'active'
}

function buildTeam(): BrokerTeamMember[] {
  return BROKER_PROFILES.map((profile, idx) => {
    const status = statusFor(idx)
    return {
      id: profile.id, // aynı id — single source of truth
      brokerId: profile.officeId, // ofise referans
      name: profile.name,
      email: profile.email,
      subRole: profile.subRole,
      status,
      invitedAt: status === 'invited'
        ? isoDaysAgo(7 + idx)
        : status === 'active'
          ? isoDaysAgo(30 + idx * 6)
          : undefined,
      joinedAt: status === 'active' || status === 'suspended'
        ? profile.joinedAt
        : undefined,
    }
  })
}

export const BROKER_TEAM: readonly BrokerTeamMember[] = buildTeam()
