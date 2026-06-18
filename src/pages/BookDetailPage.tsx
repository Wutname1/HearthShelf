import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getItem, libraryKeys } from '@/api/libraries'
import { BookDetail } from '@/components/library/BookDetail'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'

export function BookDetailPage() {
  const { itemId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: libraryKeys.item(itemId ?? ''),
    queryFn: () => getItem(itemId!),
    enabled: Boolean(itemId),
    staleTime: 10 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="page">
        <LoadingSpinner className="py-12" label="Loading book..." />
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div className="page">
        <ErrorState message="Could not load this book." onRetry={refetch} />
      </div>
    )
  }

  return (
    <div>
      <div className="page" style={{ paddingBottom: 0 }}>
        <button className="pill" onClick={() => navigate(-1)}>
          <Icon name="arrow_back" /> Back
        </button>
      </div>
      <BookDetail item={data} />
    </div>
  )
}
