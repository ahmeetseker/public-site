/**
 * Wave F25.0 — Observability helper shared across 3 LandX apps.
 *
 * Behaviour: when a real Sentry DSN is wired into `initSentry`, lazy-load
 * `@sentry/browser` and register the integration. When no DSN is present
 * (dev / CI / preview), fall back to `console.error` so the same call
 * sites work everywhere. This means apps can call `captureException`
 * unconditionally — no `if (sentry)` guards bleed into product code.
 *
 * Consent gating is the caller's responsibility (public-site cookie banner
 * exposes `cookie-consent:changed`; admins are operator-only so consent is
 * implied by login). The helper itself does not query consent state.
 */

export type SentryEnvironment = 'development' | 'preview' | 'production'

export interface InitSentryOptions {
  dsn?: string | null
  environment: SentryEnvironment
  release?: string
  /** Optional `beforeSend` hook to scrub PII before transport. */
  beforeSend?: (event: unknown) => unknown
  /** Sampling rate for performance traces (0.0 – 1.0). Default 0.1 in prod, 0 elsewhere. */
  tracesSampleRate?: number
}

interface SentryLike {
  captureException(error: unknown, context?: { extra?: Record<string, unknown> }): void
  captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void
  setUser(user: { id: string } | null): void
}

let activeClient: SentryLike | null = null
let initPromise: Promise<void> | null = null

function consoleFallback(): SentryLike {
  return {
    captureException(error, context) {
      // eslint-disable-next-line no-console
      console.error('[observability:no-dsn]', error, context?.extra)
    },
    captureMessage(message, level = 'info') {
      // eslint-disable-next-line no-console
      console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](
        '[observability:no-dsn]',
        message,
      )
    },
    setUser(user) {
      // eslint-disable-next-line no-console
      console.log('[observability:no-dsn] user', user)
    },
  }
}

export function initSentry(options: InitSentryOptions): Promise<void> {
  if (initPromise) return initPromise
  if (!options.dsn) {
    activeClient = consoleFallback()
    initPromise = Promise.resolve()
    return initPromise
  }
  initPromise = (async () => {
    try {
      // Runtime-resolved module name keeps Vite's import-analysis plugin
      // from trying to bundle @sentry/browser when the package isn't
      // installed. Real-DSN envs install the dep + the dynamic load resolves.
      const moduleName = '@sentry' + '/browser'
      const dynamicImport = new Function('name', 'return import(name)') as (
        name: string,
      ) => Promise<unknown>
      const Sentry = await dynamicImport(moduleName).catch(() => null)
      if (!Sentry) {
        activeClient = consoleFallback()
        return
      }
      const sentryAny = Sentry as unknown as {
        init: (opts: Record<string, unknown>) => void
        captureException: SentryLike['captureException']
        captureMessage: SentryLike['captureMessage']
        setUser: SentryLike['setUser']
      }
      sentryAny.init({
        dsn: options.dsn,
        environment: options.environment,
        release: options.release,
        beforeSend: options.beforeSend,
        tracesSampleRate:
          options.tracesSampleRate ??
          (options.environment === 'production' ? 0.1 : 0),
      })
      activeClient = {
        captureException: sentryAny.captureException.bind(sentryAny),
        captureMessage: sentryAny.captureMessage.bind(sentryAny),
        setUser: sentryAny.setUser.bind(sentryAny),
      }
    } catch {
      activeClient = consoleFallback()
    }
  })()
  return initPromise
}

export function captureException(error: unknown, extra?: Record<string, unknown>): void {
  if (!activeClient) activeClient = consoleFallback()
  activeClient.captureException(error, extra ? { extra } : undefined)
}

export function captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void {
  if (!activeClient) activeClient = consoleFallback()
  activeClient.captureMessage(message, level)
}

export function setUser(user: { id: string } | null): void {
  if (!activeClient) activeClient = consoleFallback()
  activeClient.setUser(user)
}

/** Test-only — resets singleton state. */
export function resetObservabilityForTests(): void {
  activeClient = null
  initPromise = null
}
