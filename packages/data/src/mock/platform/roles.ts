// Permissions Matrix (I04)

export type Resource = 'tenant' | 'user' | 'listing' | 'transaction' | 'audit' | 'pii' | 'billing' | 'plugin' | 'integration'
export type Action = 'read' | 'create' | 'update' | 'delete' | 'export' | 'impersonate'

export const RESOURCES: Resource[] = ['tenant', 'user', 'listing', 'transaction', 'audit', 'pii', 'billing', 'plugin', 'integration']
export const ACTIONS: Action[] = ['read', 'create', 'update', 'delete', 'export', 'impersonate']

export const RESOURCE_LABEL: Record<Resource, string> = {
  tenant: 'Tenant',
  user: 'Kullanıcı',
  listing: 'İlan',
  transaction: 'İşlem',
  audit: 'Audit log',
  pii: 'PII',
  billing: 'Fatura',
  plugin: 'Plugin',
  integration: 'Entegrasyon',
}

export const ACTION_LABEL: Record<Action, string> = {
  read: 'Oku',
  create: 'Oluştur',
  update: 'Güncelle',
  delete: 'Sil',
  export: 'Dışa aktar',
  impersonate: 'Impersonate',
}

export interface RoleDef {
  id: 'super-admin' | 'support' | 'billing-ops' | 'compliance' | 'readonly-auditor'
  name: string
  description: string
  permissions: Array<{ resource: Resource; actions: Action[] }>
  memberCount: number
  members: Array<{ email: string; lastActiveISO: string }>
}

export const ROLES: RoleDef[] = [
  {
    id: 'super-admin',
    name: 'Süper Admin',
    description: 'Tam yetki, sistem yöneticisi. Tüm kaynaklar üzerinde tüm aksiyonları gerçekleştirebilir.',
    permissions: [
      { resource: 'tenant', actions: ['read', 'create', 'update', 'delete', 'export', 'impersonate'] },
      { resource: 'user', actions: ['read', 'create', 'update', 'delete', 'export', 'impersonate'] },
      { resource: 'listing', actions: ['read', 'create', 'update', 'delete', 'export'] },
      { resource: 'transaction', actions: ['read', 'create', 'update', 'delete', 'export'] },
      { resource: 'audit', actions: ['read', 'export'] },
      { resource: 'pii', actions: ['read', 'export'] },
      { resource: 'billing', actions: ['read', 'create', 'update', 'delete', 'export'] },
      { resource: 'plugin', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'integration', actions: ['read', 'create', 'update', 'delete'] },
    ],
    memberCount: 2,
    members: [
      { email: 'ahmet@turksab.com', lastActiveISO: '2026-05-11T08:42:00Z' },
      { email: 'cto@turksab.com', lastActiveISO: '2026-05-10T18:20:00Z' },
    ],
  },
  {
    id: 'support',
    name: 'Destek',
    description: 'Müşteri destek ekibi. Read-mostly + sınırlı update/impersonate yetkisi.',
    permissions: [
      { resource: 'tenant', actions: ['read', 'impersonate'] },
      { resource: 'user', actions: ['read', 'update'] },
      { resource: 'listing', actions: ['read', 'update'] },
      { resource: 'transaction', actions: ['read'] },
      { resource: 'pii', actions: ['read'] },
      { resource: 'plugin', actions: ['read'] },
      { resource: 'integration', actions: ['read'] },
    ],
    memberCount: 4,
    members: [
      { email: 'destek@turksab.com', lastActiveISO: '2026-05-11T09:15:00Z' },
      { email: 'destek2@turksab.com', lastActiveISO: '2026-05-11T08:01:00Z' },
      { email: 'destek3@turksab.com', lastActiveISO: '2026-05-10T22:40:00Z' },
      { email: 'destek-gece@turksab.com', lastActiveISO: '2026-05-11T02:14:00Z' },
    ],
  },
  {
    id: 'billing-ops',
    name: 'Fatura Ops',
    description: 'Finans/billing ekibi. Sadece fatura ve işlem kaynaklarında tam yetki.',
    permissions: [
      { resource: 'tenant', actions: ['read'] },
      { resource: 'user', actions: ['read'] },
      { resource: 'transaction', actions: ['read', 'update', 'export'] },
      { resource: 'billing', actions: ['read', 'create', 'update', 'export'] },
      { resource: 'pii', actions: ['read'] },
    ],
    memberCount: 2,
    members: [
      { email: 'finans@turksab.com', lastActiveISO: '2026-05-11T10:00:00Z' },
      { email: 'muhasebe@turksab.com', lastActiveISO: '2026-05-10T17:30:00Z' },
    ],
  },
  {
    id: 'compliance',
    name: 'Compliance',
    description: 'KVKK/GDPR ekibi. Audit + PII üzerinde tam okuma ve dışa aktarım hakkı.',
    permissions: [
      { resource: 'tenant', actions: ['read'] },
      { resource: 'user', actions: ['read'] },
      { resource: 'audit', actions: ['read', 'export'] },
      { resource: 'pii', actions: ['read', 'export'] },
      { resource: 'billing', actions: ['read'] },
    ],
    memberCount: 2,
    members: [
      { email: 'compliance@turksab.com', lastActiveISO: '2026-05-11T07:42:00Z' },
      { email: 'kvkk@turksab.com', lastActiveISO: '2026-05-09T16:00:00Z' },
    ],
  },
  {
    id: 'readonly-auditor',
    name: 'Salt Okunur Denetçi',
    description: 'Dış denetçi (örn. SOC 2 auditor). Sadece read — hiçbir kaynakta yazma yok.',
    permissions: [
      { resource: 'tenant', actions: ['read'] },
      { resource: 'user', actions: ['read'] },
      { resource: 'listing', actions: ['read'] },
      { resource: 'transaction', actions: ['read'] },
      { resource: 'audit', actions: ['read'] },
      { resource: 'billing', actions: ['read'] },
      { resource: 'plugin', actions: ['read'] },
      { resource: 'integration', actions: ['read'] },
    ],
    memberCount: 1,
    members: [
      { email: 'auditor@deloitte-tr.com', lastActiveISO: '2026-05-08T13:20:00Z' },
    ],
  },
]
