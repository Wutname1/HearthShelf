import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPodcasts, libraryKeys } from '@/api/libraries'
import { useActiveLibrary } from '@/hooks/useActiveLibrary'
import { Cover, tintFor } from '@/components/common/Cover'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'

// The library view for a podcast-type library: a grid of shows. LibraryPage
// branches here when the active library's mediaType === "podcast".
export function PodcastsGrid({ libraryId }: { libraryId: string }) {
  const navigate = useNavigate()
  const { active } = useActiveLibrary(libraryId)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...libraryKeys.allItems(libraryId), 'podcasts'],
    queryFn: () => getPodcasts(libraryId),
    staleTime: 2 * 60 * 1000,
  })

  const podcasts = data?.results ?? []

  return (
    <div className="page fade-in" style={{ paddingTop: 24 }}>
      <div className="page-head">
        <div className="eyebrow">Your shows</div>
        <h1 className="title-xl">{active?.name ?? 'Podcasts'}</h1>
      </div>

      {isLoading && <LoadingSpinner className="py-12" label="Loading podcasts..." />}
      {isError && <ErrorState message="Could not load podcasts." onRetry={refetch} />}

      {data && (
        <>
          <div className="toolbar2">
            <span className="count-badge">
              {podcasts.length} {podcasts.length === 1 ? 'podcast' : 'podcasts'}
            </span>
          </div>
          {podcasts.length === 0 ? (
            <div className="empty-state">
              <Icon name="podcasts" />
              <h3>No podcasts yet</h3>
              <p>Add a show from the directory to get started.</p>
            </div>
          ) : (
            <div className="lib-grid">
              {podcasts.map((p) => {
                const title = p.media.metadata.title ?? 'Untitled'
                const count = p.media.numEpisodes ?? p.media.episodes?.length ?? 0
                return (
                  <div
                    className="book fade-in"
                    key={p.id}
                    data-cv={tintFor(title)}
                    onClick={() => navigate(`/podcast/${p.id}`, { state: { podcast: p } })}
                  >
                    <Cover itemId={p.id} title={title} kicker="Podcast" fs={15} />
                    <div className="b-meta">
                      <div className="b-title">{title}</div>
                      <div className="b-author">
                        {count} {count === 1 ? 'episode' : 'episodes'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
