import { useMemo, useState, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLibraries, libraryKeys } from '@/api/libraries'
import { getAllTagNames } from '@/api/admin'
import type { ABSAdminUser, ABSUserPermissions } from '@/api/types'
import type { ABSUserType, UserFormValues } from '@/api/admin'
import { Icon } from '@/components/common/Icon'
import { Modal } from '@/components/common/Modal'

const ERR_STYLE: CSSProperties = {
  fontSize: 13,
  color: '#e8897f',
  background: 'color-mix(in oklab, #d8443a 14%, transparent)',
  border: '1px solid color-mix(in oklab, #d8443a 40%, transparent)',
  borderRadius: 10,
  padding: '8px 12px',
  margin: '0 0 14px',
}

const TYPES: { value: ABSUserType; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'guest', label: 'Guest' },
]

// The permission toggles we surface, in display order. librariesAccessible /
// itemTagsSelected are handled separately by the pickers below.
const PERM_TOGGLES: { key: keyof ABSUserPermissions; label: string }[] = [
  { key: 'download', label: 'Can Download' },
  { key: 'update', label: 'Can Update' },
  { key: 'delete', label: 'Can Delete' },
  { key: 'upload', label: 'Can Upload' },
  { key: 'createEreader', label: 'Can Create Ereader' },
  { key: 'accessExplicitContent', label: 'Can Access Explicit Content' },
  { key: 'accessAllLibraries', label: 'Can Access All Libraries' },
  { key: 'accessAllTags', label: 'Can Access All Tags' },
]

function defaultPermissions(type: ABSUserType): ABSUserPermissions {
  const elevated = type === 'admin'
  return {
    download: true,
    update: elevated,
    delete: false,
    upload: elevated,
    createEreader: elevated,
    accessAllLibraries: true,
    accessAllTags: true,
    accessExplicitContent: elevated,
    selectedTagsNotAccessible: false,
    librariesAccessible: [],
    itemTagsSelected: [],
  }
}

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <div className="field-row">
      <div className="fr-meta">
        <div className="fr-t">{label}</div>
      </div>
      <div
        className={'toggle' + (on ? ' on' : '')}
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
      >
        <i />
      </div>
    </div>
  )
}

// Simple checkbox-list multi-select for libraries / tags.
function MultiSelect({
  options,
  selected,
  onToggle,
  empty,
}: {
  options: { id: string; label: string }[]
  selected: Set<string>
  onToggle: (id: string) => void
  empty: string
}) {
  if (options.length === 0) {
    return (
      <p className="hint" style={{ margin: '4px 0' }}>
        {empty}
      </p>
    )
  }
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        maxHeight: 160,
        overflowY: 'auto',
      }}
    >
      {options.map((o) => {
        const on = selected.has(o.id)
        return (
          <button
            key={o.id}
            type="button"
            className={'pill' + (on ? ' on' : '')}
            onClick={() => onToggle(o.id)}
          >
            {on && <Icon name="check" className="ms" />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export interface UserFormSubmit extends UserFormValues {
  password?: string
}

interface UserFormProps {
  // Editing an existing user, or undefined when creating.
  user?: ABSAdminUser
  // Hosted mode turns "create" into "invite by email" (no password/username).
  hostedInvite?: boolean
  busy?: boolean
  error?: string | null
  onSubmit: (values: UserFormSubmit) => void
  onInvite?: (email: string, role: 'admin' | 'user') => void
  onClose: () => void
}

// Create or edit an ABS user. HearthShelf owns user management (we are the UI for
// ABS, not a pointer to it). In hosted mode, creating instead sends an email
// invite through the control plane, so the form collapses to email + role.
export function UserForm({
  user,
  hostedInvite,
  busy,
  error,
  onSubmit,
  onInvite,
  onClose,
}: UserFormProps) {
  const editing = !!user
  const isRoot = user?.type === 'root'

  const { data: libsData } = useQuery({
    queryKey: libraryKeys.all,
    queryFn: getLibraries,
    staleTime: 5 * 60 * 1000,
  })
  const { data: tagsData } = useQuery({
    queryKey: ['admin', 'tag-names'],
    queryFn: getAllTagNames,
    staleTime: 5 * 60 * 1000,
  })

  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [type, setType] = useState<ABSUserType>((user?.type as ABSUserType) ?? 'user')
  const [isActive, setIsActive] = useState(user?.isActive ?? true)
  const [perms, setPerms] = useState<ABSUserPermissions>(
    user?.permissions ?? defaultPermissions('user'),
  )
  // Hosted invite role
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user')

  const libOptions = useMemo(
    () => (libsData?.libraries ?? []).map((l) => ({ id: l.id, label: l.name })),
    [libsData],
  )
  const tagOptions = useMemo(
    () => (tagsData?.tags ?? []).map((t) => ({ id: t, label: t })),
    [tagsData],
  )
  const libSel = useMemo(() => new Set(perms.librariesAccessible), [perms.librariesAccessible])
  const tagSel = useMemo(() => new Set(perms.itemTagsSelected), [perms.itemTagsSelected])

  const setPerm = (key: keyof ABSUserPermissions, value: boolean) =>
    setPerms((p) => ({ ...p, [key]: value }))
  const toggleLib = (id: string) =>
    setPerms((p) => ({
      ...p,
      librariesAccessible: p.librariesAccessible.includes(id)
        ? p.librariesAccessible.filter((x) => x !== id)
        : [...p.librariesAccessible, id],
    }))
  const toggleTag = (id: string) =>
    setPerms((p) => ({
      ...p,
      itemTagsSelected: p.itemTagsSelected.includes(id)
        ? p.itemTagsSelected.filter((x) => x !== id)
        : [...p.itemTagsSelected, id],
    }))

  const submit = () => {
    if (hostedInvite && !editing) {
      const e = email.trim()
      if (!e.includes('@') || !onInvite) return
      onInvite(e, inviteRole)
      return
    }
    const name = username.trim()
    if (!name) return
    if (!editing && !password) return // create requires an initial password
    onSubmit({
      username: name,
      email: email.trim() || null,
      type,
      isActive,
      permissions: perms,
      password: password || undefined,
    })
  }

  // --- Hosted invite: minimal form (email + role) ---
  if (hostedInvite && !editing) {
    return (
      <Modal
        title="Invite a user"
        onClose={onClose}
        foot={
          <>
            <div style={{ flex: 1 }} />
            <button className="btn-sm btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-sm btn-green" disabled={busy} onClick={submit}>
              <Icon name="send" /> Send Invite
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 0 }}>
          Invites are emailed through app.hearthshelf.com. The person sets their own password when
          they accept.
        </p>
        {error && <p style={ERR_STYLE}>{error}</p>}
        <div className="field full">
          <label>Email</label>
          <input
            className="fld"
            type="email"
            value={email}
            autoFocus
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </div>
        <div className="field full">
          <label>Role</label>
          <div className="seg seg-full">
            {(['user', 'admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                className={inviteRole === r ? 'on' : ''}
                onClick={() => setInviteRole(r)}
              >
                {r === 'admin' ? 'Admin' : 'User'}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    )
  }

  // --- Full create / edit form ---
  return (
    <Modal
      title={editing ? `Edit ${user?.username}` : 'Add user'}
      onClose={onClose}
      foot={
        <>
          <div style={{ flex: 1 }} />
          <button className="btn-sm btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-sm btn-green" disabled={busy} onClick={submit}>
            <Icon name={editing ? 'save' : 'person_add'} />{' '}
            {editing ? 'Save changes' : 'Create user'}
          </button>
        </>
      }
    >
      {error && <p className="form-err">{error}</p>}
      {isRoot && (
        <p className="hint" style={{ marginTop: 0, color: 'var(--text-muted)' }}>
          This is a root account. Some fields (account type) are locked, and only another root user
          can change its password.
        </p>
      )}

      <div className="field full">
        <label>Username</label>
        <input
          className="fld"
          value={username}
          autoFocus={!editing}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. listener"
        />
      </div>

      <div className="field full">
        <label>{editing ? 'Change password' : 'Set password'}</label>
        <input
          className="fld"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={editing ? 'Leave blank to keep current' : 'Choose a password'}
        />
      </div>

      <div className="field full">
        <label>Email</label>
        <input
          className="fld"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="optional"
        />
      </div>

      <div className="field full">
        <label>Account type</label>
        <div className="seg seg-full">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              disabled={isRoot}
              className={type === t.value ? 'on' : ''}
              onClick={() => {
                setType(t.value)
                // Re-seed permission defaults to the new type's baseline, but keep
                // any library/tag selections the admin already made.
                setPerms((p) => ({
                  ...defaultPermissions(t.value),
                  librariesAccessible: p.librariesAccessible,
                  itemTagsSelected: p.itemTagsSelected,
                  selectedTagsNotAccessible: p.selectedTagsNotAccessible,
                }))
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Toggle label="Enabled" on={isActive} onChange={setIsActive} />

      <div className="section-head" style={{ marginTop: 18 }}>
        <Icon name="key" />
        <h2>Permissions</h2>
      </div>

      {PERM_TOGGLES.map((t) => (
        <Toggle
          key={t.key}
          label={t.label}
          on={!!perms[t.key]}
          onChange={(v) => setPerm(t.key, v)}
        />
      ))}

      {!perms.accessAllLibraries && (
        <div className="field full" style={{ marginTop: 14 }}>
          <label>Accessible libraries</label>
          <MultiSelect
            options={libOptions}
            selected={libSel}
            onToggle={toggleLib}
            empty="No libraries found."
          />
        </div>
      )}

      {!perms.accessAllTags && (
        <div className="field full" style={{ marginTop: 14 }}>
          <label>Accessible tags</label>
          <MultiSelect
            options={tagOptions}
            selected={tagSel}
            onToggle={toggleTag}
            empty="No tags in the library yet."
          />
        </div>
      )}
    </Modal>
  )
}
