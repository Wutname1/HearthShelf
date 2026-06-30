// Fuzzy title+author matching for the Goodreads import review screen. ABS has
// no ISBN on most Kindle-only entries in a typical Goodreads export, so this
// can't rely on ISBN lookups - it scores token overlap on normalized
// title/author against the caller's library and lets the review UI decide
// what to do with anything short of a confident match.
//
// Library items passed in are ABS's minified shape: { id, media: { metadata:
// { title, authorName } } } (see packages/core/src/types/abs.ts).

const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'of', 'to'])

// Strip series/edition noise Goodreads titles carry but ABS rarely does, e.g.
// "Kiosk Kingdom (Discount Dan's Backroom Bargains #3)" -> "kiosk kingdom".
function normalizeTitle(title) {
  return String(title || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[:#].*$/, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t))
}

function normalizeAuthor(author) {
  return String(author || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function tokenOverlapScore(a, b) {
  if (!a.length || !b.length) return 0
  const setB = new Set(b)
  const hits = a.filter((t) => setB.has(t)).length
  return hits / Math.max(a.length, b.length)
}

// Auto-accept above this score; below AMBIGUOUS_FLOOR is treated as no match.
const AUTO_ACCEPT = 0.82
const AMBIGUOUS_FLOOR = 0.35
const MAX_CANDIDATES = 3

function scoreItem(row, item) {
  const meta = item?.media?.metadata
  if (!meta?.title) return 0
  const titleScore = tokenOverlapScore(normalizeTitle(row.title), normalizeTitle(meta.title))
  const authorScore = tokenOverlapScore(normalizeAuthor(row.author), normalizeAuthor(meta.authorName))
  // Title carries most of the signal; author breaks ties / disambiguates
  // common titles, but a title mismatch alone should never auto-accept.
  return titleScore * 0.75 + authorScore * 0.25
}

// row: { title, author, isbn? }. libraryItems: ABS minified items.
// Returns { status: 'auto' | 'ambiguous' | 'none', candidates: [{ libraryItemId, title, author, score }] }
export function matchAgainstLibrary(row, libraryItems) {
  const scored = libraryItems
    .map((item) => ({
      libraryItemId: item.id,
      title: item.media?.metadata?.title || '',
      author: item.media?.metadata?.authorName || '',
      score: scoreItem(row, item),
    }))
    .filter((c) => c.score >= AMBIGUOUS_FLOOR)
    .sort((a, b) => b.score - a.score)

  if (!scored.length) return { status: 'none', candidates: [] }
  if (scored[0].score >= AUTO_ACCEPT && (scored.length === 1 || scored[0].score - scored[1].score >= 0.1)) {
    return { status: 'auto', candidates: [scored[0]] }
  }
  return { status: 'ambiguous', candidates: scored.slice(0, MAX_CANDIDATES) }
}
