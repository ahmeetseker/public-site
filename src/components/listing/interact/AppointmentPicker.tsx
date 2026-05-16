import { useState, useMemo, type ReactElement } from 'react'

export interface AppointmentPickerProps {
  listingId: string
}

function nextDays(count: number) {
  const days = []
  const today = new Date()
  for (let i = 1; i <= count; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push({
      date: d.toISOString().split('T')[0]!,
      label: d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' }),
    })
  }
  return days
}

export function AppointmentPicker({ listingId }: AppointmentPickerProps): ReactElement {
  const days = useMemo(() => nextDays(7), [])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const times = ['10:00', '11:30', '14:00', '15:30', '17:00']

  if (confirmed) {
    return (
      <article className="rounded-2xl border border-emerald-500/40 bg-card p-4">
        <h3 className="font-serif text-base mb-2">Görüşme onaylandı ✓</h3>
        <p className="text-sm">
          {selectedDate} {selectedTime} — broker'a iletildi, takvimine eklenecek.
        </p>
      </article>
    )
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-serif text-base mb-3">Görüşme randevu</h3>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {days.map((d) => (
          <button
            key={d.date}
            type="button"
            onClick={() => setSelectedDate(d.date)}
            aria-pressed={selectedDate === d.date}
            className={`rounded-full border px-3 py-1 text-xs ${
              selectedDate === d.date ? 'border-foreground bg-foreground text-background' : 'border-border'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
      {selectedDate && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {times.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTime(t)}
              aria-pressed={selectedTime === t}
              className={`rounded-full border px-3 py-1 text-xs tabular-nums ${
                selectedTime === t ? 'border-foreground bg-foreground text-background' : 'border-border'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        disabled={!selectedDate || !selectedTime}
        onClick={() => setConfirmed(true)}
        className="w-full rounded-xl bg-foreground py-2 text-sm font-medium text-background disabled:opacity-40"
        data-listing-id={listingId}
      >
        Randevu al
      </button>
    </article>
  )
}

export default AppointmentPicker
