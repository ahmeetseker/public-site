// PII Access Log (D02 PII Governance)

export interface PiiAccess {
  id: string
  actor: string
  subjectType: 'customer' | 'tenant_user' | 'transaction'
  subjectId: string
  fields: string[]
  reason: 'support' | 'investigation' | 'billing' | 'export' | 'compliance'
  reasonNote: string
  tenantId: string
  atISO: string
  approved: boolean
}

export const PII_ACCESS_LOG: PiiAccess[] = [
  { id: 'PII-2026-00421', actor: 'destek@turksab.com', subjectType: 'customer', subjectId: 'cust_99812', fields: ['email', 'phone'], reason: 'support', reasonNote: 'Müşteri ilan iadesi için aradı, doğrulama gerekti (Ticket #4421).', tenantId: 'bodrum-em', atISO: '2026-05-11T07:58:00Z', approved: true },
  { id: 'PII-2026-00420', actor: 'guvenlik@turksab.com', subjectType: 'tenant_user', subjectId: 'usr_22841', fields: ['email', 'phone', 'address', 'tc'], reason: 'investigation', reasonNote: 'Şüpheli login pattern — 12 başarısız deneme aynı IP\'den (45.155.x.x). KVKK 18.1.', tenantId: 'cesme-ars', atISO: '2026-05-10T22:30:00Z', approved: false },
  { id: 'PII-2026-00419', actor: 'finans@turksab.com', subjectType: 'transaction', subjectId: 'tx_55881', fields: ['iban', 'tax_id'], reason: 'billing', reasonNote: 'Hatalı fatura — iade işlemi için banka hesap doğrulaması.', tenantId: 'bodrum-em', atISO: '2026-05-10T14:12:00Z', approved: true },
  { id: 'PII-2026-00418', actor: 'compliance@turksab.com', subjectType: 'customer', subjectId: 'cust_71224', fields: ['email', 'phone', 'address', 'birth_date'], reason: 'export', reasonNote: 'KVKK 11. madde — veri sahibi tarafından kendi verilerinin dışa aktarım talebi.', tenantId: 'fethiye-pa', atISO: '2026-05-10T11:05:00Z', approved: true },
  { id: 'PII-2026-00417', actor: 'destek@turksab.com', subjectType: 'customer', subjectId: 'cust_88421', fields: ['phone'], reason: 'support', reasonNote: 'İlan sahibine geri arama talebi.', tenantId: 'atolye-ayv', atISO: '2026-05-09T16:40:00Z', approved: true },
  { id: 'PII-2026-00416', actor: 'compliance@turksab.com', subjectType: 'customer', subjectId: 'cust_60012', fields: ['email', 'phone', 'address', 'tc', 'birth_date'], reason: 'compliance', reasonNote: 'KVKK Kurumu denetim sorgusu — 2026-Q1 PII envanteri için örnek kayıt incelendi.', tenantId: 'cesme-ars', atISO: '2026-05-09T10:22:00Z', approved: true },
  { id: 'PII-2026-00415', actor: 'destek@turksab.com', subjectType: 'tenant_user', subjectId: 'usr_71001', fields: ['email'], reason: 'support', reasonNote: 'Şifre sıfırlama linki tekrar gönderildi.', tenantId: 'datca-koy', atISO: '2026-05-08T18:10:00Z', approved: true },
  { id: 'PII-2026-00414', actor: 'finans@turksab.com', subjectType: 'transaction', subjectId: 'tx_55700', fields: ['iban'], reason: 'billing', reasonNote: 'Otomatik tahsilat reddedildi — manuel takip.', tenantId: 'gocek-ya', atISO: '2026-05-08T09:30:00Z', approved: false },
  { id: 'PII-2026-00413', actor: 'guvenlik@turksab.com', subjectType: 'customer', subjectId: 'cust_42112', fields: ['email', 'phone', 'address'], reason: 'investigation', reasonNote: 'Sahte ilan şikayeti — moderasyon ekibinin ilettiği vaka.', tenantId: 'kemer-vi', atISO: '2026-05-07T13:55:00Z', approved: true },
  { id: 'PII-2026-00412', actor: 'compliance@turksab.com', subjectType: 'customer', subjectId: 'cust_55012', fields: ['email', 'phone', 'address', 'tc'], reason: 'export', reasonNote: 'GDPR Article 15 — AB vatandaşı veri sahibi erişim talebi.', tenantId: 'bodrum-em', atISO: '2026-05-06T11:00:00Z', approved: true },
]
