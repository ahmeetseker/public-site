// Vector Store / Embedding Pipeline (A05 — /vector-store)

export interface VectorIndex {
  id: string
  name: string
  dimension: number
  model: string
  vectorCount: number
  storageGB: number
  lastIndexedISO: string
  category: 'listings' | 'customers' | 'reports' | 'docs' | 'memory'
  status: 'healthy' | 'rebuilding' | 'stale' | 'failed'
  queryStats: { lastDayCount: number; avgLatencyMs: number }
}

export const VECTOR_INDEXES: VectorIndex[] = [
  { id: 'idx-listings', name: 'arsam-listings-prod', dimension: 1536, model: 'text-embedding-3-small', vectorCount: 1248, storageGB: 0.18, lastIndexedISO: '2026-05-11T03:00:00Z', category: 'listings', status: 'healthy', queryStats: { lastDayCount: 18420, avgLatencyMs: 28 } },
  { id: 'idx-customers', name: 'arsam-customers-prod', dimension: 1536, model: 'text-embedding-3-small', vectorCount: 48240, storageGB: 0.62, lastIndexedISO: '2026-05-11T03:00:00Z', category: 'customers', status: 'healthy', queryStats: { lastDayCount: 5120, avgLatencyMs: 32 } },
  { id: 'idx-memory', name: 'arsam-memory-prod', dimension: 1536, model: 'text-embedding-3-small', vectorCount: 12480, storageGB: 0.21, lastIndexedISO: '2026-05-11T11:00:00Z', category: 'memory', status: 'healthy', queryStats: { lastDayCount: 8420, avgLatencyMs: 24 } },
  { id: 'idx-docs', name: 'arsam-docs-prod', dimension: 1536, model: 'text-embedding-3-small', vectorCount: 842, storageGB: 0.04, lastIndexedISO: '2026-05-04T03:00:00Z', category: 'docs', status: 'stale', queryStats: { lastDayCount: 240, avgLatencyMs: 38 } },
  { id: 'idx-reports', name: 'arsam-reports-staging', dimension: 768, model: 'text-embedding-3-large', vectorCount: 1280, storageGB: 0.08, lastIndexedISO: '2026-05-10T14:30:00Z', category: 'reports', status: 'rebuilding', queryStats: { lastDayCount: 0, avgLatencyMs: 0 } },
]

export interface EmbedJob {
  id: string
  indexId: string
  type: 'full-rebuild' | 'incremental' | 'delete'
  status: 'queued' | 'running' | 'success' | 'failed'
  progress: number
  startedISO: string
  finishedISO: string | null
  recordsProcessed: number
  recordsTotal: number
  costUSD: number
}

export const EMBED_JOBS: EmbedJob[] = [
  { id: 'job-2026-0418', indexId: 'idx-reports', type: 'full-rebuild', status: 'running', progress: 64, startedISO: '2026-05-11T11:00:00Z', finishedISO: null, recordsProcessed: 819, recordsTotal: 1280, costUSD: 0.84 },
  { id: 'job-2026-0417', indexId: 'idx-memory', type: 'incremental', status: 'success', progress: 100, startedISO: '2026-05-11T10:55:00Z', finishedISO: '2026-05-11T10:58:00Z', recordsProcessed: 42, recordsTotal: 42, costUSD: 0.012 },
  { id: 'job-2026-0416', indexId: 'idx-listings', type: 'incremental', status: 'success', progress: 100, startedISO: '2026-05-11T03:00:00Z', finishedISO: '2026-05-11T03:08:00Z', recordsProcessed: 18, recordsTotal: 18, costUSD: 0.008 },
  { id: 'job-2026-0415', indexId: 'idx-docs', type: 'full-rebuild', status: 'failed', progress: 42, startedISO: '2026-05-04T03:00:00Z', finishedISO: '2026-05-04T03:18:00Z', recordsProcessed: 354, recordsTotal: 842, costUSD: 0.42 },
]
