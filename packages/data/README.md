# @landx/data

LandX shared data layer. Single source for all mocks + TanStack Query hooks.

## Imports

```ts
// Domain types + mock data
import { LISTINGS, CUSTOMERS, OFFICES, REGIONS, TENANTS } from '@landx/data'
import type { Listing, Customer, Tenant, Office, Region } from '@landx/data'

// TanStack Query hooks
import {
  useListings, useListing, useListingStatusCounts, useCreateListing,
  useCustomers, useSegmentCounts,
  useDeals, useDealMove, useFunnelData,
  useTransactions, useCashflow, usePendingByAge, useFinanceKpis,
  useOffices, useOffice,
  useRegions, useRegion, useRegionListings,
  // ... and more
  queryClient,
} from '@landx/data'

// Query key factories (for cache manipulation)
import { listingKeys, customerKeys, dealKeys, transactionKeys, officeKeys, regionKeys } from '@landx/data'
```

## Hook pattern

Each hook:
- Returns standard React Query result (`{ data, isLoading, error, refetch }`)
- Uses `placeholderData: keepPreviousData` for filter changes (smooth UX)
- `mockAsync(value, 120ms)` simulates network — Faz 12'de `fetch()` ile değiştirilir

## Mutation pattern (optimistic)

Example `useDealMove`:
- `onMutate` -> snapshot + `qc.setQueryData()` optimistic
- `onError` -> rollback to snapshot
- `onSettled` -> `invalidateQueries()` to refetch truth

`useCreateListing` follows same pattern with TEMP id prepend.

## Mock organization

```
src/mock/
├ listings.ts            18 ilan
├ customers.ts           N müşteri + SEGMENT_COUNTS
├ sales.ts               N deal + STAGE_ORDER + funnelData
├ finance.ts             TRANSACTIONS + CASHFLOW + financeKpis
├ calendar.ts            EVENTS
├ messages.ts            CONVERSATIONS
├ profile.ts             TEAM + INTEGRATIONS + SHORTCUTS
├ reports.ts             TEAM_PERFORMANCE + MONTHLY_CLOSE + ...
├ offices.ts             4 ofis (public-site /ofisler)
├ regions.ts             8 bölge (public-site /bolge)
├ buyer.ts               BUYER + SAVED_SEARCHES + FAVORITES (public-site /hesabim)
├ types.ts               Domain types (Listing, Customer, etc.)
└ platform/              Super-admin scope (16 alt-modül)
   ├ tenants.ts
   ├ audit.ts
   ├ pii.ts
   ├ ... (16 dosya)
   └ index.ts            barrel
```

## Real API migration (Faz 12)

Each hook's `queryFn` swaps from `mockAsync(...)` to `fetch('/api/v1/...')`. Hook signatures and consumer code stay identical. MSW intercepts fetch in dev mode for full E2E parity. See [docs/dev/msw.md](../../docs/dev/msw.md).
