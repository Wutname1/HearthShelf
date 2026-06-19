// Tiny JSON-file persistence for the Discover backend - the only state the
// QuestGiver service keeps. Holds per-user feedback, the per-user monthly AI
// shelf cache, and the global popular-signals cache. In-memory map is the
// runtime source of truth; every change is flushed to disk with an atomic
// temp-file + rename so a crash mid-write can't corrupt the file.
//
// Losing the file is non-catastrophic: feedback resets and the monthly shelf
// regenerates on next access.
//
// Env: QG_DATA_DIR (default /app/data).

import fs from 'node:fs'
import path from 'node:path'

const DIR = process.env.QG_DATA_DIR || '/app/data'
const FILE = path.join(DIR, 'discover.json')

const EMPTY = {
  // userId -> { [libraryItemId]: { vote?: 'like'|'dislike'|'not_interested', rating?: 1-5 } }
  feedback: {},
  // userId -> { month: 'YYYY-MM', engine, intro, picks: [{ id, reason }] }
  monthly: {},
  // { date: 'YYYY-MM-DD', items: [{ itemId, finishedBy, inProgressBy }] }
  popular: null,
}

let state = { ...EMPTY }

function load() {
  try {
    const raw = fs.readFileSync(FILE, 'utf8')
    const parsed = JSON.parse(raw)
    state = {
      feedback: parsed.feedback ?? {},
      monthly: parsed.monthly ?? {},
      popular: parsed.popular ?? null,
    }
  } catch {
    // No file yet (or unreadable) - start clean.
    state = { ...EMPTY }
  }
}

function flush() {
  try {
    fs.mkdirSync(DIR, { recursive: true })
    const tmp = FILE + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(state))
    fs.renameSync(tmp, FILE) // atomic on the same filesystem
  } catch (err) {
    // Persistence is best-effort; runtime keeps working from the in-memory map.
    // eslint-disable-next-line no-console
    console.error('[discover-store] flush failed:', String(err).slice(0, 120))
  }
}

load()

// --- Feedback ---

export function getFeedback(userId) {
  return state.feedback[userId] ?? {}
}

export function setFeedback(userId, itemKey, fb) {
  const map = state.feedback[userId] ?? (state.feedback[userId] = {})
  const next = { ...(map[itemKey] ?? {}) }
  if ('vote' in fb) {
    if (fb.vote == null) delete next.vote
    else next.vote = fb.vote
  }
  if ('rating' in fb) {
    if (fb.rating == null) delete next.rating
    else next.rating = fb.rating
  }
  if (Object.keys(next).length === 0) delete map[itemKey]
  else map[itemKey] = next
  flush()
  return state.feedback[userId]
}

// --- Monthly AI shelf cache ---

export function getMonthly(userId, month) {
  const m = state.monthly[userId]
  return m && m.month === month ? m : null
}

export function setMonthly(userId, shelf) {
  state.monthly[userId] = shelf
  flush()
  return shelf
}

// --- Popular signals (global, dated) ---

export function getPopular(date) {
  return state.popular && state.popular.date === date ? state.popular : null
}

export function setPopular(payload) {
  state.popular = payload
  flush()
  return payload
}
