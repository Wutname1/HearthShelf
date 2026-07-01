// Listening stats. Mounted at /hs/stats.
//
//   GET /hs/stats?tz=<offsetMinutes>  -> the caller's computed HSListeningStats
//
// Computes streak / this-week / active-days / most-listened server-side from ABS
// /api/me/listening-stats so every client shows identical numbers instead of
// each reimplementing the walk. Per-user, no admin gate - the caller's own
// listening history, same posture as routes/finished-books.js.
//
// `tz` is the caller's timezone offset in minutes (JS Date.getTimezoneOffset();
// e.g. 300 for US Central). Day bucketing is caller-local; without `tz` we fall
// back to the server's clock, which may mis-bucket "today" across timezones.

import { json } from '../lib/http.js'
import { callerNow, computeListeningStats } from '../lib/stats.js'

export async function handleStats(req, res, url, ctx) {
  const p = url.pathname
  if (p !== '/hs/stats') return false
  if (!ctx) return (json(res, 401, { error: 'unauthorized' }), true)
  if (req.method !== 'GET') return (json(res, 405, { error: 'method_not_allowed' }), true)

  let raw
  try {
    const r = await fetch(`${ctx.absUrl}/api/me/listening-stats`, {
      headers: { Authorization: `Bearer ${ctx.absToken}` },
    })
    if (!r.ok) return (json(res, 502, { error: 'abs_unreachable' }), true)
    raw = await r.json()
  } catch {
    return (json(res, 502, { error: 'abs_unreachable' }), true)
  }

  const tz = Number.parseInt(url.searchParams.get('tz') ?? '', 10)
  const stats = computeListeningStats(raw, callerNow(Number.isNaN(tz) ? undefined : tz))
  return (json(res, 200, stats), true)
}
