import { MapPin, Building2, Sparkles, Layers } from '@landx/icons'
import type { AiSuggestion } from '@landx/ui'

export const PUBLIC_AI_SUGGESTIONS_TR: AiSuggestion[] = [
  { label: 'Çanakkale · deniz manzaralı', icon: <MapPin className="h-3 w-3" /> },
  { label: 'Bodrum villa imarlı', icon: <Building2 className="h-3 w-3" /> },
  { label: 'Antalya zeytinlik', icon: <Sparkles className="h-3 w-3" /> },
  { label: '5M altı yatırımlık', icon: <Layers className="h-3 w-3" /> },
]

export const PUBLIC_AI_SUGGESTIONS_EN: AiSuggestion[] = [
  { label: 'Çanakkale · sea view', icon: <MapPin className="h-3 w-3" /> },
  { label: 'Bodrum zoned villa', icon: <Building2 className="h-3 w-3" /> },
  { label: 'Antalya olive grove', icon: <Sparkles className="h-3 w-3" /> },
  { label: 'Under 5M investment', icon: <Layers className="h-3 w-3" /> },
]

export const PUBLIC_AI_STAGES_TR = [
  'Sorgun anlaşılıyor…',
  'İlanlar taranıyor…',
  'Sonuç hazırlanıyor…',
] as const

export const PUBLIC_AI_STAGES_EN = [
  'Parsing query…',
  'Scanning listings…',
  'Preparing result…',
] as const
