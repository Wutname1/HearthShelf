// HearthShelf's own Audible catalog search. Mounted at /hs/audible/search.
// HearthShelf owns discovery; this works regardless of whether RMAB is
// connected (RMAB is only the request/download executor). Calls Audible's
// public catalog API directly - no auth, no third-party dependency.
//
// Verified against the Audible catalog API shape: GET {apiBase}/1.0/catalog/
// products?keywords=&num_results=&page=&response_groups=... returns
// { products: [...], total_results }. We map each product to the same result
// shape the request UI already consumes (mirrors RMAB's search result).
//
// Env: AUDIBLE_REGION (us|ca|uk|au|in|de|es|fr, default us).

import { json } from '../lib/http.js'

const PAGE_SIZE = 25
const RESPONSE_GROUPS =
  'contributors,product_desc,product_attrs,product_extended_attrs,media,rating,series,category_ladders,product_details'

// Region -> Audible catalog API host. Mirrors the public marketplaces.
const REGION_API = {
  us: 'https://api.audible.com',
  ca: 'https://api.audible.ca',
  uk: 'https://api.audible.co.uk',
  au: 'https://api.audible.com.au',
  in: 'https://api.audible.in',
  de: 'https://api.audible.de',
  es: 'https://api.audible.es',
  fr: 'https://api.audible.fr',
}

function apiBase() {
  const region = (process.env.AUDIBLE_REGION || 'us').toLowerCase()
  return REGION_API[region] || REGION_API.us
}

// Map a raw Audible catalog product to our search-result shape.
function mapProduct(product) {
  const author = (product.authors ?? []).map((a) => a.name).join(', ')
  const authorAsin = product.authors?.[0]?.asin ?? undefined
  const narrator =
    product.narrators && product.narrators.length > 0
      ? product.narrators.map((n) => n.name).join(', ')
      : undefined
  const description = product.publisher_summary ?? product.merchandising_summary ?? undefined
  const coverArtUrl = product.product_images?.['500'] ?? undefined

  let series
  let seriesAsin
  if (Array.isArray(product.series) && product.series.length > 0) {
    const preferred =
      product.series.find((s) => s.sequence && String(s.sequence).trim() !== '') ?? product.series[0]
    series = preferred.title ?? undefined
    seriesAsin = preferred.asin ?? undefined
  }

  return {
    asin: product.asin,
    title: product.title ?? '',
    author,
    authorAsin,
    narrator,
    description,
    coverArtUrl,
    durationMinutes: product.runtime_length_min ?? undefined,
    releaseDate: product.release_date ?? undefined,
    rating: product.rating?.overall_distribution?.display_stars ?? undefined,
    series,
    seriesAsin,
  }
}

// Short in-memory TTL cache, keyed by region+query+page, to cut repeat Audible
// calls and smooth rate limits. Bounded so it can't grow unbounded.
const TTL_MS = 10 * 60 * 1000
const MAX_ENTRIES = 200
const cache = new Map() // key -> { at, value }

function cacheGet(key) {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(key)
    return null
  }
  return hit.value
}

function cacheSet(key, value) {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, { at: Date.now(), value })
}

async function searchAudible(query, page) {
  const base = apiBase()
  const params = new URLSearchParams({
    keywords: query,
    num_results: String(PAGE_SIZE),
    page: String(Math.max(0, page - 1)),
    response_groups: RESPONSE_GROUPS,
  })
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 15000)
  try {
    const res = await fetch(`${base}/1.0/catalog/products?${params.toString()}`, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return { results: [], totalResults: 0, page, hasMore: false }
    const data = await res.json()
    const products = data?.products ?? []
    const totalResults = data?.total_results ?? 0
    const results = products.map(mapProduct)
    return {
      results,
      totalResults,
      page,
      hasMore:
        results.length > 0 &&
        (totalResults > 0 ? totalResults > page * PAGE_SIZE : results.length >= PAGE_SIZE),
    }
  } catch {
    return { results: [], totalResults: 0, page, hasMore: false }
  } finally {
    clearTimeout(t)
  }
}

export async function handleAudible(req, res, url, ctx) {
  if (url.pathname !== '/hs/audible/search') return false
  if (req.method !== 'GET') return (json(res, 405, { error: 'method_not_allowed' }), true)
  if (!ctx) return (json(res, 401, { error: 'unauthorized' }), true)

  const q = (url.searchParams.get('q') ?? url.searchParams.get('query') ?? '').trim()
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
  if (q.length < 2) return (json(res, 200, { query: q, results: [], totalResults: 0, page, hasMore: false }), true)

  const region = (process.env.AUDIBLE_REGION || 'us').toLowerCase()
  const key = `${region}|${q.toLowerCase()}|${page}`
  const cached = cacheGet(key)
  if (cached) return (json(res, 200, { query: q, ...cached }), true)

  const result = await searchAudible(q, page)
  cacheSet(key, result)
  return (json(res, 200, { query: q, ...result }), true)
}
