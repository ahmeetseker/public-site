import { parseQuery } from './nl-parser';
import type { ChatResult, ChatTurn } from './types';

const SCRIPTS: Array<{ match: RegExp; respond: () => ChatResult }> = [
  {
    match: /(merhaba|selam|hello|hi)\b/i,
    respond: () => ({
      text: 'Merhaba. Bugün hangi konuda yardımcı olayım? Niyetinizi yazın, alanları doldurayım veya öneriler getireyim.',
      source: 'scripted',
    }),
  },
  {
    match: /\b(yardım|help)\b/i,
    respond: () => ({
      text:
        'Şu konularda yardımcı olabilirim:\n• Arsa ara: "İstanbul Beykoz 5000 m² imarlı 2,5M altı"\n• Yeni ilan oluştur\n• ECA kuralı ekle\n• Risk skorunu açıkla\n• Onay kuyruğunu özetle',
      suggestions: [
        { label: 'İlanlara git', href: '/ara' },
        { label: 'Komut paletini aç', commandId: 'palette.open' },
      ],
      source: 'scripted',
    }),
  },
  {
    match: /onay (kuyruğu|listesi)|review queue/i,
    respond: () => ({
      text:
        'Onay kuyruğunda 12 bekleyen ilan, 7 KYC ve 2 itiraz var. AI risk skoruna göre 3 ilan yüksek riskte. Detaya gidelim mi?',
      suggestions: [{ label: 'Onaylara git', href: '/approvals' }],
      source: 'scripted',
    }),
  },
  {
    match: /risk/i,
    respond: () => ({
      text:
        'Risk skoru TKGM durumu, tapu tipi, imar ve altyapı verilerine göre hesaplanır. Detaylı açıklama için ilan kartındaki risk rozetine tıklayın.',
      source: 'scripted',
    }),
  },
  {
    match: /değerleme|valuation/i,
    respond: () => ({
      text:
        'AI değerleme: il × imar × m² × emsal formülü ve altyapı katsayılarıyla hesaplanır. Alt/önerilen/üst aralık ve güven oranı verilir.',
      source: 'scripted',
    }),
  },
  {
    match: /(yeni ilan|ilan oluştur|sat[ıi][şs])/i,
    respond: () => ({
      text:
        'Yeni ilan yardımcısı: 6 adımlı sihirbaz (Konum → Detay → Görsel → Fiyat → Açıklama → Önizleme). Her adımda AI öneri sunar.',
      suggestions: [{ label: 'İlan oluştur', href: '/listings/new' }],
      source: 'scripted',
    }),
  },
  {
    match: /(kural|eca|automation)/i,
    respond: () => ({
      text:
        'ECA kuralları olay-koşul-aksiyon yapısında. Önceden hazır 24 kuraldan 15\'i etkin. Yeni kural eklemek için Kurallar sayfasına gidin.',
      suggestions: [{ label: 'Kurallara git', href: '/rules' }],
      source: 'scripted',
    }),
  },
];

export async function chat(turn: ChatTurn): Promise<ChatResult> {
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 500));

  const parsed = parseQuery(turn.user);
  if (parsed.city || parsed.imarType || parsed.maxPrice) {
    const parts: string[] = [];
    if (parsed.city) parts.push(parsed.city);
    if (parsed.district) parts.push(parsed.district);
    if (parsed.imarType) parts.push(parsed.imarType);
    if (parsed.maxPrice) parts.push(`max ${(parsed.maxPrice / 1_000_000).toFixed(1)}M ₺`);
    if (parsed.tkgmStatus) parts.push(`TKGM: ${parsed.tkgmStatus}`);
    return {
      text: `Niyetinizi anladım: ${parts.join(' · ')}. Arama sayfasına bu filtrelerle yönlendireyim mi?`,
      suggestions: [
        { label: 'Filtreyle ara', href: `/ara?q=${encodeURIComponent(turn.user)}` },
        { label: 'Aramayı kaydet', commandId: 'search.save' },
      ],
      source: 'scripted',
    };
  }

  for (const s of SCRIPTS) {
    if (s.match.test(turn.user)) return s.respond();
  }

  return {
    text:
      'Bu konuyu öğreniyorum. Şimdilik kesin bir cevabım yok — komut paletinden (Cmd+K) ilgili sayfaya gidebilirsiniz veya niyetinizi yeniden yazın.',
    suggestions: [
      { label: 'Komut paletini aç', commandId: 'palette.open' },
      { label: 'Aramaya git', href: '/ara' },
    ],
    source: 'fallback',
  };
}

export async function suggestForListing(_listingTitle: string, status?: string): Promise<string[]> {
  await new Promise((r) => setTimeout(r, 300));
  if (status === 'draft') {
    return [
      'Açıklamayı 2-3 cümle ile zenginleştir.',
      '3+ görsel ekle (alıcı ilgisi %40 artar).',
      'Fiyatı bölge ortalamasına göre %5 düşür.',
      'Yayın için TKGM doğrulamasını tamamla.',
    ];
  }
  return [
    'Başlığa "yatırımlık" eklemek tıklamayı %12 artırır.',
    'En çok görüntülenen 3 fotoğrafı başa al.',
    'Fiyatı 7 günlük emsal ortalamasıyla karşılaştır.',
  ];
}

export async function draftReply(
  _threadTopic: string,
  _lastMessage: string,
  role: 'buyer' | 'seller',
): Promise<string[]> {
  await new Promise((r) => setTimeout(r, 300));
  if (role === 'seller') {
    return [
      'Merhaba, ilgilendiğiniz için teşekkürler. Detayları paylaşabilirim.',
      'Tapu belgelerimiz tamam. Hangi konuda ek bilgi istersiniz?',
      'Hafta sonu görme randevusu için uygun saatler: Cumartesi 11:00, Pazar 14:00.',
    ];
  }
  return [
    'TKGM kaydını paylaşabilir misiniz?',
    'Hafta sonu görme randevusu mümkün mü?',
    'Pazarlık payı var mı? Net teklif önereyim.',
  ];
}

export function aiTitle(input: {
  city: string;
  district?: string;
  imarType: string;
  area: number;
}): string {
  const prefix = ['Yatırımlık', 'Fırsat', 'Yola Sıfır', 'Acil', 'Net Tapulu'][Math.floor(Math.random() * 5)];
  return `${prefix} · ${input.city}${input.district ? '/' + input.district : ''} · ${input.imarType} arsa · ${input.area} m²`;
}

export function aiDesc(input: {
  city: string;
  district?: string;
  imarType: string;
  area: number;
  tapuType?: string;
  tkgmStatus?: string;
}): string {
  const loc = `${input.city}${input.district ? ', ' + input.district : ''}`;
  const tapu = input.tapuType ? `Tapu: ${input.tapuType}.` : '';
  const tkgm = input.tkgmStatus ? ` TKGM: ${input.tkgmStatus}.` : '';
  return `${loc} bölgesinde ${input.area} m² ${input.imarType} türü arsa. ${tapu}${tkgm} Yatırım ve değer artışı açısından bölge ortalaması üzeri potansiyel. Detaylar için mesaj atın.`;
}
