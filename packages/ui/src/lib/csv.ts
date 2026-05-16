/**
 * Wave F18.0 — Dependency-free CSV utilities for atolye-admin import/export.
 *
 * Parser handles RFC 4180 essentials:
 *   - Quoted fields with embedded commas / newlines
 *   - Escaped double-quote inside quoted field (`""`)
 *   - CRLF or LF row terminators
 *   - Configurable delimiter (default `,` — Turkish locale spreadsheets often use `;`)
 *
 * The serializer (`toCsv`) emits UTF-8 BOM so Excel opens the file with the
 * correct encoding by default — mirrors what super-admin chart-export uses.
 */

export type CsvDelimiter = ',' | ';' | '\t'

export interface CsvParseError {
  line: number
  message: string
}

export interface CsvParseResult {
  headers: string[]
  rows: string[][]
  errors: CsvParseError[]
}

export interface CsvParseOptions {
  delimiter?: CsvDelimiter
  /** When true the first non-empty line is consumed as headers. Default true. */
  hasHeader?: boolean
}

export function parseCsv(text: string, options: CsvParseOptions = {}): CsvParseResult {
  const delimiter = options.delimiter ?? autoDetectDelimiter(text)
  const hasHeader = options.hasHeader ?? true
  const errors: CsvParseError[] = []
  const rows: string[][] = []

  let field = ''
  let current: string[] = []
  let inQuotes = false
  let line = 1

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
        continue
      }
      if (ch === '"') {
        inQuotes = false
        continue
      }
      if (ch === '\n') line++
      field += ch
      continue
    }

    if (ch === '"') {
      if (field.length > 0) {
        errors.push({ line, message: `Tırnak bir alanın ortasında açıldı.` })
      }
      inQuotes = true
      continue
    }
    if (ch === delimiter) {
      current.push(field)
      field = ''
      continue
    }
    if (ch === '\r' && next === '\n') {
      current.push(field)
      field = ''
      pushRow(rows, current)
      current = []
      i++
      line++
      continue
    }
    if (ch === '\n') {
      current.push(field)
      field = ''
      pushRow(rows, current)
      current = []
      line++
      continue
    }
    field += ch
  }

  if (inQuotes) {
    errors.push({ line, message: `Dosya kapanmamış tırnak içinde bitti.` })
  }

  if (field.length > 0 || current.length > 0) {
    current.push(field)
    pushRow(rows, current)
  }

  let headers: string[] = []
  if (hasHeader && rows.length > 0) {
    headers = rows.shift()!
  }

  return { headers, rows, errors }
}

function pushRow(rows: string[][], row: string[]) {
  if (row.length === 1 && row[0] === '') return
  rows.push(row)
}

function autoDetectDelimiter(text: string): CsvDelimiter {
  const firstLine = text.slice(0, text.indexOf('\n') === -1 ? text.length : text.indexOf('\n'))
  const counts: Record<CsvDelimiter, number> = {
    ',': (firstLine.match(/,/g) ?? []).length,
    ';': (firstLine.match(/;/g) ?? []).length,
    '\t': (firstLine.match(/\t/g) ?? []).length,
  }
  let best: CsvDelimiter = ','
  let bestCount = counts[',']
  if (counts[';'] > bestCount) {
    best = ';'
    bestCount = counts[';']
  }
  if (counts['\t'] > bestCount) {
    best = '\t'
  }
  return best
}

export function escapeCsvCell(value: unknown): string {
  if (value == null) return ''
  const str = String(value)
  if (/[",\n\r;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function toCsv(headers: string[], rows: ReadonlyArray<ReadonlyArray<unknown>>): string {
  const head = headers.map(escapeCsvCell).join(',')
  const body = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
  return `${head}\n${body}\n`
}

export function downloadCsv(filename: string, content: string): void {
  const BOM = '﻿'
  const blob = new Blob([BOM, content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function todayStamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}
