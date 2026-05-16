export type TxnType = 'Tahsilat' | 'Komisyon' | 'Gider' | 'Vergi'
export type TxnStatus = 'Tamamlandı' | 'Bekliyor' | 'Gecikmiş'

export interface Transaction {
  id: string
  date: string
  type: TxnType
  status: TxnStatus
  party: string
  dealId?: string
  description: string
  amount: number
  daysOverdue?: number
}

function iso(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

export const TRANSACTIONS: Transaction[] = [
  {
    id: 'F-3401',
    date: iso(1),
    type: 'Tahsilat',
    status: 'Tamamlandı',
    party: 'Mert Soydan',
    dealId: 'D-2330',
    description: 'Fethiye villa tapu sonrası bakiye',
    amount: 14800000,
  },
  {
    id: 'F-3398',
    date: iso(2),
    type: 'Komisyon',
    status: 'Tamamlandı',
    party: 'Atölye',
    dealId: 'D-2330',
    description: 'Fethiye villa %3 komisyon',
    amount: 504000,
  },
  {
    id: 'F-3392',
    date: iso(5),
    type: 'Tahsilat',
    status: 'Bekliyor',
    party: 'Mehmet Yılmaz',
    dealId: 'D-2391',
    description: 'Cunda kaparosu',
    amount: 840000,
    daysOverdue: 0,
  },
  {
    id: 'F-3388',
    date: iso(8),
    type: 'Tahsilat',
    status: 'Bekliyor',
    party: 'Filiz Uzun',
    dealId: 'D-2320',
    description: 'Çeşme imarlı kaparo ikinci taksit',
    amount: 1500000,
    daysOverdue: 3,
  },
  {
    id: 'F-3385',
    date: iso(12),
    type: 'Komisyon',
    status: 'Bekliyor',
    party: 'Atölye',
    dealId: 'D-2391',
    description: 'Cunda %3 komisyon',
    amount: 252000,
  },
  {
    id: 'F-3380',
    date: iso(15),
    type: 'Gider',
    status: 'Tamamlandı',
    party: 'Marketing',
    description: 'Sahibinden vitrin paketi',
    amount: -32000,
  },
  {
    id: 'F-3378',
    date: iso(18),
    type: 'Tahsilat',
    status: 'Gecikmiş',
    party: 'Tunç Berksoy',
    dealId: 'D-2310',
    description: 'Akçay merkez tapu sonrası bakiye',
    amount: 3360000,
    daysOverdue: 18,
  },
  {
    id: 'F-3375',
    date: iso(22),
    type: 'Vergi',
    status: 'Tamamlandı',
    party: 'Mali Müşavir',
    description: 'KDV beyannamesi Mart',
    amount: -68400,
  },
  {
    id: 'F-3370',
    date: iso(28),
    type: 'Gider',
    status: 'Tamamlandı',
    party: 'Ofis',
    description: 'Kira + utility Mart',
    amount: -42000,
  },
  {
    id: 'F-3365',
    date: iso(34),
    type: 'Tahsilat',
    status: 'Gecikmiş',
    party: 'Selin Aksoy',
    dealId: 'D-2398',
    description: 'Alaçatı bağ evi kaparo',
    amount: 1080000,
    daysOverdue: 34,
  },
  {
    id: 'F-3360',
    date: iso(40),
    type: 'Komisyon',
    status: 'Tamamlandı',
    party: 'Atölye',
    dealId: 'D-2310',
    description: 'Akçay merkez %3 komisyon',
    amount: 126000,
  },
  {
    id: 'F-3340',
    date: iso(60),
    type: 'Gider',
    status: 'Tamamlandı',
    party: 'Yazılım',
    description: 'CRM aylık abonelik',
    amount: -8400,
  },
] as const

export interface MonthlyCashflow {
  month: string
  tahsilat: number
  komisyon: number
  gider: number
  net: number
}

export const CASHFLOW_6MO: MonthlyCashflow[] = [
  { month: 'Kas', tahsilat: 1800000, komisyon: 320000, gider: -180000, net: 1940000 },
  { month: 'Ara', tahsilat: 2100000, komisyon: 410000, gider: -210000, net: 2300000 },
  { month: 'Oca', tahsilat: 1650000, komisyon: 280000, gider: -195000, net: 1735000 },
  { month: 'Şub', tahsilat: 2400000, komisyon: 520000, gider: -240000, net: 2680000 },
  { month: 'Mar', tahsilat: 2900000, komisyon: 680000, gider: -260000, net: 3320000 },
  { month: 'Nis', tahsilat: 3400000, komisyon: 740000, gider: -285000, net: 3855000 },
]

export interface AgingBucket {
  label: string
  count: number
  amount: number
}

export function pendingByAge(): AgingBucket[] {
  const pending = TRANSACTIONS.filter(
    (t) => t.type === 'Tahsilat' && (t.status === 'Bekliyor' || t.status === 'Gecikmiş'),
  )
  const buckets: AgingBucket[] = [
    { label: '< 7 gün', count: 0, amount: 0 },
    { label: '7-30 gün', count: 0, amount: 0 },
    { label: '30+ gün', count: 0, amount: 0 },
  ]
  for (const t of pending) {
    const d = t.daysOverdue ?? 0
    const idx = d < 7 ? 0 : d < 30 ? 1 : 2
    buckets[idx].count++
    buckets[idx].amount += t.amount
  }
  return buckets
}

export function financeKpis() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const tahsilatBuMonth = TRANSACTIONS.filter(
    (t) => t.type === 'Tahsilat' && t.status === 'Tamamlandı' && new Date(t.date).getTime() >= monthStart,
  ).reduce((s, t) => s + t.amount, 0)

  const bekleyen = TRANSACTIONS.filter(
    (t) => t.type === 'Tahsilat' && (t.status === 'Bekliyor' || t.status === 'Gecikmiş'),
  ).reduce((s, t) => s + t.amount, 0)

  const komisyonBuMonth = TRANSACTIONS.filter(
    (t) => t.type === 'Komisyon' && t.status === 'Tamamlandı' && new Date(t.date).getTime() >= monthStart,
  ).reduce((s, t) => s + t.amount, 0)

  const giderBuMonth = TRANSACTIONS.filter(
    (t) =>
      (t.type === 'Gider' || t.type === 'Vergi') &&
      t.status === 'Tamamlandı' &&
      new Date(t.date).getTime() >= monthStart,
  ).reduce((s, t) => s + Math.abs(t.amount), 0)

  return { tahsilatBuMonth, bekleyen, komisyonBuMonth, giderBuMonth }
}
