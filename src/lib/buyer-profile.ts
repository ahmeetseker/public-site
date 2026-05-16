// Buyer profile localStorage adapter (Wave F5.A).
//
// A minimal `arsam.buyer-profile.v1` slice — name, email, phone, avatar — for
// the read/update flow exposed by the bilingual ProfileForm island. The richer
// preferences (contactPref, regions, completion percent) live in
// `account-store.ts` under `arsam.profile.v1`. The two adapters coexist because
// the simpler shape lets E2E + i18n parity tests assert a stable contract
// without coupling to the larger preferences object.

const KEY = 'arsam.buyer-profile.v1'

export interface BuyerProfile {
  name: string
  email: string
  phone: string
  /** base64 URI or external URL (optional, future use) */
  avatar?: string
  updatedAt: number
}

function isProfile(v: unknown): v is BuyerProfile {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.name === 'string' &&
    typeof o.email === 'string' &&
    typeof o.phone === 'string' &&
    typeof o.updatedAt === 'number'
  )
}

export function getBuyerProfile(): BuyerProfile | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isProfile(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function updateBuyerProfile(
  partial: Partial<Omit<BuyerProfile, 'updatedAt'>>,
): BuyerProfile | null {
  if (typeof localStorage === 'undefined') return null
  const current =
    getBuyerProfile() ?? { name: '', email: '', phone: '', updatedAt: 0 }
  const next: BuyerProfile = {
    ...current,
    ...partial,
    updatedAt: Date.now(),
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
    return next
  } catch {
    return null
  }
}

export function clearBuyerProfile(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export const BUYER_PROFILE_KEY = KEY
