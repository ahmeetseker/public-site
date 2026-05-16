import * as React from 'react';
import { type RadiusToken } from '../tokens/radius';

/**
 * Squircle — opt-in primitive for Apple-style smooth corners (G2 continuity).
 *
 * Render preference (per FAZ 2 spec):
 *   1. Native CSS `corner-shape: squircle <smoothing>` — applied via inline
 *      style; honored automatically by browsers that ship CSS Shapes Level 2,
 *      ignored elsewhere (graceful degrade to standard arc).
 *   2. SVG mask fallback (clip-path with superellipse) — opt-in via `precise`
 *      prop. Generates path from `../lib/squircle-path`; relies on
 *      ResizeObserver to track element size.
 *
 * API surface is minimal per spec: radius, smoothing, as, className, style,
 * children, precise. Intended to be polymorphic via `as`.
 *
 * Primitive is OPT-IN. Never auto-injected. Migration is per-component
 * (FAZ 4).
 */

import { squircleClipPath } from '../lib/squircle-path';

const TOKEN_KEYS = ['shell', 'surface', 'container', 'control', 'chip'] as const;

function isRadiusToken(value: unknown): value is RadiusToken {
  return (
    typeof value === 'string' &&
    (TOKEN_KEYS as ReadonlyArray<string>).includes(value)
  );
}

/**
 * Resolve a radius prop into a CSS length value.
 *   - number  → '<n>px'
 *   - token   → 'var(--radius-<token>)'
 *   - string  → passed through (any valid CSS length, e.g. '12px', '50%')
 *   - undef   → 'var(--radius-container)' (sensible default)
 */
function resolveRadiusCss(value: SquircleProps['radius']): string {
  if (value === undefined) return 'var(--radius-container)';
  if (typeof value === 'number') return `${value}px`;
  if (isRadiusToken(value)) return `var(--radius-${value})`;
  return value;
}

/**
 * Resolve numeric radius for SVG path math (precise mode).
 * Tokens are resolved via known scale; CSS strings (% / calc) bail to undef.
 */
function resolveRadiusPx(value: SquircleProps['radius']): number | undefined {
  if (value === undefined) return 16;
  if (typeof value === 'number') return value;
  if (isRadiusToken(value)) {
    // Mirror src/tokens/radius.ts scale (kept small to avoid coupling)
    const map: Record<RadiusToken, number> = {
      shell: 32,
      surface: 24,
      container: 16,
      control: 8,
      chip: 9999,
    };
    return map[value];
  }
  // Fixed px string?
  const match = /^(-?\d*\.?\d+)px$/.exec(value);
  return match ? parseFloat(match[1]) : undefined;
}

export interface SquircleProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /**
   * Radius. Accepts:
   * - number (px): `16`
   * - token name: `'container'` (resolves to `var(--radius-container)`)
   * - any CSS length: `'1rem'`, `'20px'`, `'var(--my-radius)'`
   *
   * Default: `'container'` (resolves to `var(--radius-container)` ≈ 16px).
   */
  radius?: number | string | RadiusToken;
  /**
   * Corner smoothing factor, 0–1.
   * - 0   → standard circular arc
   * - 0.6 → iOS-style squircle (recommended default)
   * - 1   → maximum smoothness
   *
   * Default: `var(--corner-smoothing)` (≈ 0.6).
   */
  smoothing?: number;
  /**
   * Element type (polymorphic). Default `'div'`.
   */
  as?: React.ElementType;
  /**
   * If `true`, generates an SVG-mask `clip-path` to render an actual
   * squircle on browsers that don't yet support `corner-shape: squircle`.
   * Costs a ResizeObserver subscription. Default `false`.
   */
  precise?: boolean;
  children?: React.ReactNode;
}

export const Squircle = React.forwardRef<HTMLElement, SquircleProps>(
  function Squircle(
    {
      radius,
      smoothing,
      as: Tag = 'div',
      precise = false,
      className,
      style,
      children,
      ...rest
    },
    forwardedRef,
  ) {
    const radiusCss = resolveRadiusCss(radius);
    const smoothingCss =
      smoothing === undefined ? 'var(--corner-smoothing)' : String(smoothing);

    // CSS Shapes Level 2 is not yet in TypeScript's CSSProperties.
    // Cast through `unknown` to set the property safely.
    const cssWithCornerShape = {
      borderRadius: radiusCss,
      ...style,
      cornerShape: `squircle ${smoothingCss}`,
      WebkitCornerShape: `squircle ${smoothingCss}`,
    } as React.CSSProperties;

    // Precise mode: SVG-path-based clip-path, sized via ResizeObserver.
    const localRef = React.useRef<HTMLElement | null>(null);
    const setRef = React.useCallback(
      (node: HTMLElement | null) => {
        localRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    const [clipPath, setClipPath] = React.useState<string | undefined>(undefined);
    const radiusPx = resolveRadiusPx(radius);
    const smoothingPx = smoothing === undefined ? 0.6 : smoothing;

    React.useEffect(() => {
      if (!precise) {
        setClipPath(undefined);
        return;
      }
      const el = localRef.current;
      if (!el || radiusPx === undefined) return;

      const apply = () => {
        const { width, height } = el.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setClipPath(squircleClipPath(width, height, radiusPx, smoothingPx));
        }
      };
      apply();
      const ro = new ResizeObserver(apply);
      ro.observe(el);
      return () => ro.disconnect();
    }, [precise, radiusPx, smoothingPx]);

    const finalStyle: React.CSSProperties = clipPath
      ? { ...cssWithCornerShape, clipPath, WebkitClipPath: clipPath }
      : cssWithCornerShape;

    return (
      <Tag
        ref={setRef}
        data-squircle=""
        className={className}
        style={finalStyle}
        {...rest}
      >
        {children}
      </Tag>
    );
  },
);

Squircle.displayName = 'Squircle';
