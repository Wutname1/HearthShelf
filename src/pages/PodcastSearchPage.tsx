import { useState } from 'react'
import { useToast } from '@/hooks/useToast'
import { Icon } from '@/components/common/Icon'

// Admin: search a podcast directory and add a feed. The directory search / add /
// OPML endpoints are @needs-verify against ABS 2.35.1, so the actions toast
// rather than firing an unconfirmed call. The form + results layout are real.
export function PodcastSearchPage() {
  const [q, setQ] = useState('')
  const { toast, show } = useToast()

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
            show('Podcast directory search is coming soon')
          }}
        >
          <Icon name="search" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search podcasts by name…"
          />
        </form>
        <button
          className="btn-sm btn-accent"
          onClick={() => show('Podcast directory search is coming soon')}
        >
          Search
        </button>
        <button
          className="btn-sm btn-ghost"
          onClick={() => show('OPML import is coming soon')}
        >
          <Icon name="upload_file" /> OPML
        </button>
      </div>

      <div className="empty-state" style={{ maxWidth: 720 }}>
        <Icon name="travel_explore" />
        <h3>Search the directory</h3>
        <p>Find a show by name, then add its feed to your library.</p>
      </div>

      {toast && (
        <div className="p-toast">
          <Icon name="check_circle" fill /> {toast}
        </div>
      )}
    </div>
  )
}
