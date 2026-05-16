/**
 * Mock seed: AI Q&A thread'leri (ilan sayfası soru-cevap).
 * 12 thread:
 *   - 4 pending (sellerApproved: null) — satıcı henüz karar vermemiş
 *   - 6 approved (true) — alıcılara görünür
 *   - 2 rejected (false) — gizli
 *
 * `LISTINGS` mock'undaki gerçek listingId'lere bağlı.
 */

import type { AiQaThread } from '../types/ai'

function iso(daysAgo: number, hour = 12): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const AI_QA_THREADS: AiQaThread[] = [
  // ─── Approved (6) ──────────────────────────────────────────────────────────
  {
    id: 'qa-001',
    listingId: '28.AY.0142',
    userId: 'user-buyer-12',
    question: 'Yola cephesi tam olarak ne kadar?',
    aiAnswer:
      'İlan açıklamasına göre 18 metre yola cephesi var. Köşe parsel olduğu için iki cepheli — ikinci cephe yan yola 22 metre.',
    sellerApproved: true,
    createdAt: iso(3, 10),
    approvedAt: iso(3, 14),
  },
  {
    id: 'qa-002',
    listingId: '48.DT.0028',
    userId: 'user-buyer-08',
    question: 'Su ve elektrik altyapısı hazır mı?',
    aiAnswer:
      'Parsel sınırına kadar elektrik hattı geliyor (DEDAŞ). Su için 80 metre uzaklıkta belediye şebekesi var, abone bağlantısı yapılabilir.',
    sellerApproved: true,
    sellerNote: 'Su abonesi için hazırlık bedeli ~25K TL.',
    createdAt: iso(5, 9),
    approvedAt: iso(5, 16),
  },
  {
    id: 'qa-003',
    listingId: '09.CS.0033',
    userId: 'user-buyer-22',
    question: 'İmar planında otel/turizm yapılaşması mümkün mü?',
    aiAnswer:
      'Mevcut imar planı konut+ticari karma. Turizm tesisi için Çeşme Belediyesi\'nden plan değişikliği başvurusu gerekir. Bölgede 2024-2026 arası 6 başvurudan 4\'ü onaylandı.',
    sellerApproved: true,
    createdAt: iso(7, 11),
    approvedAt: iso(7, 18),
  },
  {
    id: 'qa-004',
    listingId: '10.AY.0207',
    userId: 'user-buyer-15',
    question: 'Komşu parsellerde inşaat var mı? Manzara kapanır mı?',
    aiAnswer:
      'Doğu komşu parsel boş ama imarlı (1.200 m², muhtemel 2 katlı yapı). Güney parselde mevcut tek katlı ev var. Manzaranın deniz tarafı (kuzey) açık kalır — orası yeşil alan.',
    sellerApproved: true,
    createdAt: iso(9, 13),
    approvedAt: iso(10, 11),
  },
  {
    id: 'qa-005',
    listingId: '09.UR.0188',
    userId: 'user-buyer-31',
    question: 'Kaç adet zeytin ağacı var? Verim nasıl?',
    aiAnswer:
      'Yaklaşık 280 adet ağaç (140-160 verimli yaşta). Son 3 yıl ortalama 4.2 ton zeytin/yıl. Kuru zeytinyağı için ~650 kg/yıl üretim potansiyeli.',
    sellerApproved: true,
    sellerNote: 'Geçen yıl 4.8 ton aldık — iyi sezondu.',
    createdAt: iso(12, 14),
    approvedAt: iso(13, 9),
  },
  {
    id: 'qa-006',
    listingId: '17.AK.0102',
    userId: 'user-buyer-19',
    question: 'Pazarlık payı var mı? Acil satılık mı?',
    aiAnswer:
      'İlan 23 gündür yayında, 152 görüntüleme. Bölgenin ortalama indirim oranı %4-7. Acil satış belirtisi yok. Doğrudan görüşmede %5 civarı indirim makul olabilir.',
    sellerApproved: true,
    createdAt: iso(14, 10),
    approvedAt: iso(14, 16),
  },

  // ─── Pending (4) — satıcı henüz cevap vermedi ──────────────────────────────
  {
    id: 'qa-007',
    listingId: '48.MR.0044',
    userId: 'user-buyer-44',
    question: 'Sahile yürüme mesafesi gerçekten 350m mi? Eğim nasıl?',
    aiAnswer:
      'İlan açıklamasında 350m belirtilmiş ancak Google Maps yürüyüş rotası 480m gösteriyor. Eğim ortalama %8 — yokuş aşağı sahile.',
    sellerApproved: null,
    createdAt: iso(1, 11),
  },
  {
    id: 'qa-008',
    listingId: '10.HV.0156',
    userId: 'user-buyer-27',
    question: 'Tapuda hisseli mi müstakil mi?',
    aiAnswer:
      'İlan başlığında "müstakil tapu" geçiyor. Tapu Müdürlüğü\'nde resmi sorgulama önerilir — alıcı tarafı bunu satış öncesi mutlaka kontrol etmeli.',
    sellerApproved: null,
    createdAt: iso(2, 14),
  },
  {
    id: 'qa-009',
    listingId: '09.AL.0061',
    userId: 'user-buyer-38',
    question: 'Bağ-bahçe için kullanılır mı? Zemin nasıl?',
    aiAnswer:
      'Tarım vasıflı parsel — bağ-bahçe için uygun. Toprak analizi yok ama bölgede genel olarak kireçli-kumlu yapı (zeytine ideal). Sulama suyu için kuyu açma izni alınabilir.',
    sellerApproved: null,
    createdAt: iso(0, 16),
  },
  {
    id: 'qa-010',
    listingId: '48.FT.0072',
    userId: 'user-buyer-52',
    question: 'Site içinde mi? Aidat var mı?',
    aiAnswer:
      'İlan açıklamasında site bilgisi yok. Konum verisine göre çevrede villa siteleri var ama bu parsel müstakil görünüyor. Aidat olmadığı varsayılıyor — satıcıdan teyit gerekli.',
    sellerApproved: null,
    createdAt: iso(0, 18),
  },

  // ─── Rejected (2) ──────────────────────────────────────────────────────────
  {
    id: 'qa-011',
    listingId: '09.UR.0114',
    userId: 'user-buyer-09',
    question: 'En düşük kaça verirsiniz? Net konuşalım.',
    aiAnswer:
      'Bu pazarlık aşamasını "İletişime Geç" üzerinden doğrudan satıcıyla yapmak daha verimli. Bölge ortalama indirim oranı %5-9.',
    sellerApproved: false,
    sellerNote: 'Bu kanaldan fiyat müzakeresi yapmıyorum.',
    createdAt: iso(8, 11),
    approvedAt: iso(8, 13),
  },
  {
    id: 'qa-012',
    listingId: '48.DT.0091',
    userId: 'user-buyer-17',
    question: 'Elektrik faturası ortalama ne kadar gelir? Doğalgaz var mı?',
    aiAnswer:
      'Boş arsa — henüz tesisat yok. Komşu parsel sahiplerinden alınan bilgiye göre yıllık ortalama elektrik kullanımı 12K TL civarı (yazlık kullanım).',
    sellerApproved: false,
    sellerNote: 'Soru ilanın amacıyla alakasız.',
    createdAt: iso(10, 9),
    approvedAt: iso(11, 14),
  },
] as const
