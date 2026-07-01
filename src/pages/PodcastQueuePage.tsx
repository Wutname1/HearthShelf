import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getEpisodeDownloadQueue, clearEpisodeDownloadQueue } from '@/api/libraries'
import { useActiveLibrary } from '@/hooks/useActiveLibrary'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

function fmtDate(ts: number | null): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Admin: live podcast download-queue status. Reads the per-library queue from
// ABS (GET /libraries/:id/episode-downloads) and lets an admin clear a podcast's
// pending downloads (GET /podcasts/:id/clear-queue). Polls while open so the
// current download and queue stay fresh.
export function PodcastQueuePage() {
  const qc = useQueryClient()
  const { activeId } = useActiveLibrary()

  const { data, isLoading } = useQuery({
    queryKey: ['podcast-download-queue', activeId],
    queryFn: () => getEpisodeDownloadQueue(activeId as string),
    enabled: activeId !== null,
    refetchInterval: 4000,
  })

  const current = data?.currentDownload ?? null
  const queue = data?.queue ?? []

  const clear = async (podcastItemId: string) => {
    await clearEpisodeDownloadQueue(podcastItemId)
    qc.invalidateQueries({ queryKey: ['podcast-download-queue', activeId] })
  }

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="eyebrow">Podcasts · Admin</div>
        <h1 className="title-xl">Download queue</h1>
      </div>

      <div style={{ maxWidth: 900 }}>
        {isLoading ? (
          <LoadingSpinner className="py-12" label="Loading queue..." />
        ) : (
          <>
            {current && (
              <div className="banner success" style={{ marginBottom: 'var(--s5)' }}>
                <Icon name="downloading" />
                <span>
                  Downloading <b>{current.episodeDisplayTitle ?? 'episode'}</b>
                  {current.podcastTitle ? ` · ${current.podcastTitle}` : ''}
                </span>
              </div>
            )}

            {queue.length === 0 && !current ? (
              <div className="empty-state">
                <Icon name="download_done" />
                <h3>Nothing downloading</h3>
                <p>Episode downloads in progress will appear here.</p>
              </div>
            ) : (
              <>
                <div className="section-head">
                  <Icon name="schedule" />
                  <h2>Queued · {queue.length}</h2>
                </div>
                {queue.length === 0 ? (
                  <p className="page-sub">No episodes waiting.</p>
                ) : (
                  <div className="tbl-wrap">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Episode</th>
                          <th>Podcast</th>
                          <th>Published</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queue.map((e) => (
                          <tr key={e.id}>
                            <td style={{ fontWeight: 600 }}>
                              {e.episodeDisplayTitle ?? 'Episode'}
                            </td>
                            <td>{e.podcastTitle ?? '—'}</td>
                            <td className="mono">{fmtDate(e.publishedAt)}</td>
                            <td>
                              <div className="t-actions">
                                <button
                                  className="tbl-icon"
                                  title="Clear this podcast's queue"
                                  onClick={() => void clear(e.libraryItemId)}
                                >
                                  <Icon name="close" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
