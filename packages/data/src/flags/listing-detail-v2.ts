/**
 * F37 Faz 4 — Feature flags (listing detail v2 + extension).
 *
 * Mevcut 12 bölüm (A-L) flag-gated DEĞİL (Faz 3'te tüm kullanıcılara açıldı).
 * Bu flag'ler sadece Faz 4 eklemelerini (M-P + çok-kategori + filtre) kontrol eder.
 *
 * Default: hepsi false → mevcut Faz 3 davranışı korunur.
 * Super-admin'de açılarak %10 → %50 → %100 ramp yapılır.
 */

export const LISTING_DETAIL_V2_FLAGS = {
  listing_detail_v2_layout: false,      // AnchorNav 14-anchor + MobileCtaBar
  listing_v2_extended_types: false,     // P bölüm (kategori variants)
  listing_risk_panel: true,             // mevcut H zaten var, noop guard
  listing_ai_investment: false,         // M bölüm
  listing_neighborhood_intel: true,     // mevcut I zaten var, noop guard
  listing_advanced_visual: false,       // O bölüm
  listing_interaction_v2: false,        // N bölüm
} as const

export type ListingDetailV2Flag = keyof typeof LISTING_DETAIL_V2_FLAGS

export function isFlagEnabled(flag: ListingDetailV2Flag): boolean {
  // Mock: process.env veya localStorage (super-admin set'i) okunur.
  // Şimdilik sabit map; super-admin entegrasyonu F37 sonrası slice.
  return LISTING_DETAIL_V2_FLAGS[flag]
}
