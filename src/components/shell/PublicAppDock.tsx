import {
  Home,
  Search,
  Building2,
  MapPin,
  GitCompareArrows,
  Heart,
  BookOpen,
  Plus,
  User,
  MessageSquare,
} from '@landx/icons'
import { MorphDock } from '@landx/ui/primitives'
import type { DockIcon } from '@landx/ui/primitives'
import { t, type Locale } from '@/i18n'
import { withBase } from '@/lib/with-base'

interface Props {
  locale: Locale
  pathname?: string
}

export default function PublicAppDock({ locale }: Props) {
  const prefix = locale === 'en' ? '/en' : ''
  const go = (href: string) => () => {
    window.location.href = withBase(`${prefix}${href}`)
  }

  const icons: DockIcon[] = [
    { alt: t('dock.home', locale),     label: 'Home',     icon: <Home className="size-5" />,             onClick: go('/') },
    { alt: t('dock.search', locale),   label: 'Search',   icon: <Search className="size-5" />,           onClick: go('/ara') },
    { alt: t('dock.offices', locale),  label: 'Offices',  icon: <Building2 className="size-5" />,        onClick: go('/ofisler') },
    { alt: t('dock.regions', locale),  label: 'Regions',  icon: <MapPin className="size-5" />,           onClick: go('/bolge') },
    { alt: t('dock.compare', locale),  label: 'Compare',  icon: <GitCompareArrows className="size-5" />, onClick: go('/karsilastir') },
    { alt: t('dock.favs', locale),     label: 'Favs',     icon: <Heart className="size-5" />,            onClick: go('/hesabim/favoriler') },
    { alt: t('dock.blog', locale),     label: 'Blog',     icon: <BookOpen className="size-5" />,         onClick: go('/blog') },
    { alt: t('dock.listProp', locale), label: 'List',     icon: <Plus className="size-5" />,             onClick: go('/ilan-ver') },
    { alt: t('dock.account', locale),  label: 'Account',  icon: <User className="size-5" />,             onClick: go('/hesabim') },
    { alt: t('dock.messages', locale), label: 'Messages', icon: <MessageSquare className="size-5" />,    onClick: go('/hesabim/mesajlar') },
  ]

  return <MorphDock icons={icons} orientation="horizontal" />
}
