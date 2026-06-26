// First-boot provisioning state (all-in-one image). Reads/writes the single-row
// `provisioning` table that records whether the bundled ABS has been set up and
// whether the admin has finished HearthShelf's onboarding wizard. On slim images
// nothing writes here, so getProvisioning() returns the zeroed defaults.

import { db, initDb } from '../db.js'

let ready = null
function ensure() {
  if (!ready) ready = initDb()
  return ready
}

export async function getProvisioning() {
  await ensure()
  const r = await db.execute('SELECT * FROM provisioning WHERE id = 1')
  const row = r.rows[0]
  if (!row) {
    return {
      absInitialized: false,
      adminToken: null,
      rootUsername: null,
      servicePassword: null,
      onboarded: false,
    }
  }
  return {
    absInitialized: Boolean(row.abs_initialized),
    adminToken: row.abs_admin_token ?? null,
    rootUsername: row.root_username ?? null,
    // Generated password for the service root account. Kept ONLY so an
    // interrupted onboarding (root created, user-account step failed) can log
    // back in as the service account and finish, rather than dead-ending.
    servicePassword: row.root_password ?? null,
    onboarded: Boolean(row.onboarded),
  }
}

export async function setProvisioning(patch) {
  await ensure()
  const cur = await getProvisioning()
  const next = {
    absInitialized: patch.absInitialized ?? cur.absInitialized,
    adminToken: patch.adminToken ?? cur.adminToken,
    rootUsername: patch.rootUsername ?? cur.rootUsername,
    servicePassword:
      patch.servicePassword !== undefined ? patch.servicePassword : cur.servicePassword,
    onboarded: patch.onboarded ?? cur.onboarded,
  }
  await db.execute({
    sql: `INSERT INTO provisioning (id, abs_initialized, abs_admin_token, root_username, root_password, onboarded, updated_at)
          VALUES (1, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            abs_initialized = excluded.abs_initialized,
            abs_admin_token = excluded.abs_admin_token,
            root_username   = excluded.root_username,
            root_password   = excluded.root_password,
            onboarded       = excluded.onboarded,
            updated_at      = excluded.updated_at`,
    args: [
      next.absInitialized ? 1 : 0,
      next.adminToken,
      next.rootUsername,
      next.servicePassword,
      next.onboarded ? 1 : 0,
      Date.now(),
    ],
  })
  return next
}
