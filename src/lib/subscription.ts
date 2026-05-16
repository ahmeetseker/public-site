// Subscription localStorage adapter (Wave F7.B).
//
// Spec: docs/superpowers/specs/2026-05-13-wave-f7-auth-subscription-settings-design.md §5
//
// `arsam.subscription.v1` slice — tracks the buyer's current plan + a mock
// invoice history. Public-site is SSG with no backend, so upgrades / cancels
// are simulated entirely client-side and persist across tabs via localStorage.
// Three tiers: free (0₺), pro (29₺), premium (49₺). Free is the default.
//
// Invoice ID format: `INV-YYYY-NNN` — a sequence number scoped to the current
// calendar year of paidAt. Sequence increments per invoice append; on a new
// year it resets to 001. History is capped at 12 entries (newest-first).

export type PlanTier = 'free' | 'pro' | 'premium'
export type InvoiceStatus = 'paid' | 'failed'

export interface Invoice {
  /** INV-YYYY-NNN */
  id: string
  plan: PlanTier
  /** TL */
  amount: number
  paidAt: number
  status: InvoiceStatus
}

export interface Subscription {
  currentPlan: PlanTier
  renewsAt: number | null
  cancelledAt: number | null
  invoiceHistory: Invoice[]
}

export const SUBSCRIPTION_KEY = 'arsam.subscription.v1'
export const MAX_INVOICE_HISTORY = 12

/** Price (TL/month) per plan — kept in sync with PLANS in SubscriptionPlans.tsx. */
export const PLAN_PRICES: Record<PlanTier, number> = {
  free: 0,
  pro: 29,
  premium: 49,
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

const DEFAULT_SUBSCRIPTION: Subscription = {
  currentPlan: 'free',
  renewsAt: null,
  cancelledAt: null,
  invoiceHistory: [],
}

function isInvoice(v: unknown): v is Invoice {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.plan === 'string' &&
    typeof o.amount === 'number' &&
    typeof o.paidAt === 'number' &&
    (o.status === 'paid' || o.status === 'failed')
  )
}

function isSubscription(v: unknown): v is Subscription {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    (o.currentPlan === 'free' || o.currentPlan === 'pro' || o.currentPlan === 'premium') &&
    (o.renewsAt === null || typeof o.renewsAt === 'number') &&
    (o.cancelledAt === null || typeof o.cancelledAt === 'number') &&
    Array.isArray(o.invoiceHistory) &&
    o.invoiceHistory.every(isInvoice)
  )
}

function read(): Subscription {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_SUBSCRIPTION }
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_KEY)
    if (!raw) return { ...DEFAULT_SUBSCRIPTION }
    const parsed = JSON.parse(raw)
    return isSubscription(parsed) ? parsed : { ...DEFAULT_SUBSCRIPTION }
  } catch {
    return { ...DEFAULT_SUBSCRIPTION }
  }
}

function write(sub: Subscription): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(sub))
  } catch {
    // quota exceeded — silently drop.
  }
}

function nextInvoiceId(history: Invoice[], paidAt: number): string {
  const year = new Date(paidAt).getFullYear()
  const sameYearCount = history.filter(
    (inv) => new Date(inv.paidAt).getFullYear() === year,
  ).length
  const seq = String(sameYearCount + 1).padStart(3, '0')
  return `INV-${year}-${seq}`
}

export function getSubscription(): Subscription {
  return read()
}

/**
 * Switch to the requested plan and (if it's a paid tier) append a mock invoice.
 * - upgrade pro/premium → invoice append + renewsAt = now + 30 days
 * - downgrade to free is treated as a cancel (no new invoice, history kept)
 * - no-op when the target tier == currentPlan
 */
export function upgradeTo(tier: PlanTier): Subscription {
  const current = read()
  if (tier === current.currentPlan) return current

  // Downgrade to free → behave like cancelSubscription (no invoice).
  if (tier === 'free') {
    return cancelSubscription()
  }

  const paidAt = Date.now()
  const invoice: Invoice = {
    id: nextInvoiceId(current.invoiceHistory, paidAt),
    plan: tier,
    amount: PLAN_PRICES[tier],
    paidAt,
    status: 'paid',
  }
  const nextHistory = [invoice, ...current.invoiceHistory].slice(
    0,
    MAX_INVOICE_HISTORY,
  )
  const next: Subscription = {
    currentPlan: tier,
    renewsAt: paidAt + THIRTY_DAYS_MS,
    cancelledAt: null,
    invoiceHistory: nextHistory,
  }
  write(next)
  return next
}

/** Switch back to free and stamp cancelledAt. Invoice history is preserved. */
export function cancelSubscription(): Subscription {
  const current = read()
  const next: Subscription = {
    currentPlan: 'free',
    renewsAt: null,
    cancelledAt: Date.now(),
    invoiceHistory: current.invoiceHistory.slice(0, MAX_INVOICE_HISTORY),
  }
  write(next)
  return next
}

export function clearSubscription(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(SUBSCRIPTION_KEY)
  } catch {
    /* ignore */
  }
}
