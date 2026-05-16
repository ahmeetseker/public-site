/**
 * ListingAiChat (J) — Wave F37 / Faz 2 (F37.4).
 *
 * Mockup paritesi: `remixed-1848500f.html` line 2215-2251.
 * RAG-vari sohbet kartı: bot greeting + 6 chip prompt + input + disclaimer.
 *
 * Veri kaynağı:
 *   - `useListingChatThread(listingId)` — mevcut thread + 6 default prompt.
 *   - `useAskListingChat()` — soru ekle, 800ms mock latency (F33: SSE yok).
 *
 * 6 prompt mockup orijinalinden override:
 *   - "Buraya ev yapabilir miyim?"
 *   - "Hisse durumu ne risk taşır?"
 *   - "Komşu parsel satıldı mı?"
 *   - "Yatırım potansiyeli ne?"
 *   - "Alım + emlak vergisi ne tutar?"
 *   - "Avukat tutmalı mıyım?"
 */

import { useEffect, useRef, useState } from 'react'
import { useAskListingChat, useListingChatThread } from '@landx/data'
import type { ListingChatMessage } from '@landx/data'
import { cn } from '../lib/cn'
import { ListingDetailQueryProvider } from './_provider'

export interface ListingAiChatProps {
  listingId: string
  className?: string
}

const MOCKUP_PROMPTS: readonly string[] = [
  'Buraya ev yapabilir miyim?',
  'Hisse durumu ne risk taşır?',
  'Komşu parsel satıldı mı?',
  'Yatırım potansiyeli ne?',
  'Alım + emlak vergisi ne tutar?',
  'Avukat tutmalı mıyım?',
] as const

function MessageBubble({ message }: { message: ListingChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-foreground text-background'
            : 'border border-border bg-background/70 text-foreground',
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border/60 pt-2">
            {message.sources.map((src, i) => (
              <span
                key={i}
                className="rounded-full border border-border/60 bg-card/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
              >
                {src}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PendingIndicator() {
  return (
    <div className="flex justify-start">
      <div
        className="max-w-[85%] rounded-2xl border border-border bg-background/70 px-4 py-3"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/40 [animation-delay:-200ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/40 [animation-delay:-100ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/40" />
        </div>
      </div>
    </div>
  )
}

function ListingAiChatInner({ listingId, className }: ListingAiChatProps) {
  const { data: thread, isPending: threadPending } = useListingChatThread(listingId)
  const ask = useAskListingChat()

  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Yeni mesaj eklendiğinde son mesaja kaydır.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [thread?.messages.length, ask.isPending])

  // Mockup paritesi: 6 sabit prompt; thread.suggestedPrompts varsa override.
  const prompts =
    thread && thread.suggestedPrompts.length > 0 ? thread.suggestedPrompts : MOCKUP_PROMPTS

  const greeting: ListingChatMessage | undefined = thread?.messages[0]

  // Sadece kullanıcı + cevap balonları (greeting hariç).
  const conversation = thread?.messages.slice(1) ?? []

  const submit = (question: string) => {
    const q = question.trim()
    if (!q || ask.isPending) return
    ask.mutate({ listingId, question: q })
    setDraft('')
    // Focus geri input'a.
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submit(draft)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(draft)
    }
  }

  return (
    <section
      aria-labelledby="chat-heading"
      className={cn('rounded-2xl border border-border bg-card p-5 md:p-6', className)}
    >
      <header className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          J. bölüm — asistan
        </div>
        <h2
          id="chat-heading"
          className="mt-1 font-serif text-2xl font-light tracking-tight md:text-3xl"
        >
          Bu arsayla <em className="font-serif italic font-light">sohbet et</em>
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Parselin tüm tapu, imar, afet ve uydu verileri RAG mimarisi ile context'e enjekte
          edilmiş. Cevaplar veri kaynağını alıntılar; resmi avukatlık / değerleme / vergi
          danışmanlığı değildir.
        </p>
      </header>

      <div className="mx-auto max-w-3xl space-y-4">
        {/* Bot greeting + (varsa) sohbet geçmişi */}
        <div className="rounded-2xl border border-border bg-background/40 p-4">
          {threadPending || !greeting ? (
            <div className="h-20 animate-pulse rounded-xl bg-card/40" aria-busy="true" />
          ) : (
            <div className="flex gap-3">
              <div
                aria-hidden
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-500 text-sm font-semibold text-white"
              >
                P
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-foreground">Parsel asistanı</div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {greeting.content}
                </p>
              </div>
            </div>
          )}

          {(conversation.length > 0 || ask.isPending) && (
            <div
              ref={scrollRef}
              className="mt-4 max-h-80 space-y-3 overflow-y-auto border-t border-border/60 pt-4"
            >
              {conversation.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
              {ask.isPending && <PendingIndicator />}
            </div>
          )}
        </div>

        {/* 6 chip prompt */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => submit(p)}
              disabled={ask.isPending}
              className={cn(
                'rounded-xl border border-border bg-background/70 px-3 py-2 text-left text-sm text-foreground backdrop-blur transition',
                'hover:bg-background hover:shadow-sm',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input + Sor butonu */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Bu parsele dair bir soru sor..."
            rows={1}
            disabled={ask.isPending}
            className={cn(
              'min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-background/70 px-4 py-2.5 text-sm backdrop-blur',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10',
              'disabled:cursor-not-allowed disabled:opacity-60',
            )}
            aria-label="Parsel asistanına soru sor"
          />
          <button
            type="submit"
            disabled={!draft.trim() || ask.isPending}
            className={cn(
              'h-[44px] shrink-0 rounded-xl bg-foreground px-5 text-sm font-medium text-background transition',
              'hover:opacity-90',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            Sor →
          </button>
        </form>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Cevaplar parselin doğrulanmış tapu / imar / afet verilerinden RAG ile üretilir; her
          cevap veri kaynağını alıntılar. Resmi avukatlık · değerleme · vergi danışmanlığı
          değildir.
        </p>
      </div>
    </section>
  )
}

export function ListingAiChat(props: ListingAiChatProps) {
  return (
    <ListingDetailQueryProvider>
      <ListingAiChatInner {...props} />
    </ListingDetailQueryProvider>
  )
}
