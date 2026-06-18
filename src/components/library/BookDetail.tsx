import { Play } from 'lucide-react'
import type { ABSLibraryItemDetail } from '@/api/types'
import { CoverImage } from '@/components/common/CoverImage'
import { ChapterList } from '@/components/player/ChapterList'
import { Button } from '@/components/ui/button'
import { formatDuration, stripHtml } from '@/lib/format'

interface BookDetailProps {
  item: ABSLibraryItemDetail
}

export function BookDetail({ item }: BookDetailProps) {
  const { metadata, audioFiles, chapters } = item.media
  const { title, subtitle, authors, narratorName, publishedYear, description } =
    metadata

  // The detail endpoint doesn't flatten these the way the items list does.
  const authorName = authors.map((a) => a.name).join(', ')
  const duration = audioFiles.reduce((sum, f) => sum + f.duration, 0)
  const numChapters = chapters.length

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="flex flex-col gap-4 lg:w-72 lg:shrink-0">
        <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
          <CoverImage
            itemId={item.id}
            alt={title ?? 'Untitled'}
            className="size-full"
          />
        </div>
        <Button size="lg" className="gap-2">
          <Play className="size-5" />
          Play
        </Button>
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="text-3xl font-semibold">{title ?? 'Untitled'}</h1>
        {subtitle && (
          <p className="mt-1 text-lg text-muted-foreground">{subtitle}</p>
        )}
        <p className="mt-2 text-muted-foreground">
          {authorName || 'Unknown author'}
        </p>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          {narratorName && (
            <div className="flex gap-1">
              <dt>Narrated by</dt>
              <dd className="text-foreground">{narratorName}</dd>
            </div>
          )}
          {publishedYear && (
            <div className="flex gap-1">
              <dt>Published</dt>
              <dd className="text-foreground">{publishedYear}</dd>
            </div>
          )}
          <div className="flex gap-1">
            <dt>Duration</dt>
            <dd className="text-foreground">{formatDuration(duration)}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Chapters</dt>
            <dd className="text-foreground">{numChapters}</dd>
          </div>
        </dl>

        {description && (
          <p className="mt-6 max-w-prose whitespace-pre-line text-sm leading-relaxed">
            {stripHtml(description)}
          </p>
        )}

        <div className="mt-8">
          <h2 className="mb-2 text-lg font-medium">Chapters</h2>
          <ChapterList chapters={chapters} />
        </div>
      </div>
    </div>
  )
}
