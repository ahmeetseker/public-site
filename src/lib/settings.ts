// arsam.net account settings — localStorage adapter (Wave F7.C).
//
// Persists a single `arsam.settings.v1` record holding notification
// preferences (3 categories × 3 channels), language, date format and
// privacy flags. All four /hesabim/ayarlar sections write through this
// module; the React island autosaves on change (debounced) so writes are
// frequent but small.
//
// Schema (per spec §6):
//   notifications: { newListing | newMessage | campaign } × { email | sms | push }
//   language: 'tr' | 'en'
//   dateFormat: 'dd.MM.yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd'
//   privacy: { profileVisibility: 'public'|'members'|'private', shareActivity: bool }
//
// Defaults: notifications all true, language='tr', format='dd.MM.yyyy',
// visibility='members', shareActivity=false.
//
// Special operations:
//   - buildExportPayload(): collects all `arsam.*.v1` localStorage entries
//     into a single JSON string (KVKK m.11 — "verilerinin bir kopyasını
//     alma hakkı"). Caller wires this to a Blob + anchor download.
//   - deleteAccountData(): removes every `arsam.*.v1` key (leaves other
//     site-wide keys, e.g. theme, untouched). Caller decides whether to
//     redirect afterwards.

export type NotificationChannel = 'email' | 'sms' | 'push'
export type NotificationCategory = 'newListing' | 'newMessage' | 'campaign'

export type ChannelMap = Record<NotificationChannel, boolean>

export type NotificationsMap = Record<NotificationCategory, ChannelMap>

export type LanguageCode = 'tr' | 'en'
export type DateFormat = 'dd.MM.yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd'
export type ProfileVisibility = 'public' | 'members' | 'private'

export interface PrivacySettings {
  profileVisibility: ProfileVisibility
  shareActivity: boolean
}

export interface Settings {
  notifications: NotificationsMap
  language: LanguageCode
  dateFormat: DateFormat
  privacy: PrivacySettings
}

export const SETTINGS_KEY = 'arsam.settings.v1'

const ARSAM_KEY_RE = /^arsam\..+\.v\d+$/

export const DEFAULT_SETTINGS: Settings = Object.freeze({
  notifications: {
    newListing: { email: true, sms: true, push: true },
    newMessage: { email: true, sms: true, push: true },
    campaign: { email: true, sms: true, push: true },
  },
  language: 'tr',
  dateFormat: 'dd.MM.yyyy',
  privacy: {
    profileVisibility: 'members',
    shareActivity: false,
  },
}) as Settings

function cloneDefaults(): Settings {
  // Structured clone keeps the frozen defaults safe from mutation.
  return {
    notifications: {
      newListing: { ...DEFAULT_SETTINGS.notifications.newListing },
      newMessage: { ...DEFAULT_SETTINGS.notifications.newMessage },
      campaign: { ...DEFAULT_SETTINGS.notifications.campaign },
    },
    language: DEFAULT_SETTINGS.language,
    dateFormat: DEFAULT_SETTINGS.dateFormat,
    privacy: { ...DEFAULT_SETTINGS.privacy },
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function sanitize(raw: unknown): Settings {
  const base = cloneDefaults()
  if (!isObject(raw)) return base

  // notifications
  if (isObject(raw.notifications)) {
    for (const cat of ['newListing', 'newMessage', 'campaign'] as const) {
      const src = raw.notifications[cat]
      if (isObject(src)) {
        if (typeof src.email === 'boolean') base.notifications[cat].email = src.email
        if (typeof src.sms === 'boolean') base.notifications[cat].sms = src.sms
        if (typeof src.push === 'boolean') base.notifications[cat].push = src.push
      }
    }
  }

  // language
  if (raw.language === 'tr' || raw.language === 'en') {
    base.language = raw.language
  }

  // dateFormat
  if (
    raw.dateFormat === 'dd.MM.yyyy' ||
    raw.dateFormat === 'MM/dd/yyyy' ||
    raw.dateFormat === 'yyyy-MM-dd'
  ) {
    base.dateFormat = raw.dateFormat
  }

  // privacy
  if (isObject(raw.privacy)) {
    const vis = raw.privacy.profileVisibility
    if (vis === 'public' || vis === 'members' || vis === 'private') {
      base.privacy.profileVisibility = vis
    }
    if (typeof raw.privacy.shareActivity === 'boolean') {
      base.privacy.shareActivity = raw.privacy.shareActivity
    }
  }

  return base
}

export function getSettings(): Settings {
  if (typeof localStorage === 'undefined') return cloneDefaults()
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return cloneDefaults()
    return sanitize(JSON.parse(raw))
  } catch {
    return cloneDefaults()
  }
}

// Deep-mergeable partial: each sub-record can itself be a partial update.
export interface SettingsPatch {
  notifications?: {
    [K in NotificationCategory]?: Partial<ChannelMap>
  }
  language?: LanguageCode
  dateFormat?: DateFormat
  privacy?: Partial<PrivacySettings>
}

export function updateSettings(patch: SettingsPatch): Settings {
  const current = getSettings()
  const next: Settings = {
    notifications: {
      newListing: { ...current.notifications.newListing },
      newMessage: { ...current.notifications.newMessage },
      campaign: { ...current.notifications.campaign },
    },
    language: current.language,
    dateFormat: current.dateFormat,
    privacy: { ...current.privacy },
  }

  if (patch.notifications) {
    for (const cat of ['newListing', 'newMessage', 'campaign'] as const) {
      const part = patch.notifications[cat]
      if (part) {
        next.notifications[cat] = {
          ...next.notifications[cat],
          ...part,
        }
      }
    }
  }
  if (patch.language) next.language = patch.language
  if (patch.dateFormat) next.dateFormat = patch.dateFormat
  if (patch.privacy) {
    next.privacy = { ...next.privacy, ...patch.privacy }
  }

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    } catch {
      /* quota — ignore, in-memory copy still returned */
    }
  }
  return next
}

/**
 * Collect every `arsam.*.v1` localStorage entry into a JSON-stringified
 * payload (pretty-printed). Values are JSON-parsed when possible (so the
 * export reads as a structured object, not a string-of-strings); fall back
 * to the raw string otherwise.
 *
 * Satisfies KVKK m.11 — "kişisel verilerinin bir kopyasını alma hakkı".
 * Caller wires the result to a Blob + anchor for actual download.
 */
export function buildExportPayload(): string {
  const out: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
  }
  if (typeof localStorage === 'undefined') return JSON.stringify(out, null, 2)

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !ARSAM_KEY_RE.test(key)) continue
    const raw = localStorage.getItem(key)
    if (raw == null) continue
    try {
      out[key] = JSON.parse(raw)
    } catch {
      out[key] = raw
    }
  }
  return JSON.stringify(out, null, 2)
}

/**
 * Remove every `arsam.*.v1` key (favorites, savedSearches, profile,
 * settings, …). Non-arsam keys (theme, analytics ids, etc.) are left
 * alone — `localStorage.clear()` would be too aggressive across the
 * shared site origin.
 */
export function deleteAccountData(): void {
  if (typeof localStorage === 'undefined') return
  const toRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && ARSAM_KEY_RE.test(key)) toRemove.push(key)
  }
  for (const k of toRemove) {
    try {
      localStorage.removeItem(k)
    } catch {
      /* ignore */
    }
  }
}
