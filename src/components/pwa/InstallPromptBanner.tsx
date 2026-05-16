/**
 * InstallPromptBanner — Wave F30.A
 *
 * Sticky bottom banner that surfaces the deferred `beforeinstallprompt` event
 * via the shared `useInstallPrompt` hook from `@landx/ui/lib`. Replaces the
 * Faz 9.18 floating card with a full-width banner so the call-to-action is
 * visible on mobile without obscuring filter chips / map controls in the
 * bottom-right corner.
 *
 * - Dismiss persists for 7 days in localStorage (`arsam-pwa-install-dismissed`).
 * - Hidden on iOS Safari (no programmatic install).
 * - Token-only colors (`bg-card`, `border-border`, `text-foreground`,
 *   `text-muted-foreground`) — no `bg-white` / `#000`.
 */

import { useEffect, useState, type ReactElement } from 'react'
import { useInstallPrompt } from '@landx/ui/lib'

const DISMISS_KEY = 'arsam-pwa-install-dismissed'
const DISMISS_DAYS = 7

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  // iPad on iPadOS 13+ identifies as Mac with touch support.
  const isiPadOS =
    /Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document
  return /iPhone|iPad|iPod/.test(ua) || isiPadOS
}

function isDismissed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const ts = Number.parseInt(raw, 10)
    if (Number.isNaN(ts)) return false
    const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24)
    return ageDays < DISMISS_DAYS
  } catch {
    return false
  }
}

export default function InstallPromptBanner(): ReactElement | null {
  const { canInstall, prompt, dismiss } = useInstallPrompt()
  // SSR-safe default: hidden=false. Real value resolved post-mount to avoid
  // touching browser APIs (localStorage / navigator) during server render —
  // Node 22+ exposes a partial `localStorage` global that throws on getItem.
  const [hidden, setHidden] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setHidden(isDismissed() || isIOS())
    const onInstalled = () => setHidden(true)
    window.addEventListener('appinstalled', onInstalled)
    return () => window.removeEventListener('appinstalled', onInstalled)
  }, [])

  if (hidden || !canInstall) return null

  const handleInstall = async () => {
    await prompt()
    setHidden(true)
  }

  const handleLater = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // localStorage unavailable (private mode, etc.) — silent.
    }
    dismiss()
    setHidden(true)
  }

  return (
    <div
      role="dialog"
      aria-label="Uygulamayı yükle"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md text-card-foreground shadow-lg"
    >
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <p className="text-sm font-medium">arsam.net'i ana ekranına ekle</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Daha hızlı erişim ve çevrimdışı tarama için uygulamayı yükleyebilirsin.
          </p>
        </div>
        <div className="flex flex-none gap-2 sm:justify-end">
          <button
            type="button"
            onClick={handleLater}
            className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Sonra
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Yükle
          </button>
        </div>
      </div>
    </div>
  )
}
