'use client'

import { useState } from 'react'

const BASE_PATH = '/centers'
const URL_PREFIXES = [
  'https://www.brahmakumaris.com/centers',
  'https://brahmakumaris.com/centers',
  'http://www.brahmakumaris.com/centers',
  'http://brahmakumaris.com/centers',
  'https://webapp.brahmakumaris.com/centers',
  'https://portal.brahmakumaris.com/centers',
  'http://localhost:5400/centers',
  '/centers',
]

function extractPath(raw: string): string {
  let line = raw.trim()
  if (!line) return ''
  for (const prefix of URL_PREFIXES) {
    if (line.startsWith(prefix)) { line = line.slice(prefix.length); break }
  }
  line = line.split('?')[0].split('#')[0]
  if (!line.startsWith('/')) line = '/' + line
  if (line.length > 1 && line.endsWith('/')) line = line.slice(0, -1)
  return line
}

interface LogEntry { time: string; success: boolean; message: string }

export default function RevalidatePage() {
  const [secret, setSecret] = useState('')
  const [urlsText, setUrlsText] = useState('')
  const [pathsText, setPathsText] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

  const addLog = (entry: Omit<LogEntry, 'time'>) =>
    setLogs(prev => [{ ...entry, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50))

  const revalidate = async (paths: string[] | 'all', label: string) => {
    if (!secret) { addLog({ success: false, message: 'Enter the secret key first' }); return }
    setLoading(label)
    try {
      const res = await fetch(`${BASE_PATH}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
        body: JSON.stringify(paths === 'all' ? { all: true } : { paths }),
      })
      const data = await res.json()
      if (res.ok) addLog({ success: true, message: `Revalidated: ${data.revalidated?.join(', ') || 'all pages'}` })
      else addLog({ success: false, message: data.error || 'Failed' })
    } catch { addLog({ success: false, message: 'Network error' }) }
    finally { setLoading(null) }
  }

  const revalidateTags = async (tags: string[]) => {
    if (!secret) { addLog({ success: false, message: 'Enter the secret key first' }); return }
    setLoading('tags')
    try {
      const res = await fetch(`${BASE_PATH}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
        body: JSON.stringify({ tags }),
      })
      const data = await res.json()
      if (res.ok) addLog({ success: true, message: `Tags revalidated: ${data.revalidatedTags?.join(', ')}` })
      else addLog({ success: false, message: data.error || 'Failed' })
    } catch { addLog({ success: false, message: 'Network error' }) }
    finally { setLoading(null) }
  }

  const handlePurgeUrls = () => {
    const lines = urlsText.split('\n').map(l => extractPath(l)).filter(Boolean)
    if (!lines.length) { addLog({ success: false, message: 'No valid URLs entered' }); return }
    revalidate(lines, 'urls')
  }

  const handlePurgePaths = () => {
    const lines = pathsText.split('\n').map(l => {
      let p = l.trim(); if (!p) return ''
      if (p.startsWith('/centers')) p = p.slice('/centers'.length)
      if (!p.startsWith('/')) p = '/' + p
      return p
    }).filter(Boolean)
    if (!lines.length) { addLog({ success: false, message: 'No valid paths entered' }); return }
    revalidate(lines, 'paths')
  }

  const urlPreview = urlsText.split('\n').map(l => extractPath(l)).filter(Boolean)
  const pathPreview = pathsText.split('\n').map(l => {
    let p = l.trim(); if (!p) return ''
    if (p.startsWith('/centers')) p = p.slice('/centers'.length)
    if (!p.startsWith('/')) p = '/' + p
    return p
  }).filter(Boolean)

  const btn = (label: string, onClick: () => void, variant: string, loadKey: string) => (
    <button
      onClick={onClick}
      disabled={!!loading || !secret}
      className={`flex-1 min-w-[160px] px-5 py-3 rounded-lg font-semibold text-sm text-white transition-all
        ${loading === loadKey ? 'opacity-50 cursor-wait' : !secret ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'}
        ${variant}`}
    >
      {loading === loadKey ? 'Processing...' : label}
    </button>
  )

  return (
    <div className="max-w-[860px] mx-auto px-4 py-8 text-neutral-900 dark:text-neutral-100">
      <h1 className="text-2xl font-bold mb-1">Cache Purge &amp; Revalidation</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        Purge Next.js ISR cache for BK Centers pages — similar to Cloudflare cache purge.
      </p>

      {/* How it works */}
      <div className="mb-6 p-4 rounded-xl bg-spirit-purple-50 dark:bg-spirit-purple-900/10 border border-spirit-purple-200 dark:border-spirit-purple-800">
        <h3 className="text-sm font-semibold mb-2 text-spirit-purple-700 dark:text-spirit-purple-400">How it works</h3>
        <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5 list-disc list-inside">
          <li><strong>URL box</strong> — Paste full browser URLs. The domain and <code className="bg-spirit-purple-100 dark:bg-spirit-purple-900/30 px-1 rounded">/centers</code> prefix are auto-stripped.</li>
          <li><strong>Path box</strong> — Enter internal paths directly (e.g. <code className="bg-spirit-purple-100 dark:bg-spirit-purple-900/30 px-1 rounded">/india/haryana/gurugram</code>). No <code className="bg-spirit-purple-100 dark:bg-spirit-purple-900/30 px-1 rounded">/centers</code> prefix needed.</li>
          <li>After purging, the <strong>next visitor</strong> triggers a fresh ISR rebuild (usually &lt;2s). Until then, stale content is served.</li>
          <li><strong>Purge ALL</strong> revalidates the entire site layout + all global cache tags.</li>
          <li><strong>Tags</strong> let you selectively purge news or events for a specific center email.</li>
        </ul>
      </div>

      {/* Secret Key */}
      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm font-semibold whitespace-nowrap">Secret Key</label>
        <input
          type="password"
          placeholder="Enter REVALIDATE_SECRET..."
          value={secret}
          onChange={e => setSecret(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-spirit-purple-400"
        />
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* URLs */}
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
          <h2 className="text-sm font-semibold mb-1">Purge by URLs</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            Paste full URLs, one per line. Domain &amp; <code className="bg-neutral-100 dark:bg-neutral-700 px-1 rounded">/centers</code> are auto-stripped.
          </p>
          <textarea
            value={urlsText}
            onChange={e => setUrlsText(e.target.value)}
            placeholder={`https://www.brahmakumaris.com/centers\nhttps://www.brahmakumaris.com/centers/india/haryana/gurugram\nhttps://www.brahmakumaris.com/centers/retreat`}
            rows={5}
            className="w-full p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs font-mono resize-vertical focus:outline-none focus:ring-2 focus:ring-spirit-purple-400"
          />
          {urlPreview.length > 0 && (
            <div className="mt-2 p-2 rounded-md bg-green-500/10 text-xs font-mono max-h-20 overflow-auto">
              <span className="font-semibold text-green-600 dark:text-green-400">Will purge {urlPreview.length} path(s):</span>
              {urlPreview.map((p, i) => <div key={i} className="text-green-700 dark:text-green-300">{p}</div>)}
            </div>
          )}
          <button
            onClick={handlePurgeUrls}
            disabled={!!loading || !urlPreview.length || !secret}
            className="mt-3 w-full py-2.5 rounded-lg bg-spirit-purple-600 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {loading === 'urls' ? 'Purging...' : `Purge ${urlPreview.length || ''} URL(s)`}
          </button>
        </div>

        {/* Paths */}
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
          <h2 className="text-sm font-semibold mb-1">Purge by Paths</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            Enter internal paths, one per line. <code className="bg-neutral-100 dark:bg-neutral-700 px-1 rounded">/centers</code> prefix auto-stripped if included.
          </p>
          <textarea
            value={pathsText}
            onChange={e => setPathsText(e.target.value)}
            placeholder={`/\n/retreat\n/india/haryana/gurugram/delhi-om-shanti-retreat-centre\n/india/rajasthan`}
            rows={5}
            className="w-full p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs font-mono resize-vertical focus:outline-none focus:ring-2 focus:ring-spirit-purple-400"
          />
          {pathPreview.length > 0 && (
            <div className="mt-2 p-2 rounded-md bg-amber-500/10 text-xs font-mono max-h-20 overflow-auto">
              <span className="font-semibold text-amber-600 dark:text-amber-400">Will purge {pathPreview.length} path(s):</span>
              {pathPreview.map((p, i) => <div key={i} className="text-amber-700 dark:text-amber-300">{p}</div>)}
            </div>
          )}
          <button
            onClick={handlePurgePaths}
            disabled={!!loading || !pathPreview.length || !secret}
            className="mt-3 w-full py-2.5 rounded-lg bg-amber-600 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {loading === 'paths' ? 'Purging...' : `Purge ${pathPreview.length || ''} Path(s)`}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        {btn('Purge ALL Pages', () => revalidate('all', 'all'), 'bg-red-600', 'all')}
        {btn('Purge Home + Retreat', () => revalidate(['/', '/retreat'], 'home'), 'bg-teal-700', 'home')}
        {btn('Refresh Region/State Lists', () => revalidateTags(['region-names', 'state-names', 'center-count']), 'bg-purple-600', 'tags')}
      </div>

      {/* Tag-based purge for center-specific data */}
      <div className="mb-6 p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
        <h2 className="text-sm font-semibold mb-1">Purge by Cache Tag</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
          Purge center-specific cached data. Common tags: <code className="bg-neutral-100 dark:bg-neutral-700 px-1 rounded text-[10px]">news-email</code>, <code className="bg-neutral-100 dark:bg-neutral-700 px-1 rounded text-[10px]">events-email</code>, <code className="bg-neutral-100 dark:bg-neutral-700 px-1 rounded text-[10px]">center-BRANCHCODE</code>, <code className="bg-neutral-100 dark:bg-neutral-700 px-1 rounded text-[10px]">retreat-centers</code>
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. news-orc.gurgaon@brahmakumaris.com"
            id="customTag"
            className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-spirit-purple-400"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const input = e.currentTarget
                if (input.value.trim()) {
                  revalidateTags([input.value.trim()])
                  input.value = ''
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('customTag') as HTMLInputElement
              if (input?.value.trim()) {
                revalidateTags([input.value.trim()])
                input.value = ''
              }
            }}
            disabled={!!loading || !secret}
            className="px-4 py-2 rounded-lg bg-spirit-purple-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {loading === 'tags' ? '...' : 'Purge Tag'}
          </button>
        </div>
      </div>

      {/* ISR Info */}
      <div className="mb-6 p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
        <h2 className="text-sm font-semibold mb-2">ISR Cache Timings</h2>
        <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex justify-between"><span>Center detail pages</span><span>24 hours</span></div>
          <div className="flex justify-between"><span>Region / State / District listings</span><span>24 hours</span></div>
          <div className="flex justify-between"><span>Retreat centers</span><span>24 hours</span></div>
          <div className="flex justify-between"><span>Home page</span><span>24 hours</span></div>
          <div className="flex justify-between"><span>News posts (per center)</span><span>1 hour</span></div>
          <div className="flex justify-between"><span>Events (per center)</span><span>1 hour</span></div>
          <div className="flex justify-between border-t border-neutral-200 dark:border-neutral-700 pt-1 mt-1 font-medium text-neutral-800 dark:text-neutral-200"><span>Nearby centers (bbox)</span><span>1 hour</span></div>
        </div>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold">Activity Log</h3>
            <button onClick={() => setLogs([])} className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200">Clear</button>
          </div>
          <div className="max-h-48 overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
            {logs.map((log, i) => (
              <div key={i} className={`px-3 py-2 text-xs border-b border-neutral-200 dark:border-neutral-700 flex gap-2 items-start ${log.success ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                <span className="flex-shrink-0">{log.success ? '✓' : '✗'}</span>
                <span className="flex-1">{log.message}</span>
                <span className="text-neutral-400 whitespace-nowrap">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
