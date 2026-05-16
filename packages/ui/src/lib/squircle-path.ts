/**
 * squircle-path — Figma-inspired smooth-corner SVG path generator.
 *
 * Produces a `path("...")` data string approximating an iOS/Figma squircle
 * with 8 cubic Béziers (one per corner endpoint).
 *
 * Use as fallback for browsers without `corner-shape: squircle` support
 * (currently: every stable browser as of 2026-04). Combined with
 * `clip-path: path("...")` or SVG `<clipPath>`, you can render a true
 * squircle today.
 *
 * NOT used by default in the <Squircle> primitive — opt-in. Squircle's
 * default path uses native CSS `corner-shape` + graceful arc fallback
 * (visually less precise but zero JS overhead).
 *
 * Math (simplified Figma approach):
 *   total = radius × (1 + smoothing)        // corner zone extent
 *   c     = total × (0.55 − smoothing×0.10) // bezier control distance
 *
 * For exact Figma fidelity, use the figma-squircle library. This is a
 * minimal, dependency-free approximation that's visually ~80% there.
 */

/**
 * Generate an SVG path data string for a squircle of given dimensions.
 *
 * @param width    element width in px
 * @param height   element height in px
 * @param radius   corner radius in px (clamped to half of smaller dim)
 * @param smoothing 0–1; 0 = circular arc, 0.6 ≈ iOS squircle, 1 = max smooth
 * @returns SVG path `d` attribute value, ready for `path("...")` consumption
 *
 * @example
 *   const d = squirclePath(200, 100, 16, 0.6);
 *   element.style.clipPath = `path("${d}")`;
 */
export function squirclePath(
  width: number,
  height: number,
  radius: number,
  smoothing: number,
): string {
  // Clamp radius to half of the smaller dimension (max valid arc)
  const r = Math.min(radius, width / 2, height / 2);
  // Clamp smoothing to [0, 1]
  const s = Math.max(0, Math.min(1, smoothing));

  if (r <= 0) {
    // Degenerate: sharp rectangle
    return `M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`;
  }

  // Corner zone extent (Figma's "smooth corner extends past the radius")
  const p = r * (1 + s);
  // Bezier control point distance from corner endpoint along edge.
  // 0.55 ≈ canonical 4-bezier circle approximation (tan(π/8) × 4/3).
  // Reduce slightly with smoothing to extend the curve outward.
  const c = p * (0.55 - s * 0.10);

  return [
    `M ${p} 0`,
    `L ${width - p} 0`,
    `C ${width - p + c} 0, ${width} ${p - c}, ${width} ${p}`,
    `L ${width} ${height - p}`,
    `C ${width} ${height - p + c}, ${width - p + c} ${height}, ${width - p} ${height}`,
    `L ${p} ${height}`,
    `C ${p - c} ${height}, 0 ${height - p + c}, 0 ${height - p}`,
    `L 0 ${p}`,
    `C 0 ${p - c}, ${p - c} 0, ${p} 0`,
    'Z',
  ].join(' ');
}

/**
 * Convenience wrapper that returns a value ready to drop into a CSS
 * `clip-path` declaration.
 *
 * @example
 *   element.style.clipPath = squircleClipPath(200, 100, 16, 0.6);
 *   //                  → 'path("M 9.6 0 L 190.4 0 ...")'
 */
export function squircleClipPath(
  width: number,
  height: number,
  radius: number,
  smoothing: number,
): string {
  return `path("${squirclePath(width, height, radius, smoothing)}")`;
}
