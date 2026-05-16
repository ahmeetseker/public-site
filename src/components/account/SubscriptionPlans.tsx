/**
 * SubscriptionPlans — /hesabim/aboneliklerim React island (client:visible).
 *
 * Wave F7.B.
 *
 * Renders 3 PlanCards (free/pro/premium) in a grid, owns the upgrade-confirm
 * modal, and dispatches `arsam:subscription:changed` on the window after every
 * successful upgrade/cancel so sibling islands (InvoiceHistory) can refresh.
 *
 * Locale is inferred from `window.location.pathname` so the same component can
 * power both /hesabim/aboneliklerim and /en/hesabim/aboneliklerim without an
 * Astro-side prop. The TR/EN dictionaries are loaded once and the relevant
 * branch is selected.
 *
 * Listens for `storage` events so a tab switch reflects the latest plan.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  getSubscription,
  PLAN_PRICES,
  upgradeTo,
  type PlanTier,
  type Subscription,
} from '../../lib/subscription'
import PlanCard from './PlanCard'

export const SUBSCRIPTION_CHANGED_EVENT = 'arsam:subscription:changed'

interface PlanDictionary {
  pageEyebrow: string
  pageTitle: string
  perMonth: string
  currentBadge: string
  currentSublabel: string
  upgradeCta: string
  downgradeCta: string
  plans: {
    free: { name: string; features: string[] }
    pro: { name: string; features: string[] }
    premium: { name: string; features: string[] }
  }
  confirm: {
    upgradeHeading: string
    downgradeHeading: string
    /** body has {plan} + {price} placeholders, both already substituted */
    bodyUpgrade: string
    bodyDowngrade: string
    demoNote: string
    confirm: string
    cancel: string
  }
  toastUpgraded: string
  toastDowngraded: string
}

const TR: PlanDictionary = {
  pageEyebrow: 'HESAP · ABONELİK',
  pageTitle: 'Aboneliklerim',
  perMonth: '/ay',
  currentBadge: 'Mevcut plan',
  currentSublabel: 'Şu anki planınız.',
  upgradeCta: 'Yükselt',
  downgradeCta: 'Düşür',
  plans: {
    free: {
      name: 'Ücretsiz',
      features: ['Ayda 3 ilan', 'Temel arama', 'Temel mesajlaşma'],
    },
    pro: {
      name: 'Pro',
      features: ['Sınırsız ilan', 'Öne çıkarılmış ilan', 'Öncelikli destek', 'Gelişmiş arama'],
    },
    premium: {
      name: 'Premium',
      features: [
        'Tüm Pro özellikleri',
        'Detaylı analitik panel',
        'Atanmış müşteri temsilcisi',
        'API erişimi',
      ],
    },
  },
  confirm: {
    upgradeHeading: '{plan} planına yükselt',
    downgradeHeading: '{plan} planına geç',
    bodyUpgrade:
      '{plan} planına yükselmek istediğinizden emin misiniz? Aylık {price} ücret tahakkuk eder.',
    bodyDowngrade:
      '{plan} planına geçmek istediğinizden emin misiniz? Mevcut yükseltmeniz iptal edilir.',
    demoNote: 'Bu bir demo. Gerçek ödeme alınmaz.',
    confirm: 'Onayla',
    cancel: 'Vazgeç',
  },
  toastUpgraded: 'Plan güncellendi ✓',
  toastDowngraded: 'Plan değişikliği uygulandı ✓',
}

const EN: PlanDictionary = {
  pageEyebrow: 'ACCOUNT · SUBSCRIPTION',
  pageTitle: 'My subscriptions',
  perMonth: '/mo',
  currentBadge: 'Current plan',
  currentSublabel: 'You’re on this plan.',
  upgradeCta: 'Upgrade',
  downgradeCta: 'Downgrade',
  plans: {
    free: {
      name: 'Free',
      features: ['3 listings / month', 'Basic search', 'Basic messages'],
    },
    pro: {
      name: 'Pro',
      features: ['Unlimited listings', 'Featured listings', 'Priority support', 'Advanced search'],
    },
    premium: {
      name: 'Premium',
      features: ['Everything in Pro', 'Analytics dashboard', 'Dedicated agent', 'API access'],
    },
  },
  confirm: {
    upgradeHeading: 'Upgrade to {plan}',
    downgradeHeading: 'Switch to {plan}',
    bodyUpgrade:
      'Are you sure you want to upgrade to {plan}? You will be billed {price} per month.',
    bodyDowngrade:
      'Are you sure you want to switch to {plan}? Your current upgrade will be cancelled.',
    demoNote: 'This is a demo — no real charges are made.',
    confirm: 'Confirm',
    cancel: 'Cancel',
  },
  toastUpgraded: 'Plan updated ✓',
  toastDowngraded: 'Plan change applied ✓',
}

const TIER_ORDER: Record<PlanTier, number> = { free: 0, pro: 1, premium: 2 }
const TIERS: PlanTier[] = ['free', 'pro', 'premium']

function isEnglish(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/en/') || window.location.pathname === '/en'
}

function formatPrice(amount: number, locale: 'tr' | 'en'): string {
  if (amount === 0) {
    return locale === 'tr' ? '₺0' : '₺0'
  }
  if (locale === 'tr') {
    return `₺${new Intl.NumberFormat('tr-TR').format(amount)}`
  }
  // EN: keep the lira glyph to match the TR product, format with en-US grouping.
  return `₺${new Intl.NumberFormat('en-US').format(amount)}`
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`))
}

export default function SubscriptionPlans() {
  const [sub, setSub] = useState<Subscription | null>(null)
  const [mounted, setMounted] = useState(false)
  const [locale, setLocale] = useState<'tr' | 'en'>('tr')
  const [pending, setPending] = useState<PlanTier | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    setLocale(isEnglish() ? 'en' : 'tr')
    const sync = () => setSub(getSubscription())
    sync()
    setMounted(true)
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === 'arsam.subscription.v1') sync()
    }
    const onChange = () => sync()
    window.addEventListener('storage', onStorage)
    window.addEventListener(SUBSCRIPTION_CHANGED_EVENT, onChange)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(SUBSCRIPTION_CHANGED_EVENT, onChange)
    }
  }, [])

  const dict = locale === 'en' ? EN : TR

  const currentTier: PlanTier = sub?.currentPlan ?? 'free'

  const pendingDirection: 'upgrade' | 'downgrade' | null = useMemo(() => {
    if (!pending) return null
    return TIER_ORDER[pending] > TIER_ORDER[currentTier] ? 'upgrade' : 'downgrade'
  }, [pending, currentTier])

  function handleSelect(tier: PlanTier) {
    setPending(tier)
  }

  function handleCancel() {
    setPending(null)
  }

  function handleConfirm() {
    if (!pending) return
    const next = upgradeTo(pending)
    setSub(next)
    const direction = TIER_ORDER[pending] > TIER_ORDER[currentTier] ? 'upgrade' : 'downgrade'
    setToast(direction === 'upgrade' ? dict.toastUpgraded : dict.toastDowngraded)
    setPending(null)
    // Notify sibling islands (InvoiceHistory) to refresh.
    try {
      window.dispatchEvent(new CustomEvent(SUBSCRIPTION_CHANGED_EVENT))
    } catch {
      /* ignore */
    }
    setTimeout(() => setToast(null), 3000)
  }

  // SSR-friendly placeholder; mirrors FavoritesList pattern.
  if (!mounted) {
    return (
      <div
        className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground"
        data-subscription-loading=""
      >
        {locale === 'en' ? 'Loading…' : 'Yükleniyor…'}
      </div>
    )
  }

  const pendingPlanName = pending ? dict.plans[pending].name : ''
  const pendingPriceLabel = pending ? formatPrice(PLAN_PRICES[pending], locale) : ''
  const confirmHeading =
    pendingDirection === 'upgrade' ? dict.confirm.upgradeHeading : dict.confirm.downgradeHeading
  const confirmBody =
    pendingDirection === 'upgrade' ? dict.confirm.bodyUpgrade : dict.confirm.bodyDowngrade

  return (
    <div
      data-subscription-island=""
      data-current-plan={currentTier}
      data-mounted={mounted ? 'true' : 'false'}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {TIERS.map((tier) => {
          const priceLabel = formatPrice(PLAN_PRICES[tier], locale)
          const isCurrent = tier === currentTier
          const direction: 'upgrade' | 'downgrade' | 'current' = isCurrent
            ? 'current'
            : TIER_ORDER[tier] > TIER_ORDER[currentTier]
            ? 'upgrade'
            : 'downgrade'
          return (
            <PlanCard
              key={tier}
              tier={tier}
              name={dict.plans[tier].name}
              price={PLAN_PRICES[tier]}
              priceLabel={priceLabel}
              features={dict.plans[tier].features}
              isCurrent={isCurrent}
              emphasis={tier === 'premium'}
              currentBadge={dict.currentBadge}
              upgradeCta={dict.upgradeCta}
              downgradeCta={dict.downgradeCta}
              direction={direction}
              perMonthSuffix={dict.perMonth}
              currentSublabel={dict.currentSublabel}
              onSelect={() => handleSelect(tier)}
            />
          )
        })}
      </div>

      {pending && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-confirm-heading"
          data-subscription-confirm-dialog={pending}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            // Backdrop click closes.
            if (e.target === e.currentTarget) handleCancel()
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 id="plan-confirm-heading" className="font-serif text-xl tracking-tight">
              {interpolate(confirmHeading, { plan: pendingPlanName })}
            </h2>
            <p className="mt-3 text-sm text-foreground/90">
              {interpolate(confirmBody, {
                plan: pendingPlanName,
                price: pendingPriceLabel,
              })}
            </p>
            <p className="mt-2 text-xs italic text-muted-foreground">{dict.confirm.demoNote}</p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                data-subscription-confirm-cancel
                onClick={handleCancel}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-foreground/5"
              >
                {dict.confirm.cancel}
              </button>
              <button
                type="button"
                data-subscription-confirm-ok
                onClick={handleConfirm}
                className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
              >
                {dict.confirm.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          data-subscription-toast=""
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
