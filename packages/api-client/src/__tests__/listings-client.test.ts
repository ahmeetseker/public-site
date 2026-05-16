/**
 * Wave-17 / A81 — verifies `@landx/api-client` wires a stub transport correctly
 * for the listings resource (list/get/create/patch/remove) and confirms the
 * shared `createApiClient` factory builds without missing tags.
 *
 * The transport is hand-rolled, not a fetch mock — that's the whole point of
 * the `Transport` boundary. Each method records `(method, path, body|params)`
 * and returns a canned value.
 */
import { describe, it, expect } from 'vitest'
import type { Listing } from '@landx/api-types'

import { createApiClient, type Transport } from '../index'

interface Call {
  method: 'get' | 'post' | 'patch' | 'del'
  path: string
  payload?: unknown
}

function makeStub(canned: Record<string, unknown> = {}) {
  const calls: Call[] = []
  const transport: Transport = {
    async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
      calls.push({ method: 'get', path, payload: params })
      return (canned[`GET ${path}`] ?? { data: [], meta: { total: 0 } }) as T
    },
    async post<T>(path: string, body?: unknown): Promise<T> {
      calls.push({ method: 'post', path, payload: body })
      return (canned[`POST ${path}`] ?? { data: body }) as T
    },
    async patch<T>(path: string, body: unknown): Promise<T> {
      calls.push({ method: 'patch', path, payload: body })
      return (canned[`PATCH ${path}`] ?? { data: body }) as T
    },
    async del(path: string): Promise<void> {
      calls.push({ method: 'del', path })
    },
  }
  return { transport, calls }
}

function sampleListing(over: Partial<Listing> = {}): Listing {
  return {
    id: 'L-1',
    title: 'Cunda arsa',
    city: 'Balıkesir',
    district: 'Ayvalık',
    type: 'İmarlı',
    size: 500,
    price: 1_000_000,
    status: 'Aktif',
    views: 12,
    weeklyTrend: [1, 2, 3, 4, 5, 6, 7],
    lastUpdate: '2026-01-01T00:00:00.000Z',
    tags: ['deniz manzaralı'],
    ...over,
  }
}

describe('listings resource', () => {
  it('list() passes filter params through to transport.get with the right path', async () => {
    const { transport, calls } = makeStub({
      'GET /listings': { data: [sampleListing()], meta: { total: 1, pageSize: 25 } },
    })
    const client = createApiClient({ transport })

    const res = await client.listings.list({ status: 'Aktif', city: 'Balıkesir', pageSize: 25 })

    expect(res.data).toHaveLength(1)
    expect(res.meta.total).toBe(1)
    expect(calls).toHaveLength(1)
    expect(calls[0]).toEqual({
      method: 'get',
      path: '/listings',
      payload: { status: 'Aktif', city: 'Balıkesir', pageSize: 25 },
    })
  })

  it('get() encodes the id and unwraps the item envelope', async () => {
    const listing = sampleListing({ id: 'L 42/extra' })
    const { transport, calls } = makeStub({
      'GET /listings/L%2042%2Fextra': { data: listing },
    })
    const client = createApiClient({ transport })

    const res = await client.listings.get('L 42/extra')

    expect(res.data).toEqual(listing)
    expect(calls[0]?.path).toBe('/listings/L%2042%2Fextra')
    expect(calls[0]?.method).toBe('get')
  })

  it('create() POSTs the body and returns the created entity', async () => {
    const created = sampleListing({ id: 'NEW.1', title: 'Yeni' })
    const { transport, calls } = makeStub({
      'POST /listings': { data: created },
    })
    const client = createApiClient({ transport })

    const res = await client.listings.create({
      title: 'Yeni',
      city: 'Balıkesir',
      district: 'Ayvalık',
      type: 'İmarlı',
      size: 500,
      price: 1_000_000,
    })

    expect(res.data).toEqual(created)
    expect(calls[0]?.method).toBe('post')
    expect(calls[0]?.path).toBe('/listings')
    expect(calls[0]?.payload).toMatchObject({ title: 'Yeni', city: 'Balıkesir' })
  })

  it('patch() and remove() hit PATCH /listings/:id and DELETE /listings/:id', async () => {
    const patched = sampleListing({ status: 'Pasif' })
    const { transport, calls } = makeStub({
      'PATCH /listings/L-1': { data: patched },
    })
    const client = createApiClient({ transport })

    const patchRes = await client.listings.patch('L-1', { status: 'Pasif' })
    await client.listings.remove('L-1')

    expect(patchRes.data.status).toBe('Pasif')
    expect(calls).toEqual([
      { method: 'patch', path: '/listings/L-1', payload: { status: 'Pasif' } },
      { method: 'del', path: '/listings/L-1' },
    ])
  })

  it('exposes resources for every openapi tag', () => {
    const { transport } = makeStub()
    const client = createApiClient({ transport })
    // Compile-time guarantee: all resources are wired.
    expect(typeof client.listings.list).toBe('function')
    expect(typeof client.customers.list).toBe('function')
    expect(typeof client.deals.list).toBe('function')
    expect(typeof client.calendar.list).toBe('function')
    expect(typeof client.messages.listConversations).toBe('function')
    expect(typeof client.reports.team).toBe('function')
    expect(typeof client.finance.transactions).toBe('function')
    expect(typeof client.auth.login).toBe('function')
    expect(typeof client.public.listOffices).toBe('function')
    expect(typeof client.platform.listTenants).toBe('function')
  })
})
