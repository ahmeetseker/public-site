/**
 * Wave F30.0 — PWA install prompt + connectivity helpers.
 *
 * `useInstallPrompt` captures the `beforeinstallprompt` event and exposes
 * a `prompt()` trigger plus `dismiss()`. Browsers gate the event so it
 * fires at most once per session; the hook is no-op on iOS Safari.
 *
 * `useOnline` tracks navigator.onLine + the online/offline events for
 * connectivity-loss banners and offline-fallback routing.
 */

import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface InstallPromptResult {
  canInstall: boolean
  prompt: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
  dismiss: () => void
}

export function useInstallPrompt(): InstallPromptResult {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler as EventListener)
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener)
  }, [])

  const prompt = useCallback(async () => {
    if (!deferred) return 'unavailable' as const
    try {
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      setDeferred(null)
      return outcome
    } catch {
      setDeferred(null)
      return 'unavailable' as const
    }
  }, [deferred])

  const dismiss = useCallback(() => setDeferred(null), [])

  return { canInstall: deferred !== null, prompt, dismiss }
}

export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') return true
    return navigator.onLine
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return online
}
