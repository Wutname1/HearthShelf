// All-in-one first-boot provisioning. On the bundled image HearthShelf owns the
// ABS server in the same container, but it does NOT create the admin account for
// the user. Instead the onboarding wizard collects the admin's chosen username
// and password and drives ABS /init itself (see routes/runtime.js), replicating
// ABS's own first-run rather than hiding it behind a generated password.
//
// So this boot step only DETECTS state - it never writes to ABS:
//   1. Wait for the bundled ABS to answer /status.
//   2. Record whether ABS already has a root user (absInitialized), so the SPA
//      knows whether to show the "create admin" step or the normal login.
//
// A box whose volume was restored from a prior run comes back with ABS already
// initialised; we record that and the wizard skips straight to login. A fresh
// box comes back uninitialised and the wizard shows the create-admin step.
//
// No-op unless HS_MODE=aio. Slim points at the admin's own ABS; hosted is
// fronted by the control plane.

import { getMode } from './context.js'
import { getProvisioning, setProvisioning } from './provisioning.js'

const ABS_URL = process.env.ABS_SERVER_URL || 'http://127.0.0.1:13378'

const log = (...a) => console.log('[aio-provision]', ...a)
const warn = (...a) => console.warn('[aio-provision]', ...a)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Poll ABS /status until it answers (it boots in parallel with us). Returns the
// parsed status, or null if it never came up within the budget.
async function waitForAbs({ tries = 60, intervalMs = 2000 } = {}) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${ABS_URL}/status`)
      if (res.ok) return await res.json()
    } catch {
      // ABS not listening yet - keep waiting.
    }
    await sleep(intervalMs)
  }
  return null
}

// Detect ABS setup state on boot. Returns silently on any path that isn't AIO;
// throws nothing (errors are logged, retried next boot). Never writes to ABS -
// the admin creates the root user from the onboarding wizard.
export async function provisionAio() {
  if (getMode() !== 'aio') return

  try {
    const prov = await getProvisioning()
    if (prov.absInitialized) {
      log('ABS already initialised, nothing to detect')
      return
    }

    const status = await waitForAbs()
    if (!status) {
      warn('bundled ABS never came up; will retry next boot')
      return
    }

    // A restored volume comes back with ABS already initialised. Record it so the
    // wizard shows the normal login instead of the create-admin step. A fresh box
    // stays absInitialized:false; the wizard's create-admin step flips it.
    if (status.isInit) {
      log('ABS already initialised; recording so the wizard routes to login')
      await setProvisioning({ absInitialized: true })
    } else {
      log('ABS is up and uninitialised; wizard will create the admin account')
    }
  } catch (err) {
    warn(`unexpected error: ${String(err).slice(0, 160)}`)
  }
}
