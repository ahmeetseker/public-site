/**
 * Mock seed: AI bildirim tercihleri.
 * Default user (`demo-user`) için tek pref matrisi — 8 event tipi.
 *
 * `smartTimingEnabled: true` → AI quietHours dışında en uygun saatte gönderir.
 * Spec: docs/superpowers/specs/2026-05-15-landx-parity-3-wave-design.md (Bölüm 6).
 */

import type { AiNotificationPref } from '../types/ai'

export const AI_NOTIFICATION_PREFS_DEFAULT: AiNotificationPref = {
  userId: 'demo-user',
  smartTimingEnabled: true,
  quietHours: { from: '23:00', to: '07:00' },
  perEvent: {
    listing_new_match: {
      aiPriority: 'normal',
      channels: ['email', 'push'],
    },
    listing_price_drop: {
      aiPriority: 'critical',
      channels: ['email', 'push', 'sms'],
    },
    valuation_change: {
      aiPriority: 'normal',
      channels: ['push'],
    },
    qa_seller_replied: {
      aiPriority: 'critical',
      channels: ['email', 'push'],
    },
    market_report_ready: {
      aiPriority: 'low',
      channels: ['email'],
    },
    tapu_risk_detected: {
      aiPriority: 'critical',
      channels: ['email', 'push', 'sms'],
    },
    payment_status_change: {
      aiPriority: 'normal',
      channels: ['email', 'push'],
    },
    weekly_digest: {
      aiPriority: 'low',
      channels: ['email'],
    },
  },
}
