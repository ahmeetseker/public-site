import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-foreground/[0.06] dark:bg-foreground/[0.08]',
        className,
      )}
      aria-busy="true"
      aria-live="polite"
      {...props}
    />
  )
}

export function SkeletonRow({ cells = 5 }: { cells?: number }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      {Array.from({ length: cells }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === 0 ? 'flex-[2]' : 'flex-1')} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 6, cells = 5 }: { rows?: number; cells?: number }) {
  return (
    <div className="divide-y divide-border/60">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cells={cells} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3 rounded-2xl border border-border bg-card p-4', className)}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5', className)}>
      <Skeleton className="mb-4 h-4 w-32" />
      <div className="flex h-48 items-end gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="flex-1" style={{ height: `${30 + (i * 7) % 60}%` }} />
        ))}
      </div>
    </div>
  )
}
