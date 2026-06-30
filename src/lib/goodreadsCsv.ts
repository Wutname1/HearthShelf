/**
 * Client-side parsing for a Goodreads "export your library" CSV. Goodreads'
 * export has no API equivalent worth building against - it's a one-shot CSV
 * download from the user's account - so this is the only ingestion path.
 *
 * Only `read` rows matter for reading history; `to-read`/`currently-reading`
 * are parsed (so the caller can report how many were skipped) but filtered
 * out by isReadRow before matching/import.
 */
import Papa from 'papaparse'

export interface GoodreadsRow {
  title: string
  author: string
  isbn: string | null
  isbn13: string | null
  rating: number | null
  dateFinished: string | null
  exclusiveShelf: string
}

export function parseGoodreadsCsv(file: File): Promise<GoodreadsRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length && !result.data.length) {
          reject(new Error(result.errors[0]?.message || 'Could not parse CSV'))
          return
        }
        resolve(result.data.map(toRow))
      },
      error: (err) => reject(err),
    })
  })
}

function toRow(raw: Record<string, string>): GoodreadsRow {
  return {
    title: (raw['Title'] || '').trim(),
    author: (raw['Author'] || '').trim(),
    isbn: cleanIsbn(raw['ISBN']),
    isbn13: cleanIsbn(raw['ISBN13']),
    rating: parseRating(raw['My Rating']),
    dateFinished: parseDate(raw['Date Read']),
    exclusiveShelf: (raw['Exclusive Shelf'] || '').trim(),
  }
}

export function isReadRow(row: GoodreadsRow): boolean {
  return row.exclusiveShelf === 'read'
}

// Goodreads wraps ISBNs as an Excel text literal, e.g. ="9781234567890", and
// uses ="" for "no ISBN" - both need stripping down to a plain value or null.
export function cleanIsbn(raw: string | undefined): string | null {
  if (!raw) return null
  const m = raw.match(/^="?(.*?)"?$/)
  const value = (m ? m[1] : raw).trim()
  return value && value !== '0' ? value : null
}

// Goodreads uses 0 for "unrated".
export function parseRating(raw: string | undefined): number | null {
  const n = Number(raw)
  return raw && Number.isFinite(n) && n > 0 ? n : null
}

// Goodreads dates are YYYY/MM/DD; normalize to ISO YYYY-MM-DD. Blank stays
// null - a `read` row with no Date Read still counts as finished, just
// without a known date (surfaced for manual fill-in, never dropped).
export function parseDate(raw: string | undefined): string | null {
  const trimmed = (raw || '').trim()
  if (!trimmed) return null
  const m = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}
