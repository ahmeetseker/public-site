import { AlertCircle, RefreshCw } from '@landx/icons'
import { cn } from '../lib/cn'

export interface ErrorStateProps {
  title?: string
  description?: string
  error?: Error | null
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Bir şeyler ters gitti',
  description = 'Veri yüklenirken bir sorun çıktı. Tekrar dener misin?',
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-6 py-10 text-center',
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:bg-red-400/10 dark:text-red-400">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h3 className="font-serif text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {error && import.meta.env.DEV && (
          <code className="mt-2 block font-mono text-[11px] text-muted-foreground/80">
            {error.message}
          </code>
        )}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Tekrar dene
        </button>
      )}
    </div>
  )
}
