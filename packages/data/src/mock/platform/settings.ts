// Platform Settings (Faz 11.3 — /settings)

export interface PlatformSetting {
  key: string
  label: string
  description: string
  value: string | number | boolean
  type: 'text' | 'number' | 'boolean' | 'select'
  options?: string[]
  category: 'general' | 'security' | 'email' | 'api' | 'compliance'
  lastChangedISO: string
  lastChangedBy: string
}

export const PLATFORM_SETTINGS: PlatformSetting[] = [
  { key: 'platform.name', label: 'Platform adı', description: 'Login ekranı + email başlıkları', value: 'arsam.net', type: 'text', category: 'general', lastChangedISO: '2026-04-12', lastChangedBy: 'ahmet@turksab.com' },
  { key: 'platform.locale', label: 'Varsayılan locale', description: "Yeni tenant'lar için", value: 'tr-TR', type: 'select', options: ['tr-TR', 'en-US'], category: 'general', lastChangedISO: '2026-03-01', lastChangedBy: 'ahmet@turksab.com' },
  { key: 'security.session_timeout_min', label: 'Session timeout (dk)', description: 'Inactive session expire', value: 480, type: 'number', category: 'security', lastChangedISO: '2026-04-22', lastChangedBy: 'ahmet@turksab.com' },
  { key: 'security.require_2fa', label: '2FA zorunlu', description: 'Tüm super-admin kullanıcıları için', value: true, type: 'boolean', category: 'security', lastChangedISO: '2026-04-22', lastChangedBy: 'ahmet@turksab.com' },
  { key: 'security.ip_allowlist', label: 'IP allowlist', description: 'Virgülle ayrılmış CIDR listesi', value: '195.174.0.0/16, 88.235.0.0/16', type: 'text', category: 'security', lastChangedISO: '2026-04-22', lastChangedBy: 'ahmet@turksab.com' },
  { key: 'email.from', label: 'Email FROM', description: 'Sistem maillerinin gönderici adresi', value: 'noreply@arsam.net', type: 'text', category: 'email', lastChangedISO: '2026-02-18', lastChangedBy: 'ahmet@turksab.com' },
  { key: 'email.reply_to', label: 'Email REPLY-TO', description: 'Kullanıcı yanıt adresi', value: 'destek@arsam.net', type: 'text', category: 'email', lastChangedISO: '2026-02-18', lastChangedBy: 'ahmet@turksab.com' },
  { key: 'api.rate_limit_per_min', label: 'API rate limit (req/dk)', description: 'Per-tenant default', value: 600, type: 'number', category: 'api', lastChangedISO: '2026-03-15', lastChangedBy: 'ahmet@turksab.com' },
  { key: 'api.allow_cors_origins', label: 'CORS origins', description: 'Virgülle ayrılmış allowed origins', value: 'https://arsam.net', type: 'text', category: 'api', lastChangedISO: '2026-03-15', lastChangedBy: 'ahmet@turksab.com' },
  { key: 'compliance.data_retention_days', label: 'Veri saklama (gün)', description: 'KVKK uyumu, kullanıcı talebi olmadan', value: 730, type: 'number', category: 'compliance', lastChangedISO: '2026-01-10', lastChangedBy: 'ahmet@turksab.com' },
  { key: 'compliance.audit_log_retention_days', label: 'Audit log saklama (gün)', description: 'Hot tier; soğuk arşive sonra geçer', value: 365, type: 'number', category: 'compliance', lastChangedISO: '2026-01-10', lastChangedBy: 'ahmet@turksab.com' },
  { key: 'compliance.dpo_email', label: 'DPO email', description: 'Data Protection Officer', value: 'kvkk@arsam.net', type: 'text', category: 'compliance', lastChangedISO: '2026-01-10', lastChangedBy: 'ahmet@turksab.com' },
]
