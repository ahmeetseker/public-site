"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../lib/cn";

interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
  target?: string;
  /** false ise iç cam dekorasyon katmanları (backdrop blur, tint, highlight) render edilmez. */
  decorations?: boolean;
  /**
   * Apple iOS 26 lens refraction varyantı.
   * - "off" (default): mevcut davranış (sadece backdrop-blur)
   * - "soft" / "default" / "strong" / "edge": gerçek SVG displacement + chromatic aberration
   *
   * Chromium tam destekler; Safari/Firefox kısmi/yok — her durumda blur fallback'e düşer.
   */
  lens?: "off" | "soft" | "default" | "strong" | "edge";
}

const LENS_FILTER_MAP: Record<NonNullable<GlassEffectProps["lens"]>, string> = {
  off: "",
  soft: "url(#lq-lens-soft)",
  default: "url(#lq-lens)",
  strong: "url(#lq-lens-strong)",
  edge: "url(#lq-lens-edge)",
};

export interface DockIcon {
  src?: string;
  alt: string;
  icon?: React.ReactNode;
  label?: string;
  onClick?: () => void;
  active?: boolean;
}

const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = "",
  style = {},
  href,
  target = "_blank",
  decorations = true,
  lens = "off",
}) => {
  // Cursor-tracking specular: mouse pozisyonunu CSS variable olarak güncelle.
  // Lens aktifken Apple'ın "moving glint" efektini verir.
  const rootRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (lens === "off" || !rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      rootRef.current.style.setProperty("--lq-light-x", `${x}%`);
      rootRef.current.style.setProperty("--lq-light-y", `${y}%`);
    },
    [lens],
  );

  const glassStyle: React.CSSProperties = {
    boxShadow: "var(--glass-shadow)",
    color: "var(--glass-text)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  // Lens varsa backdrop'a SVG filter + blur uygula. Yoksa eski davranış.
  const lensFilter = LENS_FILTER_MAP[lens];
  const backdropFilterValue =
    lensFilter !== ""
      ? `${lensFilter} blur(6px) saturate(180%)`
      : "blur(14px) saturate(180%)";

  const content = (
    <div
      ref={rootRef}
      className={`relative flex font-semibold cursor-pointer transition-all duration-700 ${className}`}
      style={glassStyle}
      data-lq-lens={lens !== "off" ? lens : undefined}
      onMouseMove={lens !== "off" ? handleMouseMove : undefined}
    >
      {decorations && (
        <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
          {/* Backdrop refraction layer — Chromium'da gerçek liquid glass.
              Safari/Firefox'ta SVG filter ignore edilir, blur fallback'e düşer. */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backdropFilter: backdropFilterValue,
              WebkitBackdropFilter: backdropFilterValue,
              isolation: "isolate",
            }}
          />
          <div
            className="absolute inset-0 z-10"
            style={{ background: "var(--glass-tint)" }}
          />
          {/* Cursor-tracking specular — sadece lens aktifken. */}
          {lens !== "off" && (
            <div
              className="absolute inset-0 z-15 rounded-[inherit]"
              style={{
                background:
                  "radial-gradient(circle 80px at var(--lq-light-x, 30%) var(--lq-light-y, 0%), rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 30%, transparent 60%)",
                mixBlendMode: "plus-lighter",
                opacity: 0.9,
                transition: "background 60ms linear",
              }}
            />
          )}
          {/* Symmetric edge highlights — top + bottom uniform */}
          <div
            className="absolute inset-0 z-20"
            style={{
              boxShadow: [
                "inset 0 1px 0 var(--glass-edge-top, var(--glass-highlight))",
                "inset 0 -1px 0 var(--glass-edge-top, var(--glass-highlight))",
                "inset 0 0 0 0.5px var(--glass-border, rgba(255,255,255,0.1))",
              ].join(", "),
            }}
          />
        </div>
      )}

      <div className="relative z-30 flex-1 min-w-0">{children}</div>
    </div>
  );

  return href ? (
    <a href={href} target={target} rel="noopener noreferrer" className="block">
      {content}
    </a>
  ) : (
    content
  );
};

// ─────────────────────────────────────────────────────────────────
// LiquidDock — Apple Dock tarzı magnification + active lens + tooltip.
// Tek component, horizontal/vertical orientation. İki yönelim de
// AYNI davranışa sahiptir: cursor takibi → magnification, hover tooltip,
// active item üzerinde edge-lens refraction.
// ─────────────────────────────────────────────────────────────────

const DOCK_BASE_ICON_SIZE = 38;
const DOCK_BASE_SPACING = 6;
const DOCK_MIN_SCALE = 1.0;
const DOCK_MAX_SCALE = 1.5;
const DOCK_EFFECT_LENGTH = 180; // magnification etki alanı (axis-agnostic)

const calcInitialDockPositions = (count: number): number[] => {
  let p = 0;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const c = p + DOCK_BASE_ICON_SIZE / 2;
    p += DOCK_BASE_ICON_SIZE + DOCK_BASE_SPACING;
    out.push(c);
  }
  return out;
};

export type DockOrientation = "horizontal" | "vertical";

export interface LiquidDockProps {
  icons: DockIcon[];
  orientation?: DockOrientation;
  href?: string;
  decorations?: boolean;
  /** Item tıklandığında ek olarak çağrılır (örn. parent menüyü kapatma). */
  onIconClick?: () => void;
}

export const LiquidDock: React.FC<LiquidDockProps> = ({
  icons,
  orientation = "horizontal",
  href,
  decorations = true,
  onIconClick,
}) => {
  const isH = orientation === "horizontal";
  const dockRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastMouseMoveTime = useRef<number>(0);

  // mousePos = pointer'ın along-axis pozisyonu (yatay'da X, dikey'de Y).
  const [mousePos, setMousePos] = useState<number | null>(null);
  const [scales, setScales] = useState<number[]>(() =>
    icons.map(() => DOCK_MIN_SCALE),
  );
  const [positions, setPositions] = useState<number[]>(() =>
    calcInitialDockPositions(icons.length),
  );

  const calcTargetScales = useCallback(
    (mp: number | null): number[] => {
      const count = icons.length;
      if (mp === null)
        return Array.from({ length: count }, () => DOCK_MIN_SCALE);
      return Array.from({ length: count }, (_, index) => {
        const center =
          index * (DOCK_BASE_ICON_SIZE + DOCK_BASE_SPACING) +
          DOCK_BASE_ICON_SIZE / 2;
        const minP = mp - DOCK_EFFECT_LENGTH / 2;
        const maxP = mp + DOCK_EFFECT_LENGTH / 2;
        if (center < minP || center > maxP) return DOCK_MIN_SCALE;
        const theta = ((center - minP) / DOCK_EFFECT_LENGTH) * 2 * Math.PI;
        const capped = Math.min(Math.max(theta, 0), 2 * Math.PI);
        const f = (1 - Math.cos(capped)) / 2;
        return DOCK_MIN_SCALE + f * (DOCK_MAX_SCALE - DOCK_MIN_SCALE);
      });
    },
    [icons.length],
  );

  const calcTargetPositions = useCallback((targetScales: number[]) => {
    let p = 0;
    return targetScales.map((s) => {
      const sz = DOCK_BASE_ICON_SIZE * s;
      const c = p + sz / 2;
      p += sz + DOCK_BASE_SPACING;
      return c;
    });
  }, []);

  const animate = useCallback(() => {
    const targetScales = calcTargetScales(mousePos);
    const targetPositions = calcTargetPositions(targetScales);
    const lerp = mousePos !== null ? 0.2 : 0.12;

    setScales((prev) =>
      prev.length === targetScales.length
        ? prev.map((s, i) => s + (targetScales[i] - s) * lerp)
        : targetScales,
    );
    setPositions((prev) =>
      prev.length === targetPositions.length
        ? prev.map((p, i) => p + (targetPositions[i] - p) * lerp)
        : targetPositions,
    );

    const scalesNeed = scales.some(
      (s, i) => Math.abs(s - (targetScales[i] ?? DOCK_MIN_SCALE)) > 0.002,
    );
    const positionsNeed = positions.some(
      (p, i) => Math.abs(p - (targetPositions[i] ?? 0)) > 0.1,
    );

    if (scalesNeed || positionsNeed || mousePos !== null) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [mousePos, calcTargetScales, calcTargetPositions, scales, positions]);

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const now = performance.now();
      if (now - lastMouseMoveTime.current < 16) return;
      lastMouseMoveTime.current = now;
      if (dockRef.current) {
        const rect = dockRef.current.getBoundingClientRect();
        const along = isH ? e.clientX - rect.left : e.clientY - rect.top;
        setMousePos(along);
      }
    },
    [isH],
  );

  const handleMouseLeave = useCallback(() => setMousePos(null), []);

  const contentLength =
    positions.length > 0
      ? Math.max(
          ...positions.map(
            (p, i) =>
              p + (DOCK_BASE_ICON_SIZE * (scales[i] ?? DOCK_MIN_SCALE)) / 2,
          ),
        )
      : icons.length * (DOCK_BASE_ICON_SIZE + DOCK_BASE_SPACING) -
        DOCK_BASE_SPACING;

  const trackThickness = DOCK_BASE_ICON_SIZE;

  const activeIdx = useMemo(
    () => icons.findIndex((i) => i.active),
    [icons],
  );

  const pointerHoveredIdx = useMemo(() => {
    if (mousePos === null || positions.length === 0) return null;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < positions.length; i++) {
      const d = Math.abs(positions[i] - mousePos);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }, [mousePos, positions]);

  const targetIdx = pointerHoveredIdx ?? activeIdx;
  const indicatorScale = scales[targetIdx] ?? DOCK_MIN_SCALE;
  const indicatorPosition = positions[targetIdx] ?? 0;

  return (
    <GlassEffect
      href={href}
      className={cn("r-chip", isH ? "px-2 py-1.5" : "px-1.5 py-2")}
      style={{ overflow: "visible" }}
      decorations={decorations}
    >
      <div
        ref={dockRef}
        className="relative"
        style={{
          width: isH ? `${contentLength}px` : `${trackThickness}px`,
          height: isH ? `${trackThickness}px` : `${contentLength}px`,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {targetIdx >= 0 && (
          <div
            aria-hidden="true"
            data-lq-lens="edge"
            className="absolute pointer-events-none r-chip overflow-hidden"
            style={{
              ...(isH
                ? {
                    left: `${indicatorPosition - DOCK_BASE_ICON_SIZE / 2}px`,
                    bottom: 0,
                  }
                : {
                    top: `${indicatorPosition - DOCK_BASE_ICON_SIZE / 2}px`,
                    // Dikey dock SAĞ kenarda → item de SAĞA yapışık.
                    // Magnification sola doğru taşar (içeri, ekrana doğru).
                    right: 0,
                  }),
              width: `${DOCK_BASE_ICON_SIZE}px`,
              height: `${DOCK_BASE_ICON_SIZE}px`,
              transform: `scale(${indicatorScale})`,
              // Dikey: sağ kenar pivot → sola büyüme.
              transformOrigin: isH ? "50% 100%" : "100% 50%",
              zIndex: 0,
              backdropFilter: "url(#lq-lens-edge) blur(6px) saturate(180%)",
              WebkitBackdropFilter:
                "url(#lq-lens-edge) blur(6px) saturate(180%)",
              background: "var(--glass-tint-strong)",
              boxShadow: [
                "inset 0 1px 0 var(--glass-highlight)",
                "inset 0 -1px 0 var(--glass-edge-bottom)",
                "inset 0 0 0 0.5px var(--glass-border-strong)",
                "0 4px 12px -2px rgba(0, 0, 0, 0.18)",
              ].join(", "),
            }}
          />
        )}
        {icons.map((icon, index) => {
          const scale = scales[index] ?? DOCK_MIN_SCALE;
          const position = positions[index] ?? 0;

          const tile = icon.icon ? (
            <div
              role={icon.onClick ? "button" : undefined}
              aria-label={icon.alt}
              className="w-full h-full flex items-center justify-center r-chip"
            >
              {icon.icon}
            </div>
          ) : (
            <img
              src={icon.src}
              alt={icon.alt}
              className="w-full h-full object-contain"
              draggable={false}
            />
          );

          const labelText = icon.label ?? icon.alt;
          const isHovered = pointerHoveredIdx === index;

          return (
            <div
              key={icon.alt ?? icon.label}
              onClick={() => {
                icon.onClick?.();
                onIconClick?.();
              }}
              className="absolute cursor-pointer"
              style={{
                ...(isH
                  ? {
                      left: `${position - DOCK_BASE_ICON_SIZE / 2}px`,
                      bottom: 0,
                    }
                  : {
                      top: `${position - DOCK_BASE_ICON_SIZE / 2}px`,
                      right: 0,
                    }),
                width: `${DOCK_BASE_ICON_SIZE}px`,
                height: `${DOCK_BASE_ICON_SIZE}px`,
                transform: `scale(${scale})`,
                transformOrigin: isH ? "50% 100%" : "100% 50%",
                zIndex: Math.round(scale * 10),
              }}
            >
              {isHovered && (
                <span
                  role="tooltip"
                  className={cn(
                    "pointer-events-none absolute whitespace-nowrap r-chip border border-border/60 bg-background/90 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-foreground shadow-md backdrop-blur-md",
                    isH
                      ? "left-1/2 bottom-full mb-2 -translate-x-1/2"
                      // Dikey dock sağ kenarda → tooltip SOL'a açılır.
                      : "top-1/2 right-full mr-2 -translate-y-1/2",
                  )}
                >
                  {labelText}
                </span>
              )}
              {tile}
            </div>
          );
        })}
      </div>
    </GlassEffect>
  );
};

// ─────────────────────────────────────────────────────────────────
// Geriye uyum wrapper'ları — eski GlassDock / GlassDockVertical
// API'sini koruyor, alttan tek LiquidDock'a yönlendiriyor.
// Tüm consumer'lar (MorphDock, vb.) hiç değişmeden çalışmaya devam eder.
// ─────────────────────────────────────────────────────────────────

export const GlassDock: React.FC<{
  icons: DockIcon[];
  href?: string;
  decorations?: boolean;
}> = ({ icons, href, decorations = true }) => (
  <LiquidDock
    icons={icons}
    href={href}
    decorations={decorations}
    orientation="horizontal"
  />
);

export const GlassDockVertical: React.FC<{
  icons: DockIcon[];
  onIconClick?: () => void;
}> = ({ icons, onIconClick }) => (
  <LiquidDock
    icons={icons}
    orientation="vertical"
    onIconClick={onIconClick}
  />
);


/**
 * GlassFilter — Apple iOS 26 Liquid Glass shader paketi.
 *
 * KRİTİK: Lens efekti `feTurbulence` (rastgele dalga) İLE YAPILMAZ.
 * Apple gerçek bir **radial barrel distortion** uyguluyor:
 *  - Merkez: sıfır displacement (görüntü net)
 *  - Kenar: maksimum outward displacement (içerik dışa doğru itelenir → büyütme)
 *
 * Bu komponentte displacement map, `feImage` ile inline SVG'den yüklenir:
 *  - R kanalı: 0 (sol) → 255 (sağ) lineer gradient → X displacement
 *  - G kanalı: 0 (üst) → 255 (alt) lineer gradient → Y displacement
 *  - Radial mask: merkez %0 alpha (gri kalır = 0 disp), kenar %100 alpha (full gradient)
 *
 * RGB için 3 ayrı `feDisplacementMap` (farklı scale: R<G<B → chromatic aberration).
 *
 * Filter ID'leri:
 *  - lq-lens-soft   (subtle, scale=20)
 *  - lq-lens        (default, scale=40)
 *  - lq-lens-strong (modal, scale=70)
 *  - lq-lens-edge   (Inbox/Aramalar tarzı, scale=90 + sadece kenar)
 *
 * Geriye uyum: eski #glass-distortion id'si korunmuştur.
 */

// Radial barrel lens map — merkez gri (no disp), kenar R/G gradient (full disp)
const LENS_MAP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="X" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#F00"/></linearGradient><linearGradient id="Y" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#0F0"/></linearGradient><radialGradient id="M" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity="0"/><stop offset="35%" stop-color="#fff" stop-opacity="0"/><stop offset="100%" stop-color="#fff" stop-opacity="1"/></radialGradient><mask id="K"><rect width="100" height="100" fill="url(#M)"/></mask></defs><rect width="100" height="100" fill="rgb(128,128,128)"/><g mask="url(#K)"><rect width="100" height="100" fill="url(#X)" style="mix-blend-mode:screen"/><rect width="100" height="100" fill="url(#Y)" style="mix-blend-mode:screen"/></g></svg>`;

// Edge-only variant — daha küçük merkez "net" alanı, daha geniş edge band
const LENS_MAP_EDGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="X" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#F00"/></linearGradient><linearGradient id="Y" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#0F0"/></linearGradient><radialGradient id="M" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity="0"/><stop offset="55%" stop-color="#fff" stop-opacity="0"/><stop offset="80%" stop-color="#fff" stop-opacity="0.85"/><stop offset="100%" stop-color="#fff" stop-opacity="1"/></radialGradient><mask id="K"><rect width="100" height="100" fill="url(#M)"/></mask></defs><rect width="100" height="100" fill="rgb(128,128,128)"/><g mask="url(#K)"><rect width="100" height="100" fill="url(#X)" style="mix-blend-mode:screen"/><rect width="100" height="100" fill="url(#Y)" style="mix-blend-mode:screen"/></g></svg>`;

const lensMapHref = `data:image/svg+xml;utf8,${encodeURIComponent(LENS_MAP_SVG)}`;
const lensMapEdgeHref = `data:image/svg+xml;utf8,${encodeURIComponent(LENS_MAP_EDGE_SVG)}`;

/**
 * Global cursor-tracking specular — `data-lq-lens` taşıyan TÜM elementlerde
 * ışık pozisyonunu CSS variable olarak set eder. Tek mount yeterli.
 * GlassEffect içinde zaten lokal handler var; bu, JSX'te `data-lq-lens` ile
 * doğrudan işaretlenmiş elementler (GlassEffect dışındakiler) içindir.
 */
const useGlobalLensTracking = (): void => {
  useEffect(() => {
    if (typeof document === "undefined") return;
    let raf = 0;
    let lastX = 0;
    let lastY = 0;
    const onMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const els = document.querySelectorAll<HTMLElement>(
          "[data-lq-lens]:not([data-lq-lens='off'])",
        );
        els.forEach((el) => {
          const rect = el.getBoundingClientRect();
          // Sadece pointer'ın yakınındaki elementler (perf)
          if (
            lastX < rect.left - 200 ||
            lastX > rect.right + 200 ||
            lastY < rect.top - 200 ||
            lastY > rect.bottom + 200
          ) {
            return;
          }
          const x = ((lastX - rect.left) / rect.width) * 100;
          const y = ((lastY - rect.top) / rect.height) * 100;
          el.style.setProperty("--lq-light-x", `${x}%`);
          el.style.setProperty("--lq-light-y", `${y}%`);
        });
      });
    };
    document.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      document.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
};

export const GlassFilter: React.FC = () => {
  useGlobalLensTracking();
  return (
  <svg
    aria-hidden="true"
    style={{
      position: "absolute",
      width: 0,
      height: 0,
      overflow: "hidden",
      pointerEvents: "none",
    }}
  >
    <defs>
      {/*
        ─────────────────────────────────────────────────────
        ÇEKİRDEK YAKLAŞIM — Apple iOS 26 Liquid Glass:
        feImage ile inline SVG yüklenir → barrel-distortion lens map.
        feDisplacementMap RGB için 3 ayrı scale → chromatic aberration.
        Specular layer (üst-sol point light) → moving glint.
        ─────────────────────────────────────────────────────
      */}

      {/* ───── lq-lens-soft: subtle (Card, Panel) ───── */}
      <filter
        id="lq-lens-soft"
        x="-15%"
        y="-15%"
        width="130%"
        height="130%"
        filterUnits="objectBoundingBox"
        primitiveUnits="objectBoundingBox"
      >
        <feImage
          href={lensMapHref}
          result="lensMap"
          x="0"
          y="0"
          width="1"
          height="1"
          preserveAspectRatio="none"
        />
        {/* RGB kanalları için ayrı scale — chromatic aberration */}
        <feDisplacementMap
          in="SourceGraphic"
          in2="lensMap"
          scale="0.10"
          xChannelSelector="R"
          yChannelSelector="G"
          result="dispR"
        />
        <feColorMatrix
          in="dispR"
          type="matrix"
          values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="redOnly"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="lensMap"
          scale="0.12"
          xChannelSelector="R"
          yChannelSelector="G"
          result="dispG"
        />
        <feColorMatrix
          in="dispG"
          type="matrix"
          values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="greenOnly"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="lensMap"
          scale="0.14"
          xChannelSelector="R"
          yChannelSelector="G"
          result="dispB"
        />
        <feColorMatrix
          in="dispB"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
          result="blueOnly"
        />
        <feBlend in="redOnly" in2="greenOnly" mode="screen" result="rg" />
        <feBlend in="rg" in2="blueOnly" mode="screen" />
      </filter>

      {/* ───── lq-lens: default (Button, Dock) ───── */}
      <filter
        id="lq-lens"
        x="-20%"
        y="-20%"
        width="140%"
        height="140%"
        filterUnits="objectBoundingBox"
        primitiveUnits="objectBoundingBox"
      >
        <feImage
          href={lensMapHref}
          result="lensMap"
          x="0"
          y="0"
          width="1"
          height="1"
          preserveAspectRatio="none"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="lensMap"
          scale="0.18"
          xChannelSelector="R"
          yChannelSelector="G"
          result="dispR"
        />
        <feColorMatrix
          in="dispR"
          type="matrix"
          values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="redOnly"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="lensMap"
          scale="0.22"
          xChannelSelector="R"
          yChannelSelector="G"
          result="dispG"
        />
        <feColorMatrix
          in="dispG"
          type="matrix"
          values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="greenOnly"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="lensMap"
          scale="0.26"
          xChannelSelector="R"
          yChannelSelector="G"
          result="dispB"
        />
        <feColorMatrix
          in="dispB"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
          result="blueOnly"
        />
        <feBlend in="redOnly" in2="greenOnly" mode="screen" result="rg" />
        <feBlend in="rg" in2="blueOnly" mode="screen" />
      </filter>

      {/* ───── lq-lens-strong: modal/dialog ───── */}
      <filter
        id="lq-lens-strong"
        x="-25%"
        y="-25%"
        width="150%"
        height="150%"
        filterUnits="objectBoundingBox"
        primitiveUnits="objectBoundingBox"
      >
        <feImage
          href={lensMapHref}
          result="lensMap"
          x="0"
          y="0"
          width="1"
          height="1"
          preserveAspectRatio="none"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="lensMap"
          scale="0.30"
          xChannelSelector="R"
          yChannelSelector="G"
          result="dispR"
        />
        <feColorMatrix
          in="dispR"
          type="matrix"
          values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="redOnly"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="lensMap"
          scale="0.36"
          xChannelSelector="R"
          yChannelSelector="G"
          result="dispG"
        />
        <feColorMatrix
          in="dispG"
          type="matrix"
          values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="greenOnly"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="lensMap"
          scale="0.42"
          xChannelSelector="R"
          yChannelSelector="G"
          result="dispB"
        />
        <feColorMatrix
          in="dispB"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
          result="blueOnly"
        />
        <feBlend in="redOnly" in2="greenOnly" mode="screen" result="rg" />
        <feBlend in="rg" in2="blueOnly" mode="screen" result="rgb" />

        {/* Specular highlight — diyagonal nokta ışık */}
        <feGaussianBlur in="lensMap" stdDeviation="0.01" result="lensSoft" />
        <feSpecularLighting
          in="lensSoft"
          surfaceScale="0.8"
          specularConstant="1.4"
          specularExponent="60"
          lightingColor="white"
          result="spec"
        >
          <fePointLight x="0.2" y="0.0" z="0.3" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="specMasked" />
        <feBlend in="rgb" in2="specMasked" mode="screen" />
      </filter>

      {/* ───── lq-lens-edge: Apple iOS 26 lens (Inbox/Aramalar) ─────
          Daha agresif RGB split, merkez net, sadece kenarda yoğun bükülme. */}
      <filter
        id="lq-lens-edge"
        x="-30%"
        y="-30%"
        width="160%"
        height="160%"
        filterUnits="objectBoundingBox"
        primitiveUnits="objectBoundingBox"
      >
        <feImage
          href={lensMapEdgeHref}
          result="lensMap"
          x="0"
          y="0"
          width="1"
          height="1"
          preserveAspectRatio="none"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="lensMap"
          scale="0.40"
          xChannelSelector="R"
          yChannelSelector="G"
          result="dispR"
        />
        <feColorMatrix
          in="dispR"
          type="matrix"
          values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="redOnly"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="lensMap"
          scale="0.48"
          xChannelSelector="R"
          yChannelSelector="G"
          result="dispG"
        />
        <feColorMatrix
          in="dispG"
          type="matrix"
          values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="greenOnly"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="lensMap"
          scale="0.56"
          xChannelSelector="R"
          yChannelSelector="G"
          result="dispB"
        />
        <feColorMatrix
          in="dispB"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
          result="blueOnly"
        />
        <feBlend in="redOnly" in2="greenOnly" mode="screen" result="rg" />
        <feBlend in="rg" in2="blueOnly" mode="screen" result="rgb" />

        {/* Specular */}
        <feGaussianBlur in="lensMap" stdDeviation="0.01" result="lensSoft" />
        <feSpecularLighting
          in="lensSoft"
          surfaceScale="1"
          specularConstant="1.6"
          specularExponent="50"
          lightingColor="white"
          result="spec"
        >
          <fePointLight x="0.25" y="0" z="0.35" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="specMasked" />
        <feBlend in="rgb" in2="specMasked" mode="screen" />
      </filter>

      {/* ───── Geriye uyumluluk: eski id ───── */}
      <filter
        id="glass-distortion"
        x="-20%"
        y="-20%"
        width="140%"
        height="140%"
        filterUnits="objectBoundingBox"
        primitiveUnits="objectBoundingBox"
      >
        <feImage
          href={lensMapHref}
          result="lensMap"
          x="0"
          y="0"
          width="1"
          height="1"
          preserveAspectRatio="none"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="lensMap"
          scale="0.22"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  </svg>
  );
};
