// Per-user rate limiting for QuestGiver. The admin sets QG_LIMIT as
// "off" | "N/day" | "N/week" | "N/month". Counts are kept in-memory keyed by
// ABS user id + the current period; this resets on restart, which is acceptable
// for a soft cap (the goal is curbing runaway use, not billing).

const counts = new Map() // `${userId}:${periodKey}` -> count

function parseLimit() {
  const raw = (process.env.QG_LIMIT || 'off').trim().toLowerCase()
  if (raw === 'off' || raw === '') return null
  const m = raw.match(/^(\d+)\s*\/\s*(day|week|month)$/)
  if (!m) return null
  return { max: Number(m[1]), period: m[2] }
}

function isoWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${week}`
}

function periodKey(period, now = new Date()) {
  if (period === 'day') return now.toISOString().slice(0, 10)
  if (period === 'week') return isoWeek(now)
  return now.toISOString().slice(0, 7) // month: YYYY-MM
}

// Returns { allowed, limit, remaining, period } for a user WITHOUT consuming.
export function check(userId) {
  const limit = parseLimit()
  if (!limit) return { allowed: true, limit: null, remaining: null, period: null }
  const key = `${userId}:${periodKey(limit.period)}`
  const used = counts.get(key) ?? 0
  return {
    allowed: used < limit.max,
    limit: limit.max,
    remaining: Math.max(0, limit.max - used),
    period: limit.period,
  }
}

// Consume one unit for a user; returns the post-consume state.
export function consume(userId) {
  const limit = parseLimit()
  if (!limit) return { allowed: true, limit: null, remaining: null, period: null }
  const key = `${userId}:${periodKey(limit.period)}`
  const used = (counts.get(key) ?? 0) + 1
  counts.set(key, used)
  return {
    allowed: used <= limit.max,
    limit: limit.max,
    remaining: Math.max(0, limit.max - used),
    period: limit.period,
  }
}
