// Wave F4.A.3 — comparison diff helper.
// Given a normalized row collection (label key + the per-listing values for
// that row), returns the set of row keys where at least one value differs
// from the first. Used by both <CompareTable> (desktop) and
// <MobileCompareStack> (≤md) to highlight diff-rows with stronger contrast.
//
// Strict equality (`===`) is the comparison primitive: it makes
// `null === null` true and `'konut' === null` false, which matches user
// expectation for the table — null/undefined are "no data" and two listings
// both missing the field are NOT a diff.

export interface CompareRow {
  key: string
  values: Array<unknown>
}

export function findDiffs(rows: CompareRow[]): Set<string> {
  const diffs = new Set<string>()
  for (const row of rows) {
    if (row.values.length <= 1) continue
    const first = row.values[0]
    for (let i = 1; i < row.values.length; i++) {
      if (row.values[i] !== first) {
        diffs.add(row.key)
        break
      }
    }
  }
  return diffs
}
