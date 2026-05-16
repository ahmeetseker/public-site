# @landx/api-types

Type-safe API contract for the future arsam.net REST backend.

## What's here

- `openapi.yaml` — single source of truth (OpenAPI 3.1)
- `src/generated.ts` — `openapi-typescript` output (committed)
- `src/index.ts` — convenience type aliases

## How it's used

### Future Faz 12.2 (hook swap)

```ts
import type { Listing } from '@landx/api-types'

queryFn: async (): Promise<Listing[]> => {
  const r = await fetch('/api/v1/listings')
  if (!r.ok) throw new Error('...')
  const json = await r.json() as { data: Listing[] }
  return json.data
}
```

### Future Faz 12.3 (MSW typed handlers)

```ts
import type { Listing } from '@landx/api-types'
import { http, HttpResponse } from 'msw'

http.get('/api/v1/listings', () => {
  const data: Listing[] = LISTINGS  // type checked
  return HttpResponse.json({ data, meta: { total: data.length } })
})
```

### Backend (LandX 33-module)

The Python/Go/Node backend implementation MUST conform to `openapi.yaml`. CI should run `oapi-codegen` or similar to validate the implementation.

## Regenerate

```bash
# Edit openapi.yaml
pnpm --filter @landx/api-types run generate
# or, from monorepo root:
pnpm api:types
```

This rewrites `src/generated.ts`. Commit both.

## Validation

```bash
# Verify YAML syntax
pnpm dlx @apidevtools/swagger-cli validate packages/api-types/openapi.yaml
```

(Not added to deps to avoid lock churn; run on-demand.)

## Versioning

OpenAPI version starts at `0.1.0-mvp`. Real API will publish:
- `v1` = current spec
- `v2` = breaking changes (eventual; not for MVP)

Backwards-compatible changes (new endpoints, new optional fields) bump `0.1.x`. Breaking → `0.2.0` until first prod release, then `v2` versioning.

## Note on the `Error` schema

The OpenAPI `Error` schema is re-exported as `ApiError` from `index.ts` to avoid shadowing the global `Error` constructor in consumer code. To access by its original name use:

```ts
import type { components } from '@landx/api-types'
type Error = components['schemas']['Error']
```
