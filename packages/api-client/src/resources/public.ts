/**
 * Public resource — unauthenticated reads for the public site.
 * Covers /public/offices, /public/offices/{slug}, /public/regions.
 */
import type { Office, Region, operations } from '@landx/api-types'
import type { ItemResponse, Transport } from '../types'

export type PublicOfficesQuery = NonNullable<operations['listPublicOffices']['parameters']['query']>

export function publicResource(t: Transport) {
  return {
    listOffices: (params?: PublicOfficesQuery) =>
      t.get<{ data: Office[] }>(
        '/public/offices',
        params as Record<string, unknown> | undefined,
      ),
    getOffice: (slug: string) =>
      t.get<ItemResponse<Office>>(`/public/offices/${encodeURIComponent(slug)}`),
    listRegions: () => t.get<{ data: Region[] }>('/public/regions'),
  }
}

export type PublicResource = ReturnType<typeof publicResource>
