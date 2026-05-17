import type { ReactNode } from 'react'

export interface NavPage {
  key: string
  alt: string
  icon: ReactNode
}

export interface SubNavItem {
  key: string
  label: string
  icon: ReactNode
  target: string
  href?: string
}

export interface AiSuggestion {
  label: string
  icon: ReactNode
  href?: string
}

export interface AiChartData {
  title: string
  data: Array<{ label: string; value: number; suffix?: string }>
}

export interface AiAnswer {
  text: string
  chart?: AiChartData
}

export interface DynamicIslandHeaderProps {
  brandIcon: ReactNode
  brandLabel: string
  activeKey?: string
  statusChipLabel?: string
  /**
   * Optional rich content to render inside the "Şu an: …" status chip.
   * When provided, replaces the plain `activePageLabel` text node — useful
   * for breadcrumb chains with clickable segments on detail pages.
   * `statusChipLabel` is still used for the aria-label string.
   */
  statusChipContent?: ReactNode
  navPages: NavPage[]
  subNav: Record<string, SubNavItem[]>
  aiSearch?: {
    placeholder: string
    suggestions: AiSuggestion[]
    answerFn: (q: string) => AiAnswer | Promise<AiAnswer>
    stageLabels?: readonly string[]
  }
  notifications?: {
    unreadCount: number
    panel: ReactNode | ((args: { close: () => void }) => ReactNode)
  }
  extras?: ReactNode
  onNavigate?: (key: string) => void
  onNavigateHref?: (href: string) => void
  onOpenAssistant?: () => void
}
