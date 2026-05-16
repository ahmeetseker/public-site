import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { EVENTS, eventsOnDay, eventsCountByDay } from '../mock/calendar'
import type { CalendarEvent, EventType } from '../mock/calendar'
import { apiOrMock, landxApi } from '../api'
import { calendarKeys } from './keys'
import { mockAsync } from './mock-latency'

// Wave 18 / Faz 12.12.b — SDK adoption. Hooks now go through
// `landxApi.calendar.*`. apiOrMock wrapper + mock fallback stay.
//
// Wave 19 / Faz 12.12.c — A88 lifted the CalendarEvent schema into
// openapi.yaml with the exact same structural shape as the @landx/data
// domain `CalendarEvent`. Casts dropped — the contract type assigns
// directly into the domain alias because every required/optional field
// matches one-for-one (id, type, title, date, time?, durationMin?,
// owner, location?, dealId?, customerName?, notes?).
//
// Wave F3 / Agent-F3B — added create/update/delete mutation hooks.
// The api-client `calendarResource` (read-only at the time of writing)
// exposes only `list` + `get`; until POST/PATCH/DELETE land in the SDK
// the mutation branches stay mock-only. TODO faz12.14: switch to
// apiOrMock once the SDK gets `create`/`patch`/`remove`.

function dayKey(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : ''
}

export function useEvents() {
  return useQuery({
    queryKey: calendarKeys.events(),
    queryFn: () =>
      apiOrMock(
        () => landxApi.calendar.list().then((env) => env.data),
        () => mockAsync(EVENTS),
      ),
  })
}

export function useEventsOnDay(date: Date | null) {
  const key = dayKey(date)
  return useQuery({
    queryKey: calendarKeys.eventsOnDay(key),
    queryFn: () => {
      if (!date) return Promise.resolve([] as CalendarEvent[])
      // Inclusive [start, end] of the requested day for the API range filter.
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      return apiOrMock(
        () =>
          landxApi.calendar
            .list({ from: start.toISOString(), to: end.toISOString() })
            .then((env) => env.data),
        () => mockAsync(eventsOnDay(date)),
      )
    },
    enabled: !!date,
  })
}

export function useEventsCountByMonth(month: number, year: number) {
  // No /calendar/events/count endpoint yet — derived counts stay mock-only.
  // TODO faz12.6: expose /calendar/events/count or compute client-side from
  // a range fetch.
  return useQuery({
    queryKey: calendarKeys.eventsByMonth(month, year),
    queryFn: () => mockAsync(eventsCountByDay(month, year)),
  })
}

// ---------------------------------------------------------------------------
// Mutations (Wave F3 / Agent-F3B)
// ---------------------------------------------------------------------------

export interface NewEventInput {
  type: EventType
  title: string
  date: string
  time?: string
  durationMin?: number
  owner?: string
  location?: string
  dealId?: string
  customerName?: string
  notes?: string
}

interface CreateEventContext {
  previous: CalendarEvent[] | undefined
  tempId: string
}

function buildCreatedEvent(input: NewEventInput): CalendarEvent {
  return {
    id: `NEW.${Date.now().toString().slice(-7)}`,
    type: input.type,
    title: input.title,
    date: input.date,
    time: input.time,
    durationMin: input.durationMin,
    owner: input.owner ?? '—',
    location: input.location,
    dealId: input.dealId,
    customerName: input.customerName,
    notes: input.notes,
  }
}

/**
 * Optimistic create. Prepends a temp event to `calendarKeys.events()` cache,
 * rolls back on error, refetches on settle. Mock-only until the SDK exposes
 * a POST /calendar/events route. TODO faz12.14.
 */
export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation<CalendarEvent, Error, NewEventInput, CreateEventContext>({
    mutationFn: (input) => mockAsync(buildCreatedEvent(input), 250),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: calendarKeys.events() })
      const tempId = `TEMP.${Date.now()}`
      const previous = qc.getQueryData<CalendarEvent[]>(calendarKeys.events())
      const tempEvent: CalendarEvent = {
        id: tempId,
        type: input.type,
        title: input.title,
        date: input.date,
        time: input.time,
        durationMin: input.durationMin,
        owner: input.owner ?? '—',
        location: input.location,
        dealId: input.dealId,
        customerName: input.customerName,
        notes: input.notes,
      }
      qc.setQueryData<CalendarEvent[]>(calendarKeys.events(), (old = []) => [
        tempEvent,
        ...old,
      ])
      return { previous, tempId }
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(calendarKeys.events(), ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

export interface UpdateEventInput {
  id: string
  patch: Partial<
    Pick<
      CalendarEvent,
      | 'title'
      | 'type'
      | 'date'
      | 'time'
      | 'durationMin'
      | 'location'
      | 'notes'
      | 'dealId'
      | 'customerName'
      | 'owner'
    >
  >
}

interface UpdateEventContext {
  previous: CalendarEvent[] | undefined
}

/**
 * Optimistic patch. Updates the matching event in `calendarKeys.events()`
 * cache, rolls back on error. Mock-only — mirrors the same TODO as create.
 */
export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation<CalendarEvent, Error, UpdateEventInput, UpdateEventContext>({
    mutationFn: ({ id, patch }) => {
      const current = EVENTS.find((e) => e.id === id)
      const base: CalendarEvent =
        current ??
        (qc
          .getQueryData<CalendarEvent[]>(calendarKeys.events())
          ?.find((e) => e.id === id) as CalendarEvent | undefined) ??
        ({
          id,
          type: 'task',
          title: '',
          date: new Date().toISOString(),
          owner: '—',
        } as CalendarEvent)
      const updated: CalendarEvent = { ...base, ...patch, id }
      return mockAsync(updated, 200)
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: calendarKeys.events() })
      const previous = qc.getQueryData<CalendarEvent[]>(calendarKeys.events())
      qc.setQueryData<CalendarEvent[]>(calendarKeys.events(), (old = []) =>
        old.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      )
      return { previous }
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(calendarKeys.events(), ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

interface DeleteEventContext {
  previous: CalendarEvent[] | undefined
}

/**
 * Optimistic remove. Drops the event from `calendarKeys.events()` cache,
 * rolls back on error. Mock-only — see TODO faz12.14.
 */
export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation<void, Error, string, DeleteEventContext>({
    mutationFn: () => mockAsync(undefined, 150),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: calendarKeys.events() })
      const previous = qc.getQueryData<CalendarEvent[]>(calendarKeys.events())
      qc.setQueryData<CalendarEvent[]>(calendarKeys.events(), (old = []) =>
        old.filter((e) => e.id !== id),
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(calendarKeys.events(), ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}
