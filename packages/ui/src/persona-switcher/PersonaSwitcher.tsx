/**
 * `PersonaSwitcher` — cross-app demo persona dropdown.
 *
 * Wave F35 / Faz 1C — apps/{public-site,broker-admin,super-admin} header'larında
 * (sub-path import: `@landx/ui/persona-switcher`) görünür. `VITE_DEMO_MODE !==
 * 'true'` iken `null` döner — production build tree-shake için safe.
 *
 * UX:
 *   - Trigger: küçük neon dot + persona label + chevron.
 *   - "Demo Mode" rozeti md+ breakpoint'te trigger'ın solunda.
 *   - Ctrl/Cmd+Shift+P shortcut açar/kapatır.
 *   - Dış tıklama kapatır (ref-bazlı listener).
 *   - Persona seç → localStorage'a yazar + hedef URL'e yönlendirir.
 *
 * NOT: top barrel'a export EKLENMEZ — Astro public-site'da SSR'de leaflet/
 * react-leaflet barrel trap'ı yaşanmaması için sadece `./persona-switcher`
 * sub-path üzerinden tüketilir.
 */

import { ChevronDown, Sparkles } from '@landx/icons'
import { useEffect, useRef, useState, type ReactElement } from 'react'
import { cn } from '../lib/cn'
import { findPersona, PERSONAS, type PersonaId } from './personas'
import { usePersonaKeyboardShortcut } from './keyboard'
import { usePersonaSwitcher } from './usePersonaSwitcher'

export interface PersonaSwitcherProps {
  className?: string
  /** "Demo Mode" rozetini gizle (compact header'larda kullanılabilir). */
  hideDemoBadge?: boolean
}

export function PersonaSwitcher({ className, hideDemoBadge = false }: PersonaSwitcherProps): ReactElement | null {
  const { persona, setPersona, isDemoMode } = usePersonaSwitcher()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  usePersonaKeyboardShortcut(() => setOpen((v) => !v))

  // Dış tıklama → kapat.
  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // ESC → kapat.
  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  if (!isDemoMode) return null

  const current = findPersona(persona)

  const handleSelect = (id: PersonaId): void => {
    setOpen(false)
    setPersona(id)
  }

  return (
    <div ref={ref} className={cn('relative inline-flex items-center', className)}>
      {!hideDemoBadge && (
        <span className="mr-2 hidden items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300 md:inline-flex">
          <Sparkles className="h-3 w-3" />
          Demo Mode
        </span>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Persona değiştir (Ctrl+Shift+P)"
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-foreground/5"
      >
        <span className={cn('h-2 w-2 rounded-full', current.color)} aria-hidden="true" />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Demo persona seç"
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-border bg-card shadow-2xl backdrop-blur-xl"
        >
          <div className="border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Demo Persona
          </div>
          <ul className="p-1">
            {PERSONAS.map((p) => {
              const isActive = persona === p.id
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleSelect(p.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-foreground/5',
                      isActive && 'bg-foreground/[0.04]',
                    )}
                  >
                    <span className={cn('mt-1.5 h-2 w-2 flex-none rounded-full', p.color)} aria-hidden="true" />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{p.label}</span>
                      <span className="text-[11px] leading-snug text-muted-foreground">{p.description}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="border-t border-border px-4 py-2 font-mono text-[10px] text-muted-foreground">
            Ctrl+Shift+P ile aç/kapat
          </div>
        </div>
      )}
    </div>
  )
}
