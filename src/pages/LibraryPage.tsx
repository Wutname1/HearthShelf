import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  getLibraries,
  getLibraryItems,
  libraryKeys,
} from '@/api/libraries'
import { useAuth } from '@/hooks/useAuth'
import { BookGrid } from '@/components/library/BookGrid'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'

export function LibraryPage() {
  const { libraryId } = useParams()
  const { defaultLibraryId } = useAuth()

  // Resolve which library to show: route param, then the user default, then
  // the first available library.
  const { data: librariesData } = useQuery({
    queryKey: libraryKeys.all,
    queryFn: getLibraries,
    staleTime: 5 * 60 * 1000,
  })
  const libraries = librariesData?.libraries ?? []
  const activeLibraryId =
    libraryId ?? defaultLibraryId ?? libraries[0]?.id ?? null
  const activeLibrary = libraries.find((l) => l.id === activeLibraryId)

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: libraryKeys.items(activeLibraryId ?? '', 0),
    queryFn: () => getLibraryItems(activeLibraryId!, 0, 50),
    enabled: activeLibraryId !== null,
    staleTime: 2 * 60 * 1000,
  })

  return (
    <div className="p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">
          {activeLibrary?.name ?? 'Library'}
        </h1>
        {data && (
          <span className="text-sm text-muted-foreground">
            {data.total} books
          </span>
        )}
      </div>

      {isLoading && <LoadingSpinner className="py-12" label="Loading books..." />}
      {isError && (
        <ErrorState message="Could not load this library." onRetry={refetch} />
      )}
      {data && <BookGrid items={data.results} />}
    </div>
  )
}
