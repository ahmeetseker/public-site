/**
 * OtpInput — 6-digit OTP entry. Auto-advance focus + paste support.
 *
 * Wave F32 / W3A. Mock — değer üst componente `onChange(code)` ile döner.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  length?: number
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  ariaLabel?: string
  disabled?: boolean
}

export default function OtpInput({
  length = 6,
  onChange,
  onComplete,
  ariaLabel = '6 haneli kod',
  disabled = false,
}: Props) {
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length }, () => ''))
  const refs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    const value = digits.join('')
    onChange?.(value)
    if (value.length === length && digits.every((d) => d !== '')) {
      onComplete?.(value)
    }
  }, [digits, length, onChange, onComplete])

  const focusAt = useCallback((idx: number) => {
    const el = refs.current[idx]
    if (el) el.focus()
  }, [])

  const handleChange = (idx: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, 1)
    if (cleaned.length === 0 && raw.length > 0) return
    setDigits((prev) => {
      const next = [...prev]
      next[idx] = cleaned
      return next
    })
    if (cleaned && idx < length - 1) focusAt(idx + 1)
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        setDigits((prev) => {
          const next = [...prev]
          next[idx] = ''
          return next
        })
      } else if (idx > 0) {
        focusAt(idx - 1)
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      focusAt(idx - 1)
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      focusAt(idx + 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    const next = Array.from({ length }, (_, i) => pasted[i] ?? '')
    setDigits(next)
    const focusIdx = Math.min(pasted.length, length - 1)
    focusAt(focusIdx)
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-testid="otp-input"
      className="flex items-center justify-center gap-2"
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={d}
          disabled={disabled}
          aria-label={`${ariaLabel} — ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.select()}
          className="h-12 w-10 rounded-xl border border-border bg-background text-center font-mono text-lg font-medium tabular-nums outline-none transition focus:border-foreground disabled:opacity-50"
        />
      ))}
    </div>
  )
}
