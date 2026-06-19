import { Icon } from '@/components/common/Icon'

// Admin: live download-queue status. The download-queue endpoint is
// @needs-verify against ABS 2.35.1 (this instance has no podcast library), so
// the page renders its empty state until the queue source is confirmed. The
// banner + table layout match the design for when data is wired.
export function PodcastQueuePage() {
  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="eyebrow">Podcasts · Admin</div>
        <h1 className="title-xl">Download queue</h1>
      </div>

      <div style={{ maxWidth: 900 }}>
        <div className="empty-state">
          <Icon name="download_done" />
          <h3>Nothing downloading</h3>
          <p>Episode downloads in progress will appear here.</p>
        </div>
      </div>
    </div>
  )
}
