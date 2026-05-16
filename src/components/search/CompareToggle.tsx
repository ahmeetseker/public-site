/**
 * CompareToggle — per-listing-card checkbox button (React island, client:load).
 *
 * Faz 9.16 / Wave-11 / Agent-A52.
 *
 * Visual: pill-shaped button overlay on top-right corner. Acts like a checkbox.
 * Subscribes to `arsam:compare-changed` so multiple cards stay in sync.
 * Cap behavior: if user tries to add a 4th id, the button briefly shakes and the
 * dock will surface the cap state. We don't render a toast here (keeps card UI quiet).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  EVENT_NAME,
  MAX,
  addId,
  getCompareIds,
  removeId,
} from '../../lib/compare-store'

export interface Props {
  id: string
  /** Optional human label for screen readers (defaults to id) */
  label?: string
}

export default function CompareToggle({ id, label }: Props) {
  const [selected, setSelected] = useState<boolean>(false)
  const [shake, setShake] = useState<boolean>(false)
  const [count, setCount] = useState<number>(0)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Hydrate from storage on mount + subscribe to changes
  useEffect(() => {
    const sync = () => {
      const ids = getCompareIds()
      setCount(ids.length)
      setSelected(ids.includes(id))
    }
    sync()
    window.addEventListener(EVENT_NAME, sync as EventListener)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT_NAME, sync as EventListener)
      window.removeEventListener('storage', sync)
    }
  }, [id])

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (selected) {
        removeId(id)
        return
      }
      const ok = addId(id)
      if (!ok) {
        setShake(true)
        window.setTimeout(() => setShake(false), 380)
      }
    },
    [id, selected],
  )

  const atCap = !selected && count >= MAX
  const a11yLabel = `${label ?? id} arsasını karşılaştırma listesine ${
    selected ? 'çıkar' : 'ekle'
  }`

  return (
    <button
      ref={btnRef}
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={a11yLabel}
      onClick={onClick}
      data-compare-toggle={id}
      data-state={selected ? 'on' : atCap ? 'cap' : 'off'}
      className={[
        'absolute right-2 top-2 z-30 inline-flex h-7 min-w-[28px] items-center justify-center gap-1 rounded-full border px-2 font-mono text-xs uppercase tracking-[0.14em] backdrop-blur transition',
        selected
          ? 'border-foreground bg-foreground text-background shadow-sm'
          : atCap
            ? 'border-border bg-background/80 text-muted-foreground opacity-60'
            : 'border-border bg-background/85 text-muted-foreground hover:border-foreground hover:text-foreground',
        shake ? 'animate-[arsam-shake_0.35s_ease-in-out]' : '',
      ].join(' ')}
      style={{
        // Inline keyframes via CSS var fallback — Tailwind v4 can't define ad-hoc keyframes.
        // We register the animation once in a sibling <style> below.
      }}
    >
      <span aria-hidden="true">{selected ? '✓' : '+'}</span>
      <span>Karşılaştır</span>
      <style>{`
        @keyframes arsam-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
      `}</style>
    </button>
  )
}
