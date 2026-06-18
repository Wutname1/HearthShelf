import { useQuery } from '@tanstack/react-query'
import { getLibraries, getSeries, libraryKeys } from '@/api/libraries'
import { useAuth } from '@/hooks/useAuth'
import { SeriesCard } from '@/components/library/SeriesCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'

export function SeriesPage() {
  const { defaultLibraryId } = useAuth()
  const { data: librariesData } = useQuery({
    queryKey: libraryKeys.all,
    queryFn: getLibraries,
    staleTime: 5 * 60 * 1000,
  })
  const libraryId = defaultLibraryId ?? librariesData?.libraries[0]?.id ?? null

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: libraryKeys.series(libraryId ?? ''),
    queryFn: () => getSeries(libraryId!),
    enabled: libraryId !== null,
    staleTime: 2 * 60 * 1000,
  })

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="eyebrow">Collected works</div>
        <h1 className="title-xl">Series</h1>
        {data && <p className="page-sub">{data.total} series</p>}
      </div>

      {isLoading && <LoadingSpinner className="py-12" label="Loading series..." />}
      {isError && (
        <ErrorState message="Could not load series." onRetry={refetch} />
      )}
      {data && (
        <div className="series-grid">
          {data.results.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      )}
    </div>
  )
}
