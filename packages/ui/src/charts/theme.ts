export const CHART_COLORS = {
  primary: 'hsl(28, 18%, 26%)',
  secondary: 'hsl(28, 8%, 48%)',
  emerald: '#059669',
  rose: '#e11d48',
  amber: '#d97706',
  sky: '#0284c7',
  violet: '#7c3aed',
} as const

export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.emerald,
  CHART_COLORS.amber,
  CHART_COLORS.rose,
  CHART_COLORS.sky,
  CHART_COLORS.violet,
] as const

export const CHART_GRID = {
  stroke: 'hsl(28, 14%, 22%)',
  strokeOpacity: 0.08,
  strokeDasharray: '3 3',
} as const

export const CHART_AXIS = {
  stroke: 'hsl(28, 8%, 48%)',
  fontSize: 11,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
} as const

export const CHART_TOOLTIP_STYLE = {
  background: 'hsl(36, 40%, 100%)',
  border: '1px solid hsl(32, 20%, 90%)',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(80, 60, 40, 0.10), 0 0 16px rgba(80, 60, 40, 0.05)',
  padding: '10px 12px',
  fontSize: 12,
  color: 'hsl(28, 14%, 22%)',
} as const
