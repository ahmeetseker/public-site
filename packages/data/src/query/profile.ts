import { useQuery } from '@tanstack/react-query'
import { TEAM, INTEGRATIONS, SHORTCUTS } from '../mock/profile'
import { profileKeys } from './keys'
import { mockAsync } from './mock-latency'

// Wave 18 / Faz 12.12.b — SDK adoption.
// Profile surface (team / integrations / shortcuts) has no API endpoints
// yet — the contract and route layer haven't been added. Hooks stay
// mock-only until the OpenAPI spec grows /profile/team, /profile/integrations,
// /profile/shortcuts (or equivalent). When that lands, wire each hook through
// apiOrMock(landxApi.profile.*) following the listings.ts pattern.
// TODO faz12.6: add Profile resource to api-client + apps/api.

export function useTeam() {
  return useQuery({
    queryKey: profileKeys.team(),
    queryFn: () => mockAsync(TEAM),
  })
}

export function useIntegrations() {
  return useQuery({
    queryKey: profileKeys.integrations(),
    queryFn: () => mockAsync(INTEGRATIONS),
  })
}

export function useShortcuts() {
  return useQuery({
    queryKey: profileKeys.shortcuts(),
    queryFn: () => mockAsync(SHORTCUTS),
  })
}
