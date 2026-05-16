/**
 * Listing detail bileşen barrel — Wave F37 / Faz 2.
 *
 * `apps/public-site/src/pages/ilan/[slug].astro` 12 bölümlü detay sayfası
 * için React island bileşenleri. Sub-path export (`@landx/ui/listing-detail`)
 * — top barrel'a EKLENMEZ (Astro SSR güvenliği için sub-path zorunlu).
 *
 * F37.1 (A+B+L), F37.2 (C+H+I), F37.3 (D+F+G) bileşenleri TanStack Query
 * hook'ları kullanır ama kendi provider'larına sahip değil — bu barrel'da
 * `ListingDetailQueryProvider` ile sarılarak export edilir (F37.4 island'ları
 * zaten provider'ı içinde sarıldığı için olduğu gibi re-export edilir).
 *
 * Singleton client (`_provider.tsx`) ile aynı sayfadaki tüm island'lar
 * cache'i paylaşır.
 */

import type { ComponentType } from 'react'
import { ListingDetailQueryProvider } from './_provider'

import { ListingDetailHero as _ListingDetailHero } from './ListingDetailHero'
import type { ListingDetailHeroProps } from './ListingDetailHero'
import { IdentityCard as _IdentityCard } from './IdentityCard'
import type { IdentityCardProps } from './IdentityCard'
import { VerifiedSellerCard as _VerifiedSellerCard } from './VerifiedSellerCard'
import type { VerifiedSellerCardProps } from './VerifiedSellerCard'

import { SmartMap as _SmartMap } from './SmartMap'
import type { SmartMapProps } from './SmartMap'
import { HazardRadar as _HazardRadar } from './HazardRadar'
import type { HazardRadarProps } from './HazardRadar'
import { EnvironmentPoi as _EnvironmentPoi } from './EnvironmentPoi'
import type { EnvironmentPoiProps } from './EnvironmentPoi'

import { AiValuationDeep as _AiValuationDeep } from './AiValuationDeep'
import type { AiValuationDeepProps } from './AiValuationDeep'
import { ZoningPanel as _ZoningPanel } from './ZoningPanel'
import type { ZoningPanelProps } from './ZoningPanel'
import { FarmlandModule as _FarmlandModule } from './FarmlandModule'
import type { FarmlandModuleProps } from './FarmlandModule'

// F37.4 — kendi provider'ı içinde sarılı, doğrudan re-export.
export { LegalEncumbrancePanel } from './LegalEncumbrancePanel'
export type { LegalEncumbrancePanelProps } from './LegalEncumbrancePanel'
export { ListingAiChat } from './ListingAiChat'
export type { ListingAiChatProps } from './ListingAiChat'
export { InlineCompare } from './InlineCompare'
export type { InlineCompareProps } from './InlineCompare'

// Generic wrapper helper — provider içinde sarmalayıp export.
function withProvider<P extends object>(
  Component: ComponentType<P>,
): ComponentType<P> {
  return function ProviderWrapped(props: P) {
    return (
      <ListingDetailQueryProvider>
        <Component {...props} />
      </ListingDetailQueryProvider>
    )
  }
}

// F37.1 — A + B + L bölümleri (provider wrapped)
export const ListingDetailHero = withProvider(_ListingDetailHero)
export type { ListingDetailHeroProps }
export const IdentityCard = withProvider(_IdentityCard)
export type { IdentityCardProps }
export const VerifiedSellerCard = withProvider(_VerifiedSellerCard)
export type { VerifiedSellerCardProps }

// F37.2 — C + H + I bölümleri (provider wrapped)
export const SmartMap = withProvider(_SmartMap)
export type { SmartMapProps }
export const HazardRadar = withProvider(_HazardRadar)
export type { HazardRadarProps }
export const EnvironmentPoi = withProvider(_EnvironmentPoi)
export type { EnvironmentPoiProps }

// F37.3 — D + F + G bölümleri (provider wrapped)
export const AiValuationDeep = withProvider(_AiValuationDeep)
export type { AiValuationDeepProps }
export const ZoningPanel = withProvider(_ZoningPanel)
export type { ZoningPanelProps }
export const FarmlandModule = withProvider(_FarmlandModule)
export type { FarmlandModuleProps }

// Provider helper'ı dışa açık (manuel kullanım için).
export { ListingDetailQueryProvider } from './_provider'

// F37 Faz 4.B — Category variants (P bölüm)
export { HeroVariant } from './variants/HeroVariant'
export type { HeroVariantProps } from './variants/HeroVariant'
export { IdentityCardVariant } from './variants/IdentityCardVariant'
export type { IdentityCardVariantProps } from './variants/IdentityCardVariant'
export { KeyFactsVariant } from './variants/KeyFactsVariant'
export type { KeyFactsVariantProps } from './variants/KeyFactsVariant'

// Hero üstü galeri + fullscreen lightbox.
export { ListingGallery } from './ListingGallery'
export type { ListingGalleryProps } from './ListingGallery'

// Kategori sekmeli galeri (Genel / Drone / Plan vb.).
export { ListingGalleryTabs } from './ListingGalleryTabs'
export type {
  ListingGalleryTabsProps,
  GalleryTab,
} from './ListingGalleryTabs'
