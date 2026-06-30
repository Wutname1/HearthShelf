// Narrator photos. Mounted at /hs/narrators/:name/image.
//
//   GET    /hs/narrators/:name/image  -> the image bytes (public; <img> tags
//                                        can't send auth headers). 404 when the
//                                        narrator has no uploaded photo.
//   PUT    /hs/narrators/:name/image  -> upload/replace. Body is the raw image
//                                        bytes, Content-Type is the format.
//                                        Admin only (narrators are library content).
//   DELETE /hs/narrators/:name/image  -> clear it. Admin only.
//   GET    /hs/narrators/images       -> list of narrator names that have a photo.
//
// ABS has no narrator record, so this is a HearthShelf-native feature: one photo
// per narrator NAME, server-wide. The browser resizes/crops to a small square
// before PUT, so the backend stays dependency-free (see lib/narratorImages.js).

import { json, readBodyBuffer } from '../lib/http.js'
import { isAdmin } from '../lib/context.js'
import { getServerId } from '../db.js'
import {
  readNarratorImage,
  writeNarratorImage,
  deleteNarratorImage,
  listNarratorImageNames,
  extForType,
  MAX_NARRATOR_IMAGE_BYTES,
} from '../lib/narratorImages.js'

export async function handleNarrators(req, res, url, ctx) {
  const p = url.pathname
  if (!p.startsWith('/hs/narrators')) return false

  // List which narrators have a photo (for badges / the management table).
  if (req.method === 'GET' && p === '/hs/narrators/images') {
    const serverId = await getServerId()
    const names = await listNarratorImageNames(serverId)
    return (json(res, 200, { names }), true)
  }

  const m = p.match(/^\/hs\/narrators\/([^/]+)\/image$/)
  if (!m) return false
  const name = decodeURIComponent(m[1])

  // GET is public so <img src> works without a token, namespaced by server_id.
  if (req.method === 'GET') {
    const serverId = await getServerId()
    const img = await readNarratorImage(serverId, name)
    if (!img) return (json(res, 404, { error: 'no_image' }), true)
    res.writeHead(200, {
      'Content-Type': img.contentType,
      'Content-Length': img.buf.length,
      // No version in the path; the client cache-busts with ?v= after an upload.
      'Cache-Control': 'public, max-age=300',
    })
    res.end(img.buf)
    return true
  }

  // Writes require an admin (narrators are shared library content).
  if (!ctx) return (json(res, 401, { error: 'unauthorized' }), true)
  if (!isAdmin(ctx)) return (json(res, 403, { error: 'forbidden' }), true)
  const serverId = ctx.serverId

  if (req.method === 'PUT') {
    const contentType = (req.headers['content-type'] || '').split(';')[0].trim()
    if (!extForType(contentType)) {
      return (json(res, 415, { error: 'unsupported_type' }), true)
    }
    let buf
    try {
      buf = await readBodyBuffer(req, MAX_NARRATOR_IMAGE_BYTES)
    } catch (err) {
      if (err?.code === 'payload_too_large') {
        return (json(res, 413, { error: 'too_large' }), true)
      }
      return (json(res, 400, { error: 'read_failed' }), true)
    }
    if (!buf.length) return (json(res, 400, { error: 'empty' }), true)
    const { version } = await writeNarratorImage(serverId, name, contentType, buf)
    return (json(res, 200, { ok: true, version }), true)
  }

  if (req.method === 'DELETE') {
    await deleteNarratorImage(serverId, name)
    return (json(res, 200, { ok: true }), true)
  }

  return (json(res, 405, { error: 'method_not_allowed' }), true)
}
