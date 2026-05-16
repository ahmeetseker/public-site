/**
 * AttachmentDialog — URL-paste attachment modal (Wave F9.B).
 *
 * MVP mock: no real upload. User pastes an image/document URL → we validate +
 * preview the thumbnail (for images) → onAttach hands back a MessageAttachment
 * which MessageComposer keeps in its draft state.
 */
import { useEffect, useRef, useState } from 'react'
import {
  type MessageAttachment,
  deriveAttachmentName,
  guessAttachmentType,
  isValidUrl,
} from '../../lib/messages'

type Locale = 'tr' | 'en'

interface Labels {
  title: string
  urlPlaceholder: string
  urlLabel: string
  invalidUrl: string
  preview: string
  documentPreview: string
  attach: string
  cancel: string
}

const LABELS: Record<Locale, Labels> = {
  tr: {
    title: 'Dosya ekle',
    urlPlaceholder: 'https://...',
    urlLabel: 'Dosya/Görsel URL',
    invalidUrl: 'Geçerli bir URL gir (https://...).',
    preview: 'Önizleme',
    documentPreview: 'Belge eki',
    attach: 'Ekle',
    cancel: 'İptal',
  },
  en: {
    title: 'Attach a file',
    urlPlaceholder: 'https://...',
    urlLabel: 'File / image URL',
    invalidUrl: 'Enter a valid URL (https://...).',
    preview: 'Preview',
    documentPreview: 'Document attachment',
    attach: 'Attach',
    cancel: 'Cancel',
  },
}

interface AttachmentDialogProps {
  open: boolean
  onAttach: (attachment: MessageAttachment) => void
  onClose: () => void
  locale?: Locale
}

export default function AttachmentDialog({
  open,
  onAttach,
  onClose,
  locale = 'tr',
}: AttachmentDialogProps) {
  const [url, setUrl] = useState('')
  const [touched, setTouched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const labels = LABELS[locale]

  useEffect(() => {
    if (!open) {
      setUrl('')
      setTouched(false)
      return
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 30)
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const trimmed = url.trim()
  const valid = isValidUrl(trimmed)
  const type = valid ? guessAttachmentType(trimmed) : 'document'
  const name = valid ? deriveAttachmentName(trimmed) : ''
  const showError = touched && !valid && trimmed.length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    onAttach({ url: trimmed, type, name })
    setUrl('')
    setTouched(false)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
      data-testid="attachment-dialog"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        data-testid="attachment-dialog-panel"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg tracking-tight">{labels.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.cancel}
            className="rounded-md px-2 py-1 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          >
            ×
          </button>
        </div>

        <label className="block">
          <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            {labels.urlLabel}
          </span>
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setTouched(true)
            }}
            placeholder={labels.urlPlaceholder}
            data-testid="attachment-url-input"
            aria-invalid={showError ? 'true' : 'false'}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
          />
          {showError && (
            <p
              data-testid="attachment-url-error"
              className="mt-1 text-xs text-red-600 dark:text-red-300"
            >
              {labels.invalidUrl}
            </p>
          )}
        </label>

        {valid && (
          <div className="mt-4">
            <p className="mb-1 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
              {labels.preview}
            </p>
            {type === 'image' ? (
              // eslint-disable-next-line jsx-a11y/img-redundant-alt
              <img
                src={trimmed}
                alt={name}
                data-testid="attachment-preview-image"
                className="max-h-40 w-full rounded-xl border border-border object-contain"
              />
            ) : (
              <div
                data-testid="attachment-preview-document"
                className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-card/50 p-3 text-sm"
              >
                <span aria-hidden="true">📄</span>
                <span className="truncate">{name || labels.documentPreview}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            {labels.cancel}
          </button>
          <button
            type="submit"
            disabled={!valid}
            data-testid="attachment-submit"
            className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {labels.attach}
          </button>
        </div>
      </form>
    </div>
  )
}
