/**
 * Shared API client for atolye-admin + super-admin (Faz 12.6 / 15).
 *
 * Why this lives in @landx/data: query hooks here invoke the client and need
 * a single place to read env / inject auth headers without each app reaching
 * into per-app singletons.
 *
 * Apps configure once on boot via `configureApi({ baseUrl, getToken })`.
 * Hooks call `apiGet`, `apiPost`, etc.
 *
 * Mock fallback: if `configureApi` is never called (or baseUrl is empty),
 * `apiGet` throws `ApiNotConfiguredError`. Hooks that wrap their queries
 * with `apiOrMock(apiCall, mockCall)` get graceful degradation in tests
 * that don't boot the backend.
 */

export interface ApiEnvelope<T> {
  data: T
  meta?: { total?: number; nextCursor?: string | null; pageSize?: number }
}

export class ApiNotConfiguredError extends Error {
  constructor() {
    super('@landx/data api client not configured; call configureApi() on boot or use the mock path')
    this.name = 'ApiNotConfiguredError'
  }
}

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

interface ApiConfig {
  baseUrl: string
  getToken: () => string | null
}

const config: ApiConfig = {
  baseUrl: '',
  getToken: () => null,
}

export function configureApi(opts: { baseUrl: string; getToken?: () => string | null }): void {
  config.baseUrl = opts.baseUrl.replace(/\/$/, '')
  if (opts.getToken) config.getToken = opts.getToken
}

export function isApiConfigured(): boolean {
  return config.baseUrl.length > 0
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = new URL(`${config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }
  // For relative base (e.g. '/api/v1'), URL becomes absolute via window.location; strip origin
  if (config.baseUrl.startsWith('/')) {
    return `${url.pathname}${url.search}`
  }
  return url.toString()
}

function buildHeaders(extra?: HeadersInit): Headers {
  const h = new Headers(extra)
  h.set('Accept', 'application/json')
  if (!h.has('Content-Type')) h.set('Content-Type', 'application/json')
  const token = config.getToken()
  if (token) h.set('Authorization', `Bearer ${token}`)
  return h
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T
  const text = await res.text()
  const body = text ? (JSON.parse(text) as unknown) : null
  if (!res.ok) {
    // 401 → fan out via DOM event so apps (admin/super-admin AuthProvider —
    // Wave 15 / A73 + A74) can drop in-memory tokens + redirect to /login
    // without coupling the client to a particular auth state container.
    // Guarded for non-browser contexts (Node-ish test env, SSR).
    if (res.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    const err = (body as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error
    throw new ApiError(res.status, err?.code ?? 'UNKNOWN', err?.message ?? res.statusText, err?.details)
  }
  return body as T
}

export async function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  if (!isApiConfigured()) throw new ApiNotConfiguredError()
  const res = await fetch(buildUrl(path, params), { method: 'GET', headers: buildHeaders() })
  return handleResponse<T>(res)
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  if (!isApiConfigured()) throw new ApiNotConfiguredError()
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: buildHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return handleResponse<T>(res)
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  if (!isApiConfigured()) throw new ApiNotConfiguredError()
  const res = await fetch(buildUrl(path), {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res)
}

export async function apiDelete(path: string): Promise<void> {
  if (!isApiConfigured()) throw new ApiNotConfiguredError()
  const res = await fetch(buildUrl(path), { method: 'DELETE', headers: buildHeaders() })
  await handleResponse<void>(res)
}

/**
 * Transport-compatible wrapper around the four method helpers above. Shipped
 * for `@landx/api-client` (Wave-17 / A81) so the typed SDK can plug into the
 * same configureApi-driven baseUrl + auth header pipeline without redefining
 * the network layer.
 *
 * Behavior is identical to the underlying functions — this is a shape-only
 * adapter. Resource methods on the SDK call e.g. `t.get(path, params)` and
 * the routing here just delegates.
 */
export const httpTransport = {
  get: <T>(path: string, params?: Record<string, unknown>): Promise<T> => apiGet<T>(path, params),
  post: <T>(path: string, body?: unknown): Promise<T> => apiPost<T>(path, body),
  patch: <T>(path: string, body: unknown): Promise<T> => apiPatch<T>(path, body),
  del: (path: string): Promise<void> => apiDelete(path),
}

/**
 * Try the API call first; if the client is unconfigured OR the network fails,
 * fall back to a mock implementation. Hooks use this to stay green in tests
 * that don't boot the backend.
 */
export async function apiOrMock<T>(apiCall: () => Promise<T>, mockCall: () => Promise<T>): Promise<T> {
  if (!isApiConfigured()) return mockCall()
  try {
    return await apiCall()
  } catch (err) {
    if (err instanceof ApiNotConfiguredError) return mockCall()
    throw err
  }
}
