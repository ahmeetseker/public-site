/**
 * BASE_URL-aware path helpers.
 *
 * Astro injects `import.meta.env.BASE_URL` from `astro.config.mjs#base`
 * (driven by `BASE_PATH` env in `.github/workflows/deploy.yml`). It always
 * ends with `/` — e.g. `/public-site/` on GitHub Pages, `/` for the default
 * arsam.net root build. Vite inlines the constant at build time, so the
 * value is available in both Astro SSR and client React islands.
 *
 * Why this exists: `scripts/postbuild-rewrite-base.mjs` only patches `href`,
 * `src`, `action`, `formaction` attributes in built HTML — it does not
 * touch JS bundles. Any React island that builds URLs at runtime
 * (`window.location.href = '/blog'`, `onClick={() => router.push('/ara')}`,
 * or even `<a href={`/blog`}>` that re-renders after hydration) bypasses the
 * rewrite and 404s on GitHub Pages. Use {@link withBase} for every internal
 * runtime URL so the prefix survives.
 */

// Strip trailing slash so concatenation with a `/foo` path doesn't double up.
// '/public-site/' → '/public-site', '/' → ''.
export const BASE: string = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')

/**
 * Prepend the deploy base to an internal path.
 *
 * - `'/blog'` → `'/public-site/blog'` (or `/blog` when BASE is empty)
 * - `'/public-site/blog'` → unchanged (idempotent)
 * - `'https://…'` / `'//…'` / `'mailto:…'` → unchanged
 * - `''` → `'/'` or `BASE` so a callable result is always returned
 */
export function withBase(path: string): string {
  if (!path) return BASE || '/'
  if (/^[a-z]+:/i.test(path)) return path
  if (path.startsWith('//')) return path
  if (BASE && (path === BASE || path.startsWith(BASE + '/'))) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return BASE ? `${BASE}${normalized}` : normalized
}

/**
 * Remove the deploy base from a pathname so route-matching logic can compare
 * against `/ara`, `/blog`, etc. regardless of where the site is mounted.
 *
 * `'/public-site/blog/x'` → `'/blog/x'`. Returns the input unchanged if it
 * doesn't carry the base.
 */
export function stripBase(pathname: string): string {
  if (!BASE) return pathname
  if (pathname === BASE) return '/'
  if (pathname.startsWith(BASE + '/')) return pathname.slice(BASE.length)
  return pathname
}
