export type EventType = 'visit' | 'deed' | 'task' | 'meeting' | 'reminder'

export interface CalendarEvent {
  id: string
  type: EventType
  title: string
  date: string
  time?: string
  durationMin?: number
  owner: string
  location?: string
  dealId?: string
  customerName?: string
  notes?: string
}

const TYPE_LABELS: Record<EventType, string> = {
  visit: 'Yer gösterimi',
  deed: 'Tapu randevusu',
  task: 'Görev',
  meeting: 'Ekip toplantısı',
  reminder: 'Hatırlatma',
}

export function eventTypeLabel(type: EventType): string {
  return TYPE_LABELS[type]
}

function dateAt(daysFromToday: number, hour = 0, min = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  d.setHours(hour, min, 0, 0)
  return d.toISOString()
}

export const EVENTS: CalendarEvent[] = [
  {
    id: 'E-9201',
    type: 'visit',
    title: 'Cunda · Mehmet Yılmaz ziyaret',
    date: dateAt(0, 14, 0),
    time: '14:00',
    durationMin: 90,
    owner: 'Ahmet',
    location: 'Cunda · denize 80m parsel',
    dealId: 'D-2391',
    customerName: 'Mehmet Yılmaz',
  },
  {
    id: 'E-9203',
    type: 'meeting',
    title: 'Haftalık satış sync',
    date: dateAt(0, 10, 0),
    time: '10:00',
    durationMin: 30,
    owner: 'Tüm ekip',
    notes: 'Sıcak müşteri pipeline review',
  },
  {
    id: 'E-9206',
    type: 'task',
    title: 'Datça villa fotoğraf çekimi',
    date: dateAt(1, 11, 30),
    time: '11:30',
    owner: 'Ayşe',
    location: 'Datça · 2.150 m²',
    dealId: 'D-2374',
  },
  {
    id: 'E-9208',
    type: 'visit',
    title: 'Alaçatı bağ evi · Selin Aksoy',
    date: dateAt(1, 15, 30),
    time: '15:30',
    durationMin: 60,
    owner: 'Ayşe',
    location: 'Çeşme · Alaçatı bağ evi imarlı',
    dealId: 'D-2398',
    customerName: 'Selin Aksoy',
  },
  {
    id: 'E-9211',
    type: 'deed',
    title: 'Fethiye villa tapu',
    date: dateAt(2, 9, 30),
    time: '09:30',
    durationMin: 120,
    owner: 'Ayşe',
    location: 'Fethiye Tapu Müdürlüğü',
    dealId: 'D-2330',
    customerName: 'Mert Soydan',
  },
  {
    id: 'E-9214',
    type: 'reminder',
    title: 'Selin Aksoy sözleşme imza',
    date: dateAt(2, 17, 0),
    time: '17:00',
    owner: 'Ayşe',
    dealId: 'D-2398',
  },
  {
    id: 'E-9217',
    type: 'visit',
    title: 'Ayvalık zeytinlik · Burhan Kaynak ikinci ziyaret',
    date: dateAt(3, 13, 0),
    time: '13:00',
    durationMin: 120,
    owner: 'Ahmet',
    location: 'Ayvalık Sarımsaklı zeytinlik',
    dealId: 'D-2401',
    customerName: 'Burhan Kaynak',
  },
  {
    id: 'E-9220',
    type: 'task',
    title: 'Aylık reklam bütçesi planla',
    date: dateAt(3, 16, 0),
    time: '16:00',
    owner: 'Ahmet',
  },
  {
    id: 'E-9224',
    type: 'meeting',
    title: 'Mali müşavir görüşme',
    date: dateAt(4, 11, 0),
    time: '11:00',
    durationMin: 45,
    owner: 'Ahmet',
    notes: 'Mart KDV beyanname kapanışı',
  },
  {
    id: 'E-9227',
    type: 'deed',
    title: 'Cunda tapu randevusu',
    date: dateAt(5, 10, 0),
    time: '10:00',
    durationMin: 90,
    owner: 'Ahmet',
    location: 'Ayvalık Tapu Müdürlüğü',
    dealId: 'D-2391',
    customerName: 'Mehmet Yılmaz',
  },
  {
    id: 'E-9230',
    type: 'visit',
    title: 'Söke tarla · Atilla Karaca',
    date: dateAt(6, 14, 30),
    time: '14:30',
    durationMin: 90,
    owner: 'Berk',
    location: 'Söke · ovaya bakan tarla',
    dealId: 'D-2363',
    customerName: 'Atilla Karaca',
  },
  {
    id: 'E-9233',
    type: 'task',
    title: 'Yeni 6 ilanın drone çekimi',
    date: dateAt(7, 10, 0),
    time: '10:00',
    owner: 'Ayşe',
  },
  {
    id: 'E-9236',
    type: 'meeting',
    title: 'Aylık portföy review',
    date: dateAt(8, 14, 0),
    time: '14:00',
    durationMin: 60,
    owner: 'Tüm ekip',
  },
  {
    id: 'E-9240',
    type: 'visit',
    title: 'Marmaris koy · Deniz Yıldırım',
    date: dateAt(9, 11, 0),
    time: '11:00',
    durationMin: 180,
    owner: 'Berk',
    location: 'Marmaris Bozburun koy',
    dealId: 'D-2376',
    customerName: 'Deniz Yıldırım',
  },
  {
    id: 'E-9243',
    type: 'deed',
    title: 'Çeşme imarlı tapu',
    date: dateAt(10, 13, 30),
    time: '13:30',
    owner: 'Ahmet',
    dealId: 'D-2320',
    customerName: 'Filiz Uzun',
  },
] as const

export function eventsOnDay(d: Date): CalendarEvent[] {
  const key = d.toDateString()
  return EVENTS.filter((e) => new Date(e.date).toDateString() === key)
}

export function eventsCountByDay(month: number, year: number): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const e of EVENTS) {
    const d = new Date(e.date)
    if (d.getMonth() === month && d.getFullYear() === year) {
      const key = d.toDateString()
      counts[key] = (counts[key] ?? 0) + 1
    }
  }
  return counts
}
