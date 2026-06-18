import type { ABSLibraryItem } from '@/api/types'
import { BookCard } from '@/components/library/BookCard'

interface BookGridProps {
  items: ABSLibraryItem[]
}

export function BookGrid({ items }: BookGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => (
        <BookCard key={item.id} item={item} />
      ))}
    </div>
  )
}
