// Request context resolution - the seam between deployment modes.
//
// Every route handler receives a `ctx` instead of reaching for a global
// ABS_URL or re-deriving the user. A ctx is:
//   { absUrl, absToken, serverId, userId, role }
// where role is 'user' | 'admin' | 'root' (mapped from ABS's user type).
//
// Self-hosted (today): one ABS server from the ABS_SERVER_URL env; the caller
// is identified by validating their bearer token against ABS /api/me; serverId
// is this instance's persisted id (see db.getServerId).
//
// Hosted (future, app.hearthshelf.com): the central app fronts many HearthShelf
// instances. Identity comes from the HearthShelf account (e.g. Clerk), whose
// verified email must match an ABS user; absUrl/serverId resolve per-account.
// That resolver is not built yet - resolveContext throws for it so the shape is
// fixed without committing an implementation.

import { getServerId } from '../db.js'

const ABS_URL = process.env.ABS_SERVER_URL || ''
// 'selfhosted' (default) or 'hosted'. Only selfhosted is implemented.
const MODE = (process.env.HS_MODE || 'selfhosted').toLowerCase()

function bearer(req) {
  const header = req.headers['authorization'] || ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

// Resolve the caller's context, or null if unauthenticated. Throws only for the
// not-yet-built hosted mode.
export async function resolveContext(req) {
  if (MODE === 'hosted') {
    // Future: map the HearthShelf account -> linked ABS server + token.
    throw new Error('hosted_mode_not_implemented')
  }
  return resolveSelfHosted(req)
}

async function resolveSelfHosted(req) {
  const token = bearer(req)
  if (!token || !ABS_URL) return null
  try {
    const res = await fetch(`${ABS_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const me = await res.json()
    if (!me?.id) return null
    const serverId = await getServerId()
    return {
      absUrl: ABS_URL,
      absToken: token,
      serverId,
      userId: me.id,
      role: me.type ?? 'user',
    }
  } catch {
    return null
  }
}

export function isAdmin(ctx) {
  return ctx?.role === 'admin' || ctx?.role === 'root'
}
