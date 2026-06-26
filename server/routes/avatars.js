// Profile photos. Mounted at /hs/avatars/:userId.
//
//   GET    /hs/avatars/:userId  -> the image bytes (public; photos aren't secret
//                                  and <img> tags can't send auth headers). 404
//                                  when the user has no avatar.
//   PUT    /hs/avatars/:userId  -> upload/replace. Body is the raw image bytes,
//                                  Content-Type is the format. Allowed: self, or
//                                  any admin (admins manage anyone's photo).
//   DELETE /hs/avatars/:userId  -> clear it. Same permission rule as PUT.
//
// The browser resizes/crops to a small square before PUT, so the backend stays
// dependency-free (see lib/avatars.js).

import { json, readBodyBuffer } from '../lib/http.js'
import { isAdmin } from '../lib/context.js'
import { getServerId } from '../db.js'
import {
  readAvatar,
  writeAvatar,
  deleteAvatar,
  extForType,
  MAX_AVATAR_BYTES,
} from '../lib/avatars.js'

export async function handleAvatars(req, res, url, ctx) {
  const m = url.pathname.match(/^\/hs\/avatars\/([^/]+)$/)
  if (!m) return false
  const targetUserId = decodeURIComponent(m[1])

  // GET is public so <img src> works without a token. It still namespaces by the
  // instance's server_id, which the route resolves on its own.
  if (req.method === 'GET') {
    const serverId = await getServerId()
    const avatar = await readAvatar(serverId, targetUserId)
    if (!avatar) return (json(res, 404, { error: 'no_avatar' }), true)
    res.writeHead(200, {
      'Content-Type': avatar.contentType,
      'Content-Length': avatar.buf.length,
      // The path includes no version, so allow caching but let the client
      // cache-bust with a ?v= query param after an upload.
      'Cache-Control': 'public, max-age=300',
    })
    res.end(avatar.buf)
    return true
  }

  // Writes require auth: the user themselves, or any admin.
  if (!ctx) return (json(res, 401, { error: 'unauthorized' }), true)
  const isSelf = ctx.userId === targetUserId
  if (!isSelf && !isAdmin(ctx)) {
    return (json(res, 403, { error: 'forbidden' }), true)
  }
  const serverId = ctx.serverId

  if (req.method === 'PUT') {
    const contentType = (req.headers['content-type'] || '').split(';')[0].trim()
    if (!extForType(contentType)) {
      return (json(res, 415, { error: 'unsupported_type' }), true)
    }
    let buf
    try {
      buf = await readBodyBuffer(req, MAX_AVATAR_BYTES)
    } catch (err) {
      if (err?.code === 'payload_too_large') {
        return (json(res, 413, { error: 'too_large' }), true)
      }
      return (json(res, 400, { error: 'read_failed' }), true)
    }
    if (!buf.length) return (json(res, 400, { error: 'empty' }), true)
    const { version } = await writeAvatar(serverId, targetUserId, contentType, buf)
    return (json(res, 200, { ok: true, version }), true)
  }

  if (req.method === 'DELETE') {
    await deleteAvatar(serverId, targetUserId)
    return (json(res, 200, { ok: true }), true)
  }

  return (json(res, 405, { error: 'method_not_allowed' }), true)
}
