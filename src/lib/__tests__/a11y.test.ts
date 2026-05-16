import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { announce, getFocusableElements, prefersReducedMotion, trapFocus } from '@/lib/a11y'

function makeContainer(html: string): HTMLElement {
  const root = document.createElement('div')
  root.innerHTML = html
  document.body.appendChild(root)
  return root
}

describe('getFocusableElements', () => {
  let container: HTMLElement
  beforeEach(() => {
    container = makeContainer(
      `<a href="#one">one</a>
       <button>two</button>
       <input type="text" />
       <button disabled>disabled</button>
       <input type="hidden" value="x" />
       <span tabindex="0">manual</span>
       <span tabindex="-1">skip</span>`,
    )
  })
  afterEach(() => {
    container.remove()
  })

  it('returns visible focusables in DOM order', () => {
    const focusables = getFocusableElements(container)
    expect(focusables.map((el) => el.tagName.toLowerCase() + ':' + (el.textContent ?? ''))).toEqual([
      'a:one',
      'button:two',
      'input:',
      'span:manual',
    ])
  })

  it('skips disabled, hidden, and tabindex="-1"', () => {
    const focusables = getFocusableElements(container)
    const labels = focusables.map((el) => el.textContent)
    expect(labels).not.toContain('disabled')
    expect(labels).not.toContain('skip')
  })

  it('skips aria-hidden subtrees', () => {
    const hidden = makeContainer('<button aria-hidden="true">x</button>')
    expect(getFocusableElements(hidden)).toEqual([])
    hidden.remove()
  })
})

describe('trapFocus', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = makeContainer(
      `<button id="a">A</button><button id="b">B</button><button id="c">C</button>`,
    )
  })

  afterEach(() => {
    container.remove()
  })

  it('focuses the first focusable on install', () => {
    const teardown = trapFocus(container)
    expect(document.activeElement?.id).toBe('a')
    teardown()
  })

  it('honours initialFocus override', () => {
    const target = container.querySelector<HTMLElement>('#b')!
    const teardown = trapFocus(container, { initialFocus: target })
    expect(document.activeElement?.id).toBe('b')
    teardown()
  })

  it('returns no-op teardown when container is missing', () => {
    const teardown = trapFocus(null as unknown as HTMLElement)
    expect(typeof teardown).toBe('function')
    expect(() => teardown()).not.toThrow()
  })

  it('restoreFocus returns focus to the previously-active node', () => {
    const outside = document.createElement('button')
    outside.id = 'outside'
    document.body.appendChild(outside)
    outside.focus()
    expect(document.activeElement?.id).toBe('outside')

    const teardown = trapFocus(container, { restoreFocus: true })
    expect(document.activeElement?.id).toBe('a')
    teardown()
    expect(document.activeElement?.id).toBe('outside')

    outside.remove()
  })
})

describe('announce', () => {
  afterEach(() => {
    document.getElementById('a11y-live-polite')?.remove()
    document.getElementById('a11y-live-assertive')?.remove()
  })

  it('inserts a polite live region on first call', () => {
    announce('Kayıt tamamlandı')
    const region = document.getElementById('a11y-live-polite')
    expect(region).toBeTruthy()
    expect(region?.getAttribute('aria-live')).toBe('polite')
    expect(region?.getAttribute('role')).toBe('status')
  })

  it('separates polite + assertive into different nodes', () => {
    announce('soft', 'polite')
    announce('hard', 'assertive')
    expect(document.getElementById('a11y-live-polite')).toBeTruthy()
    expect(document.getElementById('a11y-live-assertive')).toBeTruthy()
    expect(document.getElementById('a11y-live-assertive')?.getAttribute('role')).toBe('alert')
  })

  it('reuses the same region across calls', () => {
    announce('one')
    announce('two')
    const regions = document.querySelectorAll('#a11y-live-polite')
    expect(regions.length).toBe(1)
  })

  it('ignores empty messages', () => {
    announce('')
    expect(document.getElementById('a11y-live-polite')).toBeNull()
  })
})

describe('prefersReducedMotion', () => {
  it('returns a boolean (env-dependent)', () => {
    expect(typeof prefersReducedMotion()).toBe('boolean')
  })
})
