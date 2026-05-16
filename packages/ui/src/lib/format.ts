const TL_FORMATTER = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
})

const COMPACT_TL = new Intl.NumberFormat('tr-TR', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
})

export function formatTL(amount: number): string {
  return TL_FORMATTER.format(amount)
}

export function formatTLCompact(amount: number): string {
  return `₺ ${COMPACT_TL.format(amount)}`
}

export function formatArea(m2: number): string {
  if (m2 >= 10000) return `${(m2 / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} bin m²`
  return `${m2.toLocaleString('tr-TR')} m²`
}

export function timeAgo(iso: string): string {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'şimdi'
  if (minutes < 60) return `${minutes} dk önce`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} sa önce`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} gün önce`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} hafta önce`
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
}
