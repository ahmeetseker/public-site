import { useState, useEffect, type ReactElement } from 'react'

export interface PriceDropSubscribeProps {
  listingId: string
}

const LS_KEY = 'landx_price_drop_subs'

export function PriceDropSubscribe({ listingId }: PriceDropSubscribeProps): ReactElement {
  const [subscribed, setSubscribed] = useState(false)
  const [threshold, setThreshold] = useState(5)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const list = JSON.parse(raw) as Array<{ listingId: string; threshold: number }>
        const found = list.find((s) => s.listingId === listingId)
        if (found) {
          setSubscribed(true)
          setThreshold(found.threshold)
        }
      }
    } catch {
      // localStorage erişimi yoksa sessiz geç
    }
  }, [listingId])

  const handleToggle = () => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      const list = raw ? (JSON.parse(raw) as Array<{ listingId: string; threshold: number }>) : []
      if (subscribed) {
        const next = list.filter((s) => s.listingId !== listingId)
        localStorage.setItem(LS_KEY, JSON.stringify(next))
        setSubscribed(false)
      } else {
        list.push({ listingId, threshold })
        localStorage.setItem(LS_KEY, JSON.stringify(list))
        setSubscribed(true)
      }
    } catch {
      // ignore
    }
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-serif text-base mb-2">Fiyat düşünce haber ver</h3>
      <label className="mb-3 block text-sm">
        <span className="text-xs text-muted-foreground">Eşik (% düşüş)</span>
        <select
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          disabled={subscribed}
          className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value={3}>%3</option>
          <option value={5}>%5</option>
          <option value={10}>%10</option>
        </select>
      </label>
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full rounded-xl py-2 text-sm font-medium ${
          subscribed ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' : 'bg-foreground text-background'
        }`}
      >
        {subscribed ? 'Aboneliği kapat' : 'Abone ol'}
      </button>
    </article>
  )
}

export default PriceDropSubscribe
