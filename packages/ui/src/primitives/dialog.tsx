import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "@landx/icons";
import { cn } from "../lib/cn";
import { squircleStyle } from "../lib/squircle-style";
import { useReducedMotion, REDUCED_MOTION_TRANSITION } from "../lib/motion";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl",
} as const;

/**
 * FAZ 4 — Dialog primitive migration.
 *
 * Concentricity:
 *   panel radius   = --radius-surface  (= 24px)
 *   panel padding  = px-4              (= 16px) on header / body
 *   header → close button concentric:
 *     radiusInner(24, 16) = 8 = --radius-control  ✓
 *
 * Migrated:
 *   - Panel: rounded-lg-2xl (legacy --lg-r-2xl 24px) → --radius-surface (24px) [zero visual delta]
 *   - Close button: rounded-lg-md (legacy --lg-r-md 10px) → --radius-control (8px) [-2px]
 *
 * Squircle equivalent: corner-shape declaration emitted inline alongside
 * border-radius (same CSS pattern Squircle component emits). framer-motion
 * + TS button props don't compose cleanly with the React Squircle wrapper,
 * so we inline the equivalent style here.
 */

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: DialogProps) {
  const reducedMotion = useReducedMotion();
  const overlayTransition = reducedMotion
    ? REDUCED_MOTION_TRANSITION
    : ({ duration: 0.2 } as const);
  const wrapTransition = reducedMotion
    ? REDUCED_MOTION_TRANSITION
    : ({ duration: 0.2, ease: [0.22, 1, 0.36, 1] } as const);
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="dialog-overlay"
            className="fixed inset-0 z-[60] bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
            onClick={onClose}
          />
          {/*
            Wrapper — viewport center'a fixed-positioned. Halo + modal aynı
            transform'u paylaşır (child olduğu için), pozisyon kayma yok.
            framer-motion sadece opacity/scale animate eder; translate Tailwind
            class'larına bırakılır (transform conflict'i önlemek için).
          */}
          <motion.div
            key="dialog-wrap"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={wrapTransition}
            className={cn(
              "fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-h-[calc(100dvh-6rem)] -translate-x-1/2 -translate-y-1/2",
              sizeMap[size],
            )}
          >
            {/*
              Halo backdrop — modal'dan her yöne eşit uzanan ekstra blur.
              `inset: -extend` → 4 kenarın tamamı eşit kapsanır.
              Modal-relative absolute → modal nereye giderse halo da gider.
              Mask yumuşak dış fade: sert kutu kenarı görünmez.
            */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: "calc(-1 * var(--lq-halo-extend, 80px))",
                pointerEvents: "none",
                borderRadius:
                  "calc(var(--radius-surface, 24px) + var(--lq-halo-extend, 80px))",
                backdropFilter:
                  "blur(var(--lq-halo-blur, 16px)) saturate(130%)",
                WebkitBackdropFilter:
                  "blur(var(--lq-halo-blur, 16px)) saturate(130%)",
                background: "transparent",
                // Mask: iç (100% - edge-fade) full, dış edge-fade alanı yumuşak fade.
                // edge-fade küçük → keskin kenar; büyük → yumuşak halka.
                maskImage:
                  "radial-gradient(ellipse at center, black 0%, black calc(100% - var(--lq-halo-edge-fade, 15%)), transparent 100%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse at center, black 0%, black calc(100% - var(--lq-halo-edge-fade, 15%)), transparent 100%)",
              }}
            />
            <div
              role="dialog"
              aria-modal="true"
              data-squircle=""
              data-lq-lens="strong"
              style={squircleStyle("surface")}
              className={cn(
                "lg-surface relative flex max-h-full w-full flex-col overflow-hidden",
                className,
              )}
            >
            <div className="flex flex-none items-start justify-between gap-3 border-b border-[color:var(--glass-border)] px-4 pb-2.5 pt-3">
              <div className="min-w-0">
                <h2 className="font-serif text-base font-medium leading-tight tracking-tight">
                  {title}
                </h2>
                {description && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                data-squircle=""
                style={squircleStyle("control")}
                className="lg-tile flex h-7 w-7 flex-none items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 lg-edge-y">{children}</div>
            {footer && (
              <div className="flex flex-none items-center justify-end gap-2 border-t border-[color:var(--glass-border)] px-4 py-2">
                {footer}
              </div>
            )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px] text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

export const inputClass =
  "w-full r-control border border-border/60 bg-background/40 px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-stone-700/50 dark:focus:border-stone-300/50";

export const buttonPrimary =
  "inline-flex items-center justify-center gap-1.5 r-control bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50";

export const buttonGhost =
  "inline-flex items-center justify-center gap-1.5 r-control border border-border/60 bg-background/40 px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-background/70";

export const buttonDanger =
  "inline-flex items-center justify-center gap-1.5 r-control border border-red-700/40 bg-red-600/10 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-600/20 dark:text-red-300";
