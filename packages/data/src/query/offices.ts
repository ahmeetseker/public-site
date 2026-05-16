import { useQuery } from '@tanstack/react-query'
import { OFFICES, officeBySlug, officesByCity, type Office } from '../mock/offices'
import { apiOrMock, landxApi } from '../api'
import { officeKeys } from './keys'
import { mockAsync } from './mock-latency'

// Wave 18 / Faz 12.12.b — SDK adoption. Reads go through
// `landxApi.public.*`. apiOrMock + mock fallback retained.
//
// Wave 19 / Faz 12.12.c — Cast survives. The contract Office (openapi
// schema) marks phone/email/whatsapp/address/hours/specialties as optional
// and omits the domain-only `team: Array<{name,role,phone}>` field
// entirely. The mock route returns the rich domain shape so the cast is
// load-bearing (lifts an artificially-narrowed contract back to the domain
// superset the public site consumes). Drop only after openapi.yaml grows
// these fields (see TODOs below).

export function useOffices(cityFilter?: string) {
  return useQuery({
    queryKey: officeKeys.list(cityFilter),
    queryFn: () =>
      apiOrMock(
        // TODO faz19/openapi: lift Office.team[] + tighten required
        // phone/email/whatsapp/address/hours/specialties into the openapi
        // schema, then drop this cast.
        () =>
          landxApi.public
            .listOffices(cityFilter ? { city: cityFilter } : undefined)
            .then((env) => env.data as unknown as Office[]),
        () => mockAsync(cityFilter ? officesByCity(cityFilter) : OFFICES),
      ),
  })
}

export function useOffice(slug: string) {
  return useQuery({
    queryKey: officeKeys.detail(slug),
    queryFn: () =>
      apiOrMock(
        // TODO faz19/openapi: same as listOffices — Office.team[] missing
        // from contract, several required domain fields are optional.
        () =>
          landxApi.public.getOffice(slug).then((env) => env.data as unknown as Office),
        () => mockAsync(officeBySlug(slug) ?? null),
      ),
    enabled: !!slug,
  })
}
