/**
 * Mock seed: AI chat konuşmaları (`/hesabim/asistan`).
 * 12 konuşma, her birinde 4-15 mesaj. Bazı assistant mesajlarında `toolCalls`.
 * Türkçe içerik, ISO 8601 tarih (UTC).
 */

import type { AiConversation, AiMessage } from '../types/ai'

function iso(daysAgo: number, hour = 12, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

const USER = 'demo-user'

function user(content: string, daysAgo: number, hour: number, minute = 0): AiMessage {
  return { role: 'user', content, createdAt: iso(daysAgo, hour, minute) }
}

function assistant(
  content: string,
  daysAgo: number,
  hour: number,
  minute = 0,
  toolCalls?: AiMessage['toolCalls'],
): AiMessage {
  return {
    role: 'assistant',
    content,
    createdAt: iso(daysAgo, hour, minute),
    ...(toolCalls ? { toolCalls } : {}),
  }
}

export const AI_CONVERSATIONS: AiConversation[] = [
  {
    id: 'conv-001',
    userId: USER,
    title: 'Çeşme\'de arsa arıyorum',
    createdAt: iso(0, 9),
    updatedAt: iso(0, 9, 18),
    messages: [
      user('Çeşme\'de villa imarlı arsa arıyorum, bütçem 8 milyon TL', 0, 9, 0),
      assistant(
        'Çeşme\'de bu bütçeye uygun 6 ilan buldum. Alaçatı tarafında 1.200-1.800 m² aralığında, ortalama m² fiyatı 5.500 TL. Hangi mahalleyi tercih edersin?',
        0,
        9,
        2,
        [
          {
            name: 'search_listings',
            args: { city: 'İzmir', district: 'Çeşme', maxPrice: 8_000_000, type: 'Villa Arsası' },
            result: { count: 6, ids: ['09.CS.0033', '09.UR.0114'] },
          },
        ],
      ),
      user('Alaçatı önceliklim. Manzaralı olsun', 0, 9, 5),
      assistant(
        'Alaçatı\'da deniz manzaralı 3 ilan var: (1) 09.CS.0033 — 7.2M, 1.450 m², (2) köşe parsel 6.8M, 1.150 m², (3) 7.9M imarlı 1.620 m². Hangisini detaylı inceleyelim?',
        0,
        9,
        7,
      ),
      user('İlk ilanın değerlemesi makul mü?', 0, 9, 12),
      assistant(
        '09.CS.0033 için AI değerlemem 6.8-7.6M aralığında (orta nokta 7.2M, %78 güven). Mevcut fiyat orta noktada — pazarlık marjı sınırlı. Karşılaştırılabilir 4 ilan ortalaması 7.1M.',
        0,
        9,
        15,
        [
          {
            name: 'get_valuation',
            args: { listingId: '09.CS.0033' },
            result: { estimate: 7_200_000_00, confidence: 0.78 },
          },
        ],
      ),
      user('Tapuyu kontrol edebilir miyim?', 0, 9, 17),
      assistant(
        'Elbette. Tapunun fotoğrafını ya da PDF\'ini yükle, OCR aracıyla 30 saniyede ada/parsel/imar/risk analizini çıkartırım.',
        0,
        9,
        18,
      ),
    ],
  },
  {
    id: 'conv-002',
    userId: USER,
    title: 'Bu ilanın değeri makul mü?',
    createdAt: iso(1, 14),
    updatedAt: iso(1, 14, 20),
    messages: [
      user('48.DT.0028 — Datça merkez villa imarlı 14.2M. Adil mi?', 1, 14, 0),
      assistant(
        'Datça merkez 2.150 m² villa imarlı için AI değerlemem 12.8-15.2M aralığında (%82 güven). 14.2M orta noktanın biraz üstü ama bölgenin son 6 ay trendi (+18%) ve köşe parsel olması primi haklı kılıyor.',
        1,
        14,
        3,
        [
          {
            name: 'get_valuation',
            args: { listingId: '48.DT.0028' },
            result: { estimate: 14_000_000_00, confidence: 0.82 },
          },
        ],
      ),
      user('Pazarlık marjı ne kadar?', 1, 14, 8),
      assistant(
        'Bölgenin ortalama indirim oranı %4-7. Bu ilanda 600K-1M civarı (yani 13.2-13.6M) gerçekçi bir teklif olabilir. Satıcının ilan tarihi: 23 gün önce, henüz kritik eşikte değil.',
        1,
        14,
        12,
      ),
      user('Anladım. Gözleme alayım', 1, 14, 18),
      assistant('Tamam, ilanı favorilere ekledim. Fiyat değişirse seni uyaracağım.', 1, 14, 20),
    ],
  },
  {
    id: 'conv-003',
    userId: USER,
    title: 'Tapu sorunlu mu öğrenmek istiyorum',
    createdAt: iso(2, 11),
    updatedAt: iso(2, 11, 25),
    messages: [
      user('Almak istediğim tapuda ipotek olabilir, nasıl kontrol ederim?', 2, 11, 0),
      assistant(
        '3 yöntem: (1) Tapu Müdürlüğü\'nde "tapu kaydı sorgulama", (2) e-Devlet üzerinden "Tapu Bilgileri", (3) burada OCR aracımıza tapuyu yükle — ipotek/haciz/şerh otomatik çıkar.',
        2,
        11,
        2,
      ),
      user('OCR aracını nasıl kullanırım?', 2, 11, 5),
      assistant(
        'Şu adımları izle: (1) "Tapu Yükle" butonu, (2) PDF veya fotoğraf seç, (3) 30 saniye bekle. Sonuç olarak ada, parsel, alan, cins, imar durumu ve risk listesi (severity ile) görünür.',
        2,
        11,
        8,
      ),
      user('Yükledim — sonuç ne diyor?', 2, 11, 18),
      assistant(
        'Tapunda Garanti BBVA lehine 1.2M TL ipotek var (severity: high). Satış öncesi ipotek fekkini şart koş. Diğer alanlar temiz: ada 142, parsel 18, 1.450 m², imarlı.',
        2,
        11,
        20,
        [
          {
            name: 'read_tapu',
            args: { fileUrl: 'mock://tapu-12.pdf' },
            result: { risks: [{ type: 'ipotek', severity: 'high' }] },
          },
        ],
      ),
      user('İpotek fekkini satıcı yapar mı?', 2, 11, 23),
      assistant(
        'Genellikle satış bedelinden bankaya ödeme ile fek yapılır. Tapu devri öncesi banka onayı şart. Avukatla sözleşmeye "satış bedelinden öncelikle ipotek bedeli bankaya ödenir" maddesi eklet.',
        2,
        11,
        25,
      ),
    ],
  },
  {
    id: 'conv-004',
    userId: USER,
    title: 'Ayvalık vs. Çeşme yatırım',
    createdAt: iso(3, 10),
    updatedAt: iso(3, 10, 30),
    messages: [
      user('500K bütçeyle Ayvalık mı Çeşme mi alırım?', 3, 10, 0),
      assistant(
        'Bütçenle Çeşme\'de imkanın çok dar (m² ort. 5.500 TL). Ayvalık\'ta 60-80 m² küçük arsa olur ama yatırım anlamı taşımaz. Önerilerim: (1) Datça (m² ~4.000), (2) Urla iç kesim (m² ~2.800), (3) Edremit/Akçay (m² ~3.500).',
        3,
        10,
        3,
      ),
      user('Edremit detay verir misin?', 3, 10, 8),
      assistant(
        'Edremit/Akçay merkez 920 m² imarlı 4.2M\'lik 17.AK.0102 ilanı dikkat çekici. m² fiyatı 4.560 TL, sahile 350m. Son 12 ayda Edremit\'te değer artışı %22.',
        3,
        10,
        10,
        [
          {
            name: 'get_market_report',
            args: { regionSlug: 'edremit' },
            result: { yoy: 22, demandHeat: 64 },
          },
        ],
      ),
      user('Risk var mı?', 3, 10, 15),
      assistant(
        '2 ana risk: (1) Edremit imar planı 2027\'de yenilenecek — bazı parsellerin durumu değişebilir, (2) Akçay merkez yoğunlaşıyor, manzaralı parseller hızla tükeniyor.',
        3,
        10,
        18,
      ),
      user('Görmeye gidebilir miyim?', 3, 10, 25),
      assistant(
        'İlan sahibi 0532 ile başlayan numarayı paylaşmış. "İletişime Geç" butonundan WhatsApp\'tan randevu alabilirsin. Ben hatırlatma kuralım?',
        3,
        10,
        30,
      ),
    ],
  },
  {
    id: 'conv-005',
    userId: USER,
    title: 'İmar planı nasıl okunur?',
    createdAt: iso(5, 16),
    updatedAt: iso(5, 16, 22),
    messages: [
      user('İmar planındaki E:1.20 ne demek?', 5, 16, 0),
      assistant(
        'E (Emsal) = Toplam İnşaat Alanı / Parsel Alanı. E:1.20 demek 1.000 m² parselde 1.200 m² inşaat hakkı var. h_max varsa kat sınırı belirler.',
        5,
        16,
        2,
      ),
      user('TAKS ve KAKS ne?', 5, 16, 5),
      assistant(
        'TAKS (Taban Alanı Kat Sayısı) = Bina taban alanı / Parsel. Örn. 0.30 = 1.000 m² parselde 300 m² zemin oturum. KAKS = E ile aynı (Kat Alanı Kat Sayısı).',
        5,
        16,
        7,
      ),
      user('Çekme mesafesi?', 5, 16, 12),
      assistant(
        'Yapının komşu parsel ve yola bakan minimum uzaklıkları (genelde 5m yol, 3m yan/arka). Plan notlarında "yan bahçe mesafesi" diye geçer.',
        5,
        16,
        15,
      ),
      user('İyi anlattın, teşekkürler', 5, 16, 22),
    ],
  },
  {
    id: 'conv-006',
    userId: USER,
    title: 'Cunda zeytinlik yatırım',
    createdAt: iso(6, 13),
    updatedAt: iso(6, 13, 18),
    messages: [
      user('Cunda zeytinliği 28.AY.0142 — alır mıyım?', 6, 13, 0),
      assistant(
        '28.AY.0142 imarlı, 1.240 m², 8.4M TL — m² 6.770 TL. AI değerlemem 7.8-8.9M aralığında. Deniz manzaralı + yola cephe primi mevcut. %76 güvenle adil fiyat.',
        6,
        13,
        3,
        [
          {
            name: 'get_valuation',
            args: { listingId: '28.AY.0142' },
            result: { estimate: 8_350_000_00, confidence: 0.76 },
          },
        ],
      ),
      user('Kullanım amacım yazlık değil, zeytin tarımı', 6, 13, 8),
      assistant(
        'O zaman imarlı parsel pahalı kalır. Tarım amaçlı zeytinlik için 09.UR.0188 (Urla Zeytinalanı, 4.500 m², 3.6M, m² 800 TL) çok daha uygun. Mevcut zeytin ağaçları hazır gelir.',
        6,
        13,
        12,
      ),
      user('Urla\'yı düşüneyim', 6, 13, 18),
    ],
  },
  {
    id: 'conv-007',
    userId: USER,
    title: 'Banka kredisi ile arsa',
    createdAt: iso(7, 11),
    updatedAt: iso(7, 11, 16),
    messages: [
      user('Arsa için kredi alabilir miyim?', 7, 11, 0),
      assistant(
        'Evet ama ev kredisinden zor. Şartlar: (1) Tapu imarlı olmalı, (2) %50 peşinat tipik, (3) Vade 60-120 ay, (4) Faiz %3.49-3.89/ay (mevcut). Garanti, İş Bankası ve Yapı Kredi en aktif olanlar.',
        7,
        11,
        3,
      ),
      user('Tarım arazisi için?', 7, 11, 8),
      assistant(
        'Tarım arazisi için Ziraat Bankası özel paketi var (yıllık %1.69 sübvansiyonlu). Şart: arazi tarımsal amaçla kullanılacak ve ÇKS kaydı olacak. Vade 7 yıla kadar.',
        7,
        11,
        12,
      ),
      user('Hesap simülasyonu yapabilir misin?', 7, 11, 14),
      assistant(
        'Tabii. 5M TL arsa için: Peşinat 2.5M, Kredi 2.5M, 60 ay, %3.59/ay → Aylık taksit ~125.000 TL. Toplam geri ödeme ~7.5M.',
        7,
        11,
        16,
      ),
    ],
  },
  {
    id: 'conv-008',
    userId: USER,
    title: 'İlanımı öne çıkarmalı mıyım?',
    createdAt: iso(9, 14),
    updatedAt: iso(9, 14, 8),
    messages: [
      user('Sattığım ilan 18 gündür gösterilmiyor. Öne çıkarayım mı?', 9, 14, 0),
      assistant(
        'İstatistiklerine baktım: 18 günde 84 görüntüleme, 3 mesaj. Ortalama altı performans. Öne çıkarma 49 TL/7gün ve görüntülemeyi 4-6x artırıyor. ROI yüksek — öneririm.',
        9,
        14,
        3,
        [
          {
            name: 'get_listing_stats',
            args: { listingId: 'user-self-listing-3' },
            result: { views: 84, messages: 3, avgViewsForCategory: 210 },
          },
        ],
      ),
      user('Fiyatı düşürsem mi?', 9, 14, 6),
      assistant(
        'Önce öne çıkarmayı dene (1 hafta). Veri olmadan fiyat düşürmek erken — pazar talebini test et. 7 gün sonra hâlâ mesaj yoksa o zaman %5-8 düşürelim.',
        9,
        14,
        8,
      ),
    ],
  },
  {
    id: 'conv-009',
    userId: USER,
    title: 'Bodrum yarımadası araştırma',
    createdAt: iso(11, 10),
    updatedAt: iso(11, 10, 20),
    messages: [
      user('Bodrum\'da deniz görüş şart, bütçe 12M', 11, 10, 0),
      assistant(
        'Bodrum yarımadasında deniz manzaralı 12M üstü 8 ilan var. En dikkat çekici: 48.MR.0044 (Marmaris Hisarönü), 48.FT.0072 (Fethiye Çiftlik), 48.DT.0091 (Datça Mesudiye).',
        11,
        10,
        3,
        [
          {
            name: 'search_listings',
            args: { region: 'mugla', view: 'sea', minPrice: 12_000_000 },
            result: { count: 8 },
          },
        ],
      ),
      user('Mesudiye nasıl bir yer?', 11, 10, 8),
      assistant(
        'Datça yarımadasının uç kısmında, daha sakin ve doğal. 48.DT.0091 — 5.400 m² villa imarlı, 26.8M. Bütçenin üstünde ama tek tapu. Pay edilmiş halde 1/2 hissesi 13.5M civarına gelir.',
        11,
        10,
        12,
      ),
      user('Hisseli tapu sakıncalı mı?', 11, 10, 15),
      assistant(
        'Evet, dikkatli olmak gerek. Riskler: (1) İmar uygulamasında izin almak için diğer hissedar onayı gerekir, (2) Satış zorlaşır, (3) Kullanım sınırları net değil. Mümkünse müstakil tapu tercih et.',
        11,
        10,
        18,
      ),
      user('O zaman müstakil arayayım', 11, 10, 20),
    ],
  },
  {
    id: 'conv-010',
    userId: USER,
    title: 'Vergi ve harç hesaplama',
    createdAt: iso(14, 9),
    updatedAt: iso(14, 9, 10),
    messages: [
      user('5M\'lik arsa alımında ne kadar vergi öderim?', 14, 9, 0),
      assistant(
        'Arsa alımı vergileri: (1) Tapu Harcı %4 (alıcı + satıcı %2 + %2) = 200K TL toplam, (2) Damga vergisi yok, (3) Emlak vergisi yıllık (binde 3) = 15K TL/yıl. KDV alıcıya yok (gerçek kişi satıcı ise).',
        14,
        9,
        3,
      ),
      user('Tapu harcının yarısı satıcıdan alınır mı?', 14, 9, 6),
      assistant(
        'Yasal olarak %2 alıcı + %2 satıcı, ama uygulamada genellikle alıcı tüm %4\'ü öder. Sözleşmeye yazılırsa bağlayıcı. Pazarlık konusu yapabilirsin.',
        14,
        9,
        8,
      ),
      user('Düşük göstermek?', 14, 9, 9),
      assistant(
        'Tapuda gerçek bedel altında göstermek yasal değil ve riskli: (1) Vergi denetimi → ceza, (2) Kredi alırsan bankayla çelişir, (3) Sonra satarken değer artış vergisi yüksek çıkar. Önermem.',
        14,
        9,
        10,
      ),
    ],
  },
  {
    id: 'conv-011',
    userId: USER,
    title: 'Çeşme Alaçatı pazar raporu',
    createdAt: iso(18, 11),
    updatedAt: iso(18, 11, 4),
    messages: [
      user('Alaçatı pazar raporu lazım', 18, 11, 0),
      assistant(
        'Alaçatı son 30 gün: m² ortalama 8.200 TL (+%4.2 aylık), aktif ilan 47, ortalama satış süresi 58 gün, talep ısısı 78/100. AI özet: "Alaçatı\'da deniz manzaralı imarlı parseller 30 gün altında satılıyor. İç kesim tarım vasıflı arazilerde durgunluk var."',
        18,
        11,
        3,
        [
          {
            name: 'get_market_report',
            args: { regionSlug: 'cesme' },
            result: { demandHeat: 78, yoy: 18 },
          },
        ],
      ),
      user('Sağol, dökümanı PDF olarak alabilir miyim?', 18, 11, 4),
    ],
  },
  {
    id: 'conv-012',
    userId: USER,
    title: 'Yeni başlayan için arsa rehberi',
    createdAt: iso(22, 15),
    updatedAt: iso(22, 16, 5),
    messages: [
      user('Hayatımda ilk kez arsa alacağım, neye dikkat etmeliyim?', 22, 15, 0),
      assistant(
        '6 kritik nokta: (1) Tapu kaydı (ipotek/haciz), (2) İmar durumu (konut/tarım/turizm), (3) Yola cephe + altyapı (su/elektrik), (4) Çevredeki yapılaşma, (5) Avukat ile sözleşme, (6) Ödeme — banka kanalıyla.',
        22,
        15,
        3,
      ),
      user('Avukatsız olmaz mı?', 22, 15, 8),
      assistant(
        'Olabilir ama önermem. Standart sözleşme ücreti 5-10K TL — alım bedelinin yanında küçük bir sigorta. Tapu memuru sadece resmi prosedürü yapar, sözleşmenin lehine olup olmadığını avukat kontrol eder.',
        22,
        15,
        12,
      ),
      user('İlk ziyarette ne sorayım?', 22, 15, 18),
      assistant(
        '7 soru: (1) Tapu fotokopisi alabilir miyim?, (2) Son 5 yıl emlak vergisi ödendi mi?, (3) Komşularla sınır anlaşmazlığı var mı?, (4) Yola cephesi nereden?, (5) Su/elektrik abonesi olur mu?, (6) İmar izni geçmişi?, (7) Pazarlık marjı ne?',
        22,
        15,
        22,
      ),
      user('Notlarımı aldım, teşekkürler', 22, 16, 5),
    ],
  },
] as const
