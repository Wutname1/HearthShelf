import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { absRequest } from '@/api/client'
import type { ABSStatusResponse, ABSServerSettings } from '@/api/types'
import { getServerSettings, updateServerSettings } from '@/api/admin'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export function ConfigServerInfo() {
  const { data } = useQuery({
    queryKey: ['server-status'],
    queryFn: () => absRequest<ABSStatusResponse>('/status'),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Admin</div>
        <h1 className="title-xl">Settings</h1>
      </div>

      {!data ? (
        <LoadingSpinner className="py-12" label="Loading server info..." />
      ) : (
        <div className="cfg-card">
          {(
            [
              ['dns', 'Server', data.app ?? 'audiobookshelf', false],
              ['info', 'Version', data.serverVersion ?? '—', true],
              ['language', 'Language', data.language ?? '—', false],
              [
                'lock',
                'Auth methods',
                (data.authMethods ?? []).join(', ') || '—',
                false,
              ],
            ] as [string, string, string, boolean][]
          ).map(([icon, label, value, mono]) => (
            <div className="cfg-line" key={label}>
              <Icon name={icon} style={{ color: 'var(--text-muted)' }} />
              <div className="cl-meta">
                <div className="cl-t">{label}</div>
              </div>
              <span
                style={{
                  color: 'var(--text-muted)',
                  fontFamily: mono ? 'var(--font-mono)' : undefined,
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      <ScannerDisplaySettings />
    </>
  )
}

const SCANNER_TOGGLES: {
  key:
    | 'scannerFindCovers'
    | 'scannerParseSubtitle'
    | 'scannerPreferMatchedMetadata'
    | 'scannerDisableWatcher'
    | 'storeCoverWithItem'
  label: string
  desc: string
}[] = [
  {
    key: 'scannerFindCovers',
    label: 'Find covers',
    desc: 'Search for a cover online when an item has none.',
  },
  {
    key: 'scannerParseSubtitle',
    label: 'Parse subtitles',
    desc: 'Pull a subtitle from the folder name after a dash.',
  },
  {
    key: 'scannerPreferMatchedMetadata',
    label: 'Prefer matched metadata',
    desc: 'Let matched provider data override existing details.',
  },
  {
    key: 'scannerDisableWatcher',
    label: 'Disable folder watcher',
    desc: 'Stop scanning automatically when files change on disk.',
  },
  {
    key: 'storeCoverWithItem',
    label: 'Store covers with item',
    desc: 'Save the cover alongside the audio files instead of in metadata.',
  },
]

function ScannerDisplaySettings() {
  const { data } = useQuery({
    queryKey: ['admin', 'server-settings'],
    queryFn: getServerSettings,
    staleTime: 60 * 1000,
  })

  if (!data) return null
  return <ScannerDisplayForm key={JSON.stringify(data)} settings={data} />
}

function ScannerDisplayForm({ settings }: { settings: ABSServerSettings }) {
  const qc = useQueryClient()

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    scannerFindCovers: !!settings.scannerFindCovers,
    scannerParseSubtitle: !!settings.scannerParseSubtitle,
    scannerPreferMatchedMetadata: !!settings.scannerPreferMatchedMetadata,
    scannerDisableWatcher: !!settings.scannerDisableWatcher,
    storeCoverWithItem: !!settings.storeCoverWithItem,
  })
  const [dateFormat, setDateFormat] = useState(settings.dateFormat ?? '')
  const [timeFormat, setTimeFormat] = useState(settings.timeFormat ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await updateServerSettings({
        ...toggles,
        dateFormat: dateFormat || undefined,
        timeFormat: timeFormat || undefined,
      })
      qc.invalidateQueries({ queryKey: ['admin', 'server-settings'] })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="section-head" style={{ marginTop: 'var(--s6)' }}>
        <Icon name="manage_search" />
        <h2>Scanner</h2>
      </div>
      <div className="cfg-card">
        {SCANNER_TOGGLES.map((t) => (
          <div className="cfg-line" key={t.key}>
            <Icon name="tune" style={{ color: 'var(--text-muted)' }} />
            <div className="cl-meta" style={{ flex: 1 }}>
              <div className="cl-t">{t.label}</div>
              <div className="cl-d">{t.desc}</div>
            </div>
            <button
              className={toggles[t.key] ? 'toggle on' : 'toggle'}
              aria-pressed={!!toggles[t.key]}
              onClick={() =>
                setToggles((cur) => ({ ...cur, [t.key]: !cur[t.key] }))
              }
            >
              <i />
            </button>
          </div>
        ))}
      </div>

      <div className="section-head" style={{ marginTop: 'var(--s6)' }}>
        <Icon name="calendar_today" />
        <h2>Display</h2>
      </div>
      <div className="cfg-card">
        <div className="cfg-line" style={{ gap: 12 }}>
          <div className="cl-meta" style={{ width: 150, flex: 'none' }}>
            <div className="cl-t">Date format</div>
          </div>
          <input
            className="fld"
            placeholder="MM/dd/yyyy"
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
          />
        </div>
        <div className="cfg-line" style={{ gap: 12 }}>
          <div className="cl-meta" style={{ width: 150, flex: 'none' }}>
            <div className="cl-t">Time format</div>
          </div>
          <input
            className="fld"
            placeholder="HH:mm"
            value={timeFormat}
            onChange={(e) => setTimeFormat(e.target.value)}
          />
        </div>
      </div>

      <div
        className="cfg-line"
        style={{ gap: 8, justifyContent: 'flex-end', marginTop: 'var(--s5)' }}
      >
        <button className="btn-sm btn-green" disabled={saving} onClick={() => void save()}>
          {saved ? <Icon name="check" /> : <Icon name="save" />} {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </>
  )
}
