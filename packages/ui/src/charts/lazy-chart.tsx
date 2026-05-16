import { Suspense, type ReactNode } from 'react'
import { cn } from '../lib/cn'

interface LazyChartProps {
  height?: number
  className?: string
  children: ReactNode
}

export function LazyChart({ height = 220, className, children }: LazyChartProps) {
  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <Suspense fallback={<ChartSkeleton height={height} />}>{children}</Suspense>
    </div>
  )
}

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="absolute inset-0 grid place-items-center rounded-xl bg-muted/40"
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <div className="flex h-6 items-end gap-1">
          {[40, 70, 55, 90, 65, 80, 50].map((h, i) => (
            <span
              key={i}
              className="w-1.5 animate-pulse rounded-full bg-foreground/15"
              style={{
                height: `${(h / 100) * (height / 8 + 8)}px`,
                animationDelay: `${i * 80}ms`,
              }}
            />
          ))}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
          Grafik yükleniyor…
        </span>
      </div>
    </div>
  )
}
