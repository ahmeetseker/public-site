/**
 * Module-load singleton of `@landx/api-client` wired to the same
 * configureApi-driven `httpTransport` the rest of `@landx/data` already
 * shares. Hooks import `{ landxApi }` and call e.g.
 * `landxApi.listings.list(params)` — no per-hook factory boilerplate.
 *
 * Wave-17 / A81 — Faz 12.12.
 */
import { createApiClient } from '@landx/api-client'
import { httpTransport } from './client'

export const landxApi = createApiClient({ transport: httpTransport })
