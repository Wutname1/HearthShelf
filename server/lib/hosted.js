// Hosted mode: trust app.hearthshelf.com to vouch for who the caller is, then
// act on ABS as that specific user.
//
// In self-hosted mode the caller proves identity by presenting an ABS bearer
// token directly (context.js validates it against ABS /api/me). In hosted mode
// the caller instead presents a short-lived GRANT issued by the control plane
// (the central app.hearthshelf.com Worker). The grant is a signed JWT that says
// "Clerk user X, verified email E, is linked to this server, role R". We verify
// that signature OFFLINE against the control plane's published keys (JWKS) - no
// callback, so this works even when the control plane is briefly down or this
// box is firewalled from it.
//
// A verified grant tells us the user's verified EMAIL, not an ABS token. ABS
// scopes all data per user, so we must turn that email into a per-user ABS
// credential. We do it the way ABS intends: holding an ABS admin token
// (configured at pairing time), we look the user up by email and mint a
// per-user ABS API key (POST /api/api-keys), which authenticates subsequent
// calls AS that user. The key is cached so we mint it once per user. No user
// passwords are ever stored.
//
// All trust config + the key cache live in the hosted_config / hosted_user_keys
// tables (see db.js). This module is only exercised when HS_MODE=hosted.

import { createRemoteJWKSet, jwtVerify } from 'jose'
import { db, initDb, getServerId } from '../db.js'

const ABS_URL = process.env.ABS_SERVER_URL || ''

let ready = null
function ensure() {
  if (!ready) ready = initDb()
  return ready
}

// --- hosted config ---------------------------------------------------------

export async function getHostedConfig() {
  await ensure()
  const r = await db.execute('SELECT * FROM hosted_config WHERE id = 1')
  const row = r.rows[0]
  if (!row) return null
  return {
    issuer: row.issuer ?? null,
    jwksUrl: row.jwks_url ?? null,
    serverSecret: row.server_secret ?? null,
    absAdminToken: row.abs_admin_token ?? null,
  }
}

export async function setHostedConfig(patch) {
  await ensure()
  const cur = (await getHostedConfig()) || {}
  const next = {
    issuer: patch.issuer ?? cur.issuer ?? null,
    jwksUrl: patch.jwksUrl ?? cur.jwksUrl ?? null,
    serverSecret: patch.serverSecret ?? cur.serverSecret ?? null,
    absAdminToken: patch.absAdminToken ?? cur.absAdminToken ?? null,
  }
  await db.execute({
    sql: `INSERT INTO hosted_config (id, issuer, jwks_url, server_secret, abs_admin_token, updated_at)
          VALUES (1, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            issuer = excluded.issuer,
            jwks_url = excluded.jwks_url,
            server_secret = excluded.server_secret,
            abs_admin_token = excluded.abs_admin_token,
            updated_at = excluded.updated_at`,
    args: [next.issuer, next.jwksUrl, next.serverSecret, next.absAdminToken, Date.now()],
  })
  return next
}

// --- grant verification (offline, JWKS-cached) -----------------------------

// One JWKS set per jwks_url, reused across requests (jose caches the fetched
// keys internally and refreshes them as needed - this is the "pin + cache"
// behaviour: HS follows the control plane's key rotation without manual steps).
const jwksByUrl = new Map()
function jwksFor(url) {
  let set = jwksByUrl.get(url)
  if (!set) {
    set = createRemoteJWKSet(new URL(url))
    jwksByUrl.set(url, set)
  }
  return set
}

// Verify a control-plane grant. Returns the trusted claims, or null if the
// grant is missing/invalid/expired or hosted mode isn't configured.
export async function verifyGrant(token) {
  if (!token) return null
  const cfg = await getHostedConfig()
  if (!cfg?.jwksUrl || !cfg?.issuer) return null

  const serverId = await getServerId()
  try {
    const { payload } = await jwtVerify(token, jwksFor(cfg.jwksUrl), {
      issuer: cfg.issuer,
      audience: serverId, // grant must be minted FOR this server
    })
    // The grant is the gate: only a verified email may be federated, because
    // ABS user-matching keys on it.
    if (payload.email_verified !== true) return null
    if (typeof payload.email !== 'string' || !payload.email) return null
    if (typeof payload.sub !== 'string' || !payload.sub) return null
    return {
      subject: payload.sub,
      email: payload.email,
      username: typeof payload.username === 'string' ? payload.username : '',
      role: payload.role === 'admin' ? 'admin' : 'user',
    }
  } catch {
    return null
  }
}

// --- ABS per-user credential resolution ------------------------------------

// Look up the ABS user whose (case-insensitive) email matches, using the admin
// token. ABS has no by-email query endpoint, so we list and match.
async function findAbsUserByEmail(adminToken, email) {
  const res = await fetch(`${ABS_URL}/api/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  const users = Array.isArray(data) ? data : data?.users || []
  const want = email.toLowerCase()
  return users.find((u) => (u.email || '').toLowerCase() === want) || null
}

// Mint a per-user ABS API key (acts AS that user on every subsequent call).
// The raw key is only returned by ABS at creation, so we capture and cache it.
async function mintAbsApiKey(adminToken, absUserId) {
  const res = await fetch(`${ABS_URL}/api/api-keys`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `hearthshelf-app:${absUserId}`,
      userId: absUserId,
      isActive: true,
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  // ABS returns the raw key once on creation (field has varied across builds;
  // accept the common spellings).
  return data?.apiKey || data?.key || data?.apiKey?.apiKey || null
}

async function getCachedKey(serverId, subject) {
  const r = await db.execute({
    sql: `SELECT abs_user_id, abs_api_key, role, synced_username FROM hosted_user_keys
          WHERE server_id = ? AND cp_subject = ?`,
    args: [serverId, subject],
  })
  const row = r.rows[0]
  if (!row) return null
  return {
    absUserId: String(row.abs_user_id),
    absApiKey: String(row.abs_api_key),
    role: row.role,
    syncedUsername: row.synced_username ?? null,
  }
}

async function cacheKey(serverId, subject, email, absUserId, absApiKey, role, syncedUsername) {
  await db.execute({
    sql: `INSERT INTO hosted_user_keys
            (server_id, cp_subject, email, abs_user_id, abs_api_key, role, synced_username, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (server_id, cp_subject) DO UPDATE SET
            email = excluded.email,
            abs_user_id = excluded.abs_user_id,
            abs_api_key = excluded.abs_api_key,
            role = excluded.role,
            synced_username = excluded.synced_username`,
    args: [serverId, subject, email, absUserId, absApiKey, role, syncedUsername ?? null, Date.now()],
  })
}

// Record the latest synced username without touching the key/role.
async function updateSyncedUsername(serverId, subject, username) {
  await db.execute({
    sql: `UPDATE hosted_user_keys SET synced_username = ? WHERE server_id = ? AND cp_subject = ?`,
    args: [username, serverId, subject],
  })
}

// Reconcile the ABS username to the Clerk username. Best-effort: a collision or
// any ABS error must NOT break the user's access - we just log and carry on, and
// it will retry on the next request. ABS accepts the new name via PATCH
// /api/users/:id { username }. Returns the username that is now in effect.
async function syncUsername(adminToken, absUserId, desired, current) {
  if (!desired || desired === current) return current
  try {
    const res = await fetch(`${ABS_URL}/api/users/${absUserId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: desired }),
    })
    if (!res.ok) {
      console.warn(`[hosted] username sync skipped for ${absUserId}: ABS returned ${res.status}`)
      return current
    }
    return desired
  } catch (err) {
    console.warn(`[hosted] username sync failed for ${absUserId}: ${String(err).slice(0, 120)}`)
    return current
  }
}

// Resolve a verified grant into the standard ctx the rest of the backend uses:
//   { absUrl, absToken, serverId, userId, role }
// absToken is a per-user ABS API key (minted once, cached). Returns null if the
// user can't be matched or a key can't be obtained.
export async function resolveHostedContext(token) {
  const claims = await verifyGrant(token)
  if (!claims) return null
  if (!ABS_URL) return null

  const cfg = await getHostedConfig()
  if (!cfg?.absAdminToken) return null
  const serverId = await getServerId()

  // Fast path: cached per-user key. Reconcile the username only when the grant's
  // Clerk username differs from what we last pushed (avoids an ABS write per
  // request); on success record the new value.
  const cached = await getCachedKey(serverId, claims.subject)
  if (cached) {
    if (claims.username && claims.username !== cached.syncedUsername) {
      const now = await syncUsername(cfg.absAdminToken, cached.absUserId, claims.username, cached.syncedUsername)
      if (now === claims.username) await updateSyncedUsername(serverId, claims.subject, claims.username)
    }
    return {
      absUrl: ABS_URL,
      absToken: cached.absApiKey,
      serverId,
      userId: cached.absUserId,
      role: claims.role || cached.role || 'user',
    }
  }

  // Cold path: match the ABS user by verified email, mint + cache a key, and
  // bring the ABS username in line with Clerk's.
  const absUser = await findAbsUserByEmail(cfg.absAdminToken, claims.email)
  if (!absUser?.id) return null
  const apiKey = await mintAbsApiKey(cfg.absAdminToken, absUser.id)
  if (!apiKey) return null
  const effectiveUsername = await syncUsername(
    cfg.absAdminToken,
    absUser.id,
    claims.username,
    absUser.username || ''
  )
  await cacheKey(serverId, claims.subject, claims.email, absUser.id, apiKey, claims.role, effectiveUsername)

  return {
    absUrl: ABS_URL,
    absToken: apiKey,
    serverId,
    userId: String(absUser.id),
    role: claims.role || 'user',
  }
}
