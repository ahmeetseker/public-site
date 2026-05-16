import { useMemo } from 'react';
import { RiskBadge, ValuationBar } from '@landx/ui/ai';
import {
  scoreRisk,
  estimateValue,
  type ImarType,
  type TapuType,
  type TkgmStatus,
} from '@landx/ai';

interface ListingLike {
  city: string;
  district: string;
  size: number;
  price: number;
  type?: string;
  zoning?: string;
  titleStatus?: string;
  hasRoad?: boolean;
  hasWater?: boolean;
  hasElectricity?: boolean;
}

const ZONING_MAP: Record<string, ImarType> = {
  konut: 'konut',
  ticari: 'ticari',
  tarim: 'tarim',
  sanayi: 'sanayi',
  turizm: 'turizm',
};

const TITLE_MAP: Record<string, TapuType> = {
  tapulu: 'mustakil',
  hisseli: 'hisseli',
  'kat-irtifaki': 'kat_irtifaki',
  'kat-mulkiyeti': 'mustakil',
};

function mapImar(l: ListingLike): ImarType {
  if (l.zoning && ZONING_MAP[l.zoning]) return ZONING_MAP[l.zoning];
  if (l.type === 'Zeytinlik') return 'zeytinlik';
  if (l.type === 'Tarla') return 'tarim';
  return 'konut';
}

function mapTapu(l: ListingLike): TapuType {
  if (l.titleStatus && TITLE_MAP[l.titleStatus]) return TITLE_MAP[l.titleStatus];
  return 'mustakil';
}

function mapTkgm(l: ListingLike): TkgmStatus {
  if (l.titleStatus === 'hisseli') return 'serh';
  return 'bilinmiyor';
}

export interface RiskAndValuationProps {
  listing: ListingLike;
  showReasons?: boolean;
}

export default function RiskAndValuation({ listing, showReasons = true }: RiskAndValuationProps) {
  const risk = useMemo(
    () =>
      scoreRisk({
        tkgmStatus: mapTkgm(listing),
        tapuType: mapTapu(listing),
        imarType: mapImar(listing),
        utilities: {
          road: listing.hasRoad,
          electricity: listing.hasElectricity,
          water: listing.hasWater,
        },
      }),
    [listing],
  );

  const valuation = useMemo(
    () =>
      estimateValue({
        area: listing.size,
        imarType: mapImar(listing),
        city: listing.city,
        district: listing.district,
        utilities: {
          road: listing.hasRoad,
          electricity: listing.hasElectricity,
          water: listing.hasWater,
        },
      }),
    [listing],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">AI risk skoru:</span>
        <RiskBadge result={risk} size="md" showReasons={showReasons} />
      </div>
      <ValuationBar result={valuation} marketPrice={listing.price} />
    </div>
  );
}
