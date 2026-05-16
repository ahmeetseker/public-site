/**
 * Radius tokens — concentricity + squircle (G2) ready
 *
 * Apple HIG-inspired radius system.
 *
 * Anayasa (FAZ 1):
 * - PARALLEL to legacy --lg-r-* tokens. Does not refactor or replace them.
 * - Opt-in: components migrate one at a time (FAZ 4).
 * - CSS counterpart: `--radius-root`, `--radius-{shell,surface,container,
 *   control,chip}`, `--corner-smoothing` declared in src/index.css :root.
 *
 * Two equivalent ways to consume:
 *
 *   // CSS / Tailwind
 *   style={{ borderRadius: 'var(--radius-container)' }}
 *
 *   // TypeScript
 *   import { radius, radiusInner } from '../tokens/radius';
 *   const r = radius.container;          // 16
 *   const inner = radiusInner(r, 8);     // 8 (concentric child)
 */

/**
 * Master radius. All scale tiers derive from this single value.
 * Default 32px = approximate Apple device corner radius (iPhone display rounding).
 */
export const RADIUS_ROOT = 32 as const;

/**
 * Semantic radius scale, descending from RADIUS_ROOT.
 *
 * shell      = root × 1.00  (device-edge level — top floating shell, full sheets)
 * surface    = root × 0.75  (primary surface — modal, dialog, sheet)
 * container  = root × 0.50  (standard container — card, panel, list group)
 * control    = root × 0.25  (interactive control — button, input, small action)
 * chip       = full pill    (off-scale special — badge, avatar, dot, chip)
 *
 * Numeric values for use in JS/inline styles or radiusInner() math.
 * For consistency with CSS-driven sizing, prefer `radiusVar.*` (var(--radius-*)).
 */
export const radius = {
  shell:     RADIUS_ROOT,           //  32
  surface:   RADIUS_ROOT * 0.75,    //  24
  container: RADIUS_ROOT * 0.5,     //  16
  control:   RADIUS_ROOT * 0.25,    //   8
  chip:      9999,                  //  full pill (off-scale)
} as const;

/**
 * Corner smoothing for squircle (G2 continuity).
 *
 * - 0.0 → pure circular arc (CSS border-radius default)
 * - 0.6 → iOS-style superellipse approximation (recommended default)
 * - 1.0 → full squircle (mathematically smooth)
 *
 * Consumed by Squircle primitive (FAZ 2). Has no effect on plain
 * border-radius — CSS does not honor this for circular arcs.
 */
export const CORNER_SMOOTHING = 0.6 as const;

/**
 * radiusInner — concentricity helper.
 *
 * Given an outer surface's radius and the padding inside it, returns the
 * radius the direct child should use so its corner is geometrically
 * concentric with the outer corner.
 *
 *     ┌─────────────────────┐  outer = 16
 *     │  padding = 8        │
 *     │   ┌─────────────┐   │  inner = max(outer - padding, 0) = 8
 *     │   │   child     │   │
 *     │   └─────────────┘   │
 *     └─────────────────────┘
 *
 * If padding ≥ outer, child becomes a sharp corner (radius 0).
 * Use this whenever a rounded child sits inside a rounded parent — the
 * arc-of-arcs rule is what makes Apple-style layouts feel coherent.
 *
 * @param outer    parent surface radius (px)
 * @param padding  inset between parent edge and child edge (px)
 * @returns inner radius (px), clamped at 0
 *
 * @example
 *   const cardR = radius.container;       // 16
 *   const buttonR = radiusInner(cardR, 8); // 8 — concentric inside card
 */
export function radiusInner(outer: number, padding: number): number {
  return Math.max(outer - padding, 0);
}

/**
 * Token name → CSS custom property reference.
 * Use when you want CSS to resolve the value at render time (allows theme
 * overrides via :root variable updates).
 *
 * @example
 *   <div style={{ borderRadius: radiusVar.container }} />
 *   // → border-radius: var(--radius-container)
 */
export const radiusVar = {
  shell:     'var(--radius-shell)',
  surface:   'var(--radius-surface)',
  container: 'var(--radius-container)',
  control:   'var(--radius-control)',
  chip:      'var(--radius-chip)',
} as const;

/** Token keys (semantic names). */
export type RadiusToken = keyof typeof radius;
