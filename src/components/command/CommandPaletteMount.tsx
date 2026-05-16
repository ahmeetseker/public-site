import { lazy, Suspense, useEffect, useState } from 'react'

/**
 * Wave F24.C — public-site command palette mount.
 *
 * Listens for `cmd+/` / `ctrl+/` globally and lazy-loads `CommandPalette`
 * the first time the user opens the palette. The actual palette code (and
 * the LISTINGS/OFFICES/REGIONS dataset it pulls in via @landx/data) lives
 * in a separate Vite chunk so the initial public-site bundle stays lean.
 */
const CommandPalette = lazy(() =>
  import('./CommandPalette').then((m) => ({ default: m.CommandPalette })),
)

export default function CommandPaletteMount() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // cmd+/ on macOS, ctrl+/ on Windows/Linux.
      // We DON'T listen for cmd+K — that's reserved for browser-built-in
      // search bars on some platforms.
      const isToggle = (e.metaKey || e.ctrlKey) && e.key === '/'
      if (isToggle) {
        // Don't let the browser swallow it (some print-shortcut variants).
        e.preventDefault()
        setOpen((v) => !v)
        return
      }
      // Esc closes — the palette ALSO has its own onKeyDown Esc handler,
      // but that only runs when an inner element has focus. This guards
      // the case where focus has been pulled outside the dialog (e.g. a
      // browser autofill stole it).
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <Suspense fallback={null}>
      {open && <CommandPalette open={open} onClose={() => setOpen(false)} />}
    </Suspense>
  )
}
