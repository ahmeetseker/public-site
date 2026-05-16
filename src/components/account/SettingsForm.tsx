/**
 * SettingsForm — /hesabim/ayarlar React island (client:idle).
 *
 * Wave F7.C. Renders 4 collapsible sections (SettingsSection) wired to
 * `lib/settings.ts`:
 *   1. Notifications — 3 categories × 3 channels grid; every toggle
 *      autosaves debounced (500ms) with a small "Kaydedildi ✓" toast.
 *   2. Language & format — Dil dropdown (TR/EN). Selecting EN/TR rewrites
 *      `window.location.href` with/without the `/en` prefix on the same
 *      pathname (no full route table lookup). Date format radio group.
 *   3. Privacy — profileVisibility radio (public/members/private) +
 *      shareActivity toggle.
 *   4. Account actions — three buttons:
 *        - "Şifre değiştir" → modal (old/new/confirm) with client-side
 *          validation (≥8 chars, new===confirm). Mock toast on success.
 *        - "Veri indir (KVKK m.11)" → buildExportPayload → Blob anchor
 *          download named `arsam-veri-${date}.json`.
 *        - "Hesabımı sil" → two-step confirm modal (checkbox + literal
 *          "SİL"/"DELETE" text) → deleteAccountData + redirect "/".
 *
 * Locale picks up from `document.documentElement.lang` (mirrors
 * ProfileForm pattern).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import SettingsSection from './SettingsSection'
import {
  buildExportPayload,
  deleteAccountData,
  getSettings,
  updateSettings,
  type DateFormat,
  type LanguageCode,
  type NotificationCategory,
  type NotificationChannel,
  type ProfileVisibility,
  type Settings,
  type SettingsPatch,
} from '../../lib/settings'

type Locale = 'tr' | 'en'

function detectLocale(): Locale {
  if (typeof document === 'undefined') return 'tr'
  return document.documentElement.lang.startsWith('en') ? 'en' : 'tr'
}

const LABELS = {
  tr: {
    notifSection: {
      title: 'Bildirimler',
      description: 'Hangi bildirimleri hangi kanaldan almak istediğini seç.',
    },
    notifColEmail: 'E-posta',
    notifColSms: 'SMS',
    notifColPush: 'Push',
    notifRowNewListing: 'Yeni ilan',
    notifRowNewMessage: 'Yeni mesaj',
    notifRowCampaign: 'Kampanya & duyuru',
    langSection: {
      title: 'Dil & format',
      description: 'Arayüz dili ve tarih formatı tercihleri.',
    },
    langLabel: 'Dil',
    langTr: 'Türkçe',
    langEn: 'English',
    dateFormatLabel: 'Tarih formatı',
    privacySection: {
      title: 'Gizlilik',
      description: 'Profilini kimler görsün, etkinliğin paylaşılsın mı?',
    },
    visibilityLabel: 'Profilini kimler görebilsin?',
    visibilityPublic: 'Herkes',
    visibilityMembers: 'Sadece üyeler',
    visibilityPrivate: 'Sadece ben',
    visibilityPublicDesc: 'Giriş yapmayan ziyaretçiler dahil herkes.',
    visibilityMembersDesc: 'Sadece arsam.net hesabı olanlar.',
    visibilityPrivateDesc: 'Profilin gizli kalır.',
    shareActivityLabel: 'Etkinliğimi paylaş',
    shareActivityDesc:
      'Favori eklediğin ilanlar arasında, hangileriyle ofislere ulaştığın anonimleştirilerek istatistiklere dahil edilebilir.',
    accountSection: {
      title: 'Hesap işlemleri',
      description: 'Şifreni değiştir, verilerini indir veya hesabını sil.',
    },
    changePasswordBtn: 'Şifre değiştir',
    exportBtn: 'Veri indir (KVKK m.11)',
    deleteBtn: 'Hesabımı sil',
    toastSaved: 'Kaydedildi ✓',
    toastPassword: 'Şifre güncellendi ✓',
    toastExport: 'Verilerin indiriliyor ✓',
    passwordModal: {
      title: 'Şifre değiştir',
      oldLabel: 'Mevcut şifre',
      newLabel: 'Yeni şifre',
      confirmLabel: 'Yeni şifre (tekrar)',
      hint: 'Yeni şifre en az 8 karakter olmalı.',
      cancel: 'Vazgeç',
      submit: 'Güncelle',
      errorMin: 'Yeni şifre en az 8 karakter olmalı.',
      errorMatch: 'Şifre tekrarı uyuşmuyor.',
    },
    deleteModal: {
      title: 'Hesabını silmek istediğine emin misin?',
      bodyLead:
        'Bu işlem geri alınamaz. Aşağıdaki adımları onayladığında favorilerin, kayıtlı aramaların, profilin ve tüm ayarların tarayıcıdan silinir.',
      ack: 'Bunun geri alınamaz olduğunu anladım.',
      typeLabel: 'Onaylamak için aşağıya “SİL” yaz:',
      typeWord: 'SİL',
      cancel: 'Vazgeç',
      confirm: 'Hesabımı kalıcı olarak sil',
    },
    on: 'Açık',
    off: 'Kapalı',
  },
  en: {
    notifSection: {
      title: 'Notifications',
      description: 'Choose what to be notified about and on which channel.',
    },
    notifColEmail: 'Email',
    notifColSms: 'SMS',
    notifColPush: 'Push',
    notifRowNewListing: 'New listing',
    notifRowNewMessage: 'New message',
    notifRowCampaign: 'Campaigns & announcements',
    langSection: {
      title: 'Language & format',
      description: 'Interface language and date format.',
    },
    langLabel: 'Language',
    langTr: 'Türkçe',
    langEn: 'English',
    dateFormatLabel: 'Date format',
    privacySection: {
      title: 'Privacy',
      description: 'Who can see your profile, and whether your activity is shared.',
    },
    visibilityLabel: 'Who can see your profile?',
    visibilityPublic: 'Everyone',
    visibilityMembers: 'Members only',
    visibilityPrivate: 'Only me',
    visibilityPublicDesc: 'Anyone, including signed-out visitors.',
    visibilityMembersDesc: 'Only people with an arsam.net account.',
    visibilityPrivateDesc: 'Your profile stays private.',
    shareActivityLabel: 'Share my activity',
    shareActivityDesc:
      'Favoriting and outreach signals may be anonymised and counted in aggregate statistics.',
    accountSection: {
      title: 'Account actions',
      description: 'Change password, download your data or delete your account.',
    },
    changePasswordBtn: 'Change password',
    exportBtn: 'Download data (KVKK art. 11)',
    deleteBtn: 'Delete my account',
    toastSaved: 'Saved ✓',
    toastPassword: 'Password updated ✓',
    toastExport: 'Downloading your data ✓',
    passwordModal: {
      title: 'Change password',
      oldLabel: 'Current password',
      newLabel: 'New password',
      confirmLabel: 'New password (again)',
      hint: 'New password must be at least 8 characters.',
      cancel: 'Cancel',
      submit: 'Update',
      errorMin: 'New password must be at least 8 characters.',
      errorMatch: 'Password confirmation does not match.',
    },
    deleteModal: {
      title: 'Are you sure you want to delete your account?',
      bodyLead:
        'This cannot be undone. When you confirm the steps below, your favorites, saved searches, profile and all settings will be removed from this browser.',
      ack: 'I understand this is irreversible.',
      typeLabel: 'To confirm, type “DELETE” below:',
      typeWord: 'DELETE',
      cancel: 'Cancel',
      confirm: 'Permanently delete my account',
    },
    on: 'On',
    off: 'Off',
  },
} as const

const NOTIF_ROWS: { cat: NotificationCategory; labelKey: 'notifRowNewListing' | 'notifRowNewMessage' | 'notifRowCampaign' }[] = [
  { cat: 'newListing', labelKey: 'notifRowNewListing' },
  { cat: 'newMessage', labelKey: 'notifRowNewMessage' },
  { cat: 'campaign', labelKey: 'notifRowCampaign' },
]
const CHANNELS: NotificationChannel[] = ['email', 'sms', 'push']

const DATE_FORMATS: DateFormat[] = ['dd.MM.yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd']
const VISIBILITY_OPTIONS: ProfileVisibility[] = ['public', 'members', 'private']

function stripLocalePrefix(pathname: string): string {
  // /en/foo/bar -> /foo/bar ; /en -> / ; /foo -> /foo
  if (pathname === '/en') return '/'
  if (pathname.startsWith('/en/')) return pathname.slice(3)
  return pathname
}

function todayFilenameStamp(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function SettingsForm() {
  const [locale, setLocale] = useState<Locale>('tr')
  const [settings, setSettings] = useState<Settings>(() => getSettings())
  const [mounted, setMounted] = useState(false)
  const [toast, setToast] = useState<string>('')

  const [pwOpen, setPwOpen] = useState(false)
  const [pwForm, setPwForm] = useState({ old: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState<string>('')

  const [delOpen, setDelOpen] = useState(false)
  const [delAck, setDelAck] = useState(false)
  const [delTyped, setDelTyped] = useState('')

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocale(detectLocale())
    setSettings(getSettings())
    setMounted(true)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const L = LABELS[locale]

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 1500)
  }

  function scheduleSave(patch: SettingsPatch) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const next = updateSettings(patch)
      setSettings(next)
      showToast(L.toastSaved)
    }, 500)
  }

  function toggleNotification(cat: NotificationCategory, channel: NotificationChannel) {
    setSettings((s) => {
      const nextVal = !s.notifications[cat][channel]
      const next: Settings = {
        ...s,
        notifications: {
          ...s.notifications,
          [cat]: { ...s.notifications[cat], [channel]: nextVal },
        },
      }
      scheduleSave({ notifications: { [cat]: { [channel]: nextVal } } })
      return next
    })
  }

  function changeLanguage(lang: LanguageCode) {
    // Persist BEFORE navigating — the new page will read this on mount.
    updateSettings({ language: lang })
    setSettings((s) => ({ ...s, language: lang }))
    if (typeof window === 'undefined') return
    const stripped = stripLocalePrefix(window.location.pathname)
    const target = lang === 'en' ? `/en${stripped === '/' ? '' : stripped}` : stripped
    window.location.href = target
  }

  function changeDateFormat(fmt: DateFormat) {
    setSettings((s) => ({ ...s, dateFormat: fmt }))
    scheduleSave({ dateFormat: fmt })
  }

  function changeVisibility(vis: ProfileVisibility) {
    setSettings((s) => ({ ...s, privacy: { ...s.privacy, profileVisibility: vis } }))
    scheduleSave({ privacy: { profileVisibility: vis } })
  }

  function toggleShareActivity() {
    setSettings((s) => {
      const nextVal = !s.privacy.shareActivity
      scheduleSave({ privacy: { shareActivity: nextVal } })
      return { ...s, privacy: { ...s.privacy, shareActivity: nextVal } }
    })
  }

  function submitPassword(e: { preventDefault: () => void }) {
    e.preventDefault()
    setPwError('')
    if (pwForm.next.length < 8) {
      setPwError(L.passwordModal.errorMin)
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError(L.passwordModal.errorMatch)
      return
    }
    // Mock — no actual storage of the password.
    setPwOpen(false)
    setPwForm({ old: '', next: '', confirm: '' })
    showToast(L.toastPassword)
  }

  function exportData() {
    if (typeof window === 'undefined') return
    const json = buildExportPayload()
    try {
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `arsam-veri-${todayFilenameStamp()}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 0)
      showToast(L.toastExport)
    } catch {
      /* ignore */
    }
  }

  function confirmDelete() {
    if (!delAck) return
    if (delTyped.trim() !== L.deleteModal.typeWord) return
    deleteAccountData()
    setDelOpen(false)
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  const dateFormatRows = useMemo(
    () =>
      DATE_FORMATS.map((fmt) => {
        // Render a sample so users see the format in action.
        const sample = (() => {
          const d = new Date(2026, 4, 13) // 2026-05-13
          const dd = String(d.getDate()).padStart(2, '0')
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const yyyy = String(d.getFullYear())
          if (fmt === 'dd.MM.yyyy') return `${dd}.${mm}.${yyyy}`
          if (fmt === 'MM/dd/yyyy') return `${mm}/${dd}/${yyyy}`
          return `${yyyy}-${mm}-${dd}`
        })()
        return { fmt, sample }
      }),
    [],
  )

  return (
    <div
      data-settings-form=""
      data-mounted={mounted ? 'true' : 'false'}
      className="flex flex-col gap-5"
    >
      {/* 1. Notifications */}
      <SettingsSection
        id="notifications"
        title={L.notifSection.title}
        description={L.notifSection.description}
        defaultOpen
      >
        <div
          role="table"
          aria-label={L.notifSection.title}
          className="overflow-x-auto"
        >
          <div className="min-w-[420px]">
            <div className="grid grid-cols-[1fr_repeat(3,72px)] items-center gap-2 pb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
              <span />
              <span className="text-center">{L.notifColEmail}</span>
              <span className="text-center">{L.notifColSms}</span>
              <span className="text-center">{L.notifColPush}</span>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {NOTIF_ROWS.map((row) => (
                <div
                  key={row.cat}
                  className="grid grid-cols-[1fr_repeat(3,72px)] items-center gap-2 py-3"
                  data-settings-notif-row={row.cat}
                >
                  <span className="text-sm font-medium text-foreground">
                    {L[row.labelKey]}
                  </span>
                  {CHANNELS.map((ch) => {
                    const checked = settings.notifications[row.cat][ch]
                    return (
                      <label
                        key={ch}
                        className="flex items-center justify-center"
                      >
                        <span className="sr-only">
                          {L[row.labelKey]} · {L[`notifCol${ch.charAt(0).toUpperCase()}${ch.slice(1)}` as 'notifColEmail' | 'notifColSms' | 'notifColPush']}
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleNotification(row.cat, ch)}
                          data-settings-notif={`${row.cat}.${ch}`}
                          className="h-4 w-4 rounded border-border accent-foreground"
                        />
                      </label>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* 2. Language & format */}
      <SettingsSection
        id="language"
        title={L.langSection.title}
        description={L.langSection.description}
        defaultOpen={false}
      >
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {L.langLabel}
            </span>
            <select
              value={settings.language}
              onChange={(e) => changeLanguage(e.target.value as LanguageCode)}
              data-settings-language=""
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
            >
              <option value="tr">{L.langTr}</option>
              <option value="en">{L.langEn}</option>
            </select>
          </label>
          <fieldset>
            <legend className="pb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {L.dateFormatLabel}
            </legend>
            <div className="flex flex-col gap-2">
              {dateFormatRows.map(({ fmt, sample }) => {
                const active = settings.dateFormat === fmt
                return (
                  <label
                    key={fmt}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                      active
                        ? 'border-foreground/20 bg-foreground/5'
                        : 'border-border bg-background hover:bg-foreground/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dateFormat"
                      value={fmt}
                      checked={active}
                      onChange={() => changeDateFormat(fmt)}
                      data-settings-dateformat={fmt}
                      className="h-4 w-4 accent-foreground"
                    />
                    <span className="font-medium">{fmt}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {sample}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </div>
      </SettingsSection>

      {/* 3. Privacy */}
      <SettingsSection
        id="privacy"
        title={L.privacySection.title}
        description={L.privacySection.description}
        defaultOpen={false}
      >
        <div className="flex flex-col gap-5">
          <fieldset>
            <legend className="pb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {L.visibilityLabel}
            </legend>
            <div className="flex flex-col gap-2">
              {VISIBILITY_OPTIONS.map((vis) => {
                const active = settings.privacy.profileVisibility === vis
                const label =
                  vis === 'public'
                    ? L.visibilityPublic
                    : vis === 'members'
                      ? L.visibilityMembers
                      : L.visibilityPrivate
                const desc =
                  vis === 'public'
                    ? L.visibilityPublicDesc
                    : vis === 'members'
                      ? L.visibilityMembersDesc
                      : L.visibilityPrivateDesc
                return (
                  <label
                    key={vis}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                      active
                        ? 'border-foreground/20 bg-foreground/5'
                        : 'border-border bg-background hover:bg-foreground/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={vis}
                      checked={active}
                      onChange={() => changeVisibility(vis)}
                      data-settings-visibility={vis}
                      className="mt-0.5 h-4 w-4 accent-foreground"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium">{label}</span>
                      <span className="block text-xs text-muted-foreground">{desc}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
          <label className="flex items-start justify-between gap-4 rounded-xl border border-border bg-background px-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{L.shareActivityLabel}</span>
              <span className="block text-xs text-muted-foreground">{L.shareActivityDesc}</span>
            </span>
            <input
              type="checkbox"
              checked={settings.privacy.shareActivity}
              onChange={toggleShareActivity}
              data-settings-share-activity=""
              className="mt-1 h-4 w-4 rounded border-border accent-foreground"
              aria-label={L.shareActivityLabel}
            />
          </label>
        </div>
      </SettingsSection>

      {/* 4. Account actions */}
      <SettingsSection
        id="account"
        title={L.accountSection.title}
        description={L.accountSection.description}
        defaultOpen={false}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => {
              setPwError('')
              setPwForm({ old: '', next: '', confirm: '' })
              setPwOpen(true)
            }}
            data-settings-change-password=""
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-foreground/5"
          >
            {L.changePasswordBtn}
          </button>
          <button
            type="button"
            onClick={exportData}
            data-settings-export=""
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-foreground/5"
          >
            {L.exportBtn}
          </button>
          <button
            type="button"
            onClick={() => {
              setDelAck(false)
              setDelTyped('')
              setDelOpen(true)
            }}
            data-settings-delete=""
            className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-500/15 dark:border-rose-400/40 dark:bg-rose-400/10 dark:text-rose-300"
          >
            {L.deleteBtn}
          </button>
        </div>
      </SettingsSection>

      {/* Toast (autosave + password + export) */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center"
      >
        {toast ? (
          <span
            data-settings-toast=""
            className="pointer-events-auto rounded-full border border-border bg-card px-4 py-1.5 font-mono text-xs uppercase tracking-wide text-foreground shadow-sm"
          >
            {toast}
          </span>
        ) : null}
      </div>

      {/* Password modal */}
      {pwOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-password-title"
          data-settings-password-dialog=""
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setPwOpen(false)}
            aria-hidden="true"
          />
          <form
            onSubmit={submitPassword}
            className="relative w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl"
          >
            <h3
              id="settings-password-title"
              className="font-serif text-xl tracking-tight"
            >
              {L.passwordModal.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{L.passwordModal.hint}</p>
            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  {L.passwordModal.oldLabel}
                </span>
                <input
                  type="password"
                  value={pwForm.old}
                  onChange={(e) => setPwForm((p) => ({ ...p, old: e.target.value }))}
                  autoComplete="current-password"
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  {L.passwordModal.newLabel}
                </span>
                <input
                  type="password"
                  value={pwForm.next}
                  onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                  autoComplete="new-password"
                  data-settings-password-new=""
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  {L.passwordModal.confirmLabel}
                </span>
                <input
                  type="password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                  autoComplete="new-password"
                  data-settings-password-confirm=""
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
                />
              </label>
              {pwError ? (
                <p
                  className="font-mono text-xs uppercase tracking-wide text-rose-600 dark:text-rose-400"
                  data-settings-password-error=""
                >
                  {pwError}
                </p>
              ) : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPwOpen(false)}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-foreground/5"
              >
                {L.passwordModal.cancel}
              </button>
              <button
                type="submit"
                data-settings-password-submit=""
                className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                {L.passwordModal.submit}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Delete account modal (2-step) */}
      {delOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-delete-title"
          data-settings-delete-dialog=""
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setDelOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-background p-6 shadow-xl">
            <h3
              id="settings-delete-title"
              className="font-serif text-xl tracking-tight"
            >
              {L.deleteModal.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{L.deleteModal.bodyLead}</p>
            <label className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-foreground/[0.02] px-3 py-2.5">
              <input
                type="checkbox"
                checked={delAck}
                onChange={(e) => setDelAck(e.target.checked)}
                data-settings-delete-ack=""
                className="mt-0.5 h-4 w-4 rounded border-border accent-foreground"
              />
              <span className="text-sm font-medium">{L.deleteModal.ack}</span>
            </label>
            <label className="mt-3 flex flex-col gap-1">
              <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                {L.deleteModal.typeLabel}
              </span>
              <input
                type="text"
                value={delTyped}
                onChange={(e) => setDelTyped(e.target.value)}
                data-settings-delete-input=""
                placeholder={L.deleteModal.typeWord}
                autoComplete="off"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDelOpen(false)}
                className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                {L.deleteModal.cancel}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={!delAck || delTyped.trim() !== L.deleteModal.typeWord}
                data-settings-delete-confirm=""
                className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-700 transition enabled:hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-400/40 dark:bg-rose-400/10 dark:text-rose-300"
              >
                {L.deleteModal.confirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
