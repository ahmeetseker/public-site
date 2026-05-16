/**
 * EmojiPicker — 32-emoji 8×4 popover (Wave F9.B).
 *
 * Reusable picker for MessageComposer: click an emoji → fires onPick with
 * the literal emoji string. The parent decides whether to insert at the
 * current textarea selection.
 */
import { useEffect, useRef } from 'react'

type Locale = 'tr' | 'en'

interface Labels {
  title: string
  close: string
}

const LABELS: Record<Locale, Labels> = {
  tr: { title: 'Emoji seç', close: 'Kapat' },
  en: { title: 'Pick emoji', close: 'Close' },
}

/** Spec §5: 32 emoji 8×4 grid — common reactions / land-listing tone. */
export const EMOJI_LIST: readonly string[] = [
  '😊', '👍', '❤️', '😂', '🎉', '🙌', '🙏', '🔥',
  '🌳', '🌿', '🏡', '🏞️', '🌊', '☀️', '🌅', '⛰️',
  '✅', '❌', '⚠️', '💡', '📌', '📍', '🗺️', '📷',
  '📞', '✉️', '💬', '🗓️', '🕐', '💰', '🤝', '👋',
]

interface EmojiPickerProps {
  open: boolean
  onPick: (emoji: string) => void
  onClose: () => void
  locale?: Locale
}

export default function EmojiPicker({
  open,
  onPick,
  onClose,
  locale = 'tr',
}: EmojiPickerProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const labels = LABELS[locale]

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    function onClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    // setTimeout pushes the listener past the same click that opened us.
    const id = window.setTimeout(
      () => document.addEventListener('mousedown', onClick),
      0,
    )
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
      window.clearTimeout(id)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={labels.title}
      data-testid="emoji-picker"
      className="absolute bottom-full left-0 z-30 mb-2 w-[280px] rounded-2xl border border-border bg-card p-3 shadow-lg"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
          {labels.title}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        >
          ×
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1" data-testid="emoji-grid">
        {EMOJI_LIST.map((e, i) => (
          <button
            key={`${e}-${i}`}
            type="button"
            data-testid="emoji-cell"
            data-emoji={e}
            onClick={() => onPick(e)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition hover:bg-foreground/10"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}
