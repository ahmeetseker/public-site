/**
 * Mock seed: trust & safety bireysel scope.
 * - 8 anlaşmazlık (`/hesabim/anlasmazliklar`)
 * - 4 ticket thread (`/hesabim/destek/[id]`)
 * - 12 FAQ entry (`/destek`)
 */

import type { Dispute, FaqEntry, SupportTicket, TicketMessage } from '../types/trust'

function iso(daysAgo: number, hour = 12): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

const USER = 'user-self'

// ─── FAQ ─────────────────────────────────────────────────────────────────────

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: 'faq-001',
    category: 'hesap',
    question: 'Hesabımı nasıl silerim?',
    answer:
      'Hesabımdan **Ayarlar → Hesabı Sil** menüsüne gidip onaylayabilirsin. İşlem 14 gün içinde geri alınabilir.',
    order: 100,
    relatedGuideSlug: 'hesap-yonetimi',
  },
  {
    id: 'faq-002',
    category: 'odeme',
    question: 'Ödememi nasıl iade alabilirim?',
    answer:
      '**Hesabım → Ödemeler** sayfasından ilgili ödemeyi seç, "İade talep et" butonuna bas. 5 iş günü içinde sonuçlandırılır.',
    order: 95,
  },
  {
    id: 'faq-003',
    category: 'ilan',
    question: 'İlanımı nasıl öne çıkarırım?',
    answer:
      'İlanı yayınla → ilan detayında **Öne çıkar** butonuna bas. 7 gün boyunca aramalarda üstte gösterilir.',
    order: 90,
  },
  {
    id: 'faq-004',
    category: 'guvenlik',
    question: 'İki adımlı doğrulamayı nasıl açarım?',
    answer: '**Hesabım → Güvenlik** sayfasında SMS veya kimlik uygulaması ile etkinleştirebilirsin.',
    order: 85,
  },
  {
    id: 'faq-005',
    category: 'iletisim',
    question: 'Mesajlarım neden gelmiyor?',
    answer:
      'Bildirim tercihlerini kontrol et: **Hesabım → Bildirim Tercihleri**. Spam klasörünü de unutma.',
    order: 80,
  },
  {
    id: 'faq-006',
    category: 'genel',
    question: 'Premium üyelik ne avantaj sağlar?',
    answer:
      'Aylık 50 ilan, sınırsız öne çıkarma, gelişmiş analitik. Detay için /premium sayfası.',
    order: 75,
  },
  {
    id: 'faq-007',
    category: 'odeme',
    question: 'Hangi ödeme yöntemleri kabul ediliyor?',
    answer: 'Visa, Mastercard, Troy kartlar; banka havalesi ve LandX cüzdan kredisi.',
    order: 70,
  },
  {
    id: 'faq-008',
    category: 'ilan',
    question: 'İlanım neden onaylanmadı?',
    answer:
      'En sık nedenler: eksik fotoğraf, yanlış kategori, yetersiz tapu bilgisi. Detaylı geri bildirim e-postanda.',
    order: 65,
  },
  {
    id: 'faq-009',
    category: 'guvenlik',
    question: 'Şifremi unuttum, ne yapmalıyım?',
    answer: 'Giriş ekranında **Şifremi unuttum** linkine tıkla, e-postana sıfırlama bağlantısı gelir.',
    order: 60,
  },
  {
    id: 'faq-010',
    category: 'iletisim',
    question: 'Telefon numaramı nasıl gizlerim?',
    answer:
      'İlan oluştururken **Telefon numarasını gizle** kutusunu işaretle. Mesajlar üzerinden iletişim kurulur.',
    order: 55,
  },
  {
    id: 'faq-011',
    category: 'genel',
    question: 'Komisyon alıyor musunuz?',
    answer: 'Hayır. LandX kullanıcılar arası işlemden komisyon almaz; sadece üyelik ücreti vardır.',
    order: 50,
  },
  {
    id: 'faq-012',
    category: 'hesap',
    question: 'E-posta adresimi nasıl değiştirebilirim?',
    answer: '**Hesabım → Profil → E-posta**. Yeni adrese doğrulama bağlantısı gönderilir.',
    order: 45,
  },
] as const

// ─── Disputes ────────────────────────────────────────────────────────────────

export const DISPUTES_INDIVIDUAL: Dispute[] = [
  {
    id: 'DSP-2026-0008',
    userId: USER,
    listingId: 'L-3142',
    category: 'fraud',
    description:
      'İlan sahibi tapu bilgisi vermiyor, ödemeyi tahsil edip ortadan kaybolmaya çalışıyor.',
    status: 'investigating',
    createdAt: iso(3),
    updates: [
      { author: 'user', text: 'Şikayet açıldı, ekran görüntüleri eklendi.', at: iso(3) },
      { author: 'support', text: 'Talebiniz incelemeye alındı, 48 saat içinde dönüş yapılacak.', at: iso(2) },
      { author: 'support', text: 'İlan sahibi ile iletişim kuruldu, geri dönüş bekleniyor.', at: iso(1) },
    ],
  },
  {
    id: 'DSP-2026-0007',
    userId: USER,
    listingId: 'L-2987',
    category: 'incorrect',
    description: 'İlan açıklamasında "imarlı" yazıyor ama tapu kontrolünde tarla çıktı.',
    status: 'open',
    createdAt: iso(5),
    updates: [
      { author: 'user', text: 'Tapu örneği eklendi.', at: iso(5) },
    ],
  },
  {
    id: 'DSP-2026-0006',
    userId: USER,
    listingId: 'L-2854',
    category: 'inappropriate',
    description: 'İlan açıklamasında uygunsuz dil kullanılmış.',
    status: 'resolved',
    createdAt: iso(12),
    updates: [
      { author: 'user', text: 'Şikayet açıldı.', at: iso(12) },
      { author: 'support', text: 'İlan kaldırıldı, satıcıya uyarı verildi.', at: iso(10) },
    ],
  },
  {
    id: 'DSP-2026-0005',
    userId: USER,
    counterpartyId: 'user-pln-1004',
    category: 'fraud',
    description: 'Karşı taraf kaparoyu aldı sonra "vazgeçtim" dedi, iade etmedi.',
    status: 'investigating',
    createdAt: iso(15),
    updates: [
      { author: 'user', text: 'Banka dekontu eklendi.', at: iso(15) },
      { author: 'support', text: 'Karşı tarafa tebligat yapıldı.', at: iso(13) },
    ],
  },
  {
    id: 'DSP-2026-0004',
    userId: USER,
    listingId: 'L-2611',
    category: 'incorrect',
    description: 'İlan koordinatları yanlış, gittiğim adres farklı.',
    status: 'rejected',
    createdAt: iso(28),
    updates: [
      { author: 'user', text: 'Yanlış lokasyon şikayeti.', at: iso(28) },
      { author: 'support', text: 'Koordinatlar doğrulandı, ilan doğru lokasyonda. Talep reddedildi.', at: iso(26) },
    ],
  },
  {
    id: 'DSP-2026-0003',
    userId: USER,
    listingId: 'L-2398',
    category: 'other',
    description: 'İlan görsellerinde başka mülkün fotoğrafları var.',
    status: 'resolved',
    createdAt: iso(35),
    updates: [
      { author: 'user', text: 'Görsel uyumsuzluğu raporu.', at: iso(35) },
      { author: 'support', text: 'Satıcıdan doğru görseller talep edildi, ilan güncellendi.', at: iso(32) },
    ],
  },
  {
    id: 'DSP-2026-0002',
    userId: USER,
    counterpartyId: 'user-pln-1006',
    category: 'fraud',
    description: 'Satıcı pazarlık sonrası fiyatı değiştirdi.',
    status: 'rejected',
    createdAt: iso(42),
    updates: [
      { author: 'user', text: 'Fiyat değişikliği şikayeti.', at: iso(42) },
      { author: 'support', text: 'Pazarlık fiyatı kayıt altına alınmamış. Talep reddedildi.', at: iso(40) },
    ],
  },
  {
    id: 'DSP-2026-0001',
    userId: USER,
    listingId: 'L-2104',
    category: 'inappropriate',
    description: 'İlan başlığı yanıltıcı reklam içeriyor.',
    status: 'resolved',
    createdAt: iso(58),
    updates: [
      { author: 'user', text: 'Yanıltıcı başlık şikayeti.', at: iso(58) },
      { author: 'support', text: 'Başlık güncellendi.', at: iso(55) },
    ],
  },
]

// ─── Support tickets ─────────────────────────────────────────────────────────

function buildTicketMessages(threadId: string, items: Array<{ daysAgo: number; author: TicketMessage['author']; authorName: string; text: string }>): TicketMessage[] {
  return items.map((m, i) => ({
    id: `${threadId}-msg-${(i + 1).toString().padStart(3, '0')}`,
    author: m.author,
    authorName: m.authorName,
    text: m.text,
    at: iso(m.daysAgo, 9 + i),
  }))
}

export const SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-2026-0142',
    userId: USER,
    subject: 'İlan yayınlamada sürekli "ağ hatası" alıyorum',
    category: 'ilan',
    status: 'open',
    priority: 'high',
    createdAt: iso(1),
    updatedAt: iso(0),
    messages: buildTicketMessages('TKT-2026-0142', [
      { daysAgo: 1, author: 'user', authorName: 'Ahmet Şeker', text: 'İlan formunu doldurup gönder dediğimde "ağ hatası" mesajı çıkıyor. 5 kez denedim.' },
      { daysAgo: 1, author: 'support', authorName: 'LandX Destek', text: 'Merhaba, hangi tarayıcı ve cihazı kullandığınızı paylaşabilir misiniz?' },
      { daysAgo: 0, author: 'user', authorName: 'Ahmet Şeker', text: 'iPhone 14 Pro, Safari 17.4. WiFi üzerinden bağlıyım.' },
    ]),
  },
  {
    id: 'TKT-2026-0098',
    userId: USER,
    subject: 'Premium üyelik ücreti iki kere düştü',
    category: 'odeme',
    status: 'pending',
    priority: 'urgent',
    createdAt: iso(4),
    updatedAt: iso(2),
    messages: buildTicketMessages('TKT-2026-0098', [
      { daysAgo: 4, author: 'user', authorName: 'Ahmet Şeker', text: 'Ekstreden gördüm, 299 TL üyelik ücreti aynı gün iki kez kesilmiş.' },
      { daysAgo: 3, author: 'support', authorName: 'LandX Destek', text: 'Talebinizi finans ekibine ilettik. 3 iş günü içinde iade gerçekleşecek.' },
      { daysAgo: 2, author: 'system', authorName: 'Sistem', text: 'İade işlemi başlatıldı: PAY-2026-0354 → -299.00 TL' },
    ]),
  },
  {
    id: 'TKT-2026-0067',
    userId: USER,
    subject: 'Hesabıma giriş yapamıyorum',
    category: 'guvenlik',
    status: 'closed',
    priority: 'normal',
    createdAt: iso(18),
    updatedAt: iso(16),
    closedAt: iso(16),
    messages: buildTicketMessages('TKT-2026-0067', [
      { daysAgo: 18, author: 'user', authorName: 'Ahmet Şeker', text: 'Şifremi sıfırladım ama giriş yine "geçersiz" diyor.' },
      { daysAgo: 17, author: 'support', authorName: 'LandX Destek', text: 'Hesabınız 2 başarısız denemeden sonra kilitlenmiş. Açtık, tekrar deneyin.' },
      { daysAgo: 16, author: 'user', authorName: 'Ahmet Şeker', text: 'Teşekkürler, çalışıyor.' },
      { daysAgo: 16, author: 'system', authorName: 'Sistem', text: 'Talep "çözüldü" olarak işaretlendi.' },
    ]),
  },
  {
    id: 'TKT-2026-0041',
    userId: USER,
    subject: 'Bildirim e-postaları gelmiyor',
    category: 'iletisim',
    status: 'closed',
    priority: 'low',
    createdAt: iso(34),
    updatedAt: iso(31),
    closedAt: iso(31),
    messages: buildTicketMessages('TKT-2026-0041', [
      { daysAgo: 34, author: 'user', authorName: 'Ahmet Şeker', text: 'Yeni mesaj bildirimleri e-postaya düşmüyor.' },
      { daysAgo: 33, author: 'support', authorName: 'LandX Destek', text: 'E-posta sağlayıcınız (gmail) bizim alanı spam olarak işaretlemiş. Beyaz listeye ekledik.' },
      { daysAgo: 31, author: 'user', authorName: 'Ahmet Şeker', text: 'Şimdi geliyor, teşekkürler.' },
    ]),
  },
]
