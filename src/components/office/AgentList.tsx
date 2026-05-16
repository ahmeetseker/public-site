// Wave F9.C — Office agent roster.
// 3 deterministic agents per office, KVKK-safe tel:/mailto: links.
// Mounted from .astro pages as `client:load` so we have one fixed component
// per locale that derives labels at module load (no useEffect locale detect
// flicker — the parent passes locale via prop).
import { seedAgents, type AgentRole } from '@/lib/office-portfolio'

type Locale = 'tr' | 'en'

const LABELS: Record<Locale, {
  heading: string
  eyebrow: string
  callCta: string
  mailCta: string
  roles: Record<AgentRole, string>
}> = {
  tr: {
    heading: 'Satış uzmanlarımız',
    eyebrow: 'EKİP',
    callCta: 'Ara',
    mailCta: 'E-posta',
    roles: {
      satis: 'Satış uzmanı',
      kiralama: 'Kiralama uzmanı',
      koord: 'Koordinatör',
    },
  },
  en: {
    heading: 'Our agents',
    eyebrow: 'TEAM',
    callCta: 'Call',
    mailCta: 'Email',
    roles: {
      satis: 'Sales agent',
      kiralama: 'Rentals agent',
      koord: 'Coordinator',
    },
  },
}

export interface AgentListProps {
  officeId: string
  locale: Locale
}

export default function AgentList({ officeId, locale }: AgentListProps) {
  const agents = seedAgents(officeId)
  const L = LABELS[locale]
  return (
    <section
      aria-labelledby="ofis-agents-title"
      data-office-agents=""
      className="rounded-2xl border border-border bg-card p-5 md:p-6"
    >
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {L.eyebrow}
      </div>
      <h2
        id="ofis-agents-title"
        className="mt-1 font-serif text-2xl font-normal tracking-tight md:text-3xl"
      >
        {L.heading}
      </h2>

      <ul
        data-office-agents-list=""
        className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {agents.map((a) => (
          <li
            key={a.id}
            data-office-agent-card=""
            className="flex flex-col items-start gap-3 rounded-xl border border-border bg-background p-4"
          >
            <div className="flex items-center gap-3">
              <div
                aria-hidden
                className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5 font-mono text-sm font-medium tracking-wide text-foreground"
              >
                {a.avatarInitials}
              </div>
              <div className="min-w-0">
                <div className="truncate font-serif text-base font-medium">
                  {a.name}
                </div>
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {L.roles[a.role]}
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col gap-1.5 border-t border-border pt-3">
              <a
                href={`tel:${a.phone.replace(/\s+/g, '')}`}
                data-agent-phone=""
                className="inline-flex items-center gap-2 font-mono text-xs text-foreground transition hover:underline"
              >
                <span aria-hidden>📞</span>
                <span className="tabular-nums">{a.phone}</span>
              </a>
              <a
                href={`mailto:${a.email}`}
                data-agent-email=""
                className="inline-flex items-center gap-2 truncate font-mono text-xs text-foreground transition hover:underline"
              >
                <span aria-hidden>✉</span>
                <span className="truncate">{a.email}</span>
              </a>
            </div>
            <div className="mt-1 flex w-full gap-2">
              <a
                href={`tel:${a.phone.replace(/\s+/g, '')}`}
                className="flex-1 rounded-full bg-foreground px-3 py-1.5 text-center font-mono text-xs uppercase tracking-wide text-background transition hover:bg-foreground/85"
              >
                {L.callCta}
              </a>
              <a
                href={`mailto:${a.email}`}
                className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-center font-mono text-xs uppercase tracking-wide text-foreground transition hover:border-foreground/40"
              >
                {L.mailCta}
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
