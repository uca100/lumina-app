'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Item } from '@/components/ItemCard'

const ITEM_TYPES = ['Quote', 'Affirmation', 'Story', 'Thought', 'Lesson', 'Habit'] as const

interface Schedule {
  id: string
  label: string
  hour: number
  minute: number
  typesFilter: string[]
  itemId: string | null
  mode: 'fixed' | 'daily_random' | 'daily_scatter'
  count: number
  enabled: number
  chatId: number | null
  createdAt: number
}

function pad(n: number) { return String(n).padStart(2, '0') }

function scheduleDescription(s: Schedule) {
  if (s.mode === 'daily_scatter') return `${s.count}× per day · random times`
  if (s.mode === 'daily_random') return `random time each day`
  return `${pad(s.hour)}:${pad(s.minute)} daily`
}

export default function RemindersPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  // form state
  const [count, setCount] = useState(1)
  const [randomTime, setRandomTime] = useState(false)
  const [time, setTime] = useState('08:00')
  const [typesFilter, setTypesFilter] = useState<string[]>([])
  const [label, setLabel] = useState('')
  const [itemSearch, setItemSearch] = useState('')
  const [itemResults, setItemResults] = useState<Item[]>([])
  const [pickedItem, setPickedItem] = useState<Item | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/lumina/api/reminders')
    const data = await res.json()
    setSchedules(data.schedules)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!pickedItem) return
    const t = setTimeout(async () => {
      const res = await fetch(`/lumina/api/items?q=${encodeURIComponent(itemSearch)}`)
      const data = await res.json()
      setItemResults(data.slice(0, 8))
    }, 250)
    return () => clearTimeout(t)
  }, [itemSearch, pickedItem])

  useEffect(() => {
    if (pickedItem !== null) return
    if (!itemSearch) { setItemResults([]); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/lumina/api/items?q=${encodeURIComponent(itemSearch)}`)
      const data = await res.json()
      setItemResults(data.slice(0, 8))
    }, 250)
    return () => clearTimeout(t)
  }, [itemSearch])

  const canPinItem = count === 1 && !randomTime

  function resolveMode(): 'fixed' | 'daily_random' | 'daily_scatter' {
    if (count > 1) return 'daily_scatter'
    return randomTime ? 'daily_random' : 'fixed'
  }

  async function addReminder() {
    setSaving(true)
    const [h, m] = time.split(':').map(Number)
    const mode = resolveMode()

    await fetch('/lumina/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label,
        hour: h,
        minute: m,
        typesFilter,
        itemId: canPinItem ? (pickedItem?.id ?? null) : null,
        mode,
        count,
        enabled: 1,
      }),
    })

    setLabel('')
    setTime('08:00')
    setCount(1)
    setRandomTime(false)
    setTypesFilter([])
    setPickedItem(null)
    setItemSearch('')
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
    setTypesFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const COUNT_OPTIONS = [1, 2, 3, 5, 7, 10]

  return (
    <div className="min-h-screen text-white" style={{ background: 'radial-gradient(ellipse at top, #1c1408 0%, #0d0d0d 60%)' }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-amber-900/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-10 backdrop-blur-md bg-black/40 border-b border-white/5 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-zinc-600 hover:text-zinc-400 transition-colors text-sm">← Back</Link>
          <span className="text-zinc-700">|</span>
          <span className="text-amber-500">⏰</span>
          <h1 className="font-serif text-xl font-bold text-white tracking-tight">Reminders</h1>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Schedule list */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-zinc-600 mb-3">Active</h2>
          {loading ? (
            <div className="text-zinc-600 text-sm py-4">Loading…</div>
          ) : schedules.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-zinc-600 text-sm">
              No reminders yet.
            </div>
          ) : (
            <div className="space-y-2">
              {schedules.map(s => (
                <div
                  key={s.id}
                  className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-all ${
                    s.enabled ? 'border-zinc-700/60 bg-zinc-900/60' : 'border-zinc-800/40 bg-zinc-900/20 opacity-40'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {s.label && <p className="text-sm text-zinc-200 truncate">{s.label}</p>}
                    <p className="text-xs text-zinc-500">
                      <span className="text-amber-500/80">{scheduleDescription(s)}</span>
                      {s.typesFilter.length > 0 && <span className="ml-2">· {s.typesFilter.join(', ')}</span>}
                      {s.itemId && <span className="ml-2">· pinned item</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleEnabled(s)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all shrink-0 ${
                      s.enabled
                        ? 'border-amber-500/50 text-amber-400 hover:border-amber-400'
                        : 'border-zinc-700 text-zinc-600 hover:border-zinc-500'
                    }`}
                  >
                    {s.enabled ? 'On' : 'Off'}
                  </button>
                  <button
                    onClick={() => deleteSchedule(s.id)}
                    className="text-zinc-700 hover:text-red-400 transition-colors text-sm"
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
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-6 space-y-6">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">New Reminder</h2>

          {/* How many */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase tracking-widest">How many times per day?</label>
            <div className="flex gap-2 flex-wrap">
              {COUNT_OPTIONS.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setCount(n); if (n > 1) setRandomTime(true) }}
                  className={`w-10 h-10 rounded-xl text-sm font-bold border transition-all ${
                    count === n
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* When */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase tracking-widest">When?</label>
            {count > 1 ? (
              <p className="text-sm text-zinc-400">
                Random times spread across the day (08:00–22:00), re-picked each morning.
              </p>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRandomTime(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm border transition-all ${
                    !randomTime
                      ? 'bg-amber-500 text-black border-amber-500 font-bold'
                      : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                  }`}
                >
                  Set time
                </button>
                <button
                  type="button"
                  onClick={() => setRandomTime(true)}
                  className={`flex-1 py-2.5 rounded-xl text-sm border transition-all ${
                    randomTime
                      ? 'bg-amber-500 text-black border-amber-500 font-bold'
                      : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                  }`}
                >
                  Random each day
                </button>
              </div>
            )}
            {count === 1 && !randomTime && (
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50 w-full"
              />
            )}
          </div>

          {/* What */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase tracking-widest">What?</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTypesFilter([])}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  typesFilter.length === 0
                    ? 'bg-amber-500 text-black border-amber-500 font-bold'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                }`}
              >
                Any type
              </button>
              {ITEM_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                    typesFilter.includes(t)
                      ? 'bg-amber-500 text-black border-amber-500 font-bold'
                      : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Pin specific item (only for fixed once/day) */}
          {canPinItem && (
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 uppercase tracking-widest">Pin a specific item? (optional)</label>
              {pickedItem ? (
                <div className="flex items-start gap-3 bg-zinc-800/60 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-0.5">{pickedItem.type}</p>
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
                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 w-full"
                  />
                  {itemResults.length > 0 && (
                    <div className="rounded-xl border border-zinc-700/60 overflow-hidden">
                      {itemResults.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => { setPickedItem(item); setItemSearch('') }}
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

          {/* Label */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase tracking-widest">Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Morning boost"
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 w-full"
            />
          </div>

          <button
            onClick={addReminder}
            disabled={saving}
            className="w-full py-3 bg-gradient-to-br from-amber-400 to-amber-600 text-black font-bold text-sm rounded-xl shadow-lg shadow-amber-900/30 hover:from-amber-300 hover:to-amber-500 transition-all disabled:opacity-40"
          >
            {saving ? 'Saving…' : '+ Add Reminder'}
          </button>
        </section>

      </main>
    </div>
  )
}
