import { useState } from 'react'
import { searchPodcastDirectory, type ABSPodcastSearchResult } from '@/api/libraries'
import { useActiveLibrary } from '@/hooks/useActiveLibrary'
import { useToast } from '@/hooks/useToast'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

// Admin: search the podcast directory and add a feed. Directory search is wired
// (GET /api/search/podcast); adding a feed requires a podcast-type library with
// a folder path (POST /api/podcasts) - shown with a note when none is active.
export function PodcastSearchPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<ABSPodcastSearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const { active } = useActiveLibrary()
  const { toast, show } = useToast()
  const isPodcastLib = active?.mediaType === 'podcast'

  const run = async () => {
    const term = q.trim()
    if (!term) return
    setSearching(true)
    try {
      setResults(await searchPodcastDirectory(term))
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="eyebrow">Podcasts · Admin</div>
        <h1 className="title-xl">Add a podcast</h1>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 28, maxWidth: 640 }}>
        <form
          className="ab-search"
          style={{ flex: 1, maxWidth: 'none' }}
          onSubmit={(e) => {
            e.preventDefault()
            void run()
          }}
        >
          <Icon name="search" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search podcasts by name…"
          />
        </form>
        <button className="btn-sm btn-accent" disabled={searching} onClick={() => void run()}>
          Search
        </button>
        <button className="btn-sm btn-ghost" onClick={() => show('OPML import is coming soon')}>
          <Icon name="upload_file" /> OPML
        </button>
      </div>

      {searching && <LoadingSpinner className="py-12" label="Searching directory..." />}

      {results && results.length === 0 && (
        <div className="empty-state">
          <Icon name="search_off" />
          <h3>No podcasts found</h3>
        </div>
      )}

      {results && results.length > 0 && (
        <div style={{ maxWidth: 720 }}>
          {results.map((p) => (
            <div className="pod-result" key={p.id}>
              {p.cover ? (
                <img className="pr-cover" src={p.cover} alt="" style={{ objectFit: 'cover' }} />
              ) : (
                <span className="pr-cover" />
              )}
              <div className="pr-meta">
                <div className="pr-title">
                  {p.title}
                  {p.pageUrl && (
                    <a
                      href={p.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginLeft: 6 }}
                    >
                      <Icon
                        name="open_in_new"
                        style={{ fontSize: 14, color: 'var(--text-faint)' }}
                      />
                    </a>
                  )}
                </div>
                <div className="pr-sub">
                  {[p.artistName, p.genres[0], `${p.trackCount} episodes`]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
              <button
                className="btn-sm btn-accent"
                style={{ flex: 'none' }}
                title={isPodcastLib ? 'Add this podcast' : 'Switch to a podcast library to add'}
                onClick={() =>
                  isPodcastLib
                    ? show('Adding feeds is coming soon')
                    : show('Switch to a podcast library to add feeds')
                }
              >
                <Icon name="add" /> Add
              </button>
            </div>
          ))}
        </div>
      )}

      {!results && !searching && (
        <div className="empty-state" style={{ maxWidth: 720 }}>
          <Icon name="travel_explore" />
          <h3>Search the directory</h3>
          <p>Find a show by name, then add its feed to your library.</p>
        </div>
      )}

      {toast && (
        <div className="p-toast">
          <Icon name="check_circle" fill /> {toast}
        </div>
      )}
    </div>
  )
}
