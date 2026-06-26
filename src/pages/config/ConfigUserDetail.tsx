import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getUsers, updateUser, adminKeys } from '@/api/admin'
import type { UserFormSubmit } from '@/components/config/UserForm'
import { fmtSessDate } from '@/lib/format'
import { Icon } from '@/components/common/Icon'
import { AvatarUpload } from '@/components/common/AvatarUpload'
import { UserForm } from '@/components/config/UserForm'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useToast } from '@/hooks/useToast'

export function ConfigUserDetail({ userId }: { userId: string }) {
  const qc = useQueryClient()
  const { toast, show } = useToast()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: adminKeys.users,
    queryFn: getUsers,
    staleTime: 60 * 1000,
  })

  const user = data?.users.find((u) => u.id === userId)

  if (isLoading) {
    return <LoadingSpinner className="py-12" label="Loading user..." />
  }
  if (!user) {
    return (
      <div className="empty-state">
        <Icon name="person_off" />
        <h3>User not found</h3>
      </div>
    )
  }

  // Show only the boolean permission flags that are enabled (skip the array
  // fields librariesAccessible / itemTagsSelected, which aren't simple toggles).
  const perms = Object.entries(user.permissions ?? {}).filter(
    ([, v]) => v === true
  )
  const seen = user.lastSeen ? fmtSessDate(user.lastSeen) : null

  const save = async (values: UserFormSubmit) => {
    setBusy(true)
    setFormError(null)
    try {
      await updateUser(user.id, values)
      qc.invalidateQueries({ queryKey: adminKeys.users })
      setEditing(false)
      show('Changes saved')
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not save changes')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {toast && (
        <div className="p-toast">
          <Icon name="check_circle" fill /> {toast}
        </div>
      )}
      <div className="crumb">
        <Link className="lnk" to="/config/users">
          Users
        </Link>
        <Icon name="chevron_right" />
        {user.username}
      </div>

      <div className="page-head-row">
        <div>
          <div className="eyebrow">Admin · User</div>
          <h1 className="title-xl">{user.username}</h1>
        </div>
        <button className="btn-sm btn-accent" onClick={() => setEditing(true)}>
          <Icon name="edit" /> Edit user
        </button>
      </div>

      <div className="cfg-card" style={{ marginBottom: 18 }}>
        <div className="cfg-line">
          <Icon name="account_circle" style={{ color: 'var(--text-muted)' }} />
          <div className="cl-meta">
            <div className="cl-t">Profile photo</div>
          </div>
          <AvatarUpload userId={user.id} name={user.username} size={72} />
        </div>
      </div>

      <div className="cfg-card">
        {(
          [
            ['badge', 'Type', user.type],
            ['email', 'Email', user.email ?? '—'],
            ['toggle_on', 'Status', user.isActive ? 'Active' : 'Disabled'],
            ['lock', 'Locked', user.isLocked ? 'Yes' : 'No'],
            [
              'schedule',
              'Last seen',
              seen ? `${seen.day} · ${seen.time}` : 'never',
            ],
            ['calendar_today', 'Created', fmtSessDate(user.createdAt).day],
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

      {perms.length > 0 && (
        <>
          <div className="section-head">
            <Icon name="key" />
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

      {editing && (
        <UserForm
          user={user}
          busy={busy}
          error={formError}
          onSubmit={(v) => void save(v)}
          onClose={() => {
            setEditing(false)
            setFormError(null)
          }}
        />
      )}
    </>
  )
}
