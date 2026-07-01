// A Plex-style LAN -> WAN -> Cloud connectivity map for the Connect screen. Each
// hop is colored from real signals so the admin can see exactly how far a
// connection gets and where it breaks:
//
//   [This server] --LAN--> [Your router : 443] --internet--> [HearthShelf cloud]
//
//   - server node: always "up" (we're rendering on it).
//   - router/WAN hop: green when the public reachability probe succeeded (port
//     forwarded), amber when it failed, grey when not yet tested.
//   - cloud node: green when paired with app.hearthshelf.com.
//   - secure-address note: from hs.direct cert state.

interface ConnectivityDiagramProps {
  paired: boolean
  // Port reachability result: true = reachable from the internet, false = probed
  // but unreachable, null = not tested yet.
  reachable: boolean | null
  // The actual port being forwarded/probed (from the public URL), or null until
  // tested. We never hardcode 443 - hs.direct serves on its own port.
  port: number | null
  // hs.direct cert state: 'active' once a valid HTTPS address is provisioned.
  certActive: boolean
  serverName: string
}

const OK = '#5a9c52'
const WARN = '#d9a45a'
const IDLE = 'var(--text-muted)'

export function ConnectivityDiagram({
  paired,
  reachable,
  port,
  certActive,
  serverName,
}: ConnectivityDiagramProps) {
  const portLabel = port ? `Port ${port}` : 'Port'
  // Hop colors.
  const lanColor = OK // the server itself is up
  const wanColor = reachable === true ? OK : reachable === false ? WARN : IDLE
  const cloudColor = paired ? OK : IDLE
  // The internet link (router -> cloud) is only "good" when reachable AND paired.
  const internetColor = paired && reachable === true ? OK : reachable === false ? WARN : IDLE

  const wanLabel = reachable === true ? 'Open' : reachable === false ? 'Closed' : 'Untested'

  return (
    <div className="cfg-card" style={{ marginTop: 'var(--s4)' }}>
      <svg
        viewBox="0 0 520 150"
        width="100%"
        role="img"
        aria-label="Connectivity map"
        style={{ maxWidth: 520 }}
      >
        {/* link: server -> router (LAN, always local-good) */}
        <line x1="92" y1="60" x2="200" y2="60" stroke={lanColor} strokeWidth="3" />
        <text x="146" y="50" textAnchor="middle" fontSize="11" fill="var(--text-muted)">
          LAN
        </text>

        {/* link: router -> cloud (the internet hop) */}
        <line
          x1="320"
          y1="60"
          x2="428"
          y2="60"
          stroke={internetColor}
          strokeWidth="3"
          strokeDasharray={internetColor === IDLE ? '5 5' : undefined}
        />
        <text x="374" y="50" textAnchor="middle" fontSize="11" fill="var(--text-muted)">
          Internet{port ? ` · ${port}` : ''}
        </text>

        {/* node: this server (LAN) */}
        <Node
          x={20}
          color={lanColor}
          icon="dns"
          title={serverName || 'This server'}
          sub="Your home"
        />
        {/* node: router / public IP (WAN) */}
        <Node
          x={228}
          color={wanColor}
          icon="router"
          title="Your router"
          sub={`${portLabel} · ${wanLabel}`}
        />
        {/* node: HearthShelf cloud */}
        <Node
          x={436}
          color={cloudColor}
          icon="cloud"
          title="HearthShelf"
          sub={paired ? 'Connected' : 'Not linked'}
        />
      </svg>

      <div className="sr-d" style={{ marginTop: 'var(--s2)', lineHeight: 1.5 }}>
        {paired && reachable === true && (
          <span style={{ color: OK }}>
            {serverName || 'Your server'} is reachable from anywhere.
          </span>
        )}
        {paired && reachable === false && (
          <span style={{ color: WARN }}>
            Connected to the cloud, but the internet can’t reach your server - your router needs to
            forward <strong>port {port ?? '(your port)'}</strong> to this machine. It still works on
            your home network.
          </span>
        )}
        {paired && reachable === null && (
          <span>Connected. Run the reachability check below to test outside access.</span>
        )}
        {!paired && <span>Not connected to app.hearthshelf.com yet.</span>}
        {paired && !certActive && (
          <span style={{ display: 'block', marginTop: 4 }}>
            Setting up your secure web address…
          </span>
        )}
      </div>
    </div>
  )
}

// One labelled node: a colored ring with a material icon, a title, and a sub.
function Node({
  x,
  color,
  icon,
  title,
  sub,
}: {
  x: number
  color: string
  icon: string
  title: string
  sub: string
}) {
  const cx = x + 36
  return (
    <g>
      <circle cx={cx} cy="60" r="26" fill="none" stroke={color} strokeWidth="3" />
      {/* Material Symbols glyph via the .ms font (foreignObject so it renders the
          ligature like elsewhere in the app). */}
      <foreignObject x={cx - 16} y="44" width="32" height="32">
        <span
          className="ms"
          style={{ fontSize: 26, color, lineHeight: '32px', display: 'block', textAlign: 'center' }}
        >
          {icon}
        </span>
      </foreignObject>
      <text
        x={cx}
        y="104"
        textAnchor="middle"
        fontSize="12"
        fontWeight="600"
        fill="var(--foreground)"
      >
        {title.length > 14 ? title.slice(0, 13) + '…' : title}
      </text>
      <text x={cx} y="120" textAnchor="middle" fontSize="10.5" fill="var(--text-muted)">
        {sub}
      </text>
    </g>
  )
}
