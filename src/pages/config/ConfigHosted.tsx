import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useToast } from '@/hooks/useToast'
import {
  getHostedStatus,
  startPairing,
  inviteFromServer,
  type PairResult,
} from '@/api/hosted'

// Connect this self-hosted instance to app.hearthshelf.com so people can reach
// it from one place (like signing in to your Plex account), and invite people
// to it by email. The actual accounts and access live on the control plane;
// here we just pair and send invites.
export function ConfigHosted() {
  const qc = useQueryClient()
  const { toast, show } = useToast()

  const { data: status, isLoading } = useQuery({
    queryKey: ['hosted-status'],
    queryFn: getHostedStatus,
    staleTime: 15 * 1000,
  })

  const [pairResult, setPairResult] = useState<PairResult | null>(null)
  const pair = useMutation({
    mutationFn: () => startPairing(),
    onSuccess: (r) => {
      setPairResult(r)
      qc.invalidateQueries({ queryKey: ['hosted-status'] })
      show('Pairing started - enter the code on app.hearthshelf.com')
    },
    onError: (e: Error) => show(e.message || 'Could not start pairing'),
  })

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'user'>('user')
  const invite = useMutation({
    mutationFn: () => inviteFromServer(email.trim(), role),
    onSuccess: (r) => {
      show(r.emailed ? `Invited ${r.email} - email sent` : `Invited ${r.email}`)
      setEmail('')
    },
    onError: (e: Error) => show(e.message || 'Invite failed'),
  })

  if (isLoading || !status) {
    return (
      <>
        <div className="page-head">
          <div className="eyebrow">Admin</div>
          <h1 className="title-xl">HearthShelf Connect</h1>
        </div>
        <LoadingSpinner className="py-12" label="Loading..." />
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Admin</div>
        <h1 className="title-xl">HearthShelf Connect</h1>
        <p className="page-sub">
          Connect this server to app.hearthshelf.com so people can reach it from
          one place, and invite people to it by email.
        </p>
      </div>

      <div className="section-head">
        <Icon name="link" />
        <h2>Connection</h2>
      </div>
      <div className="cfg-card">
        <div className="set-row">
          <div className="sr-meta">
            <div className="sr-t">
              {status.paired ? 'Connected to app.hearthshelf.com' : 'Not connected'}
            </div>
            <div className="sr-d">
              {status.paired
                ? `Linked to ${status.issuer}. People you invite can reach this server from the hosted app.`
                : 'Pair this server to let people sign in once at app.hearthshelf.com and reach it from there.'}
            </div>
          </div>
          <button className="btn" disabled={pair.isPending} onClick={() => pair.mutate()}>
            <Icon name={status.paired ? 'sync' : 'add_link'} />
            {pair.isPending ? 'Starting…' : status.paired ? 'Re-pair' : 'Connect'}
          </button>
        </div>

        {pairResult && (
          <div className="banner info" style={{ marginTop: 'var(--s4)' }}>
            <Icon name="key" />
            <div>
              Enter this code on <strong>app.hearthshelf.com</strong> to finish
              connecting:
              <div
                className="t-mono"
                style={{ fontSize: '1.4rem', letterSpacing: '0.1em', marginTop: 6 }}
              >
                {pairResult.code}
              </div>
            </div>
          </div>
        )}

        {!status.hasAbsAdminToken && status.paired && (
          <div className="banner warn" style={{ marginTop: 'var(--s4)' }}>
            <Icon name="warning" />
            No admin token saved for provisioning - invited users can't be created
            automatically until this is set.
          </div>
        )}
      </div>

      <div className="section-head" style={{ marginTop: 'var(--s6)' }}>
        <Icon name="person_add" />
        <h2>Invite people</h2>
      </div>
      <div className="cfg-card">
        {!status.paired ? (
          <div className="banner info">
            <Icon name="info" />
            Connect this server above before inviting people.
          </div>
        ) : (
          <>
            <div className="field full">
              <label>Email address</label>
              <input
                className="fld"
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field full">
              <label>Role</label>
              <select
                className="fld"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              className="btn btn-primary"
              disabled={invite.isPending || !email.trim()}
              onClick={() => invite.mutate()}
              style={{ marginTop: 'var(--s2)' }}
            >
              <Icon name="send" /> {invite.isPending ? 'Sending…' : 'Send invite'}
            </button>
          </>
        )}
      </div>

      {toast && (
        <div className="p-toast">
          <Icon name="check_circle" fill /> {toast}
        </div>
      )}
    </>
  )
}
