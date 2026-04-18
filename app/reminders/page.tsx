'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Item } from '@/components/ItemCard'

const ITEM_TYPES = ['Quote', 'Affirmation', 'Story', 'Thought'] as const

interface Schedule {
  id: string
  label: string
  hour: number
  minute: number
  typesFilter: string[]
  itemId: string | null
  enabled: number
  chatId: number | null
  createdAt: number
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatTime(h: number, m: number) {
  return `${pad(h)}:${pad(m)}`
}

export default function RemindersPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [telegramChatId, setTelegramChatId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [time, setTime] = useState('08:00')
  const [label, setLabel] = useState('')
  const [typesFilter, setTypesFilter] = useState<string[]>([])
  const [mode, setMode] = useState<'random' | 'pick'>('random')
  const [itemSearch, setItemSearch] = useState('')
  const [itemResults, setItemResults] = useState<Item[]>([])
  const [pickedItem, setPickedItem] = useState<Item | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/lumina/api/reminders')
    const data = await res.json()
    setSchedules(data.schedules)
    setTelegramChatId(data.telegramChatId)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (mode !== 'pick') return
    const t = setTimeout(async () => {
      const res = await fetch(`/lumina/api/items?q=${encodeURIComponent(itemSearch)}`)
      const data = await res.json()
      setItemResults(data.slice(0, 8))
    }, 250)
    return () => clearTimeout(t)
  }, [itemSearch, mode])

  async function addReminder() {
    const [h, m] = time.split(':').map(Number)
    setSaving(true)
    await fetch('/lumina/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label,
        hour: h,
        minute: m,
        typesFilter: mode === 'random' ? typesFilter : [],
        itemId: mode === 'pick' ? pickedItem?.id ?? null : null,
        enabled: 1,
      }),
    })
    setLabel('')
    setTime('08:00')
    setTypesFilter([])
    setPickedItem(null)
    setItemSearch('')
    setMode('random')
    await load()
    setSaving(false)
  }

  async function toggleEnabled(s: Schedule) {
    await fetch(`/lumina/api/reminders/${s.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...s, typesFilter: s.typesFilter, enabled: s.enabled ? 0 : 1 }),
    })
    await load()
  }

  async function deleteSchedule(id: string) {
    await fetch(`/lumina/api/reminders/${id}`, { method: 'DELETE' })
    await load()
  }

  function toggleType(t: string) {
    setTypesFilter(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    )
  }

  return (
    <div className="min-h-screen text-white" style={{ background: 'radial-gradient(ellipse at top, #1c1408 0%, #0d0d0d 60%)' }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-amber-900/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-10 backdrop-blur-md bg-black/40 border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-600 hover:text-zinc-400 transition-colors text-sm">← Back</Link>
            <span className="text-zinc-700">|</span>
            <div className="flex items-baseline gap-2">
              <span className="text-amber-500">⏰</span>
              <h1 className="font-serif text-xl font-bold text-white tracking-tight">Reminders</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* Telegram status */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-5">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Telegram Status</h2>
          {telegramChatId ? (
            <p className="text-sm text-zinc-300">
              Chat ID <span className="font-mono text-amber-400">{telegramChatId}</span> is registered.
              Telegram reminders are ready.
            </p>
          ) : (
            <p className="text-sm text-zinc-500">
              No chat ID captured yet.{' '}
              <span className="text-zinc-400">Send any message to your Lumina bot on Telegram to register automatically.</span>
            </p>
          )}
        </section>

        {/* Schedule list */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Scheduled Reminders</h2>
          {loading ? (
            <div className="text-zinc-600 text-sm py-4">Loading…</div>
          ) : schedules.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-zinc-600 text-sm">
              No reminders yet. Add one below.
            </div>
          ) : (
            <div className="space-y-2">
              {schedules.map(s => (
                <div key={s.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${s.enabled ? 'border-zinc-700/60 bg-zinc-900/60' : 'border-zinc-800/40 bg-zinc-900/20 opacity-50'}`}>
                  <span className="font-mono text-amber-400 text-lg w-16 shrink-0">{formatTime(s.hour, s.minute)}</span>
                  <div className="flex-1 min-w-0">
                    {s.label && <p className="text-sm text-zinc-200 truncate">{s.label}</p>}
                    <p className="text-xs text-zinc-600">
                      {s.itemId
                        ? <span className="text-amber-500/70">pinned item</span>
                        : s.typesFilter.length ? s.typesFilter.join(', ') : 'All types (random)'}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleEnabled(s)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all ${s.enabled ? 'border-amber-500/50 text-amber-400 hover:border-amber-400' : 'border-zinc-700 text-zinc-600 hover:border-zinc-500'}`}
                  >
                    {s.enabled ? 'On' : 'Off'}
                  </button>
                  <button
                    onClick={() => deleteSchedule(s.id)}
                    className="text-zinc-700 hover:text-red-400 transition-colors text-sm px-1"
                    aria-label="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Add reminder form */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-5 space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">Add Reminder</h2>

          <div className="flex gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-600">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-40">
              <label className="text-xs text-zinc-600">Label (optional)</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Morning boost"
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            {(['random', 'pick'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setPickedItem(null); setItemSearch('') }}
                className={`px-4 py-1.5 rounded-full text-xs border transition-all font-medium ${
                  mode === m
                    ? 'bg-amber-500 text-black border-amber-500'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                }`}
              >
                {m === 'random' ? '⇄ Random' : '✦ Pick item'}
              </button>
            ))}
          </div>

          {mode === 'random' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-600">Filter by type (leave empty for all)</label>
              <div className="flex flex-wrap gap-2">
                {ITEM_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                      typesFilter.includes(t)
                        ? 'bg-amber-500 text-black border-amber-500'
                        : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'pick' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-600">Search and select an item</label>
              {pickedItem ? (
                <div className="flex items-start gap-2 bg-zinc-800/60 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-amber-400 mb-0.5">{pickedItem.type}</p>
                    <p className="text-sm text-zinc-200 line-clamp-2">{pickedItem.body}</p>
                    {pickedItem.author && <p className="text-xs text-zinc-600 mt-0.5">— {pickedItem.author}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPickedItem(null); setItemSearch('') }}
                    className="text-zinc-600 hover:text-zinc-400 text-sm shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    placeholder="Search your items…"
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                  />
                  {itemResults.length > 0 && (
                    <div className="rounded-xl border border-zinc-700/60 overflow-hidden">
                      {itemResults.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPickedItem(item)}
                          className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 border-b border-zinc-800 last:border-0 transition-colors"
                        >
                          <span className="text-[10px] text-amber-500/70 uppercase tracking-wider mr-2">{item.type}</span>
                          <span className="text-sm text-zinc-300 line-clamp-1">{item.body}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <button
            onClick={addReminder}
            disabled={saving}
            className="px-5 py-2 bg-gradient-to-br from-amber-400 to-amber-600 text-black font-bold text-sm rounded-full shadow-lg shadow-amber-900/30 hover:from-amber-300 hover:to-amber-500 transition-all disabled:opacity-40"
          >
            {saving ? 'Saving…' : '+ Add Reminder'}
          </button>
        </section>

        {/* iOS Shortcuts section */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-5 space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">iOS Shortcuts (Alternative)</h2>
          <p className="text-sm text-zinc-400">
            Use iOS Personal Automations to pull a random item at set times, without needing Telegram.
          </p>

          <div className="space-y-3 text-sm">
            <div className="bg-zinc-800/60 rounded-xl p-4 space-y-2">
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Step 1 — Create Shortcut &quot;Lumina Reminder&quot;</p>
              <ol className="text-zinc-400 space-y-1 list-decimal list-inside text-xs">
                <li>Add action: <span className="text-zinc-300">Get Contents of URL</span></li>
                <li>URL: <span className="font-mono text-amber-400 break-all">https://myweb.tail075174.ts.net/lumina/api/reminders/random</span></li>
                <li>Method: GET — add Header: <span className="font-mono text-zinc-300">Authorization</span> → <span className="font-mono text-zinc-300">Bearer &lt;your INGEST_API_KEY&gt;</span></li>
                <li>Add action: <span className="text-zinc-300">Get Dictionary Value</span> — Key: <span className="font-mono text-zinc-300">body</span></li>
                <li>Add action: <span className="text-zinc-300">Show Notification</span> — Body: the Dictionary Value result</li>
              </ol>
            </div>

            <div className="bg-zinc-800/60 rounded-xl p-4 space-y-2">
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Step 2 — Create Personal Automation (one per time)</p>
              <ol className="text-zinc-400 space-y-1 list-decimal list-inside text-xs">
                <li>Shortcuts app → Automation → + → Personal Automation</li>
                <li>Trigger: <span className="text-zinc-300">Time of Day</span> → set your time → Daily</li>
                <li>Action: <span className="text-zinc-300">Run Shortcut</span> → choose &quot;Lumina Reminder&quot;</li>
                <li>Disable <span className="text-zinc-300">&quot;Ask Before Running&quot;</span></li>
              </ol>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
