import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../lib/cn";
import {
  useReducedMotion,
  REDUCED_MOTION_TRANSITION,
  STANDARD_SPRING,
} from "../lib/motion";
import {
  GlassDock,
  GlassDockVertical,
  type DockIcon,
} from "./liquid-glass";

/**
 * MorphDock — Apple Dynamic Island tarzı genişleyen dock.
 *
 * Tek component, iki orientation. Davranış orientation'dan BAĞIMSIZ:
 * her iki yönelimde de hem HOVER hem CLICK ile açılır/kapanır.
 *  - Pointer cihazlarda (desktop): hover ile açılır, çekilince kapanır.
 *    Click ile toggle (kalıcı sabitleme).
 *  - Touch cihazlarda (mobile): hover hiç tetiklenmez (tarayıcı no-op),
 *    tap ile toggle. Outside-tap + Escape ile kapanır.
 *
 * Tek bir interaction kontratı, cihaz capability'sine göre browser kendisi
 * filtreler. Tutarlı davranış.
 */

export interface MorphDockProps {
  icons: DockIcon[];
  orientation: "horizontal" | "vertical";
  className?: string;
}

export function MorphDock({
  icons,
  orientation,
  className,
}: MorphDockProps) {
  const reducedMotion = useReducedMotion();
  const layoutTransition = reducedMotion
    ? REDUCED_MOTION_TRANSITION
    : ({ ...STANDARD_SPRING, mass: 0.8 } as const);
  const contentTransition = reducedMotion
    ? ({
        opacity: REDUCED_MOTION_TRANSITION,
        scale: REDUCED_MOTION_TRANSITION,
        x: REDUCED_MOTION_TRANSITION,
        y: REDUCED_MOTION_TRANSITION,
      } as const)
    : ({
        opacity: { duration: 0.14, ease: "linear" },
        scale: { duration: 0.22, ease: [0.32, 0.72, 0, 1] as const },
        x: { duration: 0.22, ease: [0.32, 0.72, 0, 1] as const },
        y: { duration: 0.22, ease: [0.32, 0.72, 0, 1] as const },
      } as const);
  const [open, setOpen] = useState(false);
  const isHorizontal = orientation === "horizontal";
  const containerRef = useRef<HTMLDivElement>(null);

  // Outside-click + Escape — açıkken her durumda aktif (hover ile açılmış
  // olsa bile, kullanıcı dışarı tap yaparsa kapansın).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Position: bottom-center vs right-center, sticky.
  // bottom-anchored / right-anchored → height/width büyürken pill konumu kayar
  // (yukarı / sola doğru genişler). Apple Dynamic Island tarzı taşma.
  const positionClass = isHorizontal
    ? "fixed bottom-3 left-1/2 -translate-x-1/2"
    : "fixed right-2 top-1/2 -translate-y-1/2";

  // Radius: rounded-full (9999px) → CSS otomatik boyutun yarısına clamp eder.
  // Her durumda tam pill / stadium shape: closed'da peek pill yarım daire kenarlı,
  // open'da stadium shape (uzun kenar düz, kısa kenar yarım daire).
  const closedRadiusClass = isHorizontal
    ? open
      ? "rounded-full"
      : "rounded-t-full"
    : open
      ? "rounded-full"
      : "rounded-l-full";

  // Closed peek-pill boyutları (Tailwind sınıfı). Open'da kaldırılır → content-driven.
  const closedSizeClass = !open
    ? isHorizontal
      ? "w-[140px] h-[24px]"
      : "w-[24px] h-[140px]"
    : "";

  // Tutarlı interaction kontratı — hem hover hem click destekler.
  // Touch cihazlarda mouseenter/leave tetiklenmez (browser otomatik filter),
  // pointer cihazlarda hepsi çalışır. Click herkes için toggle.
  const triggerProps = {
    role: "button" as const,
    tabIndex: 0,
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: (e: React.FocusEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
    },
    onClick: () => setOpen((v) => !v),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    },
  };

  return (
    <motion.div
      ref={containerRef}
      // `layout` FLIP animation: width/height değişimleri spring ile
      // smooth interpolasyon. animate prop'una width/height vermiyoruz —
      // CSS class'ları size'ı kontrol eder, framer-motion morph'u yapar.
      layout
      aria-label={open ? "Modülleri kapat" : "Modülleri aç"}
      aria-expanded={open}
      {...triggerProps}
      className={cn(
        "z-30 cursor-pointer",
        // Browser default focus outline (mavi ring) kaldırılır.
        // tabIndex=0 + role=button → mouse click sonrası focus kalır,
        // istenmeyen mavi/beyaz border görünüyordu. Tamamen sessize alındı.
        "outline-none focus:outline-none focus-visible:outline-none",
        // Open: overflow-visible (GlassDock kendi cam efekti pill dışına taşar).
        // Closed: overflow-hidden (kapanma fazında hayalet kalıntı görünmesin).
        open ? "overflow-visible" : "overflow-hidden",
        positionClass,
        closedRadiusClass,
        closedSizeClass,
        !open && "bg-foreground/55",
        // bg transition tempo'su layout FLIP ile EŞİT (300ms ~ spring tail).
        "transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        className,
      )}
      transition={{
        layout: layoutTransition,
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {open && (
          <motion.div
            key="dock-content"
            // Initial: içerik pill içinden büyüyerek gelir (giriş scale OK)
            initial={{
              opacity: 0,
              scale: 0.85,
              ...(isHorizontal ? { y: 8 } : { x: 8 }),
            }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            // Exit: SADECE opacity fade. Hareket yok (scale/x/y stabil).
            // Layout morph ile container küçülürken içerik içeride kalır,
            // şekil bozulmaz, hayalet kalıntısı yok.
            exit={{ opacity: 0 }}
            transition={contentTransition}
          >
            {isHorizontal ? (
              <GlassDock icons={icons} />
            ) : (
              <GlassDockVertical
                icons={icons}
                onIconClick={() => setOpen(false)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
