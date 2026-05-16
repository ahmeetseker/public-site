import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from 'react'
import { AnimatePresence, motion, type Transition } from 'framer-motion'
import { ArrowRight, Bell, Sparkles, X } from '@landx/icons'
import { cn } from '../lib/cn'
import { REDUCED_MOTION_TRANSITION, motionGate } from '../lib/motion'
import type {
  AiAnswer,
  DynamicIslandHeaderProps,
} from './dynamic-island-header.types'

const DEFAULT_AI_STAGES = [
  'Sorgun anlaşılıyor…',
  'Veri taranıyor…',
  'Sonuç hazırlanıyor…',
] as const

export function DynamicIslandHeader({
  brandIcon,
  brandLabel,
  activeKey = 'overview',
  statusChipLabel,
  navPages,
  subNav,
  aiSearch,
  notifications,
  extras,
  onNavigate,
  onNavigateHref,
  onOpenAssistant,
}: DynamicIslandHeaderProps) {
  const totalUnread = notifications?.unreadCount ?? 0
  const [navOpen, setNavOpen] = useState(false)
  const [pillHover, setPillHover] = useState(false)
  const [canHover, setCanHover] = useState(true)
  const [notifOpen, setNotifOpen] = useState(false)
  const [selectedNav, setSelectedNav] = useState<string | null>(null)
  const [now, setNow] = useState<Date>(() => new Date())
  const statusContentRef = useRef<HTMLSpanElement>(null)
  const [statusContentWidth, setStatusContentWidth] = useState(0)
  const [, startNavTransition] = useTransition()

  // Wave F31.C — gate top-level backdrop & notif-panel transitions through
  // motionGate so prefers-reduced-motion users get instant mount/dismount.
  // Internal layout choreography (cards-grid, peek-stack, ai-search reveal)
  // stays local — CSS prefers-reduced-motion guards in index.css already
  // disable framer animations globally for those users.
  const navBackdropTransition = motionGate<Transition>(REDUCED_MOTION_TRANSITION, { duration: 0.2 })
  const notifBackdropTransition = motionGate<Transition>(REDUCED_MOTION_TRANSITION, { duration: 0.2 })
  const notifPanelTransition = motionGate<Transition>(REDUCED_MOTION_TRANSITION, {
    duration: 0.32,
    ease: [0.32, 0.72, 0, 1] as const,
  })

  // AI search state
  const [aiSearchExpanded, setAiSearchExpanded] = useState(false)
  const [aiSearchValue, setAiSearchValue] = useState('')
  const [aiThinking, setAiThinking] = useState(false)
  const [aiStage, setAiStage] = useState(0)
  const [aiResult, setAiResult] = useState<AiAnswer | null>(null)
  const aiSearchRef = useRef<HTMLTextAreaElement>(null)
  const [isMacOs] = useState(() => {
    if (typeof navigator === 'undefined') return false
    const uaDataPlatform = (navigator as Navigator & {
      userAgentData?: { platform?: string }
    }).userAgentData?.platform
    const platform = uaDataPlatform || navigator.platform || navigator.userAgent
    return /Mac|iPhone|iPad|iPod/i.test(platform)
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const apply = () => {
      setCanHover(mq.matches)
      if (!mq.matches) setPillHover(false)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!notifOpen) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifOpen(false)
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [notifOpen])

  const closeNav = useCallback(() => {
    setNavOpen(false)
    setSelectedNav(null)
    setAiSearchExpanded(false)
    setAiSearchValue('')
    setAiResult(null)
    setAiThinking(false)
  }, [])

  const submitAiQuery = useCallback(
    (query: string) => {
      const q = query.trim()
      if (!q || !aiSearch) return
      setAiThinking(true)
      setAiResult(null)
      setAiStage(0)
      const s1 = window.setTimeout(() => setAiStage(1), 480)
      const s2 = window.setTimeout(() => setAiStage(2), 960)
      const done = window.setTimeout(() => {
        Promise.resolve(aiSearch.answerFn(q))
          .then((answer) => {
            setAiResult(answer)
          })
          .catch((err) => {
            console.error('[DynamicIslandHeader] answerFn rejected:', err)
            setAiResult({ text: 'Sonuç alınamadı. Tekrar dene.' })
          })
          .finally(() => {
            setAiThinking(false)
          })
      }, 1500)
      return () => {
        window.clearTimeout(s1)
        window.clearTimeout(s2)
        window.clearTimeout(done)
      }
    },
    [aiSearch],
  )

  // Textarea auto-grow
  useEffect(() => {
    const el = aiSearchRef.current
    if (!el) return
    if (aiSearchExpanded && aiSearchValue) {
      const prevHeight = el.offsetHeight
      el.style.height = 'auto'
      const targetHeight = Math.min(el.scrollHeight, 160)
      el.style.height = `${prevHeight}px`
      void el.offsetHeight
      el.style.height = `${targetHeight}px`
    } else {
      el.style.height = ''
    }
  }, [aiSearchExpanded, aiSearchValue])

  // Cmd+K kısayolu artık RootLayout'ta — global AssistantModal'ı açar.

  const timeLabel = now.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const activePageLabel =
    statusChipLabel ??
    navPages.find((p) => p.key === activeKey)?.alt ??
    brandLabel

  useLayoutEffect(() => {
    const el = statusContentRef.current
    if (!el) return
    const w = el.offsetWidth
    if (w > 0) setStatusContentWidth(w)
  }, [activePageLabel, timeLabel])

  useEffect(() => {
    const el = statusContentRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth
      if (w > 0) setStatusContentWidth((prev) => (prev === w ? prev : w))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <>
      <AnimatePresence>
        {navOpen && (
          <motion.div
            key="nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={navBackdropTransition}
            onClick={closeNav}
            className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <div
        className="fixed left-1/2 top-4 z-40 -translate-x-1/2"
        style={{
          width: navOpen
            ? 'min(94vw, 580px)'
            : !canHover
              ? 'min(94vw, 500px)'
              : pillHover
                ? 'min(92vw, 500px)'
                : 'min(86vw, 260px)',
          transition: 'width 500ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
      <motion.div
        layout
        transition={{
          layout: { type: 'spring', stiffness: 380, damping: 36, mass: 0.9 },
          opacity: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
          scale: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
        }}
        animate={{
          opacity: notifOpen ? 0 : 1,
          scale: notifOpen ? 0.92 : 1,
        }}
        className={cn(
          'flex w-full flex-col overflow-hidden',
          navOpen ? 'rounded-[28px]' : 'r-chip',
          'border border-border/70 bg-background/80 shadow-[0_8px_24px_rgba(80,60,40,0.1),0_0_16px_rgba(80,60,40,0.05)] dark:bg-stone-900/70 dark:shadow-[0_8px_24px_rgba(20,14,10,0.45),0_0_24px_rgba(20,14,10,0.22)]',
          notifOpen ? 'pointer-events-none' : 'pointer-events-auto',
        )}
        style={{
          maxHeight: navOpen
            ? canHover
              ? 'calc(100dvh - 2rem)'
              : 'calc(100dvh - 6rem)'
            : undefined,
          backdropFilter: 'blur(14px) saturate(180%)',
          WebkitBackdropFilter: 'blur(14px) saturate(180%)',
          transformOrigin: 'top center',
          contain: 'layout style',
          willChange: 'transform',
        }}
      >
        <motion.div
          role="button"
          tabIndex={0}
          aria-label="Hızlı gezinme"
          aria-haspopup="dialog"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}
          onHoverStart={() => {
            if (canHover) setPillHover(true)
          }}
          onHoverEnd={() => {
            if (canHover) setPillHover(false)
          }}
          onFocus={() => {
            if (canHover) setPillHover(true)
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setPillHover(false)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setNavOpen((v) => !v)
            }
          }}
          className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 transition-colors hover:bg-foreground/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 sm:px-5"
        >
          <div className="flex flex-none items-center gap-2.5">
            {brandIcon}
            <span className="text-sm font-semibold tracking-tight">{brandLabel}</span>
          </div>

          <div
            className={cn(
              'flex items-center overflow-hidden',
              !canHover && 'min-w-0 flex-1 justify-center',
            )}
            style={
              canHover
                ? {
                    width: pillHover ? `${statusContentWidth}px` : '0px',
                    opacity: pillHover ? 1 : 0,
                    transition: pillHover
                      ? 'width 600ms cubic-bezier(0.32, 0.72, 0, 1), opacity 180ms cubic-bezier(0.32, 0.72, 0, 1) 420ms'
                      : 'width 600ms cubic-bezier(0.32, 0.72, 0, 1), opacity 160ms cubic-bezier(0.32, 0.72, 0, 1)',
                  }
                : undefined
            }
            aria-hidden={canHover && !pillHover}
          >
            <span
              ref={statusContentRef}
              aria-label={`Şu an: ${activePageLabel}`}
              className="inline-flex items-center gap-1.5 r-chip whitespace-nowrap border border-border/60 bg-background/30 py-1.5 pl-2 pr-2.5 backdrop-blur-md"
            >
              <span className="relative flex h-1.5 w-1.5 flex-none">
                <span className="absolute inline-flex h-full w-full r-chip animate-ping bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 r-chip bg-emerald-600 dark:bg-emerald-400" />
              </span>
              <span className="text-xs leading-none">
                <span className="text-muted-foreground">Şu an: </span>
                <span className="font-medium text-foreground">{activePageLabel}</span>
              </span>
              <span
                className="hidden h-3 w-px flex-none bg-border/70 sm:inline-block"
                aria-hidden="true"
              />
              <span className="hidden font-mono text-xs tabular-nums tracking-wider text-muted-foreground sm:inline">
                {timeLabel}
              </span>
            </span>
          </div>

          <div className="flex flex-none items-center gap-1">
            {onOpenAssistant && (
              <button
                type="button"
                aria-label={`${brandLabel} asistanı`}
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenAssistant()
                }}
                className="hidden h-9 w-9 items-center justify-center r-chip bg-foreground/[0.06] transition-colors hover:bg-foreground/10 sm:flex"
                title={`${brandLabel} asistanı (⌘K)`}
              >
                <Sparkles className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              aria-label={`Bildirimler${totalUnread > 0 ? `, ${totalUnread} okunmamış` : ''}`}
              aria-haspopup="dialog"
              aria-expanded={notifOpen}
              onClick={(e) => {
                e.stopPropagation()
                setNotifOpen((v) => !v)
              }}
              className="relative flex h-10 w-10 items-center justify-center r-chip bg-background/30 transition-colors hover:bg-background/60 active:bg-background/70 sm:h-9 sm:w-9"
            >
              <Bell className="h-4 w-4" />
              {totalUnread > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center r-chip bg-red-600 px-1 font-mono text-[9px] font-medium tabular-nums text-white dark:bg-red-400 dark:text-stone-900"
                >
                  {totalUnread}
                </span>
              )}
            </button>
          </div>
        </motion.div>

        <AnimatePresence initial={false}>
          {navOpen && (
            <motion.div
              key="nav-content"
              role="dialog"
              aria-modal="true"
              aria-label="Hızlı gezinme"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="flex min-h-0 flex-col overflow-hidden"
            >
              {canHover && (
                <div className="flex flex-none items-center justify-between gap-3 border-b border-border/60 px-5 pb-3 pt-4">
                  <h2 className="font-serif text-base font-medium leading-none text-foreground">
                    Nereye gitmek istersin?
                  </h2>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      closeNav()
                    }}
                    aria-label="Kapat"
                    className="flex h-8 w-8 flex-none items-center justify-center r-chip bg-background/40 text-muted-foreground transition-all hover:rotate-90 hover:bg-foreground/[0.08] hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3 lg-edge-y">
                <AnimatePresence mode="popLayout" initial={false}>
                  {selectedNav === null ? (
                    <motion.div
                      key="cards-grid"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                    >
                      {navPages.map((p) => {
                        const isActive = activeKey === p.key
                        return (
                          <button
                            key={p.key}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              startNavTransition(() => setSelectedNav(p.key))
                            }}
                            className={cn(
                              'glass-item group relative flex flex-col items-center justify-center gap-2 r-container px-3 py-4 text-center',
                              isActive && 'shadow-inner',
                            )}
                          >
                            <span
                              className={cn(
                                'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                                isActive
                                  ? 'bg-foreground/10 text-foreground'
                                  : 'bg-stone-700/10 text-stone-800 group-hover:bg-foreground/10 dark:bg-stone-200/10 dark:text-stone-200',
                              )}
                            >
                              {p.icon}
                            </span>
                            <span className="text-sm font-medium leading-none">{p.alt}</span>
                            {isActive && (
                              <span
                                aria-hidden="true"
                                className="absolute right-2 top-2 h-1.5 w-1.5 r-chip bg-emerald-600 shadow-[0_0_8px_currentColor] dark:bg-emerald-400"
                              />
                            )}
                          </button>
                        )
                      })}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="stacked"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                      className="flex flex-col gap-3"
                    >
                      <div className="peek-stack" tabIndex={0} aria-label="Diğer kategoriler">
                        {navPages.filter((p) => p.key !== selectedNav).map((p) => {
                          const isActive = activeKey === p.key
                          return (
                            <button
                              key={p.key}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                startNavTransition(() => setSelectedNav(p.key))
                              }}
                              aria-label={p.alt}
                              className="peek-stack-item glass-peek flex cursor-pointer items-center gap-2.5 r-container px-3.5"
                            >
                              <span className="flex h-6 w-6 flex-none items-center justify-center r-control bg-foreground/10 text-foreground/90">
                                {p.icon}
                              </span>
                              <span className="text-sm font-medium leading-none text-foreground">
                                {p.alt}
                              </span>
                              {isActive && (
                                <span
                                  aria-hidden="true"
                                  className="ml-auto h-1.5 w-1.5 r-chip bg-emerald-600 shadow-[0_0_8px_currentColor] dark:bg-emerald-400"
                                />
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {(() => {
                        const selected = navPages.find((p) => p.key === selectedNav)
                        const isActive = activeKey === selectedNav
                        if (!selected) return null
                        return (
                          <motion.div
                            key={`active-${selectedNav}`}
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
                            className="glass-card flex shrink-0 flex-col gap-3 r-container p-4"
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-foreground/10 text-foreground">
                                {selected.icon}
                              </span>
                              <h3 className="font-serif text-base font-medium tracking-tight text-foreground">
                                {selected.alt}
                              </h3>
                              {isActive && (
                                <span
                                  aria-hidden="true"
                                  className="ml-auto h-2 w-2 r-chip bg-emerald-600 shadow-[0_0_10px_currentColor] dark:bg-emerald-400"
                                />
                              )}
                            </div>
                            <div className="h-px bg-foreground/10" />
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.22,
                                delay: 0.04,
                                ease: [0.32, 0.72, 0, 1],
                              }}
                              className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                            >
                              {(subNav[selectedNav!] ?? []).map((s, i) => (
                                <motion.button
                                  key={s.key}
                                  type="button"
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    duration: 0.18,
                                    delay: 0.04 + i * 0.015,
                                    ease: [0.32, 0.72, 0, 1],
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (s.href) {
                                      onNavigateHref?.(s.href)
                                    } else {
                                      onNavigate?.(s.target)
                                    }
                                    closeNav()
                                  }}
                                  className="glass-item group relative flex flex-col items-center justify-center gap-2 rounded-xl px-3 py-3 text-center"
                                >
                                  <span className="flex h-8 w-8 items-center justify-center r-control bg-stone-700/10 text-stone-800 group-hover:bg-foreground/10 dark:bg-stone-200/10 dark:text-stone-200">
                                    {s.icon}
                                  </span>
                                  <span className="text-[13px] font-medium leading-none">
                                    {s.label}
                                  </span>
                                </motion.button>
                              ))}
                            </motion.div>
                          </motion.div>
                        )
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {extras && (
                <div className="flex-none border-t border-border/60 bg-background/30">
                  {extras}
                </div>
              )}

              {aiSearch && (
                <div className="flex-none border-t border-border/60 bg-background/40 px-5 pb-4 pt-3">
                  <motion.div
                  animate={
                    aiThinking
                      ? {
                          boxShadow: [
                            '0 0 0 0 rgba(99,102,241,0)',
                            '0 0 0 6px rgba(99,102,241,0.18), 0 0 24px 2px rgba(99,102,241,0.25)',
                            '0 0 0 0 rgba(99,102,241,0)',
                          ],
                        }
                      : { boxShadow: '0 0 0 0 rgba(0,0,0,0)' }
                  }
                  transition={{ duration: 1.6, repeat: aiThinking ? Infinity : 0, ease: 'easeInOut' }}
                  className={cn(
                    'relative overflow-hidden rounded-xl border bg-background/40 transition-colors duration-200',
                    aiThinking
                      ? 'border-indigo-400/60 dark:border-indigo-300/60'
                      : aiSearchExpanded
                        ? 'border-foreground/50 bg-background/60'
                        : 'border-border/60',
                  )}
                >
                  {aiThinking && (
                    <motion.div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 -z-0 rounded-xl"
                      style={{
                        background:
                          'conic-gradient(from 0deg, transparent 0deg, rgba(129,140,248,0.45) 60deg, transparent 140deg, rgba(168,85,247,0.4) 220deg, transparent 320deg)',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                  <div className="relative z-10 flex items-start gap-2 px-3 py-2">
                    <motion.span
                      className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center"
                      animate={
                        aiThinking
                          ? { rotate: 360, scale: [1, 1.2, 1] }
                          : { rotate: 0, scale: 1 }
                      }
                      transition={
                        aiThinking
                          ? {
                              rotate: { duration: 1.8, repeat: Infinity, ease: 'linear' },
                              scale: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
                            }
                          : { duration: 0.2 }
                      }
                    >
                      <Sparkles
                        className={cn(
                          'h-4 w-4 transition-colors',
                          aiThinking
                            ? 'text-indigo-400 drop-shadow-[0_0_4px_rgba(129,140,248,0.7)]'
                            : 'text-muted-foreground',
                        )}
                      />
                    </motion.span>
                    <textarea
                      ref={aiSearchRef}
                      value={aiSearchValue}
                      onChange={(e) => setAiSearchValue(e.target.value)}
                      onFocus={() => setAiSearchExpanded(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.stopPropagation()
                          if (aiSearchExpanded) {
                            setAiSearchExpanded(false)
                            ;(e.target as HTMLTextAreaElement).blur()
                          }
                        } else if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          submitAiQuery(aiSearchValue)
                        }
                      }}
                      placeholder={aiSearch.placeholder}
                      rows={aiSearchExpanded ? 2 : 1}
                      className="min-w-0 flex-1 resize-none overflow-hidden border-0 bg-transparent text-sm leading-snug placeholder:text-[hsl(var(--placeholder))] transition-[height] duration-300 ease-in-out focus:outline-none focus:ring-0"
                    />
                    {aiSearchExpanded && (
                      <>
                        <kbd
                          aria-label={isMacOs ? 'Kısayol: Command + K' : 'Kısayol: Ctrl + K'}
                          className="hidden h-6 items-center gap-1 rounded-lg border border-border/60 bg-background/60 px-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:inline-flex"
                        >
                          {isMacOs ? '⌘' : 'Ctrl'} K
                        </kbd>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => submitAiQuery(aiSearchValue)}
                          aria-label="Gönder"
                          className="flex h-7 w-7 flex-none items-center justify-center r-chip bg-foreground text-background transition-opacity hover:opacity-85 disabled:opacity-40"
                          disabled={!aiSearchValue.trim() || aiThinking}
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                  <AnimatePresence initial={false} mode="wait">
                    {aiSearchExpanded && (aiResult || aiThinking) ? (
                      <motion.div
                        key="ai-result"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/40 px-3 py-3">
                          {aiThinking ? (
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-2.5">
                                <span className="relative flex h-5 w-5 flex-none items-center justify-center">
                                  <span className="absolute inset-0 animate-ping r-chip bg-indigo-400/40" />
                                  <span className="relative h-2 w-2 r-chip bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.9)]" />
                                </span>
                                <AnimatePresence mode="wait">
                                  <motion.span
                                    key={aiStage}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-[12px] font-medium tracking-tight text-foreground/90"
                                  >
                                    {(aiSearch.stageLabels ?? DEFAULT_AI_STAGES)[aiStage] ?? DEFAULT_AI_STAGES[aiStage]}
                                  </motion.span>
                                </AnimatePresence>
                              </div>
                              <div className="relative h-1 overflow-hidden r-chip bg-foreground/[0.06]">
                                <motion.div
                                  className="absolute inset-y-0 w-1/3 r-chip bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                                  animate={{ x: ['-110%', '320%'] }}
                                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                {[68, 92, 78, 56].map((w, i) => (
                                  <div
                                    key={i}
                                    className="relative h-2 overflow-hidden r-chip bg-foreground/[0.05]"
                                    style={{ width: `${w}%` }}
                                  >
                                    <motion.div
                                      className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/15 to-transparent"
                                      animate={{ x: ['-100%', '200%'] }}
                                      transition={{
                                        duration: 1.6,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        delay: i * 0.18,
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : aiResult ? (
                            <div className="flex flex-col gap-3">
                              <p className="text-[13px] leading-relaxed text-foreground/90">
                                {aiResult.text}
                              </p>
                              {aiResult.chart && (
                                <InlineMiniBars
                                  title={aiResult.chart.title}
                                  data={aiResult.chart.data}
                                />
                              )}
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setAiResult(null)
                                    setAiSearchValue('')
                                    aiSearchRef.current?.focus()
                                  }}
                                  className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
                                >
                                  Yeni soru
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    ) : aiSearchExpanded ? (
                      <motion.div
                        key="ai-suggestions"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-nowrap gap-1.5 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {aiSearch.suggestions.map((s) => (
                            <button
                              key={s.label}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setAiSearchValue(s.label)
                                submitAiQuery(s.label)
                              }}
                              className="group inline-flex flex-none items-center gap-1.5 r-chip border border-border/40 bg-transparent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/45 transition-colors hover:border-foreground/40 hover:bg-foreground/[0.05] hover:text-foreground/85"
                            >
                              <span className="opacity-70 group-hover:opacity-100">{s.icon}</span>
                              <span className="whitespace-nowrap">{s.label}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      </div>

      <AnimatePresence>
        {notifOpen && (
          <>
            <motion.div
              key="notif-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={notifBackdropTransition}
              onClick={() => setNotifOpen(false)}
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.div
              key="notif-panel"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={notifPanelTransition}
              style={{ x: '-50%' }}
              className="fixed left-1/2 top-16 z-50"
            >
              {notifications?.panel
                ? typeof notifications.panel === 'function'
                  ? notifications.panel({ close: () => setNotifOpen(false) })
                  : notifications.panel
                : null}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function InlineMiniBars({
  title,
  data,
}: {
  title: string
  data: Array<{ label: string; value: number; suffix?: string }>
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="r-control border border-border/40 bg-background/40 p-3">
      <div className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </div>
      <div className="flex flex-col gap-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2.5">
            <div className="w-20 truncate text-[11px] text-foreground/75">{d.label}</div>
            <div className="relative h-1.5 flex-1 overflow-hidden r-chip bg-foreground/[0.06]">
              <div
                className="absolute inset-y-0 left-0 r-chip bg-foreground/45"
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
            <div className="w-12 text-right text-[11px] tabular-nums text-foreground/85">
              {d.value.toLocaleString('tr-TR')}
              {d.suffix ?? ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
