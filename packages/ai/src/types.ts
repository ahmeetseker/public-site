export type TapuType =
  | 'mustakil'
  | 'hisseli'
  | 'kat_irtifaki'
  | 'arsa_tapulu'
  | 'tarla_tapulu';

export type TkgmStatus =
  | 'temiz'
  | 'ipotekli'
  | 'serh'
  | 'tedbir'
  | 'bilinmiyor';

export type ImarType =
  | 'konut'
  | 'tarim'
  | 'ticari'
  | 'sanayi'
  | 'turizm'
  | 'zeytinlik'
  | 'imarsiz'
  | 'karma';

export interface ParcelUtilities {
  road?: boolean;
  electricity?: boolean;
  water?: boolean;
  gas?: boolean;
  internet?: boolean;
}

export interface RiskInput {
  tkgmStatus: TkgmStatus;
  tapuType: TapuType;
  imarType: ImarType;
  hisseRatio?: number;
  utilities?: ParcelUtilities;
}

export interface RiskResult {
  score: number;
  level: 'low' | 'medium' | 'high';
  reasons: string[];
}

export interface ValuationInput {
  area: number;
  imarType: ImarType;
  city: string;
  district?: string;
  utilities?: ParcelUtilities;
  hisseRatio?: number;
}

export interface ValuationFactor {
  name: string;
  impact: number;
  note: string;
}

export interface ValuationResult {
  low: number;
  mid: number;
  high: number;
  confidence: number;
  factors: ValuationFactor[];
}

export interface SavedSearchFilters {
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  imarType?: ImarType;
  tkgmStatus?: TkgmStatus;
  tapuType?: TapuType;
  features?: string[];
  query?: string;
}

export type EcaEvent =
  | 'listing.created'
  | 'listing.updated'
  | 'listing.status_changed'
  | 'listing.price_changed'
  | 'listing.viewed'
  | 'offer.received'
  | 'offer.status_changed'
  | 'offer.expired'
  | 'message.received'
  | 'viewing.requested'
  | 'viewing.completed'
  | 'tkgm.query_completed'
  | 'tkgm.flag_changed'
  | 'user.signed_up'
  | 'user.kyc_status_changed'
  | 'user.favorited_listing'
  | 'system.cron.daily'
  | 'system.cron.hourly';

export type EcaActionType =
  | 'notify.user'
  | 'notify.role'
  | 'email.mock'
  | 'webhook.mock'
  | 'assign.to'
  | 'set.field'
  | 'tag.add'
  | 'flag.review'
  | 'ai.summarize';

export type EcaOp =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'between'
  | 'regex';

export interface EcaCondition {
  field: string;
  op: EcaOp;
  value: unknown;
}

export interface EcaAction {
  type: EcaActionType;
  params: Record<string, unknown>;
}

export interface EcaHistoryEntry {
  at: string;
  payload: unknown;
  matched: boolean;
  actionsRun: string[];
}

export interface EcaRule {
  id: string;
  name: string;
  description: string;
  event: EcaEvent;
  conditions: EcaCondition[];
  actions: EcaAction[];
  enabled: boolean;
  ownerId: string;
  history: EcaHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export type TkgmCode = 'OK' | 'E001' | 'E002' | 'E003' | 'E099';

export interface TkgmQuery {
  id: string;
  by: string;
  input: { il: string; ilce: string; ada: string; parsel: string };
  status: TkgmCode;
  latencyMs: number;
  result?: {
    il: string;
    ilce: string;
    mahalle: string;
    ada: string;
    parsel: string;
    yuzolcumu: number;
    cinsi: string;
    hisse?: string;
  };
  createdAt: string;
}

export interface ChatContext {
  route?: string;
  role?: string;
  selection?: { type: string; id: string; data?: unknown };
}

export interface ChatTurn {
  user: string;
  context?: ChatContext;
}

export interface ChatSuggestion {
  label: string;
  commandId?: string;
  href?: string;
}

export interface ChatResult {
  text: string;
  suggestions?: ChatSuggestion[];
  source?: 'scripted' | 'fallback';
}
