/**
 * Mock seed — admin API endpoints (Wave F35 / Faz 1C).
 *
 * 24 endpoint, 5 group:
 *   - Listings   (5)
 *   - Users      (5)
 *   - Auth       (4)
 *   - Billing    (5)
 *   - Compliance (5)
 *
 * Schema'lar JSON Schema "lite" — sadece try-it formu için yeterli alanlar.
 * F35 Faz 2 `/api-explorer` route'u bu seed'i tüketir.
 */

import type { AdminApiEndpoint } from '../types/admin-agent'

export const ADMIN_API_ENDPOINTS: ReadonlyArray<AdminApiEndpoint> = [
  // ─── Listings ──────────────────────────────────────────────────────────────
  {
    id: 'listings.list',
    method: 'GET',
    path: '/api/v1/listings',
    group: 'Listings',
    description: 'Aktif arsa ilanlarını listeler (paginated).',
    requestSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', description: 'Sayfa (1-indexed).', example: 1 },
        pageSize: { type: 'integer', description: 'Sayfa başına kayıt.', example: 20 },
        region: { type: 'string', description: 'Bölge filtresi (slug).', example: 'cesme' },
      },
    },
    responseSchema: {
      type: 'object',
      properties: {
        items: { type: 'array', description: 'Listing[]' },
        total: { type: 'integer', example: 1248 },
      },
      required: ['items', 'total'],
    },
    authRequired: false,
    rateLimit: 60,
  },
  {
    id: 'listings.get',
    method: 'GET',
    path: '/api/v1/listings/:id',
    group: 'Listings',
    description: 'Tek ilanı detay döner.',
    requestSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', required: true, example: '28.AY.0142' },
      },
      required: ['id'],
    },
    responseSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        price: { type: 'integer', description: 'Kuruş.' },
      },
    },
    authRequired: false,
    rateLimit: 120,
  },
  {
    id: 'listings.create',
    method: 'POST',
    path: '/api/v1/listings',
    group: 'Listings',
    description: 'Yeni ilan oluşturur (broker veya seller).',
    requestSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', required: true, example: 'Çeşme Alaçatı imarlı arsa' },
        price: { type: 'integer', required: true, example: 850000000 },
        regionSlug: { type: 'string', required: true, example: 'cesme-alacati' },
      },
      required: ['title', 'price', 'regionSlug'],
    },
    responseSchema: {
      type: 'object',
      properties: { id: { type: 'string', example: 'LST-9821' } },
    },
    authRequired: true,
    rateLimit: 30,
  },
  {
    id: 'listings.update',
    method: 'PATCH',
    path: '/api/v1/listings/:id',
    group: 'Listings',
    description: 'İlan alanlarını günceller.',
    requestSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', required: true },
        patch: { type: 'object', description: 'Güncellenecek alanlar.' },
      },
      required: ['id', 'patch'],
    },
    responseSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, updatedAt: { type: 'string' } },
    },
    authRequired: true,
    rateLimit: 30,
  },
  {
    id: 'listings.delete',
    method: 'DELETE',
    path: '/api/v1/listings/:id',
    group: 'Listings',
    description: 'İlanı yumuşak siler (status=archived).',
    requestSchema: {
      type: 'object',
      properties: { id: { type: 'string', required: true } },
      required: ['id'],
    },
    responseSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, deletedAt: { type: 'string' } },
    },
    authRequired: true,
    rateLimit: 10,
  },

  // ─── Users ─────────────────────────────────────────────────────────────────
  {
    id: 'users.list',
    method: 'GET',
    path: '/api/v1/users',
    group: 'Users',
    description: 'Tüm kullanıcıları listeler (admin scope).',
    requestSchema: {
      type: 'object',
      properties: {
        role: { type: 'string', enum: ['buyer', 'seller', 'broker', 'admin'], example: 'broker' },
      },
    },
    responseSchema: {
      type: 'object',
      properties: { items: { type: 'array' }, total: { type: 'integer' } },
    },
    authRequired: true,
    rateLimit: 30,
  },
  {
    id: 'users.get',
    method: 'GET',
    path: '/api/v1/users/:id',
    group: 'Users',
    description: 'Tek kullanıcı detay (PII dahil — admin only).',
    requestSchema: {
      type: 'object',
      properties: { id: { type: 'string', required: true, example: 'USR-001' } },
      required: ['id'],
    },
    responseSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
      },
    },
    authRequired: true,
  },
  {
    id: 'users.suspend',
    method: 'POST',
    path: '/api/v1/users/:id/suspend',
    group: 'Users',
    description: 'Kullanıcıyı askıya alır (login engellenir).',
    requestSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', required: true },
        reason: { type: 'string', required: true, example: 'KVKK ihlali' },
      },
      required: ['id', 'reason'],
    },
    responseSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, suspendedAt: { type: 'string' } },
    },
    authRequired: true,
    rateLimit: 5,
  },
  {
    id: 'users.export',
    method: 'POST',
    path: '/api/v1/users/:id/export',
    group: 'Users',
    description: 'KVKK kullanıcı verisi export başlatır (async job).',
    requestSchema: {
      type: 'object',
      properties: { id: { type: 'string', required: true } },
      required: ['id'],
    },
    responseSchema: {
      type: 'object',
      properties: { jobId: { type: 'string', example: 'EXP-2026-05-15-001' } },
    },
    authRequired: true,
    rateLimit: 10,
  },
  {
    id: 'users.delete',
    method: 'DELETE',
    path: '/api/v1/users/:id',
    group: 'Users',
    description: 'KVKK silme talebini işler (PII mask, audit log).',
    requestSchema: {
      type: 'object',
      properties: { id: { type: 'string', required: true } },
      required: ['id'],
    },
    responseSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, deletedAt: { type: 'string' } },
    },
    authRequired: true,
    rateLimit: 5,
  },

  // ─── Auth ──────────────────────────────────────────────────────────────────
  {
    id: 'auth.login',
    method: 'POST',
    path: '/api/v1/auth/login',
    group: 'Auth',
    description: 'E-posta + şifre ile giriş; JWT döner.',
    requestSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', required: true, example: 'admin@landx.com' },
        password: { type: 'string', required: true, example: '••••••••' },
      },
      required: ['email', 'password'],
    },
    responseSchema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        expiresAt: { type: 'string' },
      },
    },
    authRequired: false,
    rateLimit: 5,
  },
  {
    id: 'auth.refresh',
    method: 'POST',
    path: '/api/v1/auth/refresh',
    group: 'Auth',
    description: 'Refresh token ile yeni access token alır.',
    requestSchema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string', required: true },
      },
      required: ['refreshToken'],
    },
    responseSchema: {
      type: 'object',
      properties: { token: { type: 'string' }, expiresAt: { type: 'string' } },
    },
    authRequired: false,
    rateLimit: 60,
  },
  {
    id: 'auth.logout',
    method: 'POST',
    path: '/api/v1/auth/logout',
    group: 'Auth',
    description: 'Aktif session\'ı invalidate eder.',
    requestSchema: {
      type: 'object',
      properties: {},
    },
    responseSchema: {
      type: 'object',
      properties: { ok: { type: 'boolean' } },
    },
    authRequired: true,
  },
  {
    id: 'auth.session',
    method: 'GET',
    path: '/api/v1/auth/session',
    group: 'Auth',
    description: 'Mevcut session bilgisini döner.',
    requestSchema: {
      type: 'object',
      properties: {},
    },
    responseSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        role: { type: 'string' },
        expiresAt: { type: 'string' },
      },
    },
    authRequired: true,
  },

  // ─── Billing ───────────────────────────────────────────────────────────────
  {
    id: 'billing.plans',
    method: 'GET',
    path: '/api/v1/billing/plans',
    group: 'Billing',
    description: 'Tüm abonelik planlarını listeler.',
    requestSchema: { type: 'object', properties: {} },
    responseSchema: {
      type: 'object',
      properties: { items: { type: 'array' } },
    },
    authRequired: false,
  },
  {
    id: 'billing.invoices',
    method: 'GET',
    path: '/api/v1/billing/invoices',
    group: 'Billing',
    description: 'Faturaları listeler (admin = tüm tenant\'lar).',
    requestSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['draft', 'issued', 'paid', 'overdue'] },
        month: { type: 'string', example: '2026-05' },
      },
    },
    responseSchema: {
      type: 'object',
      properties: { items: { type: 'array' }, total: { type: 'integer' } },
    },
    authRequired: true,
    rateLimit: 30,
  },
  {
    id: 'billing.invoice.create',
    method: 'POST',
    path: '/api/v1/billing/invoices',
    group: 'Billing',
    description: 'Manuel fatura oluşturur.',
    requestSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', required: true },
        amount: { type: 'integer', required: true, description: 'Kuruş.' },
        description: { type: 'string', required: true },
      },
      required: ['userId', 'amount', 'description'],
    },
    responseSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
    },
    authRequired: true,
    rateLimit: 10,
  },
  {
    id: 'billing.refund',
    method: 'POST',
    path: '/api/v1/billing/payments/:id/refund',
    group: 'Billing',
    description: 'Ödemeyi geri iade başlatır (workflow: orchestration).',
    requestSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', required: true, example: 'PAY-2026-05-1842' },
        reason: { type: 'string', required: true },
      },
      required: ['id', 'reason'],
    },
    responseSchema: {
      type: 'object',
      properties: { workflowId: { type: 'string', example: 'WF-RFD-0042' } },
    },
    authRequired: true,
    rateLimit: 5,
  },
  {
    id: 'billing.transactions',
    method: 'GET',
    path: '/api/v1/billing/transactions',
    group: 'Billing',
    description: 'İşlem hareketlerini listeler.',
    requestSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', example: '2026-05-01' },
        to: { type: 'string', example: '2026-05-31' },
      },
    },
    responseSchema: {
      type: 'object',
      properties: { items: { type: 'array' }, total: { type: 'integer' } },
    },
    authRequired: true,
    rateLimit: 30,
  },

  // ─── Compliance ────────────────────────────────────────────────────────────
  {
    id: 'compliance.kvkk.export',
    method: 'POST',
    path: '/api/v1/compliance/kvkk/export',
    group: 'Compliance',
    description: 'KVKK veri taşıma talebi başlatır.',
    requestSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', required: true },
        format: { type: 'string', enum: ['json', 'pdf'], example: 'json' },
      },
      required: ['userId'],
    },
    responseSchema: {
      type: 'object',
      properties: { jobId: { type: 'string' } },
    },
    authRequired: true,
    rateLimit: 5,
  },
  {
    id: 'compliance.kvkk.delete',
    method: 'POST',
    path: '/api/v1/compliance/kvkk/delete',
    group: 'Compliance',
    description: 'KVKK silme talebini orchestration\'a aktarır.',
    requestSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', required: true },
        confirmedBy: { type: 'string', required: true, description: 'Admin id.' },
      },
      required: ['userId', 'confirmedBy'],
    },
    responseSchema: {
      type: 'object',
      properties: { workflowId: { type: 'string' } },
    },
    authRequired: true,
    rateLimit: 3,
  },
  {
    id: 'compliance.audit.list',
    method: 'GET',
    path: '/api/v1/compliance/audit',
    group: 'Compliance',
    description: 'Audit chain event\'lerini listeler.',
    requestSchema: {
      type: 'object',
      properties: {
        actor: { type: 'string' },
        from: { type: 'string' },
        to: { type: 'string' },
      },
    },
    responseSchema: {
      type: 'object',
      properties: { items: { type: 'array' }, total: { type: 'integer' } },
    },
    authRequired: true,
    rateLimit: 60,
  },
  {
    id: 'compliance.audit.verify',
    method: 'POST',
    path: '/api/v1/compliance/audit/verify',
    group: 'Compliance',
    description: 'Audit chain hash bütünlüğünü doğrular.',
    requestSchema: { type: 'object', properties: {} },
    responseSchema: {
      type: 'object',
      properties: {
        verified: { type: 'boolean' },
        brokenLinks: { type: 'array' },
      },
    },
    authRequired: true,
    rateLimit: 5,
  },
  {
    id: 'compliance.dispute.list',
    method: 'GET',
    path: '/api/v1/compliance/disputes',
    group: 'Compliance',
    description: 'Açık uyuşmazlıkları listeler.',
    requestSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['open', 'investigating', 'resolved', 'closed'] },
      },
    },
    responseSchema: {
      type: 'object',
      properties: { items: { type: 'array' }, total: { type: 'integer' } },
    },
    authRequired: true,
    rateLimit: 30,
  },
]
