// Per-user app settings sync. Mounted at /hs/settings. Settings follow a user
// across devices, keyed by (server_id, user_id).

import { json, readBody } from '../lib/http.js'
import { getSettings, setSettings } from '../settings.js'

export async function handleSettings(req, res, url, ctx) {
  if (url.pathname !== '/hs/settings') return false
  if (!ctx) return (json(res, 401, { error: 'unauthorized' }), true)

  if (req.method === 'GET') {
    const { values, updatedAt } = await getSettings(ctx.serverId, ctx.userId)
    return (json(res, 200, { values, updatedAt }), true)
  }
  if (req.method === 'PUT') {
    let body
    try {
      body = JSON.parse(await readBody(req))
    } catch {
      return (json(res, 400, { error: 'invalid_body' }), true)
    }
    const values = body?.values
    if (values == null || typeof values !== 'object') {
      return (json(res, 400, { error: 'invalid_values' }), true)
    }
    const saved = await setSettings(ctx.serverId, ctx.userId, values)
    return (json(res, 200, { values: saved.values, updatedAt: saved.updatedAt }), true)
  }
  return (json(res, 405, { error: 'method_not_allowed' }), true)
}
