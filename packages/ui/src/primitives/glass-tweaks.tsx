import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sliders, RotateCcw, X } from "@landx/icons";
import { useReducedMotion, REDUCED_MOTION_TRANSITION } from "../lib/motion";

/**
 * GlassTweaks — runtime ayar paneli.
 *
 * Liquid Glass parametrelerini canlı olarak değiştirir:
 *  - --lq-halo-blur:   modal arkasındaki ek bulanıklık (px)
 *  - --lq-halo-extend: halo'nun modal'a göre büyüme oranı (0..1)
 *
 * Değerler localStorage'a yazılır → sayfa yenilense de korunur.
 * Sağ-altta floating gear button, expand olunca panel açılır.
 *
 * Component panel kodunu DEĞİŞTİRMEZ — sadece document.documentElement'e
 * CSS variable yazar. Body içinde herhangi bir noktaya mount edilebilir.
 */

interface TweakState {
  haloBlur: number; // px (modal arkasındaki blur miktarı)
  haloExtend: number; // px (modal'dan her yöne uzanım miktarı)
  haloEdgeFade: number; // % (halo dış kenarındaki yumuşak fade alanı, 0-100)
}

const DEFAULTS: TweakState = {
  haloBlur: 16,
  haloExtend: 80,
  haloEdgeFade: 15,
};

// Storage version bump → eski formatlar yok sayılır.
const STORAGE_KEY = "lq-tweaks-v3";

function readStorage(): TweakState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<TweakState>;
    return {
      haloBlur:
        typeof parsed.haloBlur === "number" ? parsed.haloBlur : DEFAULTS.haloBlur,
      haloExtend:
        typeof parsed.haloExtend === "number"
          ? parsed.haloExtend
          : DEFAULTS.haloExtend,
      haloEdgeFade:
        typeof parsed.haloEdgeFade === "number"
          ? parsed.haloEdgeFade
          : DEFAULTS.haloEdgeFade,
    };
  } catch {
    return DEFAULTS;
  }
}

function applyToDOM(state: TweakState) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--lq-halo-blur", `${state.haloBlur}px`);
  root.style.setProperty("--lq-halo-extend", `${state.haloExtend}px`);
  root.style.setProperty("--lq-halo-edge-fade", `${state.haloEdgeFade}%`);
}

export function GlassTweaks() {
  const reducedMotion = useReducedMotion();
  const panelTransition = reducedMotion
    ? REDUCED_MOTION_TRANSITION
    : ({ duration: 0.18, ease: [0.32, 0.72, 0, 1] } as const);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<TweakState>(DEFAULTS);

  // İlk mount: storage'dan oku, DOM'a yaz
  useEffect(() => {
    const initial = readStorage();
    setState(initial);
    applyToDOM(initial);
  }, []);

  const update = (patch: Partial<TweakState>) => {
    const next = { ...state, ...patch };
    setState(next);
    applyToDOM(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota error vb. → sessizce yut */
    }
  };

  const reset = () => update(DEFAULTS);

  return (
    <>
      {/* Floating gear */}
      <button
        type="button"
        aria-label={open ? "Tweaks paneli kapat" : "Tweaks paneli aç"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-[80] flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--glass-border)] bg-[color:var(--glass-tint)] text-[color:var(--glass-text)] shadow-lg backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
      >
        <Sliders className="h-4 w-4" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="tweaks-panel"
            role="dialog"
            aria-label="Liquid Glass tweaks"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={panelTransition}
            // Anchor: gear'ın HEMEN üstüne otur (gear bottom-4 + h-10 = 56px) +
            // max-height ile viewport'a sığma garantisi + overflow-auto.
            // lg-surface kullanmıyoruz — Tweaks ayar paneli, kontrast yüksek olmalı.
            className="fixed right-4 z-[80] w-72 rounded-2xl p-4 overflow-y-auto border border-[color:var(--glass-border-strong)] shadow-2xl"
            style={{
              bottom: "calc(1rem + 2.5rem + 0.5rem)", // gear bottom + height + gap
              maxHeight: "calc(100dvh - 6rem)",
              background: "color-mix(in srgb, var(--background) 92%, transparent)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              color: "var(--foreground)",
            }}
          >
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium tracking-tight">
                Liquid Glass tweaks
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Sıfırla"
                  onClick={reset}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--glass-text)] opacity-70 hover:opacity-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Kapat"
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--glass-text)] opacity-70 hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className="space-y-4">
              <Slider
                label="Arkaplan bulanıklığı"
                hint="Modal arkasındaki halo blur (px)"
                value={state.haloBlur}
                min={0}
                max={60}
                step={1}
                unit="px"
                onChange={(haloBlur) => update({ haloBlur })}
              />
              <Slider
                label="Halo genişlemesi"
                hint="Modal'dan her yöne uzanım (px)"
                value={state.haloExtend}
                min={0}
                max={400}
                step={5}
                unit="px"
                onChange={(haloExtend) => update({ haloExtend })}
              />
              <Slider
                label="Kenar bulanıklığı"
                hint="Halo dış kenarındaki yumuşak fade alanı"
                value={state.haloEdgeFade}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(haloEdgeFade) => update({ haloEdgeFade })}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface SliderProps {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  unit = "",
  format,
  onChange,
}: SliderProps) {
  const display = format ? format(value) : `${value}${unit}`;
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-[color:var(--glass-text)]">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[color:var(--glass-text)]"
      />
      {hint && (
        <span className="mt-1 block text-[10px] text-muted-foreground">
          {hint}
        </span>
      )}
    </label>
  );
}
