import { useQuery } from '@tanstack/react-query'
import { getServerStats, getLibraryStats, adminKeys } from '@/api/admin'
import { libraryKeys, getLibraries } from '@/api/libraries'
import { useActiveLibrary } from '@/hooks/useActiveLibrary'
import { formatDuration } from '@/lib/format'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

function fmtBytes(b: number): string {
  const gb = b / (1024 * 1024 * 1024)
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  return `${(b / (1024 * 1024)).toFixed(0)} MB`
}

function Tile({ icon, num, cap }: { icon: string; num: string; cap: string }) {
  return (
    <div className="tile">
      <div className="t-ico">
        <Icon name={icon} />
      </div>
      <div className="t-num">{num}</div>
      <div className="t-cap">{cap}</div>
    </div>
  )
}

export function ConfigServerStats() {
  const { data } = useQuery({
    queryKey: ['admin', 'serverstats'],
    queryFn: getServerStats,
    staleTime: 60 * 1000,
  })

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Admin · Insights</div>
        <h1 className="title-xl">Server Stats</h1>
      </div>
      {!data ? (
        <LoadingSpinner className="py-12" label="Loading stats..." />
      ) : (
        <div className="stat-tiles">
          <Tile icon="menu_book" num={String(data.books.numItems)} cap="Books" />
          <Tile icon="podcasts" num={String(data.podcasts.numItems)} cap="Podcasts" />
          <Tile icon="audio_file" num={String(data.total.numAudioFiles)} cap="Audio files" />
          <Tile icon="storage" num={fmtBytes(data.total.totalSize)} cap="Total size" />
        </div>
      )}
    </>
  )
}

export function ConfigLibraryStats() {
  // Use the libraries list so this works regardless of the active-library route.
  const { data: libs } = useQuery({
    queryKey: libraryKeys.all,
    queryFn: getLibraries,
    staleTime: 5 * 60 * 1000,
  })
  const { activeId } = useActiveLibrary()
  const libId = activeId ?? libs?.libraries[0]?.id ?? null

  const { data } = useQuery({
    queryKey: [...adminKeys.users, 'libstats', libId],
    queryFn: () => getLibraryStats(libId as string),
    enabled: libId !== null,
    staleTime: 60 * 1000,
  })

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Admin · Insights</div>
        <h1 className="title-xl">Library Stats</h1>
      </div>
      {!data ? (
        <LoadingSpinner className="py-12" label="Loading stats..." />
      ) : (
        <>
          <div className="stat-tiles">
            <Tile icon="menu_book" num={String(data.totalItems)} cap="Items" />
            <Tile icon="person" num={String(data.totalAuthors)} cap="Authors" />
            <Tile icon="category" num={String(data.totalGenres)} cap="Genres" />
            <Tile
              icon="schedule"
              num={`${Math.round(data.totalDuration / 3600)}h`}
              cap="Total length"
            />
            <Tile icon="audio_file" num={String(data.numAudioTracks)} cap="Audio tracks" />
            <Tile icon="storage" num={fmtBytes(data.totalSize)} cap="Total size" />
          </div>

          {data.longestItems?.length > 0 && (
            <>
              <div className="section-head" style={{ marginTop: 'var(--s8)' }}>
                <Icon name="schedule" />
                <h2>Longest items</h2>
              </div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Length</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.longestItems.slice(0, 10).map((it) => (
                      <tr key={it.id}>
                        <td style={{ fontWeight: 600 }}>{it.title}</td>
                        <td className="num">{formatDuration(it.duration)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
