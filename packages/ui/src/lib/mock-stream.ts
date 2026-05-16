/**
 * Wave F29.0 — Mock event-stream hook.
 *
 * Stand-in for a future WebSocket / SSE subscriber. Calls `generator(cursor)`
 * on a fixed interval and pushes returned events into a ring buffer. When the
 * real-time backend lands, replace the implementation with `new EventSource(...)`
 * — the public surface (`{ events, cursor, clear, pause, resume }`) stays
 * identical, so consumers (atolye messages, super-admin activity feed,
 * public-site social-proof toast) need zero changes.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseMockStreamOptions<T> {
  intervalMs: number
  generator: (cursor: number) => T | null
  /** Default true; set false to pause without unmounting. */
  enabled?: boolean
  /** Ring buffer cap. Default 20. */
  maxBuffer?: number
  /** Seed cursor — useful for deterministic tests. */
  initialCursor?: number
}

export interface UseMockStreamResult<T> {
  events: T[]
  cursor: number
  isPaused: boolean
  clear: () => void
  pause: () => void
  resume: () => void
}

export function useMockStream<T>(options: UseMockStreamOptions<T>): UseMockStreamResult<T> {
  const {
    intervalMs,
    generator,
    enabled = true,
    maxBuffer = 20,
    initialCursor = 0,
  } = options

  const [events, setEvents] = useState<T[]>([])
  const [cursor, setCursor] = useState<number>(initialCursor)
  const [isPaused, setIsPaused] = useState<boolean>(!enabled)
  const generatorRef = useRef(generator)
  generatorRef.current = generator

  useEffect(() => {
    if (isPaused) return
    if (typeof window === 'undefined') return
    const id = window.setInterval(() => {
      setCursor((c) => {
        const next = c + 1
        const event = generatorRef.current(next)
        if (event !== null) {
          setEvents((prev) => {
            const merged = [event, ...prev]
            return merged.length > maxBuffer ? merged.slice(0, maxBuffer) : merged
          })
        }
        return next
      })
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs, maxBuffer, isPaused])

  const clear = useCallback(() => {
    setEvents([])
  }, [])

  const pause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  return { events, cursor, isPaused, clear, pause, resume }
}
