/**
 * Wave F19.0 — URL ↔ filter state helpers.
 *
 * Backs `routes/listings.tsx` + `routes/customers.tsx` filter sets so the
 * full UI state is reflected in `?status=...&type=...` query params. Two
 * win conditions:
 *   - Saved views can serialise filters into a single `?` URL (shareable)
 *   - Reloading a page restores the user's last filter combo without a
 *     custom localStorage layer
 *
 * No router lock-in inside the lib — the React-Router hook lives in the
 * `useFilterParams` factory. Pure helpers (`filtersToParams`,
 * `paramsToFilters`) work in tests + node + island contexts.
 */

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

export type FilterValue = string | string[]
export type FilterMap = Record<string, FilterValue>

/**
 * Serialise a filter map into URLSearchParams.
 *   - Empty strings + empty arrays drop out
 *   - Arrays serialise as repeated keys (`?tag=a&tag=b`) for natural sharing
 */
export function filtersToParams(filters: FilterMap): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v && v.length > 0) params.append(key, v)
      }
      continue
    }
    if (value && value.length > 0) params.set(key, value)
  }
  return params
}

/**
 * Deserialise URLSearchParams back into a FilterMap, using the provided
 * schema as both the key whitelist and the type witness (string vs string[]).
 */
export function paramsToFilters<F extends FilterMap>(
  params: URLSearchParams,
  schema: F,
): F {
  const out = { ...schema }
  for (const key of Object.keys(schema) as Array<keyof F>) {
    const schemaValue = schema[key]
    const all = params.getAll(String(key))
    if (Array.isArray(schemaValue)) {
      ;(out[key] as unknown as string[]) = all
    } else {
      ;(out[key] as unknown as string) = all[0] ?? ''
    }
  }
  return out
}

/**
 * Hook that binds a filter schema to the current URL query string.
 * Returns `[filters, setFilters]` where `setFilters` accepts a partial
 * update + merges it onto the live URL state.
 */
export function useFilterParams<F extends FilterMap>(
  schema: F,
): [F, (next: Partial<F>) => void] {
  const [params, setParams] = useSearchParams()

  const filters = useMemo(() => paramsToFilters(params, schema), [params, schema])

  const setFilters = useCallback(
    (next: Partial<F>) => {
      const merged: FilterMap = { ...filters }
      for (const [key, value] of Object.entries(next)) {
        if (value === undefined) continue
        merged[key] = value as FilterValue
      }
      const out = filtersToParams(merged)
      setParams(out, { replace: false })
    },
    [filters, setParams],
  )

  return [filters, setFilters]
}

/**
 * Shareable URL builder — appends the filter querystring to the current
 * pathname. Useful for the "Bağlantıyı kopyala" action in SavedViewsMenu.
 */
export function buildFilterUrl(pathname: string, filters: FilterMap): string {
  const params = filtersToParams(filters)
  const qs = params.toString()
  return qs.length > 0 ? `${pathname}?${qs}` : pathname
}
