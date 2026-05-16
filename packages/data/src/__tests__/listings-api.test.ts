/**
 * Wave-15 / A71 — exercises the apiOrMock branching for listings + customers,
 * and verifies optimistic create still rolls back when the API path errors.
 *
 * The api client is a module-level singleton, so we reset between tests by
 * mutating it through configureApi() with an empty baseUrl. The bundled
 * `configureApi` only sets baseUrl when given a non-empty string, so we use a
 * dedicated test-only reset that pokes the module state via a tiny shim.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'

import {
  apiOrMock,
  configureApi,
  isApiConfigured,
  useCreateCustomer,
  useCreateListing,
  useCustomers,
  useListings,
  listingKeys,
  customerKeys,
  LISTINGS,
} from '../index'
import type { Listing, Customer } from '../mock/types'

// configureApi has no public "reset" — for tests we set baseUrl to empty by
// re-importing the module and calling configureApi with a noop. The simplest
// robust path: keep tests that mutate config last, and explicitly reconfigure
// inside each test that needs the API path.
function resetApiClient() {
  // Calling configureApi with baseUrl '' is rejected (strips trailing slash;
  // empty stays empty so isApiConfigured() returns false). This is the
  // sanctioned reset hook.
  configureApi({ baseUrl: '' })
}

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc, children })
  return { qc, wrapper }
}

describe('apiOrMock branching', () => {
  beforeEach(() => {
    resetApiClient()
  })

  afterEach(() => {
    resetApiClient()
    vi.restoreAllMocks()
  })

  it('falls back to mock when api client is not configured', async () => {
    expect(isApiConfigured()).toBe(false)
    const apiCall = vi.fn().mockResolvedValue('api-result')
    const mockCall = vi.fn().mockResolvedValue('mock-result')
    const result = await apiOrMock(apiCall, mockCall)
    expect(result).toBe('mock-result')
    expect(apiCall).not.toHaveBeenCalled()
    expect(mockCall).toHaveBeenCalledTimes(1)
  })

  it('uses the api path after configureApi() is called', async () => {
    configureApi({ baseUrl: 'http://api.test/v1' })
    expect(isApiConfigured()).toBe(true)
    const apiCall = vi.fn().mockResolvedValue('api-result')
    const mockCall = vi.fn().mockResolvedValue('mock-result')
    const result = await apiOrMock(apiCall, mockCall)
    expect(result).toBe('api-result')
    expect(apiCall).toHaveBeenCalledTimes(1)
    expect(mockCall).not.toHaveBeenCalled()
  })

  it('useListings (unconfigured) returns the mock seed data', async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useListings({}), { wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data!.length).toBe(LISTINGS.length)
  })

  it('useListings (configured) calls fetch and unwraps the envelope', async () => {
    configureApi({ baseUrl: 'http://api.test/v1' })
    const fakeListing: Listing = {
      id: 'API.1',
      title: 'API listing',
      city: 'Balıkesir',
      district: 'Ayvalık',
      type: 'İmarlı',
      size: 500,
      price: 1_000_000,
      status: 'Aktif',
      views: 0,
      weeklyTrend: [0, 0, 0, 0, 0, 0, 0],
      lastUpdate: new Date().toISOString(),
      tags: [],
      lat: 39.3,
      lng: 26.7,
    }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [fakeListing], meta: { total: 1 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useListings({ status: 'Aktif' }), { wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toEqual([fakeListing])
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const url = (fetchSpy.mock.calls[0]?.[0] as URL | string).toString()
    expect(url).toContain('/listings')
    expect(url).toContain('status=Aktif')
  })

  it('useCustomers (configured) calls fetch and unwraps the envelope', async () => {
    configureApi({ baseUrl: 'http://api.test/v1' })
    const fakeCustomer: Customer = {
      id: 'M-1',
      name: 'API müşteri',
      segment: 'Sıcak',
      stage: 'Görüşme',
      lastContact: new Date().toISOString(),
      value: 100_000,
      source: 'Referans',
      owner: 'Ahmet',
      interestArea: 'Cunda',
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [fakeCustomer], meta: { total: 1 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useCustomers({ segment: 'Sıcak' }), { wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toEqual([fakeCustomer])
  })

  it('useCreateListing optimistic flow still rolls back on API error', async () => {
    configureApi({ baseUrl: 'http://api.test/v1' })

    // POST resolves after a deliberate delay so onMutate's optimistic update
    // is observable before onError fires the rollback. We also gate the
    // resolution on a promise so the test controls timing precisely.
    let releasePost!: () => void
    const postBarrier = new Promise<void>((r) => {
      releasePost = r
    })
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const method = (init?.method ?? 'GET').toUpperCase()
      if (method === 'POST') {
        await postBarrier
        return new Response(
          JSON.stringify({ error: { code: 'INTERNAL', message: 'boom' } }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify({ data: [], meta: { total: 0 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const sentinel: Listing[] = [
      {
        id: 'SEED.1',
        title: 'Seed listing',
        city: 'Balıkesir',
        district: 'Ayvalık',
        type: 'İmarlı',
        size: 100,
        price: 10,
        status: 'Aktif',
        views: 0,
        weeklyTrend: [0, 0, 0, 0, 0, 0, 0],
        lastUpdate: new Date().toISOString(),
        tags: [],
        lat: 39.3,
        lng: 26.7,
      },
    ]
    const { qc, wrapper } = makeWrapper()
    // Seed the cache so `previous` in onMutate is a known reference.
    qc.setQueryData<Listing[]>(listingKeys.list({}), sentinel)

    const { result: mutationResult } = renderHook(() => useCreateListing(), { wrapper })

    act(() => {
      mutationResult.current.mutate({
        title: 'Will fail',
        city: 'X',
        district: 'Y',
        type: 'İmarlı',
        size: 100,
        price: 10,
      })
    })

    // Optimistic temp entry appears (POST is gated by `releasePost`).
    await waitFor(() => {
      const cached = qc.getQueryData<Listing[]>(listingKeys.list({}))
      expect(cached?.length).toBe(2)
      expect(cached?.[0]?.id.startsWith('TEMP.')).toBe(true)
    })

    // Release the POST so it can fail and trigger rollback.
    releasePost()

    // POST fails → rollback to the seed sentinel.
    await waitFor(() => expect(mutationResult.current.isError).toBe(true), { timeout: 2000 })
    const afterRollback = qc.getQueryData<Listing[]>(listingKeys.list({}))
    expect(afterRollback).toEqual(sentinel)
    expect(fetchSpy).toHaveBeenCalled()
  })

  it('useCreateCustomer mock-path creates a customer with optimistic temp id', async () => {
    // Unconfigured → mock branch
    expect(isApiConfigured()).toBe(false)
    const { qc, wrapper } = makeWrapper()

    // Seed the cache so onMutate has previous data
    const { result: listResult } = renderHook(() => useCustomers({}), { wrapper })
    await waitFor(() => expect(listResult.current.data).toBeDefined())
    const seedCount = listResult.current.data!.length

    const { result: mutationResult } = renderHook(() => useCreateCustomer(), { wrapper })

    act(() => {
      mutationResult.current.mutate({
        name: 'Yeni Müşteri',
        segment: 'Sıcak',
        stage: 'İlk temas',
        value: 250_000,
        source: 'Referans',
        owner: 'Ahmet',
        interestArea: 'Cunda',
      })
    })

    await waitFor(() => {
      const cached = qc.getQueryData<Customer[]>(customerKeys.list({}))
      expect(cached?.[0]?.id.startsWith('TEMP.')).toBe(true)
    })
    const optimistic = qc.getQueryData<Customer[]>(customerKeys.list({}))
    expect(optimistic!.length).toBe(seedCount + 1)
    expect(optimistic![0].name).toBe('Yeni Müşteri')

    await waitFor(() => expect(mutationResult.current.isSuccess).toBe(true), { timeout: 2000 })
  })
})
