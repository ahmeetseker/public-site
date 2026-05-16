import { useMemo, useState } from 'react'
import { HELP_ARTICLES, type HelpArticle } from '@/lib/help-index'

// HelpSearch — minimal client-side substring filter over the static help
// index. No external libs (no fuse.js, no lunr). Build target ~1.5KB
// minified. Mounted as `client:load` from /yardim hub.
//
// Algorithm: lowercase, trim, fold Turkish diacritics, then check whether
// every whitespace-separated token appears as a substring in either the
// title or any keyword. Empty input shows no results.

function normalize(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c] || c)
}

interface Indexed {
  article: HelpArticle
  haystack: string
}

const INDEX: Indexed[] = HELP_ARTICLES.map((a) => ({
  article: a,
  haystack: normalize([a.title, a.summary, ...a.keywords].join(' ')),
}))

export default function HelpSearch() {
  const [q, setQ] = useState('')
  const results = useMemo(() => {
    const trimmed = normalize(q.trim())
    if (!trimmed) return []
    const tokens = trimmed.split(/\s+/).filter(Boolean)
    return INDEX.filter((entry) => tokens.every((t) => entry.haystack.includes(t))).map((e) => e.article)
  }, [q])

  return (
    <div className="w-full">
      <label className="block">
        <span className="sr-only">Yardım merkezinde ara</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ör. ilan yayınla, KVKK, ofis..."
          className="w-full rounded-full border border-border bg-card px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          aria-label="Yardım makalelerinde ara"
          autoComplete="off"
        />
      </label>
      {q.trim() && (
        <div className="mt-3 rounded-2xl border border-border bg-card">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              Sonuç bulunamadı. <a href="/iletisim" className="underline underline-offset-2">İletişime geç</a>.
            </div>
          ) : (
            <ul className="divide-y divide-border" data-testid="help-search-results">
              {results.map((a) => (
                <li key={a.slug}>
                  <a
                    href={a.path}
                    className="block px-4 py-3 transition hover:bg-accent"
                    data-testid="help-search-result"
                  >
                    <div className="text-sm font-medium text-foreground">{a.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{a.summary}</div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
