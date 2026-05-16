/**
 * PersonaSwitcher meta — Wave F35 / Faz 1C.
 *
 * 5 demo persona × 3 fiziksel app (public-site, broker-admin, super-admin).
 * `appUrlEnvKey` runtime'da `import.meta.env`'den okunur, fallback olarak
 * `defaultUrl` (localhost). `pathSuffix` aynı app içinde farklı route'a
 * yönlendirmek için (örn. Satıcı → public-site `/hesabim`, Agent → super-admin
 * `/agent-memory`).
 *
 * Demo modda `VITE_DEMO_MODE === 'true'` olmadıkça component render etmez —
 * tree-shake için flag oluşturucu erken `null` döner.
 *
 * SSR-safe: Bu modül sadece tipler + statik veri export eder, side-effect yok.
 */

export type PersonaId = 'alici' | 'satici' | 'emlakci' | 'yonetici' | 'agent'

export interface Persona {
  id: PersonaId
  /** Türkçe etiket — dropdown ve trigger button'da gösterilir. */
  label: string
  /** Kısa açıklama — dropdown'daki ikinci satır. */
  description: string
  /** Tailwind class — neon dot rengi (örn. `bg-cyan-400`). */
  color: string
  /** `import.meta.env` key'i — apps build-time'da set eder. */
  appUrlEnvKey: string
  /** Env yoksa fallback (localhost dev port). */
  defaultUrl: string
  /** Hedef route suffix — aynı host, farklı path için. */
  pathSuffix?: string
}

export const PERSONAS: ReadonlyArray<Persona> = [
  {
    id: 'alici',
    label: 'Alıcı',
    description: 'Bireysel arsa alıcısı — public marketplace deneyimi',
    color: 'bg-cyan-400',
    appUrlEnvKey: 'VITE_APP_PUBLIC_URL',
    defaultUrl: 'http://localhost:5180',
  },
  {
    id: 'satici',
    label: 'Satıcı',
    description: 'Bireysel satıcı/yatırımcı — kişisel dashboard',
    color: 'bg-lime-400',
    appUrlEnvKey: 'VITE_APP_PUBLIC_URL',
    defaultUrl: 'http://localhost:5180',
    pathSuffix: '/hesabim',
  },
  {
    id: 'emlakci',
    label: 'Emlakçı',
    description: 'Emlakçı ofis yöneticisi — portföy + takım + komisyon',
    color: 'bg-amber-400',
    appUrlEnvKey: 'VITE_APP_BROKER_URL',
    defaultUrl: 'http://localhost:5174',
  },
  {
    id: 'yonetici',
    label: 'Yönetici',
    description: 'Platform yöneticisi — Auto Admin UI',
    color: 'bg-violet-400',
    appUrlEnvKey: 'VITE_APP_OPS_URL',
    defaultUrl: 'http://localhost:5181',
  },
  {
    id: 'agent',
    label: 'Agent Debugger',
    description: 'AI gözlemleme ve MCP tool debugger',
    color: 'bg-pink-400',
    appUrlEnvKey: 'VITE_APP_OPS_URL',
    defaultUrl: 'http://localhost:5181',
    pathSuffix: '/agent-memory',
  },
]

/** Persona id → Persona meta lookup. */
export function findPersona(id: PersonaId): Persona {
  const found = PERSONAS.find((p) => p.id === id)
  if (!found) {
    // PersonaId union zaten bunu engellemeli — defansif fallback.
    return PERSONAS[0]!
  }
  return found
}

/**
 * `import.meta.env`'den persona'ya ait base URL'i çözer, `pathSuffix` ekler.
 * SSR'de window yok ama `import.meta.env` Vite tarafında her ortamda var
 * (Astro public-site dahil). Env yoksa `defaultUrl`'e düşer.
 */
export function resolvePersonaUrl(persona: Persona): string {
  // `import.meta.env` her bundler'da farklı tip — runtime'da `Record<string, string>` gibi davranır.
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {}
  const fromEnv = env[persona.appUrlEnvKey]
  const base = (fromEnv && fromEnv.length > 0 ? fromEnv : persona.defaultUrl).replace(/\/$/, '')
  return base + (persona.pathSuffix ?? '')
}
