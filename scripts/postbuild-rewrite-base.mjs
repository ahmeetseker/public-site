#!/usr/bin/env node
// Rewrites root-relative URLs in built HTML to include BASE_PATH.
// Why: Astro prefixes its own asset paths with `base`, but user-authored
// `<a href="/foo">` / `<form action="/foo">` are left untouched. On GitHub
// Pages at /public-site/ that breaks every internal navigation. This pass
// patches the built dist/ in place so source code can stay base-agnostic.
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const DIST = process.env.DIST_DIR || 'dist'
const RAW_BASE = process.env.BASE_PATH || '/'
const BASE = RAW_BASE.replace(/\/+$/, '') // '' or '/public-site'

if (!BASE) {
  console.log('[postbuild-rewrite-base] base is "/", nothing to do')
  process.exit(0)
}

const ATTR_RE = /\b(href|src|action|formaction)=(["'])(\/[^"'\s][^"']*)\2/g

function shouldRewrite(path) {
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false // protocol-relative
  if (path === BASE || path.startsWith(BASE + '/')) return false
  return true
}

async function* walkHtml(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) yield* walkHtml(p)
    else if (entry.isFile() && /\.(html|xml)$/i.test(entry.name)) yield p
  }
}

let touched = 0
let total = 0
for await (const file of walkHtml(DIST)) {
  total++
  const html = await readFile(file, 'utf8')
  const next = html.replace(ATTR_RE, (m, attr, q, path) =>
    shouldRewrite(path) ? `${attr}=${q}${BASE}${path}${q}` : m
  )
  if (next !== html) {
    await writeFile(file, next)
    touched++
  }
}

console.log(
  `[postbuild-rewrite-base] base=${BASE} files=${total} rewritten=${touched}`
)
