// Shell primitives — page-shell + animated-grid. Pure React components, SSR-safe
// but typically rendered as React islands in Astro (`client:visible`).
export * from './page-shell'
export * from './animated-grid'
export { DynamicIslandHeader } from './dynamic-island-header'
export type {
  DynamicIslandHeaderProps,
  NavPage,
  SubNavItem,
  AiSuggestion,
  AiAnswer,
  AiChartData,
} from './dynamic-island-header.types'
