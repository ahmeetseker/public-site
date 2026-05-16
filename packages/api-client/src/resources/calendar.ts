/**
 * Calendar resource — list + get a single event.
 */
import type { CalendarEvent, operations } from '@landx/api-types'
import type { ItemResponse, ListResponse, Transport } from '../types'

export type CalendarListQuery = NonNullable<operations['listCalendarEvents']['parameters']['query']>

export function calendarResource(t: Transport) {
  return {
    list: (params?: CalendarListQuery) =>
      t.get<ListResponse<CalendarEvent>>(
        '/calendar/events',
        params as Record<string, unknown> | undefined,
      ),
    get: (id: string) =>
      t.get<ItemResponse<CalendarEvent>>(`/calendar/events/${encodeURIComponent(id)}`),
  }
}

export type CalendarResource = ReturnType<typeof calendarResource>
