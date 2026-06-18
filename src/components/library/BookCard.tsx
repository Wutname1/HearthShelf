import { Link } from 'react-router-dom'
import type { ABSLibraryItem } from '@/api/types'
import { CoverImage } from '@/components/common/CoverImage'

interface BookCardProps {
  item: ABSLibraryItem
}

export function BookCard({ item }: BookCardProps) {
  const { title, authorName } = item.media.metadata

  return (
    <Link to={`/book/${item.id}`} className="group flex flex-col gap-2">
      <div className="aspect-square overflow-hidden rounded-md border bg-muted">
        <CoverImage
          itemId={item.id}
          alt={title ?? 'Untitled'}
          className="size-full transition-transform group-hover:scale-105"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium" title={title ?? undefined}>
          {title ?? 'Untitled'}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {authorName || 'Unknown author'}
        </p>
      </div>
    </Link>
  )
}
