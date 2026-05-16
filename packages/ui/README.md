# @landx/ui

LandX paylaşılan UI kütüphanesi. 3 frontend (atolye-admin, super-admin, public-site) tarafından tüketilir.

## Subpath exports (kullan!)

```ts
import { TypeChip, StatusChip } from '@landx/ui/atoms'
import { ListingsMap } from '@landx/ui/maps'
import { Skeleton, ErrorState, EmptyState } from '@landx/ui/feedback'
import { CashflowChart } from '@landx/ui/charts'
import { LiquidGlass, MorphDock, Squircle } from '@landx/ui/primitives'
import { PageShell, AnimatedGrid } from '@landx/ui/shell'
import { cn, formatTL, formatTLCompact } from '@landx/ui/lib'
```

**Why subpath?** `@landx/ui` main barrel transitively imports react-leaflet which evaluates `window` at module load — breaks Astro SSR. Subpath imports skip the heavy modules.

Main barrel `@landx/ui` exists for backward compat (admin/super-admin still use it).

## Styles

```ts
// In your app's main CSS:
@import "@landx/ui/styles/theme.css"        // Liquid Glass tokens + base
@import "@landx/ui/styles/leaflet.css"       // Only if using ListingsMap
```

## Design tokens

All color/size/radius via HSL CSS vars. See `src/styles/theme.css`. Key:
- `--background`, `--foreground`, `--card`, `--muted-foreground`, `--placeholder`
- `--glass-tint`, `--glass-shadow`, etc.
- `--radius-shell`, `--radius-surface`, `--radius-container`, `--radius-control`, `--radius-chip`

## Dependencies

- React 19 + react-dom (peer)
- framer-motion 12 (peer)
- Tailwind v4 (peer)
- @landx/icons (peer for components that render icons)
- recharts 3 (charts only)
- leaflet 1 + react-leaflet 5 (maps only)

## Storybook (dev tool — not deployed)

Storybook 8 + Vite + React 19. Browse components in isolation, verify a11y,
and (Wave 12) snapshot via Chromatic. The static build is **not** bundled
into any app — it's a development aid only.

```bash
pnpm --filter @landx/ui storybook         # dev server on http://localhost:6006
pnpm --filter @landx/ui storybook:build   # static export → packages/ui/storybook-static/
```

Stories live as siblings of their components (`packages/ui/src/<subpath>/*.stories.tsx`).
The Tailwind v4 token sheet (`src/styles/theme.css`) is loaded globally via
`.storybook/preview.ts` so all utility classes resolve.

Note: the `maps/listings-map` story dynamic-imports the component because
Leaflet evaluates `window` at module load (same SSR concern as Astro).
