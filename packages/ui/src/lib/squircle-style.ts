import type { CSSProperties } from 'react';
import type { RadiusToken } from '../tokens/radius';

/**
 * squircleStyle — shared inline-style emitter for token-driven radius +
 * forward-compat squircle declaration.
 *
 * Mirrors the production CSS the <Squircle> component emits, for use in
 * contexts where the React primitive can't compose cleanly:
 *   - framer-motion `motion.div` / `motion.button`
 *   - polymorphic elements with strict TS prop typing (button `type`)
 *   - one-off spots inside larger inline render trees
 *
 * Pair with `data-squircle=""` attribute on the same element if you want
 * uniform CSS hooks alongside the React primitive.
 *
 * @param token — radius token name ('shell' | 'surface' | 'container' | 'control' | 'chip')
 * @param smoothing — 0–1 override, defaults to var(--corner-smoothing) ≈ 0.6
 *
 * @example
 *   <motion.div data-squircle="" style={squircleStyle('container')} />
 *   //         border-radius: var(--radius-container);
 *   //         corner-shape: squircle var(--corner-smoothing);
 */
export function squircleStyle(
  token: RadiusToken,
  smoothing?: number,
): CSSProperties {
  const s = smoothing === undefined ? 'var(--corner-smoothing)' : String(smoothing);
  return {
    borderRadius: `var(--radius-${token})`,
    cornerShape: `squircle ${s}`,
    WebkitCornerShape: `squircle ${s}`,
  } as CSSProperties;
}
