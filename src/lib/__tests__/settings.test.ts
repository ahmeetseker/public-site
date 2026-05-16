// Vitest: settings.ts adapter (Wave F7.C).
//
// Covers `arsam.settings.v1` localStorage adapter:
//   - default state + getSettings on empty
//   - partial update (top-level)
//   - notifications deep merge (nested per-channel toggle should NOT replace
//     the whole notifications block)
//   - language switch
//   - dateFormat switch
//   - privacy update
//   - malformed JSON → default fallback
//   - exportData shape (collects arsam.*.v1 keys, JSON-parseable)
//   - deleteAccount clears all arsam.*.v1 keys
//   - deleteAccount leaves non-arsam keys untouched
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  buildExportPayload,
  deleteAccountData,
  getSettings,
  updateSettings,
} from '../settings'

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  localStorage.clear()
})

describe('settings adapter', () => {
  it('returns default state when nothing is stored', () => {
    const s = getSettings()
    expect(s).toEqual(DEFAULT_SETTINGS)
    expect(s.notifications.newListing.email).toBe(true)
    expect(s.notifications.newListing.sms).toBe(true)
    expect(s.notifications.newListing.push).toBe(true)
    expect(s.language).toBe('tr')
    expect(s.dateFormat).toBe('dd.MM.yyyy')
    expect(s.privacy.profileVisibility).toBe('members')
    expect(s.privacy.shareActivity).toBe(false)
  })

  it('partial top-level update preserves other fields', () => {
    const next = updateSettings({ language: 'en' })
    expect(next.language).toBe('en')
    expect(next.dateFormat).toBe('dd.MM.yyyy')
    expect(next.notifications.newListing.email).toBe(true)
    expect(next.privacy.shareActivity).toBe(false)
  })

  it('deep-merges nested notifications (per-channel toggle)', () => {
    // Turn off email for newMessage only; sms/push and other categories must stay ON.
    const next = updateSettings({
      notifications: { newMessage: { email: false } },
    })
    expect(next.notifications.newMessage.email).toBe(false)
    expect(next.notifications.newMessage.sms).toBe(true)
    expect(next.notifications.newMessage.push).toBe(true)
    expect(next.notifications.newListing.email).toBe(true)
    expect(next.notifications.campaign.email).toBe(true)
  })

  it('deep-merges nested privacy fields independently', () => {
    const next = updateSettings({
      privacy: { profileVisibility: 'private' },
    })
    expect(next.privacy.profileVisibility).toBe('private')
    expect(next.privacy.shareActivity).toBe(false)
    const next2 = updateSettings({ privacy: { shareActivity: true } })
    expect(next2.privacy.profileVisibility).toBe('private')
    expect(next2.privacy.shareActivity).toBe(true)
  })

  it('switches language and persists across getSettings calls', () => {
    updateSettings({ language: 'en' })
    expect(getSettings().language).toBe('en')
    updateSettings({ language: 'tr' })
    expect(getSettings().language).toBe('tr')
  })

  it('survives malformed payload and returns defaults', () => {
    localStorage.setItem(SETTINGS_KEY, '{bad json')
    const s = getSettings()
    expect(s).toEqual(DEFAULT_SETTINGS)
  })

  it('switches dateFormat', () => {
    const next = updateSettings({ dateFormat: 'yyyy-MM-dd' })
    expect(next.dateFormat).toBe('yyyy-MM-dd')
    expect(getSettings().dateFormat).toBe('yyyy-MM-dd')
  })

  it('buildExportPayload gathers arsam.*.v1 keys into JSON-parseable string', () => {
    localStorage.setItem('arsam.favorites.v1', JSON.stringify(['lst1', 'lst2']))
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS))
    localStorage.setItem('not-arsam-key', 'should-be-ignored')

    const json = buildExportPayload()
    const parsed = JSON.parse(json) as Record<string, unknown>
    expect(parsed).toHaveProperty('arsam.favorites.v1')
    expect(parsed).toHaveProperty('arsam.settings.v1')
    expect(parsed).toHaveProperty('exportedAt')
    expect(parsed).not.toHaveProperty('not-arsam-key')
    // arsam.favorites.v1 should be the parsed array, not the raw string.
    expect(parsed['arsam.favorites.v1']).toEqual(['lst1', 'lst2'])
  })

  it('deleteAccountData clears every arsam.*.v1 key', () => {
    localStorage.setItem('arsam.favorites.v1', '[]')
    localStorage.setItem('arsam.savedSearches.v1', '[]')
    localStorage.setItem('arsam.profile.v1', '{}')
    localStorage.setItem(SETTINGS_KEY, '{}')

    deleteAccountData()

    expect(localStorage.getItem('arsam.favorites.v1')).toBeNull()
    expect(localStorage.getItem('arsam.savedSearches.v1')).toBeNull()
    expect(localStorage.getItem('arsam.profile.v1')).toBeNull()
    expect(localStorage.getItem(SETTINGS_KEY)).toBeNull()
  })

  it('deleteAccountData leaves non-arsam keys untouched', () => {
    localStorage.setItem('arsam.favorites.v1', '[]')
    localStorage.setItem('theme', 'dark')
    localStorage.setItem('analytics-id', 'xyz')

    deleteAccountData()

    expect(localStorage.getItem('arsam.favorites.v1')).toBeNull()
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(localStorage.getItem('analytics-id')).toBe('xyz')
  })
})
