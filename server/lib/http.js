// Small HTTP helpers shared by every route module: JSON responses and a
// size-capped body reader. Plain Node http, no framework.

export function json(res, status, body) {
  const data = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  })
  res.end(data)
}

// Read the request body as raw bytes, capped at `limit`. Rejects with an error
// whose `.code` is 'payload_too_large' so callers can map it to a 413.
export async function readBodyBuffer(req, limit = 512 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > limit) {
        const err = new Error('payload too large')
        err.code = 'payload_too_large'
        reject(err)
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export async function readBody(req, limit = 512 * 1024) {
  const buf = await readBodyBuffer(req, limit)
  return buf.toString('utf8')
}
