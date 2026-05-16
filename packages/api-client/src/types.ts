/**
 * Shared transport contracts for @landx/api-client.
 *
 * The package never owns the network layer — instead each call goes through
 * an injected `Transport`. `@landx/data` ships `httpTransport` (a thin object
 * wrapping `apiGet/Post/Patch/Delete`); tests pass a stub.
 *
 * Keeping the transport boundary narrow means:
 *   - SDK has zero runtime fetch dep
 *   - tests can assert "which path was hit with which body" without monkey-
 *     patching globalThis.fetch
 *   - any future swap (fetch → undici → MSW handler) only touches the host app
 */

export interface Transport {
  get<T>(path: string, params?: Record<string, unknown>): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
  patch<T>(path: string, body: unknown): Promise<T>
  del(path: string): Promise<void>
}

/**
 * Standard list envelope from the OpenAPI contract. Mirrors the inline shape
 * generated under `paths['/x']['get']['responses']['200']['content']
 * ['application/json']`; promoted here so resources can return it without
 * each caller chasing the nested path.
 */
export interface ListResponse<T> {
  data: T[]
  meta: ListMeta
}

export interface ListMeta {
  total: number
  nextCursor?: string | null
  pageSize?: number
}

/** Single-item envelope (used by `get`/`create`/`patch`). */
export interface ItemResponse<T> {
  data: T
}
