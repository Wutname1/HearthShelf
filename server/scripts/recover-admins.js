// On-box admin recovery CLI - the break-glass path that needs no working admin
// login at all. Run it from inside the HearthShelf container when every admin
// account has been disabled/locked and nobody can sign in to fix it.
//
// In the container the server lives at /app/server, so use the absolute path
// (works from any working directory - imports + deps resolve relative to the
// script file, not your cwd):
//
//   node /app/server/scripts/recover-admins.js            # re-enable ALL disabled admins
//   node /app/server/scripts/recover-admins.js jeremy     # re-enable just one (by username)
//   node /app/server/scripts/recover-admins.js --list     # show admins + their state, change nothing
//
// From a repo checkout instead: `node server/scripts/recover-admins.js`.
//
// This mirrors the hosted POST /hs/hosted/recover-admins endpoint but works
// offline and unpaired. It obtains an ABS admin credential WITHOUT a human login,
// trying in order:
//   1. ABS_ADMIN_TOKEN env / --token <jwt>      (any deployment)
//   2. the stored service-root token             (provisioning / hosted_config)
//   3. logging in as the AIO service-root        (rootUsername + saved password)
// then PATCHes every disabled admin/root account back to active via ABS's API.
// It never writes to ABS's database directly - ABS stays the sole writer of its
// own data, same invariant as absdb.js.
//
// Exit codes: 0 success (or nothing to do), 1 usage/precondition error, 2 could
// not obtain an admin credential, 3 ABS unreachable / rejected.
//
// The stored-token sources (hosted_config / provisioning) live in the HearthShelf
// DB, so those modules are imported dynamically AFTER --help is handled - opening
// the DB client eagerly would otherwise make even `--help` require a real DB.

const ABS_URL = (process.env.ABS_SERVER_URL || 'http://127.0.0.1:13378').replace(/\/$/, '')

function parseArgs(argv) {
  const args = { list: false, username: null, token: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--list' || a === '-l') args.list = true
    else if (a === '--token' || a === '-t') args.token = argv[++i] || null
    else if (a === '--help' || a === '-h') args.help = true
    else if (!a.startsWith('-')) args.username = a
  }
  return args
}

function usage() {
  // In the container the server is at /app/server, so show the absolute path -
  // that is what works from the Unraid/Docker console regardless of cwd.
  const self = '/app/server/scripts/recover-admins.js'
  console.log(
    [
      'Recover disabled HearthShelf/ABS admin accounts (run inside the container).',
      '',
      'Usage:',
      `  node ${self}              Re-enable all disabled admins`,
      `  node ${self} <username>   Re-enable one admin by username`,
      `  node ${self} --list       List admins and their state`,
      `  node ${self} --token JWT  Use a specific ABS admin token`,
      '',
      'Env:',
      '  ABS_SERVER_URL    ABS base URL (default http://127.0.0.1:13378)',
      '  ABS_ADMIN_TOKEN   An ABS admin/root token to authenticate with',
    ].join('\n')
  )
}

// Validate a token against ABS /api/me; returns it if it belongs to an
// admin/root, else null. Lets us skip dead/expired stored tokens cleanly.
async function tokenIsAdmin(token) {
  if (!token) return false
  try {
    const res = await fetch(`${ABS_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return false
    const me = await res.json()
    return me?.type === 'admin' || me?.type === 'root'
  } catch {
    return false
  }
}

// Log in to ABS with username/password and return the session token, or null.
async function loginForToken(username, password) {
  if (!username || !password) return null
  try {
    const res = await fetch(`${ABS_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.user?.token || null
  } catch {
    return null
  }
}

// Find an ABS admin credential without a human login, trying the cheapest /
// most-available source first. Returns { token, via } or null.
async function resolveAdminToken(explicitToken) {
  // 1. Explicit token (flag or env).
  const envToken = explicitToken || process.env.ABS_ADMIN_TOKEN || null
  if (envToken && (await tokenIsAdmin(envToken))) {
    return { token: envToken, via: 'token' }
  }

  // 2. Stored service tokens (paired hosted_config, then AIO provisioning).
  //    Imported here so the DB is only opened once we actually need it.
  const { getHostedConfig } = await import('../lib/hosted.js')
  const { getProvisioning } = await import('../lib/provisioning.js')
  const hosted = await getHostedConfig().catch(() => null)
  if (hosted?.absAdminToken && (await tokenIsAdmin(hosted.absAdminToken))) {
    return { token: hosted.absAdminToken, via: 'hosted_config' }
  }
  const prov = await getProvisioning().catch(() => null)
  if (prov?.adminToken && (await tokenIsAdmin(prov.adminToken))) {
    return { token: prov.adminToken, via: 'provisioning' }
  }

  // 3. AIO service-root login (the token may have expired; the saved password
  //    earns a fresh one). The service root is never disabled, so this is the
  //    most reliable on-box path.
  if (prov?.rootUsername && prov?.servicePassword) {
    const fresh = await loginForToken(prov.rootUsername, prov.servicePassword)
    if (fresh && (await tokenIsAdmin(fresh))) {
      return { token: fresh, via: 'service-root login' }
    }
  }

  return null
}

async function listUsers(token) {
  const res = await fetch(`${ABS_URL}/api/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`ABS /api/users returned ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : data?.users || []
}

async function reactivate(token, user) {
  const res = await fetch(`${ABS_URL}/api/users/${user.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive: true, isLocked: false }),
  })
  return res.ok
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    usage()
    process.exit(0)
  }

  const resolved = await resolveAdminToken(args.token)
  if (!resolved) {
    console.error(
      'Could not obtain an ABS admin credential. Pass one with --token <jwt> or\n' +
        'set ABS_ADMIN_TOKEN. On the all-in-one image this normally uses the saved\n' +
        'service-root account automatically; if that failed, the ABS root login is\n' +
        'the last resort (re-enable yourself from there).'
    )
    process.exit(2)
  }
  console.log(`Authenticated with ABS (via ${resolved.via}).`)

  let users
  try {
    users = await listUsers(resolved.token)
  } catch (err) {
    console.error(`ABS is unreachable or rejected the request: ${String(err.message || err)}`)
    process.exit(3)
  }

  const admins = users.filter((u) => u.type === 'admin' || u.type === 'root')

  if (args.list) {
    console.log('\nAdmin accounts:')
    for (const u of admins) {
      const state = !u.isActive ? 'DISABLED' : u.isLocked ? 'LOCKED' : 'active'
      console.log(`  ${u.username.padEnd(24)} ${u.type.padEnd(6)} ${state}`)
    }
    process.exit(0)
  }

  // Pick the targets: a named user (must be an admin), else every disabled/locked
  // admin. Enabling an already-active account is a harmless no-op, but we only
  // touch ones that actually need it so the summary is meaningful.
  let targets
  if (args.username) {
    const match = admins.find(
      (u) => u.username.toLowerCase() === args.username.toLowerCase()
    )
    if (!match) {
      console.error(`No admin account named "${args.username}". Use --list to see admins.`)
      process.exit(1)
    }
    targets = [match]
  } else {
    targets = admins.filter((u) => !u.isActive || u.isLocked)
  }

  if (targets.length === 0) {
    console.log('No disabled or locked admin accounts. Nothing to do.')
    process.exit(0)
  }

  let ok = 0
  for (const u of targets) {
    const done = await reactivate(resolved.token, u)
    console.log(`  ${done ? 'OK ' : 'FAIL'} ${u.username}`)
    if (done) ok++
  }
  console.log(`\nRe-enabled ${ok} of ${targets.length} admin account(s).`)
  process.exit(ok === targets.length ? 0 : 3)
}

main().catch((err) => {
  console.error(`Unexpected error: ${String(err?.stack || err)}`)
  process.exit(1)
})
