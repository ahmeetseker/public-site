// sw-register.client.ts — Faz 9.18 (Wave 12 / Agent-A56)
//
// Registers /sw.js on `requestIdleCallback` (with `setTimeout` fallback) so SW
// registration never blocks first paint. Guarded for SSR + unsupported envs.

function onIdle(cb: () => void): void {
  if (typeof window === 'undefined') return;
  // `requestIdleCallback` is in lib.dom but not all targets ship it — runtime
  // guard, no type augmentation needed (would clash with the built-in lib).
  const ric = (window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
  }).requestIdleCallback;
  if (typeof ric === 'function') {
    ric(cb, { timeout: 2000 });
  } else {
    window.setTimeout(cb, 1200);
  }
}

function register(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  // Dev server (Astro :5180) — SW kayıt deneyimi geliştiriciyi şaşırtmasın.
  // Vite/Astro static dev mode'da public/ klasörünü serve etse de SW
  // strategy'leri build artifact'leri varsayar. Sadece production'da kaydet.
  const isProd = location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';
  if (!isProd) return;

  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
    // Silent — SW registration failure must never crash the page.
  });
}

onIdle(register);

export {};
