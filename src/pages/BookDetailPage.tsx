import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { getItem, libraryKeys } from '@/api/libraries'
import { BookDetail } from '@/components/library/BookDetail'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'

export function BookDetailPage() {
  const { itemId } = useParams()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: libraryKeys.item(itemId ?? ''),
    queryFn: () => getItem(itemId!),
    enabled: Boolean(itemId),
    staleTime: 10 * 60 * 1000,
  })

  return (
    <div className="p-6">
      <Link
        to="/library"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to library
      </Link>

      {isLoading && <LoadingSpinner className="py-12" label="Loading book..." />}
      {isError && (
        <ErrorState message="Could not load this book." onRetry={refetch} />
      )}
      {data && <BookDetail item={data} />}
    </div>
  )
}
