/**
 * SettingsSection — reusable collapsible section for /hesabim/ayarlar.
 *
 * Wave F7.C. Mirrors the visual language of the other account-section
 * surfaces (`rounded-2xl border border-border bg-card p-5`). Uses a
 * controlled `aria-expanded` chevron header rather than the native
 * `<details>/<summary>` so the chevron rotation animates and styling
 * tokens line up with the rest of the dashboard.
 */
import { useState, type ReactNode } from 'react'

export interface SettingsSectionProps {
  title: string
  description?: string
  defaultOpen?: boolean
  /**
   * data-testid hook for E2E. Becomes `data-settings-section={id}` on the
   * root element + `data-settings-toggle={id}` on the button.
   */
  id: string
  children: ReactNode
}

export default function SettingsSection({
  title,
  description,
  defaultOpen = true,
  id,
  children,
}: SettingsSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = `settings-section-${id}-body`

  return (
    <section
      className="rounded-2xl border border-border bg-card"
      data-settings-section={id}
      data-open={open ? 'true' : 'false'}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
        data-settings-toggle={id}
        className="flex w-full items-start justify-between gap-4 rounded-2xl px-5 py-4 text-left transition hover:bg-foreground/[0.02]"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-lg tracking-tight text-foreground">
            {title}
          </span>
          {description ? (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
        <span
          aria-hidden="true"
          className={`mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      {open ? (
        <div
          id={bodyId}
          data-settings-body={id}
          className="border-t border-border px-5 py-5"
        >
          {children}
        </div>
      ) : null}
    </section>
  )
}
