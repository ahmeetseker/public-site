// ShareButtons — KVKK-uyumlu paylaşım butonları (Faz 9.20).
//
// Davranış:
//   1. Birincil "Paylaş" butonu → navigator.share varsa native sheet açar.
//   2. Yoksa (veya kullanıcı küçük popover'ı isterse) X / WhatsApp / Facebook
//      "intent" URL'lerine giden <a> linkleri + "Bağlantıyı kopyala" butonu.
//   3. Kopyala → navigator.clipboard.writeText + "Kopyalandı ✓" toast (1.2s).
//
// KVKK garantileri:
//   - Hiçbir üçüncü taraf <script> yüklenmiyor (Twitter widgets / Facebook SDK
//     / WhatsApp Click-to-Chat yok).
//   - <iframe> yok.
//   - Analitik event yok (PostHog dahil) — kullanıcı niyeti client-side kalır.
//   - Veri yalnızca kullanıcının açık tıklamasıyla platforma gider.
//
// Mount: `client:idle` — sayfa interaktif olduktan sonra hidrate olur, LCP
// üzerinde bir etkisi yoktur.

import { useEffect, useRef, useState } from 'react'
import {
  buildFacebookIntent,
  buildWhatsAppIntent,
  buildXIntent,
} from '@/lib/share-url'
import ShareToast from './ShareToast'

export interface ShareButtonsProps {
  url: string
  title: string
  text: string
}

type ToastState = { show: boolean; message: string }

export default function ShareButtons({ url, title, text }: ShareButtonsProps) {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' })
  const [hasNativeShare, setHasNativeShare] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // navigator.share is only meaningfully available on mobile + Safari macOS.
  // Detect after mount so SSR markup is stable.
  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setHasNativeShare(true)
    }
  }, [])

  // Close popover on outside click / Escape.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
  }, [])

  function flashToast(message: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ show: true, message })
    toastTimerRef.current = setTimeout(() => {
      setToast({ show: false, message: '' })
    }, 1200)
  }

  async function handlePrimary() {
    if (hasNativeShare && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url })
        return
      } catch {
        // User cancelled or share failed — fall through to popover.
      }
    }
    setOpen((v) => !v)
  }

  async function handleCopy() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        flashToast('Kopyalandı ✓')
      } else {
        flashToast('Tarayıcı desteklemiyor')
      }
    } catch {
      flashToast('Kopyalanamadı')
    }
  }

  const xHref = buildXIntent(url, text)
  const waHref = buildWhatsAppIntent(url, text)
  const fbHref = buildFacebookIntent(url)

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
      data-testid="share-buttons"
    >
      <button
        type="button"
        onClick={handlePrimary}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="İlanı paylaş"
        data-testid="share-trigger"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Paylaş
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Paylaşım seçenekleri"
          className="absolute right-0 top-full z-10 mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-lg"
          data-testid="share-popover"
        >
          <a
            href={xHref}
            target="_blank"
            rel="noopener noreferrer nofollow"
            role="menuitem"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-foreground transition hover:bg-accent"
            data-testid="share-x"
          >
            <span aria-hidden="true" className="font-mono text-xs font-bold">X</span>
            X (Twitter) üzerinde paylaş
          </a>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer nofollow"
            role="menuitem"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-foreground transition hover:bg-accent"
            data-testid="share-whatsapp"
          >
            <span aria-hidden="true" className="font-mono text-xs font-bold">WA</span>
            WhatsApp ile gönder
          </a>
          <a
            href={fbHref}
            target="_blank"
            rel="noopener noreferrer nofollow"
            role="menuitem"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-foreground transition hover:bg-accent"
            data-testid="share-facebook"
          >
            <span aria-hidden="true" className="font-mono text-xs font-bold">FB</span>
            Facebook'ta paylaş
          </a>
          <button
            type="button"
            onClick={handleCopy}
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-foreground transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
            data-testid="share-copy"
          >
            <span aria-hidden="true" className="font-mono text-xs font-bold">CP</span>
            Bağlantıyı kopyala
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              if (typeof window !== 'undefined') window.print()
            }}
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-foreground transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
            data-testid="share-print"
          >
            <span aria-hidden="true" className="font-mono text-xs font-bold">PR</span>
            Yazdır / PDF
          </button>
          <p className="mt-1 px-3 pt-2 text-xs leading-snug text-muted-foreground">
            Yalnızca tıkladığınızda paylaşılır. Üçüncü taraf takip kodu yüklenmez.
          </p>
        </div>
      )}

      <ShareToast show={toast.show} message={toast.message} />
    </div>
  )
}
