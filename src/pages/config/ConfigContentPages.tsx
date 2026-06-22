import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getEmailSettings,
  updateEmailSettings,
  sendTestEmail,
  updateEreaderDevices,
  getRssFeeds,
  closeRssFeed,
  getAuthSettings,
  updateAuthSettings,
  getCustomProviders,
  type ABSAuthSettings,
  type ABSEmailSettings,
  type ABSEreaderDevice,
} from '@/api/admin'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useRmabConfig } from '@/hooks/useRmab'
import { useAudplexusConfig, useAudplexusStatus } from '@/hooks/useAudplexus'

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="cfg-line">
      <Icon name={icon} style={{ color: 'var(--text-muted)' }} />
      <div className="cl-meta">
        <div className="cl-t">{label}</div>
      </div>
      <span style={{ color: 'var(--text-muted)' }}>{value}</span>
    </div>
  )
}

// --- Email (editable SMTP form + eReader devices) ---
// Thin wrapper: fetches settings, then mounts the form keyed on the loaded data
// so form state initializes directly from props (no setState-in-effect sync).
export function ConfigEmail() {
  const { data } = useQuery({
    queryKey: ['admin', 'email'],
    queryFn: getEmailSettings,
    staleTime: 60 * 1000,
  })

  if (!data) {
    return (
      <>
        <div className="page-head">
          <div className="eyebrow">Admin</div>
          <h1 className="title-xl">Email</h1>
        </div>
        <LoadingSpinner className="py-12" label="Loading..." />
      </>
    )
  }

  return <EmailForm key={JSON.stringify(data.settings)} settings={data.settings} />
}

function EmailForm({ settings }: { settings: ABSEmailSettings }) {
  const qc = useQueryClient()

  const [host, setHost] = useState(settings.host ?? '')
  const [port, setPort] = useState(settings.port != null ? String(settings.port) : '465')
  const [secure, setSecure] = useState(settings.secure)
  const [user, setUser] = useState(settings.user ?? '')
  const [pass, setPass] = useState('')
  const [fromAddress, setFromAddress] = useState(settings.fromAddress ?? '')
  const [testAddress, setTestAddress] = useState(settings.testAddress ?? '')
  const [devices, setDevices] = useState<ABSEreaderDevice[]>(settings.ereaderDevices ?? [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    try {
      await updateEmailSettings({
        host: host || null,
        port: port ? Number(port) : null,
        secure,
        user: user || null,
        fromAddress: fromAddress || null,
        testAddress: testAddress || null,
        // pass is write-only; only send when the admin typed a new one
        ...(pass ? { pass } : {}),
      })
      setPass('')
      qc.invalidateQueries({ queryKey: ['admin', 'email'] })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const test = async () => {
    setTesting(true)
    setTestMsg(null)
    try {
      await sendTestEmail()
      setTestMsg('Test email sent.')
    } catch {
      setTestMsg('Test failed - check the SMTP settings and save first.')
    } finally {
      setTesting(false)
      window.setTimeout(() => setTestMsg(null), 4000)
    }
  }

  const saveDevices = async (next: ABSEreaderDevice[]) => {
    setDevices(next)
    await updateEreaderDevices(next)
    qc.invalidateQueries({ queryKey: ['admin', 'email'] })
  }

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Admin</div>
        <h1 className="title-xl">Email</h1>
        <p className="page-sub">SMTP server used to send ebooks to e-readers.</p>
      </div>

      <div className="cfg-card">
        <Field label="SMTP host">
          <input
            className="fld"
            placeholder="smtp.example.com"
            value={host}
            onChange={(e) => setHost(e.target.value)}
          />
        </Field>
        <Field label="Port">
          <input
            className="fld"
            inputMode="numeric"
            placeholder="465"
            value={port}
            onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </Field>
        <div className="cfg-line">
          <Icon name="lock" style={{ color: 'var(--text-muted)' }} />
          <div className="cl-meta" style={{ flex: 1 }}>
            <div className="cl-t">Use TLS</div>
            <div className="cl-d">Secure connection (recommended for port 465).</div>
          </div>
          <button
            className={secure ? 'toggle on' : 'toggle'}
            aria-pressed={secure}
            onClick={() => setSecure((v) => !v)}
          >
            <i />
          </button>
        </div>
        <Field label="Username">
          <input
            className="fld"
            placeholder="user@example.com"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <input
            className="fld"
            type="password"
            placeholder={settings.host ? 'Leave blank to keep current' : ''}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </Field>
        <Field label="From address">
          <input
            className="fld"
            placeholder="library@example.com"
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
          />
        </Field>
        <Field label="Test recipient">
          <input
            className="fld"
            placeholder="you@example.com"
            value={testAddress}
            onChange={(e) => setTestAddress(e.target.value)}
          />
        </Field>
        <div className="cfg-line" style={{ gap: 8, justifyContent: 'flex-end' }}>
          {testMsg && (
            <span style={{ color: 'var(--text-muted)', fontSize: 12.5, marginRight: 'auto' }}>
              {testMsg}
            </span>
          )}
          <button
            className="btn-sm"
            disabled={testing || !testAddress}
            onClick={() => void test()}
          >
            <Icon name="send" /> {testing ? 'Sending...' : 'Send test'}
          </button>
          <button className="btn-sm btn-green" disabled={saving} onClick={() => void save()}>
            {saved ? <Icon name="check" /> : <Icon name="save" />}{' '}
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      <EreaderDevices devices={devices} onChange={saveDevices} />
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="cfg-line" style={{ gap: 12 }}>
      <div className="cl-meta" style={{ width: 150, flex: 'none' }}>
        <div className="cl-t">{label}</div>
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

function EreaderDevices({
  devices,
  onChange,
}: {
  devices: ABSEreaderDevice[]
  onChange: (next: ABSEreaderDevice[]) => void | Promise<void>
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const add = () => {
    if (!name.trim() || !email.trim()) return
    void onChange([...devices, { name: name.trim(), email: email.trim() }])
    setName('')
    setEmail('')
  }
  const remove = (idx: number) => {
    void onChange(devices.filter((_, i) => i !== idx))
  }

  return (
    <>
      <div className="section-head" style={{ marginTop: 'var(--s6)' }}>
        <Icon name="tablet" />
        <h2>E-reader devices · {devices.length}</h2>
      </div>
      <div className="cfg-card">
        {devices.map((d, i) => (
          <div className="cfg-line" key={`${d.email}-${i}`}>
            <Icon name="tablet" style={{ color: 'var(--text-muted)' }} />
            <div className="cl-meta" style={{ flex: 1 }}>
              <div className="cl-t">{d.name}</div>
              <div className="cl-d">{d.email}</div>
            </div>
            <button className="tbl-icon" title="Remove device" onClick={() => remove(i)}>
              <Icon name="delete" />
            </button>
          </div>
        ))}
        <div className="cfg-line" style={{ gap: 8 }}>
          <input
            className="fld"
            placeholder="Device name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="fld"
            placeholder="device@kindle.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="btn-sm"
            style={{ flex: 'none' }}
            disabled={!name.trim() || !email.trim()}
            onClick={add}
          >
            <Icon name="add" /> Add
          </button>
        </div>
      </div>
    </>
  )
}

// --- RSS feeds (read + close) ---
export function ConfigRss() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['admin', 'rss'],
    queryFn: getRssFeeds,
    staleTime: 30 * 1000,
  })
  const feeds = data?.feeds ?? []
  const close = async (id: string) => {
    await closeRssFeed(id)
    qc.invalidateQueries({ queryKey: ['admin', 'rss'] })
  }
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Admin</div>
        <h1 className="title-xl">RSS Feeds</h1>
        {data && <p className="page-sub">{feeds.length} open feeds</p>}
      </div>
      {!data ? (
        <LoadingSpinner className="py-12" label="Loading..." />
      ) : feeds.length === 0 ? (
        <div className="empty-state">
          <Icon name="rss_feed" />
          <h3>No open RSS feeds</h3>
          <p>Open a feed from a book, series, or collection to share it.</p>
        </div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Feed</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feeds.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600 }}>{f.meta?.title ?? f.feedUrl}</td>
                  <td>{f.entityType}</td>
                  <td>
                    <div className="t-actions">
                      <button
                        className="tbl-icon"
                        title="Close feed"
                        onClick={() => void close(f.id)}
                      >
                        <Icon name="close" />
                      </button>
                    </div>
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

// --- Authentication (editable: method toggles + OIDC form) ---
export function ConfigAuth() {
  const { data } = useQuery({
    queryKey: ['admin', 'auth'],
    queryFn: getAuthSettings,
    staleTime: 60 * 1000,
  })

  if (!data) {
    return (
      <>
        <div className="page-head">
          <div className="eyebrow">Admin</div>
          <h1 className="title-xl">Authentication</h1>
        </div>
        <LoadingSpinner className="py-12" label="Loading..." />
      </>
    )
  }

  return <AuthForm key={JSON.stringify(data)} settings={data} />
}

function AuthForm({ settings }: { settings: ABSAuthSettings }) {
  const qc = useQueryClient()

  const [methods, setMethods] = useState<string[]>(
    settings.authActiveAuthMethods ?? ['local']
  )
  const [oidc, setOidc] = useState({
    authOpenIDIssuerURL: settings.authOpenIDIssuerURL ?? '',
    authOpenIDClientID: settings.authOpenIDClientID ?? '',
    authOpenIDButtonText: settings.authOpenIDButtonText ?? '',
    authOpenIDAutoLaunch: settings.authOpenIDAutoLaunch ?? false,
    authOpenIDAutoRegister: settings.authOpenIDAutoRegister ?? false,
  })
  const [clientSecret, setClientSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const openidOn = methods.includes('openid')
  const toggleMethod = (m: string) => {
    setMethods((cur) =>
      cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]
    )
  }

  const save = async () => {
    setSaving(true)
    try {
      const patch: Partial<ABSAuthSettings> & { authOpenIDClientSecret?: string } = {
        authActiveAuthMethods: methods.length ? methods : ['local'],
        ...oidc,
        authOpenIDIssuerURL: oidc.authOpenIDIssuerURL || null,
        authOpenIDClientID: oidc.authOpenIDClientID || null,
        authOpenIDButtonText: oidc.authOpenIDButtonText || null,
        ...(clientSecret ? { authOpenIDClientSecret: clientSecret } : {}),
      }
      await updateAuthSettings(patch)
      setClientSecret('')
      qc.invalidateQueries({ queryKey: ['admin', 'auth'] })
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
        <h1 className="title-xl">Authentication</h1>
      </div>

      <div className="cfg-card">
        <div className="cfg-line">
          <Icon name="password" style={{ color: 'var(--text-muted)' }} />
          <div className="cl-meta" style={{ flex: 1 }}>
            <div className="cl-t">Local accounts</div>
            <div className="cl-d">Username and password sign-in.</div>
          </div>
          <button
            className={methods.includes('local') ? 'toggle on' : 'toggle'}
            aria-pressed={methods.includes('local')}
            onClick={() => toggleMethod('local')}
          >
            <i />
          </button>
        </div>
        <div className="cfg-line">
          <Icon name="key" style={{ color: 'var(--text-muted)' }} />
          <div className="cl-meta" style={{ flex: 1 }}>
            <div className="cl-t">OpenID Connect</div>
            <div className="cl-d">Single sign-on through an identity provider.</div>
          </div>
          <button
            className={openidOn ? 'toggle on' : 'toggle'}
            aria-pressed={openidOn}
            onClick={() => toggleMethod('openid')}
          >
            <i />
          </button>
        </div>
      </div>

      {openidOn && (
        <>
          <div className="section-head" style={{ marginTop: 'var(--s6)' }}>
            <Icon name="key" />
            <h2>OpenID Connect</h2>
          </div>
          <div className="cfg-card">
            <Field label="Issuer URL">
              <input
                className="fld"
                placeholder="https://idp.example.com"
                value={oidc.authOpenIDIssuerURL}
                onChange={(e) => setOidc((o) => ({ ...o, authOpenIDIssuerURL: e.target.value }))}
              />
            </Field>
            <Field label="Client ID">
              <input
                className="fld"
                value={oidc.authOpenIDClientID}
                onChange={(e) => setOidc((o) => ({ ...o, authOpenIDClientID: e.target.value }))}
              />
            </Field>
            <Field label="Client secret">
              <input
                className="fld"
                type="password"
                placeholder={settings.authOpenIDClientID ? 'Leave blank to keep current' : ''}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </Field>
            <Field label="Button text">
              <input
                className="fld"
                placeholder="Sign in with SSO"
                value={oidc.authOpenIDButtonText}
                onChange={(e) => setOidc((o) => ({ ...o, authOpenIDButtonText: e.target.value }))}
              />
            </Field>
            <div className="cfg-line">
              <Icon name="rocket_launch" style={{ color: 'var(--text-muted)' }} />
              <div className="cl-meta" style={{ flex: 1 }}>
                <div className="cl-t">Auto-launch</div>
                <div className="cl-d">Skip the login screen and go straight to the provider.</div>
              </div>
              <button
                className={oidc.authOpenIDAutoLaunch ? 'toggle on' : 'toggle'}
                aria-pressed={oidc.authOpenIDAutoLaunch}
                onClick={() => setOidc((o) => ({ ...o, authOpenIDAutoLaunch: !o.authOpenIDAutoLaunch }))}
              >
                <i />
              </button>
            </div>
            <div className="cfg-line">
              <Icon name="person_add" style={{ color: 'var(--text-muted)' }} />
              <div className="cl-meta" style={{ flex: 1 }}>
                <div className="cl-t">Auto-register</div>
                <div className="cl-d">Create an account on first sign-in.</div>
              </div>
              <button
                className={oidc.authOpenIDAutoRegister ? 'toggle on' : 'toggle'}
                aria-pressed={oidc.authOpenIDAutoRegister}
                onClick={() => setOidc((o) => ({ ...o, authOpenIDAutoRegister: !o.authOpenIDAutoRegister }))}
              >
                <i />
              </button>
            </div>
          </div>
        </>
      )}

      <div className="cfg-line" style={{ gap: 8, justifyContent: 'flex-end', marginTop: 'var(--s5)' }}>
        <button className="btn-sm btn-green" disabled={saving} onClick={() => void save()}>
          {saved ? <Icon name="check" /> : <Icon name="save" />} {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </>
  )
}

// ReadMeABook connection status. Config is server-side (RMAB_URL +
// RMAB_LOGIN_TOKEN env); the token is never editable from the browser, so this
// card reports connection state and points admins at the env setup.
function RmabIntegrationCard() {
  const { data, isLoading } = useRmabConfig()
  const connected = data?.configured === true
  return (
    <div style={{ marginBottom: 'var(--s7)' }}>
      <div className="section-head">
        <Icon name="bolt" />
        <h2>ReadMeABook</h2>
      </div>
      <div className="cfg-card">
        <div className="cfg-line">
          <Icon
            name={connected ? 'check_circle' : 'cancel'}
            fill
            style={{ color: connected ? '#5a9c52' : 'var(--text-faint)' }}
          />
          <div className="cl-meta">
            <div className="cl-t">{connected ? 'Connected' : 'Not connected'}</div>
            <div className="cl-d">
              {isLoading
                ? 'Checking...'
                : connected
                  ? 'Requesting is available across HearthShelf.'
                  : 'Set RMAB_URL and RMAB_LOGIN_TOKEN to enable requesting. The login token comes from an RMAB admin (Users > Login Token); give that service account the admin role.'}
            </div>
          </div>
          <span
            className="badge-pill"
            style={{
              background: connected
                ? 'color-mix(in oklab, #5a9c52 20%, transparent)'
                : 'var(--fill)',
              color: connected ? '#7fbd6f' : 'var(--text-muted)',
            }}
          >
            {connected ? 'Active' : 'Off'}
          </span>
        </div>
      </div>
    </div>
  )
}

// Audplexus connection + library-sync health. Config is server-side (AUDPLEXUS_URL
// + AUDPLEXUS_KEY env). When connected, surfaces a sync-issue alert so admins know
// when owned books don't line up with what's actually in ABS.
function AudplexusIntegrationCard() {
  const { data: cfg, isLoading } = useAudplexusConfig()
  const connected = cfg?.configured === true
  const { data: status } = useAudplexusStatus(connected)

  const issues = status?.booksFailed ?? 0
  const alert = status?.hasIssues === true

  return (
    <div style={{ marginBottom: 'var(--s7)' }}>
      <div className="section-head">
        <Icon name="sync" />
        <h2>Audplexus</h2>
      </div>
      <div className="cfg-card">
        <div className="cfg-line">
          <Icon
            name={connected ? 'check_circle' : 'cancel'}
            fill
            style={{ color: connected ? '#5a9c52' : 'var(--text-faint)' }}
          />
          <div className="cl-meta">
            <div className="cl-t">{connected ? 'Connected' : 'Not connected'}</div>
            <div className="cl-d">
              {isLoading
                ? 'Checking...'
                : connected
                  ? 'Watching your library for sync issues with AudiobookShelf.'
                  : 'Set AUDPLEXUS_URL and AUDPLEXUS_KEY to monitor library sync health.'}
            </div>
          </div>
          <span
            className="badge-pill"
            style={{
              background: connected
                ? 'color-mix(in oklab, #5a9c52 20%, transparent)'
                : 'var(--fill)',
              color: connected ? '#7fbd6f' : 'var(--text-muted)',
            }}
          >
            {connected ? 'Active' : 'Off'}
          </span>
        </div>

        {connected && status && (
          <div className="cfg-line">
            <Icon
              name={alert ? 'warning' : 'task_alt'}
              fill
              style={{ color: alert ? '#d9a45a' : '#5a9c52' }}
            />
            <div className="cl-meta">
              <div className="cl-t">
                {status.running
                  ? 'Sync running...'
                  : alert
                    ? `${issues} book${issues === 1 ? '' : 's'} need attention`
                    : 'Library in sync'}
              </div>
              <div className="cl-d">
                {status.error
                  ? status.error
                  : `${status.booksTotal} books tracked${status.completedAt ? ' · last synced ' + new Date(status.completedAt).toLocaleString() : ''}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Integrations (read) ---
export function ConfigIntegrations() {
  const { data } = useQuery({
    queryKey: ['admin', 'custom-providers'],
    queryFn: getCustomProviders,
    staleTime: 60 * 1000,
  })
  const providers = data?.providers ?? []
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Admin</div>
        <h1 className="title-xl">Integrations</h1>
      </div>

      <RmabIntegrationCard />

      <AudplexusIntegrationCard />

      <div className="section-head">
        <Icon name="travel_explore" />
        <h2>Custom metadata providers</h2>
      </div>
      {!data ? (
        <LoadingSpinner className="py-8" label="Loading..." />
      ) : providers.length === 0 ? (
        <div className="empty-state">
          <Icon name="extension_off" />
          <h3>No custom providers</h3>
          <p>Built-in providers (Audible, Google, iTunes, Open Library) are always available.</p>
        </div>
      ) : (
        <div className="cfg-card">
          {providers.map((p) => (
            <Row key={p.id} icon="travel_explore" label={p.name} value={p.url} />
          ))}
        </div>
      )}
    </>
  )
}
