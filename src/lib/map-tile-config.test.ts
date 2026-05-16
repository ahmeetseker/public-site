import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('getTileConfig', () => {
  const originalEnv = { ...import.meta.env }

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    // Restore env (vitest doesn't auto-restore import.meta.env mocks)
    Object.assign(import.meta.env, originalEnv)
  })

  it('returns MapTiler URL + attribution + maxZoom 22 when key is present', async () => {
    vi.stubEnv('PUBLIC_MAPTILER_KEY', 'test-key-xyz')
    const { getTileConfig } = await import('./map-tile-config')
    const config = getTileConfig()

    expect(config.url).toBe(
      'https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=test-key-xyz',
    )
    expect(config.maxZoom).toBe(22)
    expect(config.attribution).toContain('MapTiler')
    expect(config.attribution).toContain('OpenStreetMap')
  })

  it('falls back to raw OSM URL + maxZoom 18 when key is empty string', async () => {
    vi.stubEnv('PUBLIC_MAPTILER_KEY', '')
    const { getTileConfig } = await import('./map-tile-config')
    const config = getTileConfig()

    expect(config.url).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    expect(config.maxZoom).toBe(18)
    expect(config.attribution).toContain('OpenStreetMap')
    expect(config.attribution).not.toContain('MapTiler')
  })

  it('falls back to OSM when key is whitespace-only', async () => {
    vi.stubEnv('PUBLIC_MAPTILER_KEY', '   ')
    const { getTileConfig } = await import('./map-tile-config')
    const config = getTileConfig()

    expect(config.url).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    expect(config.maxZoom).toBe(18)
    expect(config.attribution).not.toContain('MapTiler')
  })

  it('falls back to raw OSM URL when key is undefined', async () => {
    vi.stubEnv('PUBLIC_MAPTILER_KEY', undefined as unknown as string)
    const { getTileConfig } = await import('./map-tile-config')
    const config = getTileConfig()

    expect(config.url).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    expect(config.maxZoom).toBe(18)
  })
})
