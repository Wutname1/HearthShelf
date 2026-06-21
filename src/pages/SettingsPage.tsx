import { useState, type ReactNode } from 'react'
import {
  useSettingsStore,
  ACCENT_PRESETS,
  type SettingsState,
  type AutoRulePref,
} from '@/store/settingsStore'
import type { AutoRuleId } from '@/store/queueStore'
import { useQueueStore } from '@/store/queueStore'
import { useActiveLibrary } from '@/hooks/useActiveLibrary'
import { useQuery } from '@tanstack/react-query'
import { getPlaylists, libraryKeys } from '@/api/libraries'
import { Icon } from '@/components/common/Icon'
import { CoverStyleDemo } from '@/components/common/CoverStyleDemo'

// Picks which playlist Playlist-mode follows. Stored in the queue store
// (session-scoped) since it drives playback, not a synced preference.
function PlaylistPicker() {
  const { activeId } = useActiveLibrary()
  const playlistId = useQueueStore((s) => s.playlistId)
  const setPlaylistId = useQueueStore((s) => s.setPlaylistId)
  const { data } = useQuery({
    queryKey: libraryKeys.playlists(activeId ?? ''),
    queryFn: () => getPlaylists(activeId as string),
    enabled: !!activeId,
    staleTime: 2 * 60 * 1000,
  })
  const playlists = data?.results ?? []

  if (playlists.length === 0) {
    return <span className="badge-pill">No playlists yet</span>
  }
  return (
    <select
      className="fld"
      style={{ maxWidth: 240 }}
      value={playlistId ?? ''}
      onChange={(e) => setPlaylistId(e.target.value || null)}
    >
      <option value="">Choose a playlist…</option>
      {playlists.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  )
}

// Human labels for the Auto-queue rules.
const RULE_LABELS: Record<AutoRuleId, { title: string; desc: string }> = {
  'finish-series': {
    title: 'Finish current series',
    desc: 'Queue the next book in the series you are listening to.',
  },
  'in-progress': {
    title: 'Anything in progress',
    desc: 'Queue other books you have started but not finished.',
  },
  'new-in-series': {
    title: 'New book in a started series',
    desc: 'Queue unread books from any series you have begun but not completed.',
  },
}

// Drag-to-reorder list of the Auto rules, each with an on/off toggle. The list
// order is the rule priority. Reuses the queue-panel drag pattern.
function RuleList({
  rules,
  onChange,
}: {
  rules: AutoRulePref[]
  onChange: (rules: AutoRulePref[]) => void
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const move = (from: number, to: number) => {
    const next = rules.slice()
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }
  const toggle = (i: number) =>
    onChange(rules.map((r, idx) => (idx === i ? { ...r, on: !r.on } : r)))

  return (
    <div className="rule-list">
      {rules.map((r, i) => {
        const meta = RULE_LABELS[r.id]
        return (
          <div
            className={'rule-row' + (dragIdx === i ? ' dragging' : '')}
            key={r.id}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIdx !== null && dragIdx !== i) move(dragIdx, i)
              setDragIdx(null)
            }}
            onDragEnd={() => setDragIdx(null)}
          >
            <span className="rule-handle" title="Drag to reorder">
              <Icon name="drag_indicator" />
            </span>
            <span className="rule-pri">{i + 1}</span>
            <div className="rule-meta">
              <div className="rule-t">{meta.title}</div>
              <div className="rule-d">{meta.desc}</div>
            </div>
            <Toggle on={r.on} onClick={() => toggle(i)} />
          </div>
        )
      })}
    </div>
  )
}

// --- Local controls (ported from the design reference Settings component) ---

interface SegOption<T extends string> {
  v: T
  l: string
}
function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: SegOption<T>[]
  onChange: (v: T) => void
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.v}
          className={value === o.v ? 'on' : ''}
          onClick={() => onChange(o.v)}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div
      className={'toggle' + (on ? ' on' : '')}
      role="switch"
      aria-checked={on}
      onClick={onClick}
    >
      <i />
    </div>
  )
}

// Quick-pick preset chips + a freeform numeric field sharing one value.
function NumPick({
  value,
  onChange,
  presets,
  min = 1,
  max = 600,
  unit = 's',
}: {
  value: number
  onChange: (v: number) => void
  presets: number[]
  min?: number
  max?: number
  unit?: string
}) {
  return (
    <div className="num-pick">
      <div className="seg">
        {presets.map((p) => (
          <button
            key={p}
            className={value === p ? 'on' : ''}
            onClick={() => onChange(p)}
          >
            {p}
            {unit}
          </button>
        ))}
      </div>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))
        }
        className="num-field"
      />
      <span className="num-unit">{unit === 's' ? 'sec' : unit}</span>
    </div>
  )
}

function SetRow({
  title,
  desc,
  control,
  disabled,
}: {
  title: ReactNode
  desc?: string
  control: ReactNode
  disabled?: boolean
}) {
  return (
    <div
      className="set-row"
      style={disabled ? { opacity: 0.45, pointerEvents: 'none' } : undefined}
    >
      <div className="sr-meta">
        <div className="sr-t">{title}</div>
        {desc && <div className="sr-d">{desc}</div>}
      </div>
      {control}
    </div>
  )
}

// Stretch features that depend on data ABS may not expose yet.
function ComingSoon() {
  return <span className="badge-pill abridged">Coming soon</span>
}

export function SettingsPage() {
  const s = useSettingsStore()
  const set = s.set
  // Typed setter shorthand.
  const put = <K extends keyof SettingsState>(k: K, v: SettingsState[K]) =>
    set(k as never, v as never)

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="eyebrow">Make it yours</div>
        <h1 className="title-xl">Settings</h1>
      </div>

      {/* Appearance */}
      <div className="nav-label" style={{ padding: '0 4px 10px' }}>
        Appearance
      </div>
      <div className="set-group">
        <SetRow
          title="Theme"
          desc="Dark is home; light for daytime reading."
          control={
            <Seg
              value={s.theme}
              onChange={(v) => put('theme', v)}
              options={[
                { v: 'dark', l: 'Dark' },
                { v: 'light', l: 'Light' },
                { v: 'flat', l: 'OLED' },
              ]}
            />
          }
        />
        <SetRow
          title="Accent colour"
          desc="The colour for buttons, progress, and active controls."
          control={
            <div className="swatch-row">
              {ACCENT_PRESETS.map((p) => (
                <div
                  key={p.name}
                  title={p.name}
                  className={'swatch' + (s.accentHex === p.hex ? ' on' : '')}
                  style={{ background: p.hex }}
                  onClick={() => {
                    put('accentMode', 'manual')
                    put('accentHex', p.hex)
                  }}
                />
              ))}
            </div>
          }
        />
        <SetRow
          title="Cover-glow intensity"
          desc="How strongly the now-playing cover blooms behind the page."
          control={
            <div className="range-row">
              <input
                type="range"
                min={0}
                max={60}
                value={s.glow}
                onChange={(e) => put('glow', Number(e.target.value))}
              />
              <span className="badge-pill">{s.glow}</span>
            </div>
          }
        />
        <SetRow
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              Cover style
              <span className="cs-info">
                <Icon name="info" />
                <span className="cs-pop">
                  <CoverStyleDemo />
                </span>
              </span>
            </span>
          }
          desc="Float artwork on the page, or sit it on cards."
          control={
            <Seg
              value={s.coverStyle}
              onChange={(v) => put('coverStyle', v)}
              options={[
                { v: 'floating', l: 'Floating' },
                { v: 'cards', l: 'Cards' },
              ]}
            />
          }
        />
        <SetRow
          title="Hearth background on player"
          desc="Show the cozy hearth scene behind the full-screen player while something is playing."
          control={
            <Toggle
              on={s.hearthBgPlayer}
              onClick={() => put('hearthBgPlayer', !s.hearthBgPlayer)}
            />
          }
        />
      </div>

      {/* Playback */}
      <div className="nav-label" style={{ padding: '16px 4px 10px' }}>
        Playback
      </div>
      <div className="set-group">
        <SetRow
          title="Scrubber"
          desc="Drag through the current chapter, or scrub the whole book on one bar."
          control={
            <Seg
              value={s.scrubber}
              onChange={(v) => put('scrubber', v)}
              options={[
                { v: 'chapter', l: 'Chapter' },
                { v: 'book', l: 'Full book' },
              ]}
            />
          }
        />
        <SetRow
          title="Fast-forward"
          desc="How far the forward button jumps."
          control={
            <NumPick
              value={s.skipForward}
              onChange={(v) => put('skipForward', v)}
              presets={[15, 30, 60]}
            />
          }
        />
        <SetRow
          title="Rewind"
          desc="How far the back button jumps - shorter to nudge, longer to recap."
          control={
            <NumPick
              value={s.skipBack}
              onChange={(v) => put('skipBack', v)}
              presets={[10, 15, 30]}
            />
          }
        />
        <SetRow
          title="Chapter barrier"
          desc="Stop playback at the end of each chapter instead of rolling on."
          control={
            <Toggle
              on={s.chapterBarrier}
              onClick={() => put('chapterBarrier', !s.chapterBarrier)}
            />
          }
        />
      </div>

      {/* Queue */}
      <div className="nav-label" style={{ padding: '16px 4px 10px' }}>
        Queue
      </div>
      <div className="set-group">
        <SetRow
          title="When a book ends"
          desc="Off stops; Manual plays your queue; Auto builds an up-next from the rules below; Playlist follows a chosen playlist."
          control={
            <Seg
              value={s.queueMode}
              onChange={(v) => put('queueMode', v)}
              options={[
                { v: 'off', l: 'Off' },
                { v: 'manual', l: 'Manual' },
                { v: 'auto', l: 'Auto' },
                { v: 'playlist', l: 'Playlist' },
              ]}
            />
          }
        />
        <div
          className="set-row set-row-stack"
          style={
            s.queueMode !== 'auto'
              ? { opacity: 0.45, pointerEvents: 'none' }
              : undefined
          }
        >
          <div className="sr-meta">
            <div className="sr-t">Auto rules</div>
            <div className="sr-d">
              Drag to set priority. The queue fills from the top rule down.
            </div>
          </div>
          <RuleList
            rules={s.queueAutoRules}
            onChange={(r) => put('queueAutoRules', r)}
          />
        </div>
        {s.queueMode === 'playlist' && (
          <SetRow
            title="Playlist to follow"
            desc="Playlist mode plays through this playlist in order."
            control={<PlaylistPicker />}
          />
        )}
      </div>

      {/* Library */}
      <div className="nav-label" style={{ padding: '16px 4px 10px' }}>
        Library
      </div>
      <div className="set-group">
        <SetRow
          title="Library layout"
          desc="Let the grid fill the full width, or keep it boxed."
          control={
            <Toggle
              on={s.libraryFill}
              onClick={() => put('libraryFill', !s.libraryFill)}
            />
          }
        />
        <SetRow
          title="Unified home"
          desc="Pull in-progress titles onto Home from every library at once."
          control={
            <Toggle
              on={s.unifiedHome}
              onClick={() => put('unifiedHome', !s.unifiedHome)}
            />
          }
        />
        <SetRow
          title="Show what others have read"
          desc="See community comparisons and what other listeners are reading."
          disabled
          control={<ComingSoon />}
        />
        <SetRow
          title="Share my reading list"
          desc="Let other listeners see your name and finished titles."
          disabled
          control={<ComingSoon />}
        />
      </div>

      {/* Sleep timer */}
      <div className="nav-label" style={{ padding: '16px 4px 10px' }}>
        Sleep timer
      </div>
      <div className="set-group">
        <SetRow
          title="Fade volume out"
          desc="Ease the volume down as the timer runs out, instead of cutting off."
          control={
            <Toggle
              on={s.sleepFade}
              onClick={() => put('sleepFade', !s.sleepFade)}
            />
          }
        />
        <SetRow
          title="Fade length"
          desc="How long the fade takes before it stops."
          disabled={!s.sleepFade}
          control={
            <div className="range-row">
              <input
                type="range"
                min={3}
                max={60}
                value={s.sleepFadeLen}
                onChange={(e) => put('sleepFadeLen', Number(e.target.value))}
              />
              <span className="badge-pill">{s.sleepFadeLen}s</span>
            </div>
          }
        />
        <SetRow
          title="Rewind on wake"
          desc="When the timer stops, jump back this far so you can pick up with context. Set to Off to resume exactly where it stopped."
          control={
            <div className="range-row">
              <input
                type="range"
                min={0}
                max={300}
                step={5}
                value={s.sleepRewindSec}
                onChange={(e) => put('sleepRewindSec', Number(e.target.value))}
              />
              <span className="badge-pill">
                {s.sleepRewindSec === 0
                  ? 'Off'
                  : s.sleepRewindSec < 60
                    ? `${s.sleepRewindSec}s`
                    : `${Math.floor(s.sleepRewindSec / 60)}m${
                        s.sleepRewindSec % 60 ? ` ${s.sleepRewindSec % 60}s` : ''
                      }`}
              </span>
            </div>
          }
        />
        <SetRow
          title="Auto sleep timer"
          desc="Start a timer on its own when you press play during quiet hours."
          control={
            <Toggle
              on={s.autoSleep}
              onClick={() => put('autoSleep', !s.autoSleep)}
            />
          }
        />
        {s.autoSleep && (
          <>
            <SetRow
              title="Quiet hours"
              desc="When auto sleep should kick in."
              control={
                <div className="time-row">
                  <input
                    type="time"
                    value={s.autoSleepStart}
                    onChange={(e) => put('autoSleepStart', e.target.value)}
                    className="fld"
                  />
                  <span style={{ color: 'var(--text-muted)' }}>to</span>
                  <input
                    type="time"
                    value={s.autoSleepEnd}
                    onChange={(e) => put('autoSleepEnd', e.target.value)}
                    className="fld"
                  />
                </div>
              }
            />
            <SetRow
              title="Auto duration"
              desc="Timer length auto sleep starts with."
              control={
                <NumPick
                  value={s.autoSleepDur}
                  onChange={(v) => put('autoSleepDur', v)}
                  presets={[20, 30, 45]}
                  min={5}
                  max={180}
                  unit="m"
                />
              }
            />
          </>
        )}
      </div>

      <p
        className="page-sub"
        style={{ margin: '12px 4px 8px', fontSize: 12.5 }}
      >
        External book links (Goodreads, Audible, Hardcover...) are managed by your
        server admin under Server &rarr; Integrations.
      </p>
    </div>
  )
}
