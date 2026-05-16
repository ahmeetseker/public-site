import { cn } from '../lib/cn'
import type {
  CustomerSegment,
  CustomerStage,
  ListingStatus,
  ListingType,
} from '../types'

const STATUS_TONES: Record<ListingStatus, { fg: string; bg: string; dot: string }> = {
  Aktif: {
    fg: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
  },
  Pasif: {
    fg: 'text-stone-600 dark:text-stone-300',
    bg: 'bg-stone-500/10 dark:bg-stone-400/10',
    dot: 'bg-stone-500 dark:bg-stone-400',
  },
  Taslak: {
    fg: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10 dark:bg-amber-400/10',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
}

export function StatusChip({ status }: { status: ListingStatus }) {
  const t = STATUS_TONES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        t.bg,
        t.fg,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', t.dot)} />
      {status}
    </span>
  )
}

const SEGMENT_TONES: Record<CustomerSegment, { fg: string; bg: string; emoji: string }> = {
  Sıcak: {
    fg: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-500/10 dark:bg-rose-400/10',
    emoji: '🔥',
  },
  Ilık: {
    fg: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10 dark:bg-amber-400/10',
    emoji: '⚡',
  },
  Soğuk: {
    fg: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-500/10 dark:bg-sky-400/10',
    emoji: '❄',
  },
}

export function SegmentChip({ segment }: { segment: CustomerSegment }) {
  const t = SEGMENT_TONES[segment]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        t.bg,
        t.fg,
      )}
    >
      <span aria-hidden>{t.emoji}</span>
      {segment}
    </span>
  )
}

const STAGE_ORDER: CustomerStage[] = [
  'İlk temas',
  'Görüşme',
  'Teklif',
  'Kaparo',
  'Tapu',
]

export function StageChip({ stage }: { stage: CustomerStage }) {
  const idx = STAGE_ORDER.indexOf(stage)
  const progress = (idx + 1) / STAGE_ORDER.length
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
        {idx + 1}/{STAGE_ORDER.length}
      </span>
      <span className="relative inline-block h-1 w-12 overflow-hidden rounded-full bg-foreground/10">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-foreground/60"
          style={{ width: `${progress * 100}%` }}
        />
      </span>
      <span className="text-[12px] font-medium">{stage}</span>
    </span>
  )
}

const TYPE_TONES: Record<ListingType, { fg: string; bg: string }> = {
  İmarlı: {
    fg: 'text-emerald-800 dark:text-emerald-200',
    bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
  },
  Tarla: {
    fg: 'text-yellow-800 dark:text-yellow-200',
    bg: 'bg-yellow-500/10 dark:bg-yellow-400/10',
  },
  Zeytinlik: {
    fg: 'text-lime-800 dark:text-lime-200',
    bg: 'bg-lime-500/10 dark:bg-lime-400/10',
  },
  'Villa Arsası': {
    fg: 'text-fuchsia-800 dark:text-fuchsia-200',
    bg: 'bg-fuchsia-500/10 dark:bg-fuchsia-400/10',
  },
}

export function TypeChip({ type }: { type: ListingType }) {
  const t = TYPE_TONES[type]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
        t.bg,
        t.fg,
      )}
    >
      {type}
    </span>
  )
}
