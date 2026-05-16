/**
 * landxpanel-deepening domain helper'ları (Wave F36 / Faz 1).
 *
 * Sadece pure fonksiyonlar — UI bağımlılığı yok. Hooks katmanı ve testler
 * doğrudan tüketir.
 *
 * Kapsam:
 *   - ECA condition evaluation + dry-run engine
 *   - TKGM parsel arama (il+ilçe+ada+parsel match) + error simülasyon
 */

import type {
  EcaAction,
  EcaCondition,
  EcaDryRunResult,
  EcaOperator,
  EcaRule,
  TkgmErrorCode,
  TkgmParcel,
  TkgmQueryResult,
} from '../types/landxpanel-deepening'
import { simulateTkgmLatency } from '../mock/tkgm-parcels'

// ─── ECA evaluation ──────────────────────────────────────────────────────────

/** Dot-path field lookup on an arbitrary payload. */
function getField(obj: unknown, path: string): unknown {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur && typeof cur === 'object') {
      cur = (cur as Record<string, unknown>)[p]
    } else {
      return undefined
    }
  }
  return cur
}

function describeValue(v: unknown): string {
  if (v === undefined) return 'undefined'
  if (v === null) return 'null'
  if (typeof v === 'string') return JSON.stringify(v)
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return `[${v.length} öğe]`
  return typeof v
}

export function evaluateCondition(
  cond: EcaCondition,
  payload: unknown,
): { result: boolean; reason: string } {
  const v = getField(payload, cond.field)
  const op: EcaOperator = cond.operator
  const lhs = describeValue(v)
  const rhs = describeValue(cond.value)

  switch (op) {
    case 'eq':
      return { result: v === cond.value, reason: `${lhs} === ${rhs}` }
    case 'ne':
      return { result: v !== cond.value, reason: `${lhs} !== ${rhs}` }
    case 'gt':
      if (typeof v === 'number' && typeof cond.value === 'number') {
        return { result: v > cond.value, reason: `${lhs} > ${rhs}` }
      }
      return { result: false, reason: `tip uyumsuz (${typeof v} vs ${typeof cond.value})` }
    case 'lt':
      if (typeof v === 'number' && typeof cond.value === 'number') {
        return { result: v < cond.value, reason: `${lhs} < ${rhs}` }
      }
      return { result: false, reason: `tip uyumsuz` }
    case 'gte':
      if (typeof v === 'number' && typeof cond.value === 'number') {
        return { result: v >= cond.value, reason: `${lhs} >= ${rhs}` }
      }
      return { result: false, reason: `tip uyumsuz` }
    case 'lte':
      if (typeof v === 'number' && typeof cond.value === 'number') {
        return { result: v <= cond.value, reason: `${lhs} <= ${rhs}` }
      }
      return { result: false, reason: `tip uyumsuz` }
    case 'in':
      if (Array.isArray(cond.value)) {
        const hit = (cond.value as unknown[]).includes(v)
        return { result: hit, reason: `${lhs} ∈ ${rhs}` }
      }
      return { result: false, reason: 'value array değil' }
    case 'nin':
      if (Array.isArray(cond.value)) {
        const hit = !(cond.value as unknown[]).includes(v)
        return { result: hit, reason: `${lhs} ∉ ${rhs}` }
      }
      return { result: false, reason: 'value array değil' }
    case 'contains': {
      if (typeof v === 'string' && typeof cond.value === 'string') {
        const hit = v.toLowerCase().includes(cond.value.toLowerCase())
        return { result: hit, reason: `${lhs} contains ${rhs}` }
      }
      if (Array.isArray(v)) {
        const hit = (v as unknown[]).includes(cond.value)
        return { result: hit, reason: `array ∋ ${rhs}` }
      }
      return { result: false, reason: 'tip uyumsuz' }
    }
    case 'between': {
      if (
        Array.isArray(cond.value) &&
        cond.value.length === 2 &&
        typeof v === 'number' &&
        typeof cond.value[0] === 'number' &&
        typeof cond.value[1] === 'number'
      ) {
        const [lo, hi] = cond.value
        return {
          result: v >= lo && v <= hi,
          reason: `${lhs} ∈ [${lo}, ${hi}]`,
        }
      }
      return { result: false, reason: 'value [number, number] değil' }
    }
    case 'regex': {
      if (typeof v === 'string' && typeof cond.value === 'string') {
        try {
          const re = new RegExp(cond.value)
          return { result: re.test(v), reason: `${lhs} matches /${cond.value}/` }
        } catch {
          return { result: false, reason: 'geçersiz regex' }
        }
      }
      return { result: false, reason: 'tip uyumsuz' }
    }
  }
}

/**
 * Tek bir kuralı payload'a karşı dry-run eder. UI'da "test et" butonunun
 * arkasındaki çekirdek mantık.
 */
export function dryRunRule(rule: EcaRule, payload: unknown): EcaDryRunResult {
  const log = rule.conditions.map((c) => {
    const ev = evaluateCondition(c, payload)
    return { conditionId: c.id, result: ev.result, reason: ev.reason }
  })
  const matched =
    rule.conditions.length === 0 || log.every((entry) => entry.result)
  return {
    matched,
    rule: matched ? rule : undefined,
    emittedActions: matched ? rule.actions.map((a) => ({ ...a })) : [],
    evaluationLog: log,
  }
}

/**
 * Çoklu kural değerlendirme — verilen event tipindeki tüm enabled kuralları
 * sırayla dener, eşleşen kuralların aksiyonlarını topla.
 */
export function evaluateEventAgainstRules(
  event: EcaRule['event'],
  payload: unknown,
  rules: ReadonlyArray<EcaRule>,
): {
  matchedRules: EcaRule[]
  emittedActions: EcaAction[]
} {
  const matchedRules: EcaRule[] = []
  const emittedActions: EcaAction[] = []
  for (const r of rules) {
    if (!r.enabled) continue
    if (r.event !== event) continue
    const res = dryRunRule(r, payload)
    if (res.matched) {
      matchedRules.push(r)
      emittedActions.push(...res.emittedActions)
    }
  }
  return { matchedRules, emittedActions }
}

// ─── TKGM lookup ─────────────────────────────────────────────────────────────

export interface TkgmQueryInput {
  il: string
  ilce: string
  ada: string
  parsel: string
}

/** Case-insensitive trim eşitliği. */
function eqi(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('tr-TR') ===
    b.trim().toLocaleLowerCase('tr-TR')
}

/**
 * Pure parsel arama — store/latency içermez (test ve UI hooks paylaşır).
 * Validation:
 *   - ada/parsel boş veya non-numeric → E002_INVALID_PARSEL
 *   - Match yoksa → E001_NOT_FOUND
 *   - Match varsa → OK + parcel
 *
 * `latencyMs` çağıran tarafça eklenir (hook gerçek async simülasyon yapar).
 */
export function lookupTkgmParcel(
  input: TkgmQueryInput,
  parcels: ReadonlyArray<TkgmParcel>,
  latencyMs: number,
): TkgmQueryResult {
  const queriedAt = new Date().toISOString()

  if (!input.ada.trim() || !input.parsel.trim()) {
    return { errorCode: 'E002_INVALID_PARSEL', latencyMs, queriedAt }
  }
  if (!/^\d+$/.test(input.ada.trim()) || !/^\d+$/.test(input.parsel.trim())) {
    return { errorCode: 'E002_INVALID_PARSEL', latencyMs, queriedAt }
  }

  const hit = parcels.find(
    (p) =>
      eqi(p.il, input.il) &&
      eqi(p.ilce, input.ilce) &&
      p.ada === input.ada.trim() &&
      p.parsel === input.parsel.trim(),
  )

  if (!hit) {
    return { errorCode: 'E001_NOT_FOUND', latencyMs, queriedAt }
  }

  return {
    errorCode: 'OK',
    parcel: { ...hit },
    latencyMs,
    queriedAt,
  }
}

/**
 * Random timeout simülasyonu — gerçek TKGM SOAP servisi nadiren timeout
 * verir, hook'larda kullanılır. ~%3 olasılıkla E003.
 */
export function maybeSimulateTimeout(): TkgmErrorCode | null {
  return Math.random() < 0.03 ? 'E003_TIMEOUT' : null
}

export { simulateTkgmLatency }
