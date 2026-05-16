import { useQuery } from '@tanstack/react-query'
import {
  TEAM_PERFORMANCE,
  MONTHLY_CLOSE,
  CUSTOMER_SOURCES,
  REGION_RANKING,
} from '../mock/reports'
import { apiOrMock, landxApi } from '../api'
import { reportKeys } from './keys'
import { mockAsync } from './mock-latency'

// Wave 18 / Faz 12.12.b — SDK adoption. Hooks now go through
// `landxApi.reports.*`. apiOrMock wrapper + mock fallback stay.
//
// Wave 19 / Faz 12.12.c — A88 added TeamRow/MonthlyClose/SourceRow to
// openapi.yaml as one-for-one structural matches of the @landx/data
// domain interfaces. Casts dropped; the SDK response data assigns
// directly into the domain aliases.

export function useTeamPerformance() {
  return useQuery({
    queryKey: reportKeys.teamPerformance(),
    queryFn: () =>
      apiOrMock(
        () => landxApi.reports.team().then((env) => env.data),
        () => mockAsync(TEAM_PERFORMANCE),
      ),
  })
}

export function useMonthlyClose() {
  return useQuery({
    queryKey: reportKeys.monthlyClose(),
    queryFn: () =>
      apiOrMock(
        () => landxApi.reports.monthlyClose().then((env) => env.data),
        () => mockAsync(MONTHLY_CLOSE),
      ),
  })
}

export function useCustomerSources() {
  return useQuery({
    queryKey: reportKeys.customerSources(),
    queryFn: () =>
      apiOrMock(
        () => landxApi.reports.customerSources().then((env) => env.data),
        () => mockAsync(CUSTOMER_SOURCES),
      ),
  })
}

export function useRegionRanking() {
  // No /reports/region-ranking endpoint yet — derived report stays mock-only.
  // TODO faz12.6: expose /reports/region-ranking in apps/api.
  return useQuery({
    queryKey: reportKeys.regionRanking(),
    queryFn: () => mockAsync(REGION_RANKING),
  })
}
