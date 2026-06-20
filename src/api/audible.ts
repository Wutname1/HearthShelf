// HearthShelf's own Audible catalog search. Talks to /hs/audible/search, which
// queries Audible's public catalog directly - works regardless of whether RMAB
// is connected (RMAB is only the request/download executor). Discovery is ours.

import { useAuthStore } from '@/store/authStore'

export interface AudibleResult {
  asin: string
  title: string
  author: string
  authorAsin?: string
  narrator?: string
  description?: string
  coverArtUrl?: string
  durationMinutes?: number
  releaseDate?: string
  rating?: number
  series?: string
  seriesAsin?: string
}

export interface AudibleSearchResponse {
  query: string
  results: AudibleResult[]
  totalResults: number
  page: number
  hasMore: boolean
}

export const audibleKeys = {
  search: (q: string, page = 1) => ['audible', 'search', q, page] as const,
}

export async function searchAudible(query: string, page = 1): Promise<AudibleSearchResponse> {
  const token = useAuthStore.getState().token
  const res = await fetch(
    `/hs/audible/search?q=${encodeURIComponent(query)}&page=${page}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  )
  if (!res.ok) throw new Error(`Audible ${res.status}`)
  return res.json() as Promise<AudibleSearchResponse>
}

// A plain Audible store link for a result, used by the "Buy on Audible" action
// when the request backend isn't the path (e.g. Audplexus-only setups).
export function audibleStoreUrl(r: { title: string; author: string }): string {
  return 'https://www.audible.com/search?keywords=' + encodeURIComponent(`${r.title} ${r.author}`)
}
