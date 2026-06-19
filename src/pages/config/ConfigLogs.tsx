import { useQuery } from '@tanstack/react-query'
import { getLoggerData } from '@/api/admin'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

const LEVEL_LABEL: Record<number, string> = {
  0: 'TRACE',
  1: 'DEBUG',
  2: 'INFO',
  3: 'WARN',
  4: 'ERROR',
  5: 'FATAL',
}

export function ConfigLogs() {
  const { data } = useQuery({
    queryKey: ['admin', 'logs'],
    queryFn: getLoggerData,
    staleTime: 10 * 1000,
  })

  const logs = data?.currentDailyLogs ?? []

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Admin</div>
        <h1 className="title-xl">Logs</h1>
        {data && <p className="page-sub">Today's server log · {logs.length} lines</p>}
      </div>

      {!data ? (
        <LoadingSpinner className="py-12" label="Loading logs..." />
      ) : (
        <div className="log-box">
          {logs.map((l, i) => (
            <div className="log-line" key={i}>
              <span style={{ color: 'var(--text-faint)' }}>{l.timestamp}</span>{' '}
              {l.level != null && (
                <span style={{ color: 'var(--text-muted)' }}>
                  [{LEVEL_LABEL[l.level] ?? l.level}]
                </span>
              )}{' '}
              {l.message}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
