import type { ImarType, ValuationFactor, ValuationInput, ValuationResult } from './types';

const CITY_MUL: Record<string, number> = {
  İstanbul: 6.5,
  Ankara: 2.5,
  İzmir: 4.0,
  Antalya: 4.2,
  Muğla: 5.5,
  Bursa: 2.2,
  Aydın: 2.5,
  Çanakkale: 1.8,
  Tekirdağ: 2.0,
  Kocaeli: 2.4,
  Sakarya: 1.8,
  Yalova: 2.3,
  Eskişehir: 1.4,
  Balıkesir: 2.0,
  Trabzon: 1.6,
  Konya: 1.3,
  Mersin: 1.7,
  Manisa: 1.4,
  Denizli: 1.5,
  Edirne: 1.4,
  Samsun: 1.4,
  Hatay: 1.3,
};

const IMAR_MUL: Record<ImarType, number> = {
  konut: 1.3,
  ticari: 1.7,
  sanayi: 0.9,
  turizm: 1.5,
  tarim: 0.4,
  zeytinlik: 0.55,
  imarsiz: 0.3,
  karma: 1.1,
};

export function estimateValue(input: ValuationInput): ValuationResult {
  const cm = CITY_MUL[input.city] ?? 1.0;
  const im = IMAR_MUL[input.imarType];
  const base = 1200;
  let multiplier = cm * im;
  const factors: ValuationFactor[] = [];
  factors.push({ name: 'Şehir çarpanı', impact: cm, note: input.city });
  factors.push({ name: 'İmar çarpanı', impact: im, note: input.imarType });

  if (input.utilities?.road) {
    multiplier *= 1.05;
    factors.push({ name: 'Yol erişimi', impact: 1.05, note: '+%5' });
  }
  if (input.utilities?.electricity) {
    multiplier *= 1.04;
    factors.push({ name: 'Elektrik', impact: 1.04, note: '+%4' });
  }
  if (input.utilities?.water) {
    multiplier *= 1.03;
    factors.push({ name: 'Su', impact: 1.03, note: '+%3' });
  }
  if (input.hisseRatio && input.hisseRatio < 100) {
    multiplier *= 0.85;
    factors.push({ name: 'Hisseli tapu', impact: 0.85, note: '-%15' });
  }

  const mid = Math.round((input.area * base * multiplier) / 10_000) * 10_000;
  const spread = 0.08;
  const low = Math.round((mid * (1 - spread)) / 10_000) * 10_000;
  const high = Math.round((mid * (1 + spread)) / 10_000) * 10_000;
  const confidence = Math.round((0.55 + Math.min(0.3, multiplier / 10)) * 100) / 100;

  return { low, mid, high, confidence, factors };
}
