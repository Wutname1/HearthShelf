import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAuthors, libraryKeys } from '@/api/libraries'
import { useActiveLibrary } from '@/hooks/useActiveLibrary'
import { AuthorCard } from '@/components/library/AuthorCard'
import { Dropdown, MItem } from '@/components/common/Dropdown'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'

type AuthorSort = 'Name' | 'Books' | 'Added'

export function AuthorsPage() {
  const navigate = useNavigate()
  const { activeId } = useActiveLibrary()
  const [sort, setSort] = useState<AuthorSort>('Books')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: libraryKeys.authors(activeId ?? ''),
    queryFn: () => getAuthors(activeId as string),
    enabled: activeId !== null,
    staleTime: 5 * 60 * 1000,
  })

  const authors = useMemo(() => {
    const list = [...(data?.authors ?? [])]
    if (sort === 'Name') list.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'Books') list.sort((a, b) => b.numBooks - a.numBooks)
    else list.sort((a, b) => b.addedAt - a.addedAt)
    return list
  }, [data, sort])

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="eyebrow">Who wrote it</div>
        <h1 className="title-xl">Authors</h1>
      </div>

      {isLoading && <LoadingSpinner className="py-12" label="Loading authors..." />}
      {isError && (
        <ErrorState message="Could not load authors." onRetry={refetch} />
      )}

      {data && (
        <>
          <div className="toolbar2">
            <span className="count-badge">{authors.length} authors</span>
            <div className="tb-spacer" />
            <Dropdown icon="swap_vert" label={`Sort: ${sort}`} align="left">
              <div className="mp-label">Sort by</div>
              {(['Name', 'Books', 'Added'] as AuthorSort[]).map((s) => (
                <MItem
                  key={s}
                  label={s}
                  on={s === sort}
                  onClick={() => setSort(s)}
                />
              ))}
            </Dropdown>
          </div>

          {authors.length === 0 ? (
            <div className="empty-state">
              <Icon name="person" />
              <h3>No authors found</h3>
            </div>
          ) : (
            <div className="author-grid">
              {authors.map((a) => (
                <AuthorCard
                  key={a.id}
                  author={a}
                  onOpen={(id) => navigate(`/author/${id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
