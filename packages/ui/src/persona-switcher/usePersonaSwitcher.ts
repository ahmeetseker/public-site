/**
 * `usePersonaSwitcher` — localStorage destekli persona state hook.
 *
 * - SSR-safe: `typeof window === 'undefined'` guard'lı.
 * - Cross-tab sync: `storage` event ile farklı tab'lardaki değişikliği yakalar.
 * - `setPersona(id)`: localStorage yazar + aynı host ya da farklı app'e yönlendirir.
 *   Cross-app navigation için `window.location.href` kullanır (SPA router'a değil).
 * - `isDemoMode`: build-time `VITE_DEMO_MODE === 'true'` flag'i — false ise
 *   PersonaSwitcher tree-shake edilebilir (`if (!isDemoMode) return null`).
 */

import { useCallback, useEffect, useState } from 'react'
import { findPersona, type PersonaId, resolvePersonaUrl } from './personas'

export const PERSONA_STORAGE_KEY = 'landx:demo:persona'

function readDemoFlag(): boolean {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {}
  return env.VITE_DEMO_MODE === 'true'
}

function readInitialPersona(): PersonaId {
  if (typeof window === 'undefined') return 'alici'
  try {
    const stored = window.localStorage.getItem(PERSONA_STORAGE_KEY)
    if (stored === 'alici' || stored === 'satici' || stored === 'emlakci' || stored === 'yonetici' || stored === 'agent') {
      return stored
    }
  } catch {
    // Private mode / quota — sessizce fallback.
  }
  return 'alici'
}

export interface UsePersonaSwitcherResult {
  persona: PersonaId
  /** Persona'yı localStorage'a yazar ve hedef URL'e yönlendirir. */
  setPersona: (id: PersonaId) => void
  /** `VITE_DEMO_MODE === 'true'` olduğunda `true`. */
  isDemoMode: boolean
}

export function usePersonaSwitcher(): UsePersonaSwitcherResult {
  const [persona, setPersonaState] = useState<PersonaId>(readInitialPersona)
  const isDemoMode = readDemoFlag()

  // Cross-tab sync — başka tab'daki değişikliği yakala.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (event: StorageEvent) => {
      if (event.key !== PERSONA_STORAGE_KEY || event.newValue == null) return
      const next = event.newValue as PersonaId
      if (next === 'alici' || next === 'satici' || next === 'emlakci' || next === 'yonetici' || next === 'agent') {
        setPersonaState(next)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const setPersona = useCallback((id: PersonaId): void => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(PERSONA_STORAGE_KEY, id)
    } catch {
      // Quota / private mode — yine de in-memory state'i güncelle ve yönlendir.
    }
    setPersonaState(id)
    const target = resolvePersonaUrl(findPersona(id))
    // Cross-app navigation — SPA router DEĞİL.
    window.location.href = target
  }, [])

  return { persona, setPersona, isDemoMode }
}
