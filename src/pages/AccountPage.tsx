import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMe, changePassword, meKeys } from '@/api/me'
import { fmtSessDate } from '@/lib/format'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export function AccountPage() {
  const { data: me } = useQuery({
    queryKey: meKeys.me,
    queryFn: getMe,
    staleTime: 60 * 1000,
  })

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const submit = async () => {
    setMsg(null)
    if (next !== confirm) {
      setMsg({ ok: false, text: 'New passwords do not match.' })
      return
    }
    if (!next) {
      setMsg({ ok: false, text: 'Enter a new password.' })
      return
    }
    setBusy(true)
    try {
      await changePassword(current, next)
      setMsg({ ok: true, text: 'Password updated.' })
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch {
      setMsg({ ok: false, text: 'Could not update password. Check your current password.' })
    } finally {
      setBusy(false)
    }
  }

  if (!me) {
    return (
      <div className="page">
        <LoadingSpinner className="py-12" label="Loading account..." />
      </div>
    )
  }

  const perms = Object.entries(me.permissions ?? {}).filter(([, v]) => v)

  return (
    <div className="page fade-in" style={{ maxWidth: 680 }}>
      <div className="page-head">
        <div className="eyebrow">Your account</div>
        <h1 className="title-xl">{me.username}</h1>
      </div>

      <div className="cfg-card">
        {(
          [
            ['badge', 'Account type', me.type],
            ['email', 'Email', me.email ?? 'Not set'],
            ['key', 'OpenID linked', me.hasOpenIDLink ? 'Yes' : 'No'],
            ['calendar_today', 'Member since', fmtSessDate(me.createdAt).day],
          ] as [string, string, string][]
        ).map(([icon, label, value]) => (
          <div className="cfg-line" key={label}>
            <Icon name={icon} style={{ color: 'var(--text-muted)' }} />
            <div className="cl-meta">
              <div className="cl-t">{label}</div>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>{value}</span>
          </div>
        ))}
      </div>

      <div className="section-head" style={{ marginTop: 'var(--s6)' }}>
        <Icon name="lock" />
        <h2>Change password</h2>
      </div>
      <div className="cfg-card">
        <div className="field full">
          <label>Current password</label>
          <input
            className="fld"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <div className="field full">
          <label>New password</label>
          <input
            className="fld"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </div>
        <div className="field full">
          <label>Confirm new password</label>
          <input
            className="fld"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <button className="btn-sm btn-green" disabled={busy} onClick={() => void submit()}>
            <Icon name="save" /> Update password
          </button>
          {msg && (
            <span
              style={{ fontSize: 13, color: msg.ok ? '#a7c896' : 'var(--primary)' }}
            >
              {msg.text}
            </span>
          )}
        </div>
      </div>

      {perms.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 'var(--s6)' }}>
            <Icon name="verified_user" />
            <h2>Permissions</h2>
          </div>
          <div className="meta-chips">
            {perms.map(([k]) => (
              <span className="chip" key={k}>
                <Icon name="check" /> {k.replace(/^can/, '')}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
