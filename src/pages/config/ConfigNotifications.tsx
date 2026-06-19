import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getNotifications, updateNotifications } from '@/api/admin'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export function ConfigNotifications() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: getNotifications,
    staleTime: 60 * 1000,
  })

  const [apprise, setApprise] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) setApprise(data.settings.appriseApiUrl ?? '')
  }, [data])

  const save = async () => {
    setSaving(true)
    try {
      await updateNotifications({ appriseApiUrl: apprise || null })
      qc.invalidateQueries({ queryKey: ['admin', 'notifications'] })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Admin</div>
        <h1 className="title-xl">Notifications</h1>
      </div>

      {isLoading || !data ? (
        <LoadingSpinner className="py-12" label="Loading..." />
      ) : (
        <>
          <div className="cfg-card">
            <div className="cfg-line">
              <Icon name="webhook" style={{ color: 'var(--text-muted)' }} />
              <div className="cl-meta" style={{ flex: 1 }}>
                <div className="cl-t">Apprise API URL</div>
                <div className="cl-d">
                  HearthShelf relays notifications through your Apprise server.
                </div>
              </div>
            </div>
            <div className="cfg-line" style={{ gap: 8 }}>
              <input
                className="fld"
                placeholder="https://apprise.example.com/notify"
                value={apprise}
                onChange={(e) => setApprise(e.target.value)}
              />
              <button
                className="btn-sm btn-green"
                style={{ flex: 'none' }}
                disabled={saving}
                onClick={() => void save()}
              >
                {saved ? <Icon name="check" /> : <Icon name="save" />}{' '}
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>

          <div className="section-head" style={{ marginTop: 'var(--s6)' }}>
            <Icon name="notifications" />
            <h2>Rules · {data.settings.notifications.length}</h2>
          </div>
          {data.settings.notifications.length === 0 ? (
            <div className="empty-state">
              <Icon name="notifications_off" />
              <h3>No notification rules</h3>
              <p>Add rules in AudiobookShelf to be notified of events.</p>
            </div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.settings.notifications.map((n) => (
                    <tr key={n.id}>
                      <td style={{ fontWeight: 600 }}>{n.eventName}</td>
                      <td>{n.enabled ? 'Enabled' : 'Disabled'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  )
}
