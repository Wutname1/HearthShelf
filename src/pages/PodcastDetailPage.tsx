import { useParams, useLocation, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPodcast } from '@/api/libraries'
import { useMediaProgress } from '@/hooks/useMediaProgress'
import { usePlayer } from '@/hooks/usePlayer'
import { useToast } from '@/hooks/useToast'
import { stripHtml } from '@/lib/format'
import type { ABSPodcastItem } from '@/api/types'
import { Cover, tintFor } from '@/components/common/Cover'
import { Icon } from '@/components/common/Icon'
import { EpisodeCard, type EpisodeCardData } from '@/components/podcast/EpisodeCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'

function PodcastDetail({ podcast }: { podcast: ABSPodcastItem }) {
  const { playEpisode } = usePlayer()
  const progressById = useMediaProgress()
  const { toast, show } = useToast()

  const m = podcast.media.metadata
  const title = m.title ?? 'Untitled'
  const cv = tintFor(title)
  const episodes = podcast.media.episodes ?? []
  const category = m.genres?.[0] ?? 'Podcast'

  const play = (ep: EpisodeCardData) => void playEpisode(podcast.id, ep.id)
  const toCard = (ep: (typeof episodes)[number]): EpisodeCardData => ({
    ...ep,
    podcastItemId: podcast.id,
    podTitle: title,
    played: progressById.get(ep.id)?.progress ?? 0,
  })

  return (
    <div className="page fade-in" style={{ ['--glow-accent' as string]: cv }}>
      <div className="crumb">
        <Link className="lnk" to="/library">
          Podcasts
        </Link>
        <Icon name="chevron_right" />
        {title}
      </div>

      <div className="detail-top">
        <div className="detail-cover" data-cv={cv}>
          <Cover itemId={podcast.id} title={title} kicker="Podcast" fs={18} />
        </div>
        <div className="detail-main">
          <h1>{title}</h1>
          <div className="d-sub" style={{ marginTop: 8 }}>
            By {m.author ?? 'Unknown'} · {category}
          </div>
          {m.description && (
            <p className="detail-desc" style={{ marginTop: 16 }}>
              {stripHtml(m.description)}
            </p>
          )}
          <div className="detail-actions">
            {episodes[0] && (
              <button
                className="btn btn-primary"
                onClick={() => void playEpisode(podcast.id, episodes[0].id)}
              >
                <Icon name="play_arrow" fill /> Play latest
              </button>
            )}
            <button className="pill" onClick={() => show('Auto-download is coming soon')}>
              <Icon name="notifications_active" /> Auto-download
            </button>
            {m.feedUrl && (
              <a className="pill" href={m.feedUrl} target="_blank" rel="noopener noreferrer">
                <Icon name="rss_feed" /> RSS feed
              </a>
            )}
            <button className="pill" onClick={() => show('Editing is coming soon')}>
              <Icon name="edit" /> Edit
            </button>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <div className="section-head">
          <Icon name="podcasts" />
          <h2>Episodes · {episodes.length}</h2>
        </div>
        <div className="ep-list" style={{ maxWidth: 'none' }}>
          {episodes.map((ep) => (
            <EpisodeCard key={ep.id} ep={toCard(ep)} onPlay={play} onToast={show} />
          ))}
        </div>
      </div>

      {toast && (
        <div className="p-toast">
          <Icon name="check_circle" fill /> {toast}
        </div>
      )}
    </div>
  )
}

export function PodcastDetailPage() {
  const { podcastId } = useParams()
  const location = useLocation()
  const passed = (location.state as { podcast?: ABSPodcastItem } | null)?.podcast

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['podcast', podcastId],
    queryFn: () => getPodcast(podcastId as string),
    enabled: Boolean(podcastId) && !passed,
    staleTime: 10 * 60 * 1000,
  })

  if (passed) return <PodcastDetail podcast={passed} />
  if (isLoading) {
    return (
      <div className="page">
        <LoadingSpinner className="py-12" label="Loading podcast..." />
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div className="page">
        <ErrorState message="Could not load this podcast." onRetry={refetch} />
      </div>
    )
  }
  return <PodcastDetail podcast={data} />
}
