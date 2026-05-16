export type MessageSender = 'me' | 'them' | 'system'
export type MessageChannel = 'whatsapp' | 'sahibinden' | 'phone' | 'email' | 'internal'

export interface Message {
  id: string
  sender: MessageSender
  content: string
  time: string
  channel?: MessageChannel
  attachments?: number
}

export interface Conversation {
  id: string
  customerId: string
  customerName: string
  customerAvatarInitials: string
  channel: MessageChannel
  lastPreview: string
  lastAt: string
  unreadCount: number
  pinned?: boolean
  segment: 'Sıcak' | 'Ilık' | 'Soğuk'
  messages: Message[]
}

function iso(daysAgo: number, hourOffset = 0, _minOffset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(d.getHours() - hourOffset)
  d.setMinutes(d.getMinutes() - _minOffset)
  return d.toISOString()
}

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'C-7401',
    customerId: 'M-2401',
    customerName: 'Burhan Kaynak',
    customerAvatarInitials: 'BK',
    channel: 'whatsapp',
    lastPreview: 'Pazar günü ikinci ziyareti yapabilir miyiz?',
    lastAt: iso(0, 1),
    unreadCount: 2,
    pinned: true,
    segment: 'Sıcak',
    messages: [
      {
        id: 'msg-001',
        sender: 'them',
        content: 'Merhabalar, Cunda zeytinlik için fiyat aralığını netleştirebilir miyiz?',
        time: iso(2, 3),
        channel: 'whatsapp',
      },
      {
        id: 'msg-002',
        sender: 'me',
        content:
          'Elbette. Liste fiyatı 5.8M. Pazarlık marjı 200-300K, mülk sahibi 5.5M altına inmek istemiyor.',
        time: iso(2, 2),
        channel: 'whatsapp',
      },
      {
        id: 'msg-003',
        sender: 'them',
        content: 'Anlaşıldı. Pazar günü ikinci ziyareti yapabilir miyiz?',
        time: iso(0, 1, 30),
        channel: 'whatsapp',
      },
      {
        id: 'msg-004',
        sender: 'them',
        content: 'Eşim de gelmek istiyor.',
        time: iso(0, 1),
        channel: 'whatsapp',
      },
    ],
  },
  {
    id: 'C-7398',
    customerId: 'M-2398',
    customerName: 'Selin Aksoy',
    customerAvatarInitials: 'SA',
    channel: 'sahibinden',
    lastPreview: 'Sözleşme imza için Salı uygun mu?',
    lastAt: iso(0, 5),
    unreadCount: 1,
    segment: 'Sıcak',
    messages: [
      {
        id: 'msg-101',
        sender: 'them',
        content: 'Alaçatı için 10.8M ön teklif veriyorum, kabul ediliyor mu?',
        time: iso(1, 6),
        channel: 'sahibinden',
      },
      {
        id: 'msg-102',
        sender: 'me',
        content: 'Mülk sahibi 10.8M üstüne 200K talep ediyor. 11M anlaşırsak imza Salı.',
        time: iso(1, 4),
        channel: 'sahibinden',
      },
      {
        id: 'msg-103',
        sender: 'them',
        content: 'Tamamdır, 11M kabulüm. Sözleşme imza için Salı uygun mu?',
        time: iso(0, 5),
        channel: 'sahibinden',
      },
    ],
  },
  {
    id: 'C-7391',
    customerId: 'M-2391',
    customerName: 'Mehmet Yılmaz',
    customerAvatarInitials: 'MY',
    channel: 'phone',
    lastPreview: 'Kaparo banka havalesini bugün attım.',
    lastAt: iso(0, 8),
    unreadCount: 0,
    segment: 'Sıcak',
    messages: [
      {
        id: 'msg-201',
        sender: 'them',
        content: 'Kaparo banka havalesini bugün attım.',
        time: iso(0, 8),
        channel: 'phone',
      },
      {
        id: 'msg-202',
        sender: 'system',
        content: 'Çağrı 14:30 — 18 dakika sürdü.',
        time: iso(0, 8, 30),
      },
    ],
  },
  {
    id: 'C-7376',
    customerId: 'M-2376',
    customerName: 'Deniz Yıldırım',
    customerAvatarInitials: 'DY',
    channel: 'email',
    lastPreview: 'Bozburun koy için bütçemi yeniden değerlendiriyorum.',
    lastAt: iso(1),
    unreadCount: 0,
    segment: 'Sıcak',
    messages: [
      {
        id: 'msg-301',
        sender: 'them',
        content: 'Bozburun koy için bütçemi yeniden değerlendiriyorum, 22M biraz yüksek.',
        time: iso(1),
        channel: 'email',
      },
    ],
  },
  {
    id: 'C-7369',
    customerId: 'M-2369',
    customerName: 'Pınar Akın',
    customerAvatarInitials: 'PA',
    channel: 'whatsapp',
    lastPreview: 'Urla zeytinlik için fotoğraf gönderebilir misiniz?',
    lastAt: iso(2),
    unreadCount: 0,
    segment: 'Ilık',
    messages: [
      {
        id: 'msg-401',
        sender: 'them',
        content: 'Urla zeytinlik için fotoğraf gönderebilir misiniz?',
        time: iso(2),
        channel: 'whatsapp',
      },
      {
        id: 'msg-402',
        sender: 'me',
        content: 'Hemen drone çekiminden bir set hazırlıyorum, akşam atarım.',
        time: iso(2, 1),
        channel: 'whatsapp',
      },
    ],
  },
  {
    id: 'C-7363',
    customerId: 'M-2363',
    customerName: 'Atilla Karaca',
    customerAvatarInitials: 'AK',
    channel: 'sahibinden',
    lastPreview: 'Söke tarla için kredi onayını bekliyorum.',
    lastAt: iso(3),
    unreadCount: 0,
    segment: 'Ilık',
    messages: [
      {
        id: 'msg-501',
        sender: 'them',
        content: 'Söke tarla için kredi onayını bekliyorum.',
        time: iso(3),
        channel: 'sahibinden',
      },
    ],
  },
  {
    id: 'C-7346',
    customerId: 'M-2346',
    customerName: 'Lale Erdem',
    customerAvatarInitials: 'LE',
    channel: 'whatsapp',
    lastPreview: 'Havran zeytinlik için anlaştık.',
    lastAt: iso(6),
    unreadCount: 0,
    segment: 'Ilık',
    messages: [
      {
        id: 'msg-601',
        sender: 'them',
        content: 'Havran zeytinlik için anlaştık, sözleşme detaylarını ne zaman görüşürüz?',
        time: iso(6),
        channel: 'whatsapp',
      },
      {
        id: 'msg-602',
        sender: 'me',
        content: 'Yarın akşam 17:00 müsait misin? Ofiste imzalayalım.',
        time: iso(6, 1),
        channel: 'whatsapp',
      },
    ],
  },
] as const

export const CHANNEL_LABELS: Record<MessageChannel, string> = {
  whatsapp: 'WhatsApp',
  sahibinden: 'Sahibinden',
  phone: 'Telefon',
  email: 'E-posta',
  internal: 'Dahili not',
}
