/**
 * Ctrl+Shift+P shortcut → persona dropdown açma/kapatma.
 *
 * Windows/Linux'ta Ctrl+Shift+P, macOS'ta Cmd+Shift+P de eşleşir
 * (`metaKey || ctrlKey`). Browser'ın varsayılan shortcut'larıyla çakışmamak
 * için `key.toLowerCase() === 'p'` kontrolü ek güvenlik.
 */

import { useEffect } from 'react'

export function usePersonaKeyboardShortcut(onTrigger: () => void): void {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (event: KeyboardEvent): void => {
      const mod = event.ctrlKey || event.metaKey
      if (mod && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault()
        onTrigger()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onTrigger])
}
