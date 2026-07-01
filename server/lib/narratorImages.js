// Narrator photos - a HearthShelf-native feature; ABS has NO concept of a
// narrator record (narrators are plain credit strings on items), so there is no
// ABS place to attach a photo. We store one image per narrator NAME, server-wide
// (a narrator is the same person across libraries), mirroring lib/avatars.js.
//
// Files live at QG_DATA_DIR/narrators/<server_id>_<namehash>.<ext> on the same
// volume as hearthshelf.db, so the existing backup story covers them. The DB row
// tracks the content type, extension, version (cache-bust), and the original name.

import path from 'node:path'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import { db, initDb } from '../db.js'
import { DB_DIR } from '../db.js'

const NARRATOR_DIR = path.join(DB_DIR, 'narrators')

// The browser sends a small square (~256px), so 2MB is generous headroom while
// refusing anything that didn't go through the client resize.
export const MAX_NARRATOR_IMAGE_BYTES = 2 * 1024 * 1024

const TYPE_EXT = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

export function extForType(contentType) {
  return TYPE_EXT[contentType] || null
}

// Narrators are matched by name across the whole server. Normalize (trim +
// lowercase) so "Jane Doe" and "jane doe " resolve to one photo, then hash for a
// filesystem-safe, fixed-length key.
export function narratorKey(name) {
  const normalized = String(name).trim().toLowerCase()
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 32)
}

async function ensureDir() {
  await fs.mkdir(NARRATOR_DIR, { recursive: true })
}

function fileName(serverId, key, ext) {
  const safe = (s) => String(s).replace(/[^a-zA-Z0-9_-]/g, '')
  return `${safe(serverId)}_${safe(key)}.${ext}`
}

// The image metadata for one narrator, or null if none.
export async function getNarratorImageMeta(serverId, name) {
  await initDb()
  const r = await db.execute({
    sql: `SELECT content_type, ext, version, updated_at
            FROM narrator_images WHERE server_id = ? AND name_key = ?`,
    args: [serverId, narratorKey(name)],
  })
  const row = r.rows[0]
  if (!row) return null
  return {
    contentType: String(row.content_type),
    ext: String(row.ext),
    version: Number(row.version),
    updatedAt: Number(row.updated_at),
  }
}

// Read the stored image bytes for one narrator, or null if missing.
export async function readNarratorImage(serverId, name) {
  const meta = await getNarratorImageMeta(serverId, name)
  if (!meta) return null
  try {
    const buf = await fs.readFile(
      path.join(NARRATOR_DIR, fileName(serverId, narratorKey(name), meta.ext)),
    )
    return { buf, contentType: meta.contentType, version: meta.version }
  } catch {
    return null
  }
}

// Store (or replace) a narrator's photo. Bumps the version so clients cache-bust.
export async function writeNarratorImage(serverId, name, contentType, buf) {
  const ext = extForType(contentType)
  if (!ext) throw new Error('unsupported_type')
  await ensureDir()
  await initDb()

  const key = narratorKey(name)
  const prev = await getNarratorImageMeta(serverId, name)
  if (prev && prev.ext !== ext) {
    await fs
      .rm(path.join(NARRATOR_DIR, fileName(serverId, key, prev.ext)), { force: true })
      .catch(() => {})
  }

  await fs.writeFile(path.join(NARRATOR_DIR, fileName(serverId, key, ext)), buf)
  const version = prev ? prev.version + 1 : 1
  await db.execute({
    sql: `INSERT INTO narrator_images (server_id, name_key, name, content_type, ext, version, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(server_id, name_key) DO UPDATE SET
            name = excluded.name,
            content_type = excluded.content_type,
            ext = excluded.ext,
            version = excluded.version,
            updated_at = excluded.updated_at`,
    args: [serverId, key, String(name).trim(), contentType, ext, version, Date.now()],
  })
  return { version }
}

// Remove a narrator's photo (row + file). No-op if none.
export async function deleteNarratorImage(serverId, name) {
  const key = narratorKey(name)
  const prev = await getNarratorImageMeta(serverId, name)
  if (!prev) return
  await fs
    .rm(path.join(NARRATOR_DIR, fileName(serverId, key, prev.ext)), { force: true })
    .catch(() => {})
  await db.execute({
    sql: `DELETE FROM narrator_images WHERE server_id = ? AND name_key = ?`,
    args: [serverId, key],
  })
}

// Names (server-wide) that have an uploaded photo, so the UI can show a badge or
// list. Returns the original-cased names.
export async function listNarratorImageNames(serverId) {
  await initDb()
  const r = await db.execute({
    sql: `SELECT name FROM narrator_images WHERE server_id = ?`,
    args: [serverId],
  })
  return r.rows.map((row) => String(row.name))
}
