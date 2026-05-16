// Wave F9.C — Opening hours grid + live open/closed badge.
// Reads from the deterministic getOpeningHours helper. The "is open now"
// badge re-evaluates on mount (and again every 60s for long-lived pages)
// using new Date() — so SSR markup is deterministic from the office id but
// the badge becomes live once hydrated.
import { useEffect, useState } from 'react'
import {
  dayName,
  formatMinutes,
  getOpeningHours,
  isOfficeOpenNow,
} from '@/lib/office-portfolio'

type Locale = 'tr' | 'en'

const LABELS: Record<Locale, {
  eyebrow: string
  heading: string
  openBadge: string
  closedBadge: string
  closedRow: string
}> = {
  tr: {
    eyebrow: 'AÇILIŞ SAATLERİ',
    heading: 'Çalışma saatleri',
    openBadge: 'Şu an açık',
    closedBadge: 'Şu an kapalı',
    closedRow: 'Kapalı',
  },
  en: {
    eyebrow: 'OPENING HOURS',
    heading: 'Opening hours',
    openBadge: 'Open now',
    closedBadge: 'Closed now',
    closedRow: 'Closed',
  },
}

export interface OpeningHoursProps {
  officeId: string
  locale: Locale
}

export default function OpeningHours({ officeId, locale }: OpeningHoursProps) {
  const L = LABELS[locale]
  const grid = getOpeningHours(officeId)
  // SSR: assume closed-baseline so server markup matches first paint without
  // assumption about server clock; client `useEffect` corrects it.
  const [openNow, setOpenNow] = useState<boolean | null>(null)
  const [todayIdx, setTodayIdx] = useState<number | null>(null)

  useEffect(() => {
    function tick() {
      const now = new Date()
      setOpenNow(isOfficeOpenNow(officeId, now))
      const js = now.getDay()
      setTodayIdx(js === 0 ? 6 : js - 1)
    }
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [officeId])

  return (
    <section
      aria-labelledby="ofis-hours-title"
      data-office-hours=""
      className="rounded-2xl border border-border bg-card p-5 md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {L.eyebrow}
          </div>
          <h2
            id="ofis-hours-title"
            className="mt-1 font-serif text-2xl font-normal tracking-tight md:text-3xl"
          >
            {L.heading}
          </h2>
        </div>
        {openNow === null ? null : (
          <span
            data-office-hours-badge={openNow ? 'open' : 'closed'}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wide ${
              openNow
                ? 'border-green-600/30 bg-green-600/10 text-green-700'
                : 'border-border bg-background text-muted-foreground'
            }`}
          >
            <span
              aria-hidden
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                openNow ? 'bg-green-600' : 'bg-muted-foreground/60'
              }`}
            />
            {openNow ? L.openBadge : L.closedBadge}
          </span>
        )}
      </div>

      <ul data-office-hours-list="" className="mt-5 divide-y divide-border rounded-xl border border-border bg-background">
        {grid.map((slot) => {
          const closed = slot.openMin === null || slot.closeMin === null
          const isToday = todayIdx === slot.dayIdx
          return (
            <li
              key={slot.dayIdx}
              data-office-hours-row={slot.dayIdx}
              data-office-hours-today={isToday ? 'true' : 'false'}
              className={`flex items-center justify-between px-3 py-2 text-sm ${
                isToday ? 'bg-foreground/[0.03]' : ''
              }`}
            >
              <span className="font-mono text-xs uppercase tracking-wide text-foreground">
                {dayName(slot.dayIdx, locale)}
                {isToday ? (
                  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-foreground align-middle" aria-hidden />
                ) : null}
              </span>
              {closed ? (
                <span className="font-mono text-xs text-muted-foreground">{L.closedRow}</span>
              ) : (
                <span className="font-mono text-xs tabular-nums text-foreground">
                  {formatMinutes(slot.openMin!)} – {formatMinutes(slot.closeMin!)}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
