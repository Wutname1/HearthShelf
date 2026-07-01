// Hardcover (hardcover.app) GraphQL client. Auth is a per-user Personal
// Access Token (Settings > Hardcover API on hardcover.app), NOT OAuth -
// stored per ABS user in hardcover_accounts (see lib/finishedBooks.js).
//
// IMPORTANT - schema verification status: docs.hardcover.app returned 403 to
// automated fetch while building this, so the query/mutation shapes below are
// inferred from third-party write-ups and search results, NOT confirmed
// against Hardcover's live GraphQL schema. Before relying on this module:
//   1. Get a real PAT (hardcover.app account settings).
//   2. Run a standard GraphQL introspection query against ENDPOINT below.
//   3. Confirm/fix every TODO in this file against the real schema.
// Until then, treat searchBook/upsertReadBook as best-effort scaffolding, not
// verified working code.

const ENDPOINT = 'https://api.hardcover.app/v1/graphql'

// Reported as 60 req/min; keep well under it with a simple per-process
// sliding window since this only ever runs one sync at a time per user.
const RATE_LIMIT_PER_MIN = 60
const WINDOW_MS = 60_000
const callTimes = []

async function throttle() {
  const now = Date.now()
  while (callTimes.length && now - callTimes[0] > WINDOW_MS) callTimes.shift()
  if (callTimes.length >= RATE_LIMIT_PER_MIN) {
    const waitMs = WINDOW_MS - (now - callTimes[0]) + 50
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }
  callTimes.push(Date.now())
}

async function gql(token, query, variables) {
  await throttle()
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) {
    const err = new Error(`hardcover ${res.status}`)
    err.code = res.status === 401 ? 'invalid_token' : 'hardcover_error'
    throw err
  }
  const body = await res.json()
  if (body.errors?.length) {
    const err = new Error(body.errors[0]?.message || 'hardcover graphql error')
    err.code = 'hardcover_error'
    err.graphqlErrors = body.errors
    throw err
  }
  return body.data
}

// Verify a PAT and return the account's username, or null if invalid.
// TODO(unverified): the `me { id username }` shape is a guess at the
// lightest possible authenticated query - confirm the real field name(s) via
// introspection (may be `me`, `viewer`, or require an explicit user id).
export async function verifyToken(token) {
  try {
    const data = await gql(token, `query { me { id username } }`)
    const me = Array.isArray(data?.me) ? data.me[0] : data?.me
    return me?.username ? String(me.username) : me?.id ? String(me.id) : null
  } catch (err) {
    if (err.code === 'invalid_token') return null
    throw err
  }
}

// Resolve a Hardcover book id from title/author/isbn.
// TODO(unverified): query name/shape is a guess (`books` full-text search via
// a `where`/`search` argument). Confirm the actual search query, its filter
// argument names, and which field holds a usable book id for
// insert_user_book (Hardcover separates "books" from "editions" - may need an
// edition id instead of a book id depending on the mutation's real schema).
export async function searchBook(token, { title, author, isbn }) {
  const data = await gql(
    token,
    `query SearchBooks($query: String!) {
       books(where: { title: { _ilike: $query } }, limit: 5) {
         id
         title
         contributions { author { name } }
       }
     }`,
    { query: `%${title}%` },
  )
  const candidates = data?.books || []
  if (!candidates.length) return null
  if (!author) return candidates[0]
  const authorLower = author.toLowerCase()
  const match = candidates.find((b) =>
    (b.contributions || []).some((c) => c.author?.name?.toLowerCase().includes(authorLower)),
  )
  return match || candidates[0]
}

// Mark a book as read with a finish date and optional rating.
// TODO(unverified): `insert_user_book` is a guess at the mutation name;
// whether date_finished/rating are inline object fields here or require a
// separate "user_book_read" insert (Hardcover models reading as discrete
// passes, not a single status) is unconfirmed. status_id=3 ("read") is a
// guess at the enum value - confirm against the real `book_status_type`
// lookup before shipping. Also unconfirmed: how to detect/avoid duplicate
// inserts on a re-run (idempotent upsert vs. an explicit existence check).
export async function upsertReadBook(token, { bookId, dateFinished, rating }) {
  const data = await gql(
    token,
    `mutation UpsertReadBook($object: UserBookInput!) {
       insert_user_book(object: $object) {
         id
       }
     }`,
    {
      object: {
        book_id: bookId,
        status_id: 3,
        ...(dateFinished ? { date_finished: dateFinished } : {}),
        ...(rating ? { rating } : {}),
      },
    },
  )
  return data?.insert_user_book?.id ?? null
}
