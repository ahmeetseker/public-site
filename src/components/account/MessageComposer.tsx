/**
 * MessageComposer — textarea + emoji + attachment toolbar (Wave F9.B).
 *
 * Owns: draft text, draft attachments (pre-send), emoji-picker open state,
 * attachment-dialog open state. Sending hands the body + attachments to the
 * parent (MessagesView) which persists to localStorage via lib/messages.ts.
 */
import { useRef, useState } from 'react'
import { type MessageAttachment, insertAtCursor } from '../../lib/messages'
import AttachmentDialog from './AttachmentDialog'
import EmojiPicker from './EmojiPicker'

type Locale = 'tr' | 'en'

interface Labels {
  placeholder: string
  emoji: string
  attach: string
  send: string
  attachmentRemove: string
  attachmentsTitle: string
}

const LABELS: Record<Locale, Labels> = {
  tr: {
    placeholder: 'Mesajını yaz…',
    emoji: 'Emoji',
    attach: 'Dosya ekle',
    send: 'Gönder',
    attachmentRemove: 'Kaldır',
    attachmentsTitle: 'Ekler',
  },
  en: {
    placeholder: 'Type a message…',
    emoji: 'Emoji',
    attach: 'Attach',
    send: 'Send',
    attachmentRemove: 'Remove',
    attachmentsTitle: 'Attachments',
  },
}

interface MessageComposerProps {
  onSend: (body: string, attachments: MessageAttachment[]) => void
  locale?: Locale
  disabled?: boolean
}

export default function MessageComposer({
  onSend,
  locale = 'tr',
  disabled,
}: MessageComposerProps) {
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<MessageAttachment[]>([])
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [attachOpen, setAttachOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const labels = LABELS[locale]

  const canSend = !disabled && (body.trim().length > 0 || attachments.length > 0)

  function handleEmojiPick(emoji: string) {
    const ta = textareaRef.current
    const selStart = ta?.selectionStart ?? body.length
    const selEnd = ta?.selectionEnd ?? body.length
    const { value, caret } = insertAtCursor(body, selStart, selEnd, emoji)
    setBody(value)
    setEmojiOpen(false)
    // Restore focus + caret after the state flush.
    window.setTimeout(() => {
      if (ta) {
        ta.focus()
        try {
          ta.setSelectionRange(caret, caret)
        } catch {
          /* ignore */
        }
      }
    }, 0)
  }

  function handleAttachment(attachment: MessageAttachment) {
    setAttachments((prev) => [...prev, attachment])
    setAttachOpen(false)
  }

  function handleAttachmentRemove(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSend) return
    onSend(body, attachments)
    setBody('')
    setAttachments([])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canSend) {
        onSend(body, attachments)
        setBody('')
        setAttachments([])
      }
    }
  }

  return (
    <>
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-col gap-2 border-t border-border bg-card p-3"
      data-testid="message-composer"
    >
      {attachments.length > 0 && (
        <ul
          className="flex flex-wrap gap-2"
          data-testid="composer-attachments-list"
          aria-label={labels.attachmentsTitle}
        >
          {attachments.map((a, i) => (
            <li
              key={`${a.url}-${i}`}
              className="flex items-center gap-2 rounded-xl border border-border bg-card/80 px-2 py-1 text-xs"
              data-testid="composer-attachment-chip"
            >
              <span aria-hidden="true">{a.type === 'image' ? '🖼️' : '📄'}</span>
              <span className="max-w-[160px] truncate">{a.name}</span>
              <button
                type="button"
                onClick={() => handleAttachmentRemove(i)}
                aria-label={labels.attachmentRemove}
                className="rounded-md px-1 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={labels.placeholder}
        rows={2}
        data-testid="composer-textarea"
        disabled={disabled}
        className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />

      <div className="flex items-center justify-between">
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            data-testid="composer-emoji-toggle"
            aria-label={labels.emoji}
            aria-expanded={emojiOpen}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs text-foreground transition hover:bg-foreground/5"
          >
            <span aria-hidden="true">😊</span>
            <span>{labels.emoji}</span>
          </button>
          <button
            type="button"
            onClick={() => setAttachOpen(true)}
            data-testid="composer-attach-toggle"
            aria-label={labels.attach}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs text-foreground transition hover:bg-foreground/5"
          >
            <span aria-hidden="true">📎</span>
            <span>{labels.attach}</span>
          </button>
          <EmojiPicker
            open={emojiOpen}
            onPick={handleEmojiPick}
            onClose={() => setEmojiOpen(false)}
            locale={locale}
          />
        </div>

        <button
          type="submit"
          disabled={!canSend}
          data-testid="composer-send"
          className="inline-flex items-center gap-1 rounded-xl bg-foreground px-4 py-1.5 text-xs font-medium text-background transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>{labels.send}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>

    </form>
    {/* Rendered outside the composer form to avoid nested-form HTML invariance. */}
    <AttachmentDialog
      open={attachOpen}
      onAttach={handleAttachment}
      onClose={() => setAttachOpen(false)}
      locale={locale}
    />
    </>
  )
}
