import { Icon } from '@/components/common/Icon'

// Short, port-forward-focused help for the Connect step. hs.direct gives the box
// a valid HTTPS address automatically, so the only thing a self-hoster usually
// has to do is let inbound traffic reach the box - i.e. forward a port on the
// router. Kept brief and height-capped (scrolls) so it never runs off-screen.
// Detailed networking lives in the docs, not here.
export function ReachabilityHelp({ open = false, port }: { open?: boolean; port?: number | null }) {
  return (
    <details className="cfg-card" open={open} style={{ marginTop: 'var(--s3)' }}>
      <summary
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}
      >
        <Icon name="help" />
        <span className="sr-t">Why can’t it reach my server?</span>
      </summary>

      <div
        className="sr-d"
        style={{ marginTop: 'var(--s3)', maxHeight: '40vh', overflowY: 'auto' }}
      >
        <p style={{ margin: '0 0 var(--s3)' }}>
          HearthShelf sets up the secure web address for you (hs.direct) - you
          don’t need your own domain. The one thing it can’t do for you is open
          your home network: your router has to let the connection in.
        </p>
        <p style={{ margin: '0 0 var(--s3)' }}>
          In your router’s settings, <strong>forward port {port ?? '(your server’s port)'}</strong>{' '}
          to this machine’s local address. The exact page is usually called{' '}
          <em>Port Forwarding</em> or <em>Virtual Server</em>. After that, come
          back and test again.
        </p>
        <p style={{ margin: 0, color: 'var(--muted-foreground)' }}>
          If your internet provider uses CGNAT (common on cellular or some fiber),
          port forwarding may not be possible - you can still connect now and your
          library will work on your home network.
        </p>
      </div>
    </details>
  )
}
