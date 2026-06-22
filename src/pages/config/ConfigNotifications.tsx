import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNotifications,
  updateNotifications,
  updateNotificationRule,
  type ABSNotificationSettings,
} from '@/api/admin'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export function ConfigNotifications() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: getNotifications,
    staleTime: 60 * 1000,
  })

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Admin</div>
        <h1 className="title-xl">Notifications</h1>
      </div>

      {isLoading || !data ? (
        <LoadingSpinner className="py-12" label="Loading..." />
      ) : (
        <NotificationsForm key={JSON.stringify(data.settings)} settings={data.settings} />
      )}
    </>
  )
}

function NotificationsForm({ settings }: { settings: ABSNotificationSettings }) {
  const qc = useQueryClient()

  const [apprise, setApprise] = useState(settings.appriseApiUrl ?? '')
  const [maxFailed, setMaxFailed] = useState(String(settings.maxFailedAttempts ?? 5))
  const [delay, setDelay] = useState(String(settings.notificationDelay ?? 1000))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await updateNotifications({
        appriseApiUrl: apprise || null,
        maxFailedAttempts: Number(maxFailed) || 5,
        notificationDelay: Number(delay) || 1000,
      })
      qc.invalidateQueries({ queryKey: ['admin', 'notifications'] })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const toggleRule = async (id: string, enabled: boolean) => {
    await updateNotificationRule(id, { enabled })
    qc.invalidateQueries({ queryKey: ['admin', 'notifications'] })
  }

  return (
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
        </div>
        <div className="cfg-line" style={{ gap: 12 }}>
          <div className="cl-meta" style={{ width: 170, flex: 'none' }}>
            <div className="cl-t">Max failed attempts</div>
            <div className="cl-d">Stop retrying after this many failures.</div>
          </div>
          <input
            className="fld"
            inputMode="numeric"
            style={{ maxWidth: 120 }}
            value={maxFailed}
            onChange={(e) => setMaxFailed(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
        <div className="cfg-line" style={{ gap: 12 }}>
          <div className="cl-meta" style={{ width: 170, flex: 'none' }}>
            <div className="cl-t">Delay (ms)</div>
            <div className="cl-d">Wait between firing notifications.</div>
          </div>
          <input
            className="fld"
            inputMode="numeric"
            style={{ maxWidth: 120 }}
            value={delay}
            onChange={(e) => setDelay(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
        <div className="cfg-line" style={{ gap: 8, justifyContent: 'flex-end' }}>
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
        <h2>Rules · {settings.notifications.length}</h2>
      </div>
      {settings.notifications.length === 0 ? (
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
                <th style={{ textAlign: 'right' }}>Enabled</th>
              </tr>
            </thead>
            <tbody>
              {settings.notifications.map((n) => (
                <tr key={n.id}>
                  <td style={{ fontWeight: 600 }}>{n.eventName}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className={n.enabled ? 'toggle on' : 'toggle'}
                      aria-pressed={n.enabled}
                      style={{ marginLeft: 'auto' }}
                      onClick={() => void toggleRule(n.id, !n.enabled)}
                    >
                      <i />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
