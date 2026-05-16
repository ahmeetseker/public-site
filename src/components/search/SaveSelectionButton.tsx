/**
 * SaveSelectionButton — small button rendered next to ComparisonHeader on
 * /karsilastir. Persists the URL `ids` to `arsam.compare.v1` so the user's
 * selection survives navigation back to /ara.
 *
 * Faz 9.16 / Wave-11 / Agent-A52. React island, client:load.
 */
import { useEffect, useState } from 'react'
import { EVENT_NAME, getCompareIds, setIds as writeIds } from '../../lib/compare-store'

export interface Props {
  ids: string[]
}

export default function SaveSelectionButton({ ids }: Props) {
  const [saved, setSaved] = useState<boolean>(false)
  const [hydrated, setHydrated] = useState<boolean>(false)

  useEffect(() => {
    const sync = () => {
      const stored = getCompareIds()
      // "saved" iff every URL id is already in storage AND counts match
      const allMatch =
        ids.length > 0 &&
        stored.length === ids.length &&
        ids.every((id) => stored.includes(id))
      setSaved(allMatch)
    }
    sync()
    setHydrated(true)
    window.addEventListener(EVENT_NAME, sync as EventListener)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT_NAME, sync as EventListener)
      window.removeEventListener('storage', sync)
    }
  }, [ids])

  if (ids.length === 0) return null

  const onClick = () => {
    writeIds(ids)
    setSaved(true)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!hydrated || saved}
      data-save-selection=""
      className={[
        'inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.14em] transition',
        saved
          ? 'border-border bg-card text-muted-foreground'
          : 'border-border bg-card text-foreground hover:border-foreground',
      ].join(' ')}
    >
      <span aria-hidden="true">{saved ? '✓' : '☆'}</span>
      {saved ? 'Seçim kaydedildi' : 'Bu seçimi kaydet'}
    </button>
  )
}
