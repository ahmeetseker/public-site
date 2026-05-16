/**
 * SocialLoginButtons — Wave F7.A.
 *
 * Three mock social-auth CTAs (Google / Apple / Facebook). No real OAuth — the
 * scope of F7.A is UI-only: click sets the demo cookie, shows a transient toast
 * ("Sosyal giriş yakında — şimdilik form'u kullanın"), and after ~600ms
 * navigates to /hesabim (or /en/hesabim/) so the existing AuthGuard recognises
 * the session.
 *
 * Tooltip line on each button: "Yalnızca demo amaçlıdır, gerçek hesap
 * oluşturulmaz." (KVKK-safe wording).
 *
 * Mounted above the existing email/password forms in /giris and /kayit
 * (TR + EN). Pure token styling, inline SVG icons, no external icon deps.
 */

import { useCallback, useState } from 'react'

type Provider = 'google' | 'apple' | 'facebook'

interface SocialLoginButtonsProps {
  locale?: 'tr' | 'en'
}

interface Copy {
  google: string
  apple: string
  facebook: string
  toast: string
  tooltip: string
  ariaLabel: (provider: string) => string
}

const COPY: Record<'tr' | 'en', Copy> = {
  tr: {
    google: 'Google ile devam et',
    apple: 'Apple ile devam et',
    facebook: 'Facebook ile devam et',
    toast: 'Sosyal giriş yakında — şimdilik form\'u kullanın',
    tooltip: 'Yalnızca demo amaçlıdır, gerçek hesap oluşturulmaz.',
    ariaLabel: (p) => `${p} ile devam et (demo)`,
  },
  en: {
    google: 'Continue with Google',
    apple: 'Continue with Apple',
    facebook: 'Continue with Facebook',
    toast: 'Social sign-in coming soon — use the form for now',
    tooltip: 'Demo only — no real account is created.',
    ariaLabel: (p) => `Continue with ${p} (demo)`,
  },
}

export default function SocialLoginButtons({ locale = 'tr' }: SocialLoginButtonsProps) {
  const [toastVisible, setToastVisible] = useState(false)
  const copy = COPY[locale]

  const onClick = useCallback(
    (provider: Provider) => {
      if (typeof document !== 'undefined') {
        // Demo cookie matches existing buyer mock (see /giris form handler).
        document.cookie = `arsam_buyer_demo=social-${provider}; path=/; max-age=86400; SameSite=Lax`
      }
      setToastVisible(true)
      // Give the toast time to read; then redirect.
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = locale === 'en' ? '/en/hesabim/' : '/hesabim/'
        }
      }, 600)
    },
    [locale],
  )

  const baseBtn = [
    'inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl',
    'border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground',
    'transition hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20',
  ].join(' ')

  return (
    <div data-social-login="" className="flex flex-col gap-2 sm:flex-row sm:gap-3">
      <button
        type="button"
        data-social-provider="google"
        title={copy.tooltip}
        aria-label={copy.ariaLabel('Google')}
        onClick={() => onClick('google')}
        className={baseBtn}
      >
        <GoogleIcon />
        <span>{copy.google}</span>
      </button>

      <button
        type="button"
        data-social-provider="apple"
        title={copy.tooltip}
        aria-label={copy.ariaLabel('Apple')}
        onClick={() => onClick('apple')}
        className={baseBtn}
      >
        <AppleIcon />
        <span>{copy.apple}</span>
      </button>

      <button
        type="button"
        data-social-provider="facebook"
        title={copy.tooltip}
        aria-label={copy.ariaLabel('Facebook')}
        onClick={() => onClick('facebook')}
        className={baseBtn}
      >
        <FacebookIcon />
        <span>{copy.facebook}</span>
      </button>

      {toastVisible ? (
        <div
          role="status"
          aria-live="polite"
          data-social-toast=""
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-foreground px-4 py-2 text-xs text-background shadow-lg"
        >
          {copy.toast}
        </div>
      ) : null}
    </div>
  )
}

/* ---------- Inline brand icons (monochrome currentColor variants) ---------- */

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      <path d="M16.365 1.43c0 1.14-.41 2.21-1.23 2.95-.83.78-1.87 1.36-2.94 1.27-.12-1.11.41-2.27 1.16-3.01.78-.78 2.12-1.36 3.01-1.21zM20.5 17.39c-.55 1.27-.81 1.84-1.52 2.96-.99 1.55-2.39 3.48-4.12 3.5-1.54.01-1.94-1-4.03-.99-2.1.01-2.53.99-4.07.98-1.74-.02-3.06-1.76-4.05-3.31C.27 16.07-.27 10.97 1.74 8.24 3.18 6.28 5.45 5.18 7.6 5.18c2.18 0 3.54 1.19 5.33 1.19 1.73 0 2.79-1.19 5.31-1.19 1.91 0 3.94 1.04 5.39 2.84-4.74 2.6-3.97 9.37-3.13 9.37z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="#1877F2"
    >
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97H15.83c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  )
}
