// Wave F27.B — shared command palette types.
//
// `PaletteItem` is intentionally minimal and **icon-library-agnostic**: the
// `Icon` field accepts any React component that takes `className` (e.g.
// `LucideIcon` from `@landx/icons`, or any svg-as-component). The base
// shell only renders `<item.Icon className="..." />` — it never inspects
// the icon's other props.
//
// Apps may extend `PaletteItem` with extra fields (e.g. `type: 'listing'`)
// in their own `lib/command-palette.ts` — TypeScript's structural typing
// will still treat the extended shape as assignable to the base.

import type { ComponentType } from 'react'

/**
 * Permissive icon prop shape. We DON'T pin to lucide's `LucideIcon` because
 * that's a `ForwardRefExoticComponent` with ref typing that varies per app
 * (apps depend on `@landx/icons` directly; the UI package shouldn't).
 */
export type PaletteIcon = ComponentType<{
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}>

export interface PaletteItem {
  id: string
  label: string
  hint?: string
  shortcut?: string
  Icon?: PaletteIcon
  to?: string
  action?: () => void
}

export interface FlatSection {
  label: string
  items: ReadonlyArray<PaletteItem>
}
