// Conversation Sessions (A11 — /sessions)

export interface ConversationSession {
  id: string
  tenantId: string
  userId: string  // ofis çalışanı veya end user
  userName: string
  agentId: string  // 'atolye-assistant' | 'sales-coach' | ...
  startedISO: string
  lastMessageISO: string
  endedISO: string | null
  status: 'active' | 'ended' | 'timeout' | 'flagged'
  messageCount: number
  tokensInput: number
  tokensOutput: number
  costUSD: number
  channel: 'web' | 'mobile' | 'api'
  firstMessage: string  // truncated preview
  hasPiiFlag: boolean  // KVKK audit flag
}

export const CONVERSATION_SESSIONS: ConversationSession[] = [
  { id: 'sess-2026-94821', tenantId: 'atolye-ayv', userId: 'u-ahmet', userName: 'Ahmet Şeker', agentId: 'atolye-assistant', startedISO: '2026-05-11T08:30:00Z', lastMessageISO: '2026-05-11T08:48:00Z', endedISO: null, status: 'active', messageCount: 12, tokensInput: 14820, tokensOutput: 2480, costUSD: 0.082, channel: 'web', firstMessage: 'Cunda denize 80m parsele bakan müşteri var, fiyat geçmişi gösterir misin?', hasPiiFlag: false },
  { id: 'sess-2026-94820', tenantId: 'cesme-ars', userId: 'u-zeynep', userName: 'Zeynep Aksoy', agentId: 'sales-coach', startedISO: '2026-05-11T07:00:00Z', lastMessageISO: '2026-05-11T07:42:00Z', endedISO: '2026-05-11T08:00:00Z', status: 'ended', messageCount: 18, tokensInput: 22480, tokensOutput: 4820, costUSD: 0.142, channel: 'web', firstMessage: 'Alaçatı içi parsel için Mert D. ile teklif görüşmesi öncesi hazırlık.', hasPiiFlag: false },
  { id: 'sess-2026-94819', tenantId: 'atolye-ayv', userId: 'u-berk', userName: 'Berk Demir', agentId: 'atolye-assistant', startedISO: '2026-05-11T06:14:00Z', lastMessageISO: '2026-05-11T06:42:00Z', endedISO: '2026-05-11T07:12:00Z', status: 'timeout', messageCount: 4, tokensInput: 4280, tokensOutput: 840, costUSD: 0.024, channel: 'mobile', firstMessage: 'Bugünkü ziyaretler için liste verir misin?', hasPiiFlag: false },
  { id: 'sess-2026-94818', tenantId: 'bodrum-em', userId: 'u-mehmet', userName: 'Mehmet Yılmaz', agentId: 'atolye-assistant', startedISO: '2026-05-10T22:30:00Z', lastMessageISO: '2026-05-10T22:48:00Z', endedISO: '2026-05-10T23:00:00Z', status: 'flagged', messageCount: 8, tokensInput: 8240, tokensOutput: 1840, costUSD: 0.062, channel: 'web', firstMessage: 'TC: 12345678901 olan müşterinin geçmiş işlemleri...', hasPiiFlag: true },
  { id: 'sess-2026-94817', tenantId: 'fethiye-pa', userId: 'u-deniz', userName: 'Deniz Korkmaz', agentId: 'atolye-assistant', startedISO: '2026-05-10T18:14:00Z', lastMessageISO: '2026-05-10T18:42:00Z', endedISO: '2026-05-10T19:00:00Z', status: 'ended', messageCount: 14, tokensInput: 12480, tokensOutput: 2840, costUSD: 0.084, channel: 'mobile', firstMessage: 'Fethiye Çalış 2+1 daire arayan müşteriye uygun listeler.', hasPiiFlag: false },
  { id: 'sess-2026-94816', tenantId: 'cesme-ars', userId: 'u-can', userName: 'Can Yıldız', agentId: 'sales-coach', startedISO: '2026-05-10T14:00:00Z', lastMessageISO: '2026-05-10T14:24:00Z', endedISO: '2026-05-10T14:30:00Z', status: 'ended', messageCount: 9, tokensInput: 7820, tokensOutput: 1420, costUSD: 0.048, channel: 'web', firstMessage: 'Müşteri "düşünelim" diyor, nasıl ilerleyebilirim?', hasPiiFlag: false },
  { id: 'sess-2026-94815', tenantId: 'datca-koy', userId: 'u-aslihan', userName: 'Aslıhan Kara', agentId: 'atolye-assistant', startedISO: '2026-05-10T11:20:00Z', lastMessageISO: '2026-05-10T11:48:00Z', endedISO: '2026-05-10T12:00:00Z', status: 'flagged', messageCount: 6, tokensInput: 5840, tokensOutput: 1240, costUSD: 0.038, channel: 'api', firstMessage: 'IBAN: TR33 0006 ... olan ödemeyi takip ediyorum, durum nedir?', hasPiiFlag: true },
  { id: 'sess-2026-94814', tenantId: 'atolye-ayv', userId: 'u-pelin', userName: 'Pelin Akın', agentId: 'atolye-assistant', startedISO: '2026-05-10T09:00:00Z', lastMessageISO: '2026-05-10T09:14:00Z', endedISO: '2026-05-10T09:20:00Z', status: 'ended', messageCount: 7, tokensInput: 6240, tokensOutput: 1480, costUSD: 0.042, channel: 'web', firstMessage: 'Cunda merkez 3+1 stoğumuzu gösterir misin?', hasPiiFlag: false },
  { id: 'sess-2026-94813', tenantId: 'bodrum-em', userId: 'u-burak', userName: 'Burak Çelik', agentId: 'sales-coach', startedISO: '2026-05-10T06:30:00Z', lastMessageISO: '2026-05-10T06:48:00Z', endedISO: null, status: 'timeout', messageCount: 3, tokensInput: 2840, tokensOutput: 620, costUSD: 0.018, channel: 'mobile', firstMessage: 'Yarın görüşme öncesi hazırlık', hasPiiFlag: false },
  { id: 'sess-2026-94812', tenantId: 'kemer-vi', userId: 'u-elif', userName: 'Elif Şahin', agentId: 'atolye-assistant', startedISO: '2026-05-09T22:00:00Z', lastMessageISO: '2026-05-09T22:18:00Z', endedISO: '2026-05-09T22:30:00Z', status: 'ended', messageCount: 11, tokensInput: 9840, tokensOutput: 2180, costUSD: 0.068, channel: 'web', firstMessage: 'Kemer Çıralı villa stoğu var mı? Bütçe 18M.', hasPiiFlag: false },
]
