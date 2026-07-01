// Audplexus proxy. Audplexus is an admin-facing library-sync diagnostics
// service (does HearthShelf's owned library match what's actually in ABS?).
// Mounted under /hs/audplexus/*. Admin-only; the API key stays server-side.
//
// Connection config (url + key) lives in the integrations_config table, editable
// from Config > Integrations and seeded from AUDPLEXUS_URL / AUDPLEXUS_KEY on
// first boot. See server/integrations.js.

import { json } from '../lib/http.js'
import { isAdmin } from '../lib/context.js'
import { getIntegrations } from '../integrations.js'

const TIMEOUT_MS = 15000

export async function isAudplexusConfigured() {
  const { audplexusUrl, audplexusKey } = await getIntegrations()
  return Boolean(audplexusUrl && audplexusKey)
}

// Forward an authenticated GET to Audplexus. Returns { status, body }.
async function apxFetch(path) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const { audplexusUrl, audplexusKey } = await getIntegrations()
    const res = await fetch(`${audplexusUrl}${path}`, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json', Authorization: `Bearer ${audplexusKey}` },
    })
    let parsed = null
    try {
      parsed = await res.json()
    } catch {
      parsed = null
    }
    return { status: res.status, body: parsed }
  } finally {
    clearTimeout(t)
  }
}

export async function handleAudplexus(req, res, url, ctx) {
  const p = url.pathname

  // Connection state. Admin-only (Audplexus is an admin diagnostics tool).
  if (p === '/hs/audplexus/config') {
    if (!ctx) return (json(res, 401, { error: 'unauthorized' }), true)
    if (!isAdmin(ctx)) return (json(res, 200, { configured: false }), true)
    return (json(res, 200, { configured: await isAudplexusConfigured() }), true)
  }

  if (!p.startsWith('/hs/audplexus/')) return false
  if (!ctx) return (json(res, 401, { error: 'unauthorized' }), true)
  if (!isAdmin(ctx)) return (json(res, 403, { error: 'forbidden' }), true)
  if (!(await isAudplexusConfigured()))
    return (json(res, 503, { error: 'audplexus_unavailable' }), true)

  try {
    // Sync-status + library-health summary.
    if (req.method === 'GET' && p === '/hs/audplexus/status') {
      const r = await apxFetch('/api/sync/status.json')
      return (json(res, r.status, r.body ?? {}), true)
    }
  } catch (err) {
    return (json(res, 502, { error: 'audplexus_error', detail: String(err).slice(0, 200) }), true)
  }

  return (json(res, 404, { error: 'not_found' }), true)
}
