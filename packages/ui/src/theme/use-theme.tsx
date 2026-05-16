import { useCallback, useEffect, useState } from 'react'
import { THEME_STORAGE_KEY } from './init-script'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

function readStored(): Theme {
  // SSR-safe: some non-browser environments (Astro SSR, edge runtimes) expose
  // a `localStorage` global whose methods are not functions. Wrap defensively.
  try {
    if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return 'system'
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
  } catch {
    return 'system'
  }
}

function systemPrefersDark(): boolean {
  try {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

function applyToDocument(theme: Theme, resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  document.documentElement.dataset.theme = theme
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readStored())
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    readStored() === 'dark' || (readStored() === 'system' && systemPrefersDark()) ? 'dark' : 'light',
  )

  useEffect(() => {
    const resolved: ResolvedTheme = theme === 'dark' || (theme === 'system' && systemPrefersDark()) ? 'dark' : 'light'
    setResolvedTheme(resolved)
    applyToDocument(theme, resolved)
  }, [theme])

  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const resolved: ResolvedTheme = e.matches ? 'dark' : 'light'
      setResolvedTheme(resolved)
      applyToDocument('system', resolved)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      }
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('theme:changed', { detail: { theme: next } }))
    }
  }, [])

  return { theme, setTheme, resolvedTheme }
}
