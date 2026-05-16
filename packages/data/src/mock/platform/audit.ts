// Audit Log (D01 Event Sourcing)

export interface AuditEntry {
  id: string
  actor: string
  action: string
  resourceType: string
  resourceId: string
  tenantId: string | null
  ip: string
  userAgent: string
  outcome: 'success' | 'failure'
  metadata?: Record<string, string | number>
  atISO: string
}

export const AUDIT_LOG: AuditEntry[] = [
  { id: 'AUD-2026-09421', actor: 'ahmet@turksab.com', action: 'tenant.create', resourceType: 'tenant', resourceId: 'atolye-ayv', tenantId: null, ip: '195.174.42.18', userAgent: 'Chrome/126 macOS', outcome: 'success', atISO: '2026-05-11T08:42:00Z', metadata: { plan: 'Pro', region: 'TR-10' } },
  { id: 'AUD-2026-09420', actor: 'system', action: 'webhook.dispatched', resourceType: 'webhook', resourceId: 'whk_88421', tenantId: 'cesme-ars', ip: 'internal', userAgent: 'arsam-internal', outcome: 'success', atISO: '2026-05-11T08:30:00Z', metadata: { event: 'listing.published', attempts: 1 } },
  { id: 'AUD-2026-09419', actor: 'destek@turksab.com', action: 'pii.access', resourceType: 'customer', resourceId: 'cust_99812', tenantId: 'bodrum-em', ip: '212.156.91.4', userAgent: 'Safari/17 iPad', outcome: 'success', atISO: '2026-05-11T07:58:00Z', metadata: { fields: 'email,phone', reason: 'support-ticket #4421' } },
  { id: 'AUD-2026-09418', actor: 'guvenlik@turksab.com', action: 'tenant.impersonate.start', resourceType: 'tenant', resourceId: 'gocek-ya', tenantId: 'gocek-ya', ip: '195.174.42.18', userAgent: 'Chrome/126 macOS', outcome: 'success', atISO: '2026-05-11T07:12:00Z', metadata: { reason: 'investigation' } },
  { id: 'AUD-2026-09417', actor: 'guvenlik@turksab.com', action: 'tenant.impersonate.end', resourceType: 'tenant', resourceId: 'gocek-ya', tenantId: 'gocek-ya', ip: '195.174.42.18', userAgent: 'Chrome/126 macOS', outcome: 'success', atISO: '2026-05-11T07:24:00Z', metadata: { durationSec: 720 } },
  { id: 'AUD-2026-09416', actor: 'eren@cesme-ars', action: 'auth.login', resourceType: 'user', resourceId: 'usr_22841', tenantId: 'cesme-ars', ip: '88.235.12.91', userAgent: 'Chrome/126 Windows', outcome: 'failure', atISO: '2026-05-11T06:45:00Z', metadata: { reason: 'wrong-password', attempt: 3 } },
  { id: 'AUD-2026-09415', actor: 'system', action: 'plan.renewed', resourceType: 'billing', resourceId: 'bil_55881', tenantId: 'bodrum-em', ip: 'internal', userAgent: 'arsam-billing', outcome: 'success', atISO: '2026-05-10T23:00:00Z', metadata: { plan: 'Enterprise', amount: 19900 } },
  { id: 'AUD-2026-09414', actor: 'merve@fethiye-pa', action: 'listing.updated', resourceType: 'listing', resourceId: 'lst_71224', tenantId: 'fethiye-pa', ip: '5.180.44.21', userAgent: 'Chrome/126 Android', outcome: 'success', atISO: '2026-05-10T18:22:00Z', metadata: { fields: 'price,description' } },
  { id: 'AUD-2026-09413', actor: 'destek@turksab.com', action: 'permission.denied', resourceType: 'audit', resourceId: 'AUD-2026-09150', tenantId: null, ip: '195.174.42.18', userAgent: 'Chrome/126 macOS', outcome: 'failure', atISO: '2026-05-10T14:11:00Z', metadata: { requiredRole: 'super-admin' } },
  { id: 'AUD-2026-09412', actor: 'ahmet@turksab.com', action: 'plugin.installed', resourceType: 'plugin', resourceId: 'pl-claude-assistant', tenantId: 'cesme-ars', ip: '195.174.42.18', userAgent: 'Chrome/126 macOS', outcome: 'success', atISO: '2026-05-10T11:30:00Z', metadata: { version: '0.9.1' } },
  { id: 'AUD-2026-09411', actor: 'system', action: 'tenant.suspended', resourceType: 'tenant', resourceId: 'gocek-ya', tenantId: 'gocek-ya', ip: 'internal', userAgent: 'arsam-billing', outcome: 'success', atISO: '2026-05-09T22:00:00Z', metadata: { reason: 'payment-failed', attempts: 3 } },
  { id: 'AUD-2026-09410', actor: 'compliance@turksab.com', action: 'audit.export', resourceType: 'audit', resourceId: 'AUD-EXPORT-2026-04', tenantId: null, ip: '195.174.42.18', userAgent: 'Chrome/126 macOS', outcome: 'success', atISO: '2026-05-09T15:40:00Z', metadata: { range: '2026-04', rows: 8842 } },
  { id: 'AUD-2026-09409', actor: 'kemal@bodrum-em', action: 'user.invited', resourceType: 'user', resourceId: 'usr_22844', tenantId: 'bodrum-em', ip: '85.107.21.5', userAgent: 'Safari/17 macOS', outcome: 'success', atISO: '2026-05-09T10:18:00Z', metadata: { role: 'agent', email: 'a***@bodrum-em.com' } },
  { id: 'AUD-2026-09408', actor: 'system', action: 'backup.completed', resourceType: 'system', resourceId: 'bkp_20260509', tenantId: null, ip: 'internal', userAgent: 'arsam-backup', outcome: 'success', atISO: '2026-05-09T03:00:00Z', metadata: { sizeGB: 184, durationMin: 42 } },
  { id: 'AUD-2026-09407', actor: 'unknown', action: 'auth.login', resourceType: 'user', resourceId: 'usr_unknown', tenantId: null, ip: '45.155.205.220', userAgent: 'curl/7.81', outcome: 'failure', atISO: '2026-05-08T02:14:00Z', metadata: { reason: 'invalid-credentials', flagged: 'brute-force-suspect' } },
]
