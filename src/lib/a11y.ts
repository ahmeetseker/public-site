/**
 * Wave F23.0 — Shared a11y helpers for public-site.
 *
 * `trapFocus` consolidates the inline focus-trap copies that lived in
 * MobileFilterSheet + LightboxModal. `announce` provides a single
 * polite/assertive live region so toasts + form-submit confirmations +
 * skeleton-state updates can flow to screen readers without each
 * component owning its own `aria-live` node.
 *
 * SSR-safe: every helper short-circuits when `window`/`document` are
 * missing (Astro static prerender, vitest jsdom variants without DOM).
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  if (!container) return []
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => {
      if (el.hasAttribute('aria-hidden')) return false
      // jsdom doesn't compute layout, so `offsetParent` is always null. Only
      // gate on it when we have a real browser layout engine available.
      if (typeof window !== 'undefined' && 'getComputedStyle' in window) {
        const style = window.getComputedStyle(el)
        if (style.display === 'none' || style.visibility === 'hidden') return false
      }
      return true
    },
  )
}

export interface TrapFocusOptions {
  initialFocus?: HTMLElement | null
  /** When true, restores focus to the element that was active before the trap was installed. */
  restoreFocus?: boolean
}

/**
 * Install a focus trap on a container. Returns an `unmount()` function that
 * removes the listener + (optionally) restores the previously-active node.
 */
export function trapFocus(
  container: HTMLElement,
  options: TrapFocusOptions = {},
): () => void {
  if (typeof document === 'undefined' || !container) {
    return () => {}
  }
  const restoreFocus = options.restoreFocus ?? true
  const previouslyActive =
    restoreFocus && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

  const initial = options.initialFocus ?? getFocusableElements(container)[0] ?? container
  if (initial && typeof initial.focus === 'function') {
    initial.focus()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return
    const focusables = getFocusableElements(container)
    if (focusables.length === 0) {
      event.preventDefault()
      return
    }
    const first = focusables[0]!
    const last = focusables[focusables.length - 1]!
    const active = document.activeElement as HTMLElement | null

    if (event.shiftKey) {
      if (active === first || !container.contains(active)) {
        event.preventDefault()
        last.focus()
      }
    } else if (active === last || !container.contains(active)) {
      event.preventDefault()
      first.focus()
    }
  }

  container.addEventListener('keydown', onKeyDown)
  return () => {
    container.removeEventListener('keydown', onKeyDown)
    if (previouslyActive && typeof previouslyActive.focus === 'function') {
      previouslyActive.focus()
    }
  }
}

const LIVE_REGION_ID_POLITE = 'a11y-live-polite'
const LIVE_REGION_ID_ASSERTIVE = 'a11y-live-assertive'

function ensureLiveRegion(priority: 'polite' | 'assertive'): HTMLElement | null {
  if (typeof document === 'undefined') return null
  const id = priority === 'assertive' ? LIVE_REGION_ID_ASSERTIVE : LIVE_REGION_ID_POLITE
  let region = document.getElementById(id)
  if (region) return region
  region = document.createElement('div')
  region.id = id
  region.setAttribute('role', priority === 'assertive' ? 'alert' : 'status')
  region.setAttribute('aria-live', priority)
  region.setAttribute('aria-atomic', 'true')
  region.style.cssText =
    'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;'
  document.body.appendChild(region)
  return region
}

/**
 * Announce a string to the singleton live region. Used by toasts,
 * skeleton load completions, save-confirmations, etc.
 *
 * `polite` (default) queues after the user's current interaction; only
 * use `assertive` for truly time-critical messages (form-blocking errors).
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (!message) return
  const region = ensureLiveRegion(priority)
  if (!region) return
  // Reset to force the screen reader to re-announce identical strings.
  region.textContent = ''
  window.setTimeout(() => {
    region.textContent = message
  }, 16)
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}
