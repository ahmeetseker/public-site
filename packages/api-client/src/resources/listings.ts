/**
 * Listings resource — wraps GET/POST/PATCH/DELETE /listings.
 *
 * The query-param shape is pulled straight from the openapi-generated
 * `operations['listListings']['parameters']['query']`, so adding a new filter
 * to openapi.yaml + regenerating `@landx/api-types` is the only thing needed
 * for it to surface here.
 */
import type {
  Listing,
  ListingCreateInput,
  ListingPatchInput,
  operations,
} from '@landx/api-types'
import type { ItemResponse, ListResponse, Transport } from '../types'

export type ListingListQuery = NonNullable<operations['listListings']['parameters']['query']>

export function listingsResource(t: Transport) {
  return {
    list: (params?: ListingListQuery) =>
      t.get<ListResponse<Listing>>('/listings', params as Record<string, unknown> | undefined),
    get: (id: string) =>
      t.get<ItemResponse<Listing>>(`/listings/${encodeURIComponent(id)}`),
    create: (input: ListingCreateInput) =>
      t.post<ItemResponse<Listing>>('/listings', input),
    patch: (id: string, input: ListingPatchInput) =>
      t.patch<ItemResponse<Listing>>(`/listings/${encodeURIComponent(id)}`, input),
    remove: (id: string) => t.del(`/listings/${encodeURIComponent(id)}`),
  }
}

export type ListingsResource = ReturnType<typeof listingsResource>
