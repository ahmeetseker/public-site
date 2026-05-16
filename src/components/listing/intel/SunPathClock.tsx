import { useEffect, useState, type ReactElement } from 'react'

export interface SunPathClockProps {
  listingId: string
}

/** Mock güneş yolu — deterministik tek-saatlik veri (yaz/kış). */
function sunPath(listingId: string, season: 'summer' | 'winter') {
  const hours = Array.from({ length: 24 }, (_, h) => {
    const peak = season === 'summer' ? 12 : 12.5
    const amp = season === 'summer' ? 75 : 30
    const elevation = Math.max(0, amp * Math.sin(((h - 6) / 12) * Math.PI))
    const azimuth = 90 + (h - peak) * 12
    return { hour: h, azimuth, elevation }
  })
  return hours
}

export function SunPathClock({ listingId }: SunPathClockProps): ReactElement {
  const [season, setSeason] = useState<'summer' | 'winter'>('summer')
  const [reduceMotion, setReduceMotion] = useState(false)
  const [currentHour, setCurrentHour] = useState(12)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const onChange = () => setReduceMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (reduceMotion) return
    const id = setInterval(() => {
      setCurrentHour((h) => (h + 1) % 24)
    }, 1500)
    return () => clearInterval(id)
  }, [reduceMotion])

  const path = sunPath(listingId, season)
  const current = path[currentHour]!

  const cx = 150
  const cy = 110
  const r = 90
  const angle = (current.azimuth - 90) * (Math.PI / 180)
  const sunX = cx + Math.cos(angle) * r * (current.elevation / 75)
  const sunY = cy - Math.sin(angle) * r * (current.elevation / 75) * 0.6

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-end justify-between mb-3">
        <h3 className="font-serif text-base">Güneşlenme</h3>
        <div role="tablist" aria-label="Mevsim" className="flex gap-1 text-xs">
          <button
            type="button"
            role="tab"
            aria-selected={season === 'summer'}
            onClick={() => setSeason('summer')}
            className={`rounded-full px-2 py-1 ${season === 'summer' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
          >
            Yaz
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={season === 'winter'}
            onClick={() => setSeason('winter')}
            className={`rounded-full px-2 py-1 ${season === 'winter' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
          >
            Kış
          </button>
        </div>
      </div>
      <svg viewBox="0 0 300 130" className="w-full" role="img" aria-label="Güneş yolu animasyonu">
        <line x1={20} y1={cy} x2={280} y2={cy} stroke="currentColor" strokeWidth={0.5} opacity={0.3} />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r * 0.6} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={0.5}
          opacity={0.3}
        />
        <circle cx={sunX} cy={sunY} r={6} fill="currentColor" />
      </svg>
      <p className="mt-2 text-xs text-muted-foreground">
        Saat {currentHour.toString().padStart(2, '0')}:00 · azimut {Math.round(current.azimuth)}° · yükseklik {Math.round(current.elevation)}°
        {reduceMotion && ' · animasyon kapalı (a11y)'}
      </p>
    </article>
  )
}

export default SunPathClock
