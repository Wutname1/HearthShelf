import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getLibraries, getLibraryItems, libraryKeys } from '@/api/libraries'
import { useAuth } from '@/hooks/useAuth'
import { useMediaProgress } from '@/hooks/useMediaProgress'
import { BookTile } from '@/components/library/BookTile'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'

export function LibraryPage() {
  const { libraryId } = useParams()
  const { defaultLibraryId } = useAuth()
  const progressById = useMediaProgress()

  const { data: librariesData } = useQuery({
    queryKey: libraryKeys.all,
    queryFn: getLibraries,
    staleTime: 5 * 60 * 1000,
  })
  const libraries = librariesData?.libraries ?? []
  const activeLibraryId =
    libraryId ?? defaultLibraryId ?? libraries[0]?.id ?? null
  const activeLibrary = libraries.find((l) => l.id === activeLibraryId)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: libraryKeys.items(activeLibraryId ?? '', 0),
    queryFn: () => getLibraryItems(activeLibraryId!, 0, 50),
    enabled: activeLibraryId !== null,
    staleTime: 2 * 60 * 1000,
  })

  return (
    <div className="fade-in">
      <div className="topbar bare">
        <div className="search">
          <Icon name="search" />
          <input placeholder="Search your library…" disabled />
        </div>
        <div className="topbar-spacer" />
        <button className="pill">
          <Icon name="grid_view" />
        </button>
      </div>

      <div className="page" style={{ paddingTop: 8 }}>
        <div className="page-head">
          <div className="eyebrow">Your collection</div>
          <h1 className="title-xl">{activeLibrary?.name ?? 'Library'}</h1>
          {data && <p className="page-sub">{data.total} books</p>}
        </div>

        {isLoading && (
          <LoadingSpinner className="py-12" label="Loading books..." />
        )}
        {isError && (
          <ErrorState message="Could not load this library." onRetry={refetch} />
        )}
        {data && (
          <div className="lib-grid">
            {data.results.map((item) => {
              const p = progressById.get(item.id)
              return (
                <BookTile
                  key={item.id}
                  item={item}
                  progress={p?.progress ?? 0}
                  finished={p?.isFinished}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
