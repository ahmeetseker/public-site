/**
 * Mock seed — PII Governance inventory + DSAR (Wave F36 / Faz 1).
 *
 * 30 PII inventory item:
 *   - users (8): email, phone, name, tckn, address, dob, ip, last_login
 *   - listings (6): seller_phone, seller_email, geo, owner_name, tapu_no, price
 *   - messages (5): sender, recipient, body, ip, device
 *   - payments (4): card_last4, iban, billing_addr, tax_no
 *   - broker_clients (4): name, phone, email, notes
 *   - audit_log (3): actor, ip, user_agent
 *
 * Sensitivity karması: public/internal/pii/sensitive_pii/special_category.
 *
 * 8 DSAR örnek:
 *   - 4 pending (yeni başvuru)
 *   - 2 processing (devam ediyor)
 *   - 2 fulfilled (kapanmış)
 *
 * F36 Faz 2 (`/pii` UI) bu seed üzerinde:
 *   - Heatmap (table × sensitivity)
 *   - Remediation aksiyonu (mutation)
 *   - DSAR kuyruğu + fulfillment
 * yapar.
 */

import type {
  PiiInventoryItem,
  PiiDsarRequest,
  PiiSensitivity,
} from '../types/landxpanel-deepening'

const T_NOW = new Date('2026-05-15T10:00:00.000Z').getTime()

function isoOffset(daysAgo: number, hoursAgo = 0): string {
  return new Date(
    T_NOW - daysAgo * 86_400_000 - hoursAgo * 3_600_000,
  ).toISOString()
}

interface InvSeed {
  id: string
  table: string
  column: string
  dataType: string
  sensitivity: PiiSensitivity
  encrypted: boolean
  maskedInLogs: boolean
  retentionDays: number
  legalBasis?: string
  lastAccessedDaysAgo: number
  accessCount30d: number
}

const INV_SEEDS: ReadonlyArray<InvSeed> = [
  // ── users (8) ──
  { id: 'pii-001', table: 'users', column: 'email', dataType: 'varchar(255)', sensitivity: 'pii', encrypted: false, maskedInLogs: true, retentionDays: 2555, legalBasis: 'KVKK m.5/2-c sözleşme ifası', lastAccessedDaysAgo: 0, accessCount30d: 28450 },
  { id: 'pii-002', table: 'users', column: 'phone', dataType: 'varchar(20)', sensitivity: 'pii', encrypted: true, maskedInLogs: true, retentionDays: 2555, legalBasis: 'KVKK m.5/2-c', lastAccessedDaysAgo: 0, accessCount30d: 18230 },
  { id: 'pii-003', table: 'users', column: 'full_name', dataType: 'varchar(255)', sensitivity: 'pii', encrypted: false, maskedInLogs: false, retentionDays: 2555, legalBasis: 'KVKK m.5/2-c', lastAccessedDaysAgo: 0, accessCount30d: 32100 },
  { id: 'pii-004', table: 'users', column: 'tckn', dataType: 'char(11)', sensitivity: 'sensitive_pii', encrypted: true, maskedInLogs: true, retentionDays: 3650, legalBasis: 'KVKK m.5/2-a kanuni yükümlülük', lastAccessedDaysAgo: 3, accessCount30d: 145 },
  { id: 'pii-005', table: 'users', column: 'address', dataType: 'text', sensitivity: 'pii', encrypted: false, maskedInLogs: false, retentionDays: 1825, legalBasis: 'KVKK m.5/2-c', lastAccessedDaysAgo: 1, accessCount30d: 4250 },
  { id: 'pii-006', table: 'users', column: 'date_of_birth', dataType: 'date', sensitivity: 'pii', encrypted: false, maskedInLogs: true, retentionDays: 2555, legalBasis: 'KVKK m.5/2-c', lastAccessedDaysAgo: 7, accessCount30d: 380 },
  { id: 'pii-007', table: 'users', column: 'last_login_ip', dataType: 'inet', sensitivity: 'internal', encrypted: false, maskedInLogs: false, retentionDays: 365, legalBasis: 'Meşru menfaat — güvenlik', lastAccessedDaysAgo: 0, accessCount30d: 9800 },
  { id: 'pii-008', table: 'users', column: 'kyc_documents', dataType: 'jsonb', sensitivity: 'sensitive_pii', encrypted: true, maskedInLogs: true, retentionDays: 3650, legalBasis: 'KVKK m.5/2-a', lastAccessedDaysAgo: 12, accessCount30d: 220 },

  // ── listings (6) ──
  { id: 'pii-009', table: 'listings', column: 'seller_phone', dataType: 'varchar(20)', sensitivity: 'pii', encrypted: false, maskedInLogs: false, retentionDays: 1095, legalBasis: 'Açık rıza', lastAccessedDaysAgo: 0, accessCount30d: 56200 },
  { id: 'pii-010', table: 'listings', column: 'seller_email', dataType: 'varchar(255)', sensitivity: 'pii', encrypted: false, maskedInLogs: true, retentionDays: 1095, legalBasis: 'Açık rıza', lastAccessedDaysAgo: 0, accessCount30d: 12800 },
  { id: 'pii-011', table: 'listings', column: 'geo_point', dataType: 'geometry', sensitivity: 'pii', encrypted: false, maskedInLogs: false, retentionDays: 1095, legalBasis: 'Açık rıza', lastAccessedDaysAgo: 0, accessCount30d: 89500 },
  { id: 'pii-012', table: 'listings', column: 'owner_name', dataType: 'varchar(255)', sensitivity: 'pii', encrypted: false, maskedInLogs: false, retentionDays: 1095, legalBasis: 'Açık rıza', lastAccessedDaysAgo: 0, accessCount30d: 23400 },
  { id: 'pii-013', table: 'listings', column: 'tapu_no', dataType: 'varchar(50)', sensitivity: 'sensitive_pii', encrypted: true, maskedInLogs: true, retentionDays: 1825, legalBasis: 'KVKK m.5/2-c', lastAccessedDaysAgo: 2, accessCount30d: 1840 },
  { id: 'pii-014', table: 'listings', column: 'price', dataType: 'bigint', sensitivity: 'public', encrypted: false, maskedInLogs: false, retentionDays: 1095, lastAccessedDaysAgo: 0, accessCount30d: 234500 },

  // ── messages (5) ──
  { id: 'pii-015', table: 'messages', column: 'sender_user_id', dataType: 'uuid', sensitivity: 'pii', encrypted: false, maskedInLogs: true, retentionDays: 730, legalBasis: 'Meşru menfaat — uyuşmazlık', lastAccessedDaysAgo: 0, accessCount30d: 145000 },
  { id: 'pii-016', table: 'messages', column: 'recipient_user_id', dataType: 'uuid', sensitivity: 'pii', encrypted: false, maskedInLogs: true, retentionDays: 730, legalBasis: 'Meşru menfaat', lastAccessedDaysAgo: 0, accessCount30d: 145000 },
  { id: 'pii-017', table: 'messages', column: 'body', dataType: 'text', sensitivity: 'sensitive_pii', encrypted: true, maskedInLogs: true, retentionDays: 730, legalBasis: 'Açık rıza', lastAccessedDaysAgo: 0, accessCount30d: 89200 },
  { id: 'pii-018', table: 'messages', column: 'sender_ip', dataType: 'inet', sensitivity: 'internal', encrypted: false, maskedInLogs: true, retentionDays: 365, legalBasis: 'Meşru menfaat — güvenlik', lastAccessedDaysAgo: 1, accessCount30d: 8200 },
  { id: 'pii-019', table: 'messages', column: 'device_fingerprint', dataType: 'varchar(64)', sensitivity: 'internal', encrypted: false, maskedInLogs: true, retentionDays: 365, legalBasis: 'Meşru menfaat', lastAccessedDaysAgo: 1, accessCount30d: 8200 },

  // ── payments (4) ──
  { id: 'pii-020', table: 'payments', column: 'card_last4', dataType: 'char(4)', sensitivity: 'pii', encrypted: false, maskedInLogs: true, retentionDays: 3650, legalBasis: 'KVKK m.5/2-a', lastAccessedDaysAgo: 0, accessCount30d: 14500 },
  { id: 'pii-021', table: 'payments', column: 'iban', dataType: 'varchar(34)', sensitivity: 'sensitive_pii', encrypted: true, maskedInLogs: true, retentionDays: 3650, legalBasis: 'KVKK m.5/2-a', lastAccessedDaysAgo: 0, accessCount30d: 2800 },
  { id: 'pii-022', table: 'payments', column: 'billing_address', dataType: 'jsonb', sensitivity: 'pii', encrypted: false, maskedInLogs: false, retentionDays: 3650, legalBasis: 'KVKK m.5/2-a', lastAccessedDaysAgo: 0, accessCount30d: 4200 },
  { id: 'pii-023', table: 'payments', column: 'tax_id', dataType: 'varchar(20)', sensitivity: 'sensitive_pii', encrypted: true, maskedInLogs: true, retentionDays: 3650, legalBasis: 'KVKK m.5/2-a', lastAccessedDaysAgo: 4, accessCount30d: 920 },

  // ── broker_clients (4) ──
  { id: 'pii-024', table: 'broker_clients', column: 'name', dataType: 'varchar(255)', sensitivity: 'pii', encrypted: false, maskedInLogs: false, retentionDays: 1825, legalBasis: 'Açık rıza', lastAccessedDaysAgo: 0, accessCount30d: 6800 },
  { id: 'pii-025', table: 'broker_clients', column: 'phone', dataType: 'varchar(20)', sensitivity: 'pii', encrypted: true, maskedInLogs: true, retentionDays: 1825, legalBasis: 'Açık rıza', lastAccessedDaysAgo: 0, accessCount30d: 5200 },
  { id: 'pii-026', table: 'broker_clients', column: 'email', dataType: 'varchar(255)', sensitivity: 'pii', encrypted: false, maskedInLogs: true, retentionDays: 1825, legalBasis: 'Açık rıza', lastAccessedDaysAgo: 0, accessCount30d: 4800 },
  { id: 'pii-027', table: 'broker_clients', column: 'private_notes', dataType: 'text', sensitivity: 'sensitive_pii', encrypted: true, maskedInLogs: true, retentionDays: 1095, legalBasis: 'Meşru menfaat', lastAccessedDaysAgo: 2, accessCount30d: 1850 },

  // ── audit_log (3) ──
  { id: 'pii-028', table: 'audit_log', column: 'actor_user_id', dataType: 'uuid', sensitivity: 'pii', encrypted: false, maskedInLogs: false, retentionDays: 3650, legalBasis: 'Kanuni yükümlülük', lastAccessedDaysAgo: 0, accessCount30d: 23500 },
  { id: 'pii-029', table: 'audit_log', column: 'source_ip', dataType: 'inet', sensitivity: 'internal', encrypted: false, maskedInLogs: false, retentionDays: 3650, legalBasis: 'Kanuni yükümlülük', lastAccessedDaysAgo: 0, accessCount30d: 23500 },
  { id: 'pii-030', table: 'audit_log', column: 'user_agent', dataType: 'text', sensitivity: 'internal', encrypted: false, maskedInLogs: false, retentionDays: 3650, legalBasis: 'Kanuni yükümlülük', lastAccessedDaysAgo: 0, accessCount30d: 23500 },
]

export const PII_INVENTORY: PiiInventoryItem[] = INV_SEEDS.map((s) => ({
  id: s.id,
  table: s.table,
  column: s.column,
  dataType: s.dataType,
  sensitivity: s.sensitivity,
  encrypted: s.encrypted,
  maskedInLogs: s.maskedInLogs,
  retentionDays: s.retentionDays,
  legalBasis: s.legalBasis,
  lastAccessedAt: isoOffset(s.lastAccessedDaysAgo, Math.floor(Math.random() * 24)),
  accessCount30d: s.accessCount30d,
}))

export const PII_DSAR_REQUESTS: PiiDsarRequest[] = [
  // ── pending (4) ──
  {
    id: 'dsar-001',
    type: 'access',
    subjectName: 'Mehmet Yılmaz',
    status: 'pending',
    requestedAt: isoOffset(2),
    affectedTables: ['users', 'listings', 'messages', 'payments'],
  },
  {
    id: 'dsar-002',
    type: 'erasure',
    subjectName: 'Ayşe Demir',
    status: 'pending',
    requestedAt: isoOffset(1, 8),
    affectedTables: ['users', 'listings', 'messages', 'broker_clients'],
  },
  {
    id: 'dsar-003',
    type: 'rectification',
    subjectName: 'Hasan Öztürk',
    status: 'pending',
    requestedAt: isoOffset(0, 6),
    affectedTables: ['users'],
  },
  {
    id: 'dsar-004',
    type: 'portability',
    subjectName: 'Fatma Aksoy',
    status: 'pending',
    requestedAt: isoOffset(0, 2),
    affectedTables: ['users', 'listings'],
  },

  // ── processing (2) ──
  {
    id: 'dsar-005',
    type: 'access',
    subjectName: 'Mustafa Çelik',
    status: 'processing',
    requestedAt: isoOffset(4),
    affectedTables: ['users', 'listings', 'messages', 'payments', 'audit_log'],
  },
  {
    id: 'dsar-006',
    type: 'erasure',
    subjectName: 'Hülya Arslan',
    status: 'processing',
    requestedAt: isoOffset(3),
    affectedTables: ['users', 'messages', 'broker_clients'],
  },

  // ── fulfilled (2) ──
  {
    id: 'dsar-007',
    type: 'access',
    subjectName: 'Emre Yıldız',
    status: 'fulfilled',
    requestedAt: isoOffset(15),
    fulfilledAt: isoOffset(12),
    affectedTables: ['users', 'listings', 'messages'],
  },
  {
    id: 'dsar-008',
    type: 'erasure',
    subjectName: 'Sevgi Polat',
    status: 'fulfilled',
    requestedAt: isoOffset(20),
    fulfilledAt: isoOffset(16),
    affectedTables: ['users', 'listings', 'messages', 'payments', 'broker_clients'],
  },
]
