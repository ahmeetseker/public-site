// Platform-level mocks (super-admin scope).
// Cross-tenant data — distinct from tenant-scoped mocks in ../*.ts.
// Will be replaced by real APIs progressively (I01, O01, A08, D01-D03, etc.).

export * from './tenants'
export * from './observability'
export * from './llm'
export * from './audit'
export * from './pii'
export * from './plans'
export * from './roles'
export * from './plugins'
export * from './compliance'
export * from './settings'
export * from './mcp'
export * from './memory'
export * from './vector'
export * from './webhooks'
export * from './prompts'
export * from './sessions'
export * from './web-vitals'
export * from './overview-metrics'
