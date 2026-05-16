// ShareToast — tiny ephemeral toast used by ShareButtons.
//
// Pure CSS animation (no framer-motion). Auto-dismisses after ~1.2s via
// parent setTimeout. The component itself is a controlled visual: when
// `show` flips false the toast fades out instantly (next render).
//
// Token-only styling. No portal: rendered inline in ShareButtons' relative
// container so it positions just below the trigger row.

interface ShareToastProps {
  show: boolean
  message: string
}

export default function ShareToast({ show, message }: ShareToastProps) {
  if (!show) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-foreground px-3 py-1.5 text-xs text-background shadow-lg [animation:share-toast-in_180ms_ease-out_both,share-toast-out_220ms_ease-in_1s_both]"
    >
      {message}
      <style>{`
        @keyframes share-toast-in {
          from { opacity: 0; transform: translate(-50%, -4px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes share-toast-out {
          from { opacity: 1; transform: translate(-50%, 0); }
          to   { opacity: 0; transform: translate(-50%, -4px); }
        }
      `}</style>
    </div>
  )
}
