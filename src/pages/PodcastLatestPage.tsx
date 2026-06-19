import { useQuery } from '@tanstack/react-query'
import { getRecentEpisodes } from '@/api/libraries'
import { useActiveLibrary } from '@/hooks/useActiveLibrary'
import { useMediaProgress } from '@/hooks/useMediaProgress'
import { usePlayer } from '@/hooks/usePlayer'
import { useToast } from '@/hooks/useToast'
import { Icon } from '@/components/common/Icon'
import {
  EpisodeCard,
  type EpisodeCardData,
} from '@/components/podcast/EpisodeCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'

// A flat, reverse-chronological feed of recent episodes across every podcast in
// the active library.
export function PodcastLatestPage() {
  const { activeId } = useActiveLibrary()
  const { playEpisode } = usePlayer()
  const progressById = useMediaProgress()
  const { toast, show } = useToast()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['recent-episodes', activeId],
    queryFn: () => getRecentEpisodes(activeId as string, 50),
    enabled: activeId !== null,
    staleTime: 2 * 60 * 1000,
  })

  const episodes = data?.episodes ?? []

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="eyebrow">Podcasts</div>
        <h1 className="title-xl">Latest episodes</h1>
        {data && (
          <p className="page-sub">
            {episodes.length} recent{' '}
            {episodes.length === 1 ? 'episode' : 'episodes'} across your podcasts
          </p>
        )}
      </div>

      {isLoading && <LoadingSpinner className="py-12" label="Loading episodes..." />}
      {isError && (
        <ErrorState message="Could not load recent episodes." onRetry={refetch} />
      )}

      {data && episodes.length === 0 && (
        <div className="empty-state">
          <Icon name="podcasts" />
          <h3>No recent episodes</h3>
        </div>
      )}

      {episodes.length > 0 && (
        <div className="ep-list">
          {episodes.map((ep) => {
            const card: EpisodeCardData = {
              ...ep,
              podcastItemId: ep.libraryItemId,
              podTitle: ep.podcast?.title ?? 'Podcast',
              played: progressById.get(ep.id)?.progress ?? 0,
            }
            return (
              <EpisodeCard
                key={ep.id}
                ep={card}
                onPlay={(e) => void playEpisode(e.podcastItemId, e.id)}
                onToast={show}
              />
            )
          })}
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
