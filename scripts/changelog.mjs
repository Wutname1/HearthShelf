#!/usr/bin/env node
// Generate a grouped changelog from commit subjects since the previous tag.
// Groups follow the HearthShelf CLAUDE.md convention:
//   🚀 Features  — new:/feat:/feature:, or starts with Add/Adds/.../Implement/Integrate
//   📝 Changes   — improved:/chore:/refactor:/perf:, or Improve/Enhance/Update/...
//   🐛 Fixes     — fix:/fixes:/bug:, or Fix/Fixes/.../Silence/Protect/Ensure
// Usage: node scripts/changelog.mjs [<fromRef>] [<toRef>]
// Defaults: fromRef = previous tag (or first commit), toRef = HEAD.

import { execSync } from 'node:child_process'

const sh = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim()

const toRef = process.argv[3] || 'HEAD'
let fromRef = process.argv[2]
if (!fromRef) {
  // The tag immediately before toRef, if any.
  try {
    fromRef = sh(`git describe --tags --abbrev=0 ${toRef}^ 2>/dev/null`)
  } catch {
    fromRef = '' // no prior tag — include all history
  }
}

const range = fromRef ? `${fromRef}..${toRef}` : toRef
// %s = subject. Skip merge commits.
const raw = sh(`git log ${range} --no-merges --pretty=format:%s`)
const subjects = raw ? raw.split('\n') : []

const FEATURE_PREFIX = /^(new|feat|feature):/i
const FEATURE_START = /^(Add(s|ed|ing)?|Implement|Integrate)\b/i
const FIX_PREFIX = /^(fix|fixes|bug):/i
const FIX_START = /^(Fix(es|ed|ing)?|Silence|Protect|Ensure)\b/i
const CHANGE_PREFIX = /^(improved|chore|refactor|perf):/i
const CHANGE_START = /^(Improve|Enhance|Update|Refactor|Cleanup|Move|Remove)\b/i

const features = []
const changes = []
const fixes = []
const other = []

// Strip a known prefix and capitalize the user-facing summary.
const clean = (s) => {
  const stripped = s.replace(
    /^(new|feat|feature|fix|fixes|bug|improved|chore|refactor|perf):\s*/i,
    '',
  )
  return stripped.charAt(0).toUpperCase() + stripped.slice(1)
}

for (const s of subjects) {
  if (FEATURE_PREFIX.test(s) || FEATURE_START.test(s)) features.push(clean(s))
  else if (FIX_PREFIX.test(s) || FIX_START.test(s)) fixes.push(clean(s))
  else if (CHANGE_PREFIX.test(s) || CHANGE_START.test(s)) changes.push(clean(s))
  else other.push(clean(s))
}

const section = (title, items) =>
  items.length ? `## ${title}\n\n${items.map((i) => `- ${i}`).join('\n')}\n` : ''

const body = [
  section('🚀 Features', features),
  section('📝 Changes', changes),
  section('🐛 Fixes', fixes),
  section('Other', other),
]
  .filter(Boolean)
  .join('\n')

process.stdout.write(body || '_No notable changes._\n')
