// Vitest setup — runs before each test file.
//
// Node 25 ships an experimental Web Storage implementation that's enabled by
// default in many CLI contexts. When `--localstorage-file=` isn't provided
// (the common case), it installs a `localStorage` global whose methods are
// effectively undefined — and that stub shadows jsdom's real Storage. Result:
// `localStorage.setItem` / `.clear()` throw `TypeError: ... is not a function`
// inside the test environment.
//
// Fix: at setup time, install a plain in-memory Storage polyfill on both
// `globalThis` and `window`. This is deterministic, ignores any Node-level
// experimental flag drift, and matches how the browser localStorage behaves
// for the surface area our code (recent-views, favorites, KVKK consent, etc.)
// actually uses.

function makeStorage(): Storage {
  let store: Record<string, string> = {}
  const api: Storage = {
    get length() { return Object.keys(store).length },
    clear() { store = {} },
    getItem(key: string) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null },
    key(i: number) { return Object.keys(store)[i] ?? null },
    removeItem(key: string) { delete store[key] },
    setItem(key: string, value: string) { store[key] = String(value) },
  }
  return api
}

const localStoragePolyfill = makeStorage()
const sessionStoragePolyfill = makeStorage()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStoragePolyfill,
  writable: true,
  configurable: true,
})
Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStoragePolyfill,
  writable: true,
  configurable: true,
})

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStoragePolyfill,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStoragePolyfill,
    writable: true,
    configurable: true,
  })
}
