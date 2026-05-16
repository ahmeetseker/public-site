/**
 * Mock seed: AI değerlemeler — `LISTINGS` mock'undaki tüm 18 ilan için.
 *
 * `generateValuation()` deterministik olduğu için aynı listingId her zaman
 * aynı sonucu döner (test snapshot uyumlu). Hooks bu seed'i fallback olarak
 * kullanır; eksik valuation için `generateValuation()` runtime'da üretir.
 *
 * Tutar birimi: kuruş (`8_400_000_00` = 8.4M TL).
 */

import { LISTINGS } from './listings'
import type { AiValuation } from '../types/ai'
import { generateValuation } from '../lib/ai-helpers'

/** 18 ilan için pre-computed valuation. Order = LISTINGS order. */
export const AI_VALUATIONS: AiValuation[] = LISTINGS.map((l) => generateValuation(l.id))
