# `@landx/api-client`

Typed SDK over the LandX REST API.

Today the frontend hooks call the wire-level helpers directly:

```ts
apiGet<ApiEnvelope<Listing[]>>('/listings', { status: 'Aktif' }).then((env) => env.data)
```

That's safe but stringly-typed — path, query keys and response envelope are
all opaque strings until you hand-type them. This package wraps the same
transport with a method-per-endpoint surface generated from the OpenAPI types
in `@landx/api-types`:

```ts
import { createApiClient } from '@landx/api-client'
import { httpTransport } from '@landx/data'

const api = createApiClient({ transport: httpTransport })

const { data, meta } = await api.listings.list({ status: 'Aktif', city: 'İstanbul' })
const single = await api.listings.get('L-1')
await api.listings.create({ title: 'X', city: 'X', district: 'Y', type: 'İmarlı', size: 100, price: 10 })
await api.listings.patch('L-1', { status: 'Pasif' })
await api.listings.remove('L-1')
```

## Design

- **No fetch dependency.** The SDK accepts a `Transport` object —
  `{ get, post, patch, del }` — and never reaches the network on its own.
  Apps inject `httpTransport` from `@landx/data` (which wraps
  `apiGet/Post/Patch/Delete`). Tests inject a hand-rolled stub.
- **No singletons.** `createApiClient` is a pure factory. Construct once at
  module load, import everywhere.
- **Generated types in / generated types out.** Filter shapes come from
  `operations['xxx']['parameters']['query']`; payload shapes come from
  `components.schemas.*`. Re-running `pnpm api:types` refreshes the surface.

## Resources

| Field | Tag | Endpoints |
| --- | --- | --- |
| `client.listings` | `listings` | list / get / create / patch / remove |
| `client.customers` | `customers` | list / get / create / patch / remove |
| `client.deals` | `deals` | list / move |
| `client.calendar` | `calendar` | list / get |
| `client.messages` | `messages` | listConversations / getConversation |
| `client.reports` | `reports` | team / monthlyClose / customerSources |
| `client.finance` | `finance` | transactions / cashflow / kpis / pendingByAge |
| `client.auth` | `auth` | login / logout / me / refresh |
| `client.public` | `offices`+`regions` | listOffices / getOffice / listRegions |
| `client.platform` | `platform`+`audit` | listTenants / listAudit |

## Migration from raw `apiGet`

Before:

```ts
import { apiGet, apiOrMock, type ApiEnvelope } from '@landx/data'

queryFn: () =>
  apiOrMock(
    () => apiGet<ApiEnvelope<Listing[]>>('/listings', params).then((env) => env.data),
    () => mockAsync(rows),
  )
```

After:

```ts
import { apiOrMock, landxApi } from '@landx/data'

queryFn: () =>
  apiOrMock(
    () => landxApi.listings.list(params).then((env) => env.data),
    () => mockAsync(rows),
  )
```

Notes:
- The envelope unwrap (`.then(env => env.data)`) stays in the hook — that's a
  per-hook UX choice (some hooks want the meta, some don't).
- `apiOrMock` keeps its current job: pick between the live API and the local
  seed when the API client isn't configured.
- For mutations, swap `apiPost`/`apiPatch`/`apiDelete` for
  `landxApi.<resource>.create / patch / remove`.

## Test stub example

```ts
import { createApiClient, type Transport } from '@landx/api-client'

const transport: Transport = {
  async get() { return { data: [], meta: { total: 0 } } },
  async post(_p, body) { return { data: body } },
  async patch(_p, body) { return { data: body } },
  async del() {},
}
const api = createApiClient({ transport })
await api.listings.list({})
```

## Status (Wave 17)

- `listings` + `customers` consumed by `@landx/data` hooks today.
- All other resources are typed and ready; remaining hooks
  (`sales`, `calendar`, `messages`, `reports`, `finance`, `offices`,
  `regions`, `profile`, `platform`) migrate in Wave 18.
