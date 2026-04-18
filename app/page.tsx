'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ItemCard, Item } from '@/components/ItemCard'

const TYPES = ['', 'Quote', 'Affirmation', 'Story', 'Thought'] as const

const TYPE_ICONS: Record<string, string> = {
  '': '✦',
  Quote: '"',
  Affirmation: '✿',
  Story: '◈',
  Thought: '◎',
}

export default function FeedPage() {
  const [items, setItems] = useState<Item[]>([])
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [debouncedQ, setDebouncedQ] = useState('')
  const [version, setVersion] = useState('')

  useEffect(() => {
    fetch('/lumina/api/version').then(r => r.json()).then(d => setVersion(`v${d.version}`))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedQ) params.set('q', debouncedQ)
    if (type) params.set('type', type)
    const res = await fetch(`/lumina/api/items?${params}`)
    const data = await res.json()
    setItems(data)
    setLoading(false)
  }, [debouncedQ, type])

  useEffect(() => { fetchItems() }, [fetchItems])

  async function triggerSync() {
    setSyncing(true)
    await fetch('/lumina/api/sync', { method: 'POST' })
    setSyncing(false)
    fetchItems()
  }

  return (
    <div className="min-h-screen text-white" style={{ background: 'radial-gradient(ellipse at top, #1c1408 0%, #0d0d0d 60%)' }}>

      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-amber-900/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-black/40 border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-amber-500 text-xl">✦</span>
            <h1 className="font-serif text-2xl font-bold text-white tracking-tight">Lumina</h1>
            <span className="text-zinc-600 text-sm hidden sm:block">/ your inspiration</span>
            {version && <span className="text-[10px] text-zinc-700 font-mono hidden sm:block">{version}</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={triggerSync}
              disabled={syncing}
              className="text-xs px-3 py-1.5 border border-zinc-700 rounded-full text-zinc-500 hover:border-amber-500/50 hover:text-amber-400 transition-all disabled:opacity-40"
            >
              {syncing ? '⟳ Syncing…' : '⟳ Notion'}
            </button>
            <Link
              href="/capture"
              className="text-sm px-5 py-1.5 bg-gradient-to-br from-amber-400 to-amber-600 text-black font-bold rounded-full shadow-lg shadow-amber-900/30 hover:from-amber-300 hover:to-amber-500 transition-all"
            >
              + Capture
            </Link>
          </div>
        </div>
      </header>

      <main className="relative max-w-3xl mx-auto px-6 py-8">

        {/* Search + filters */}
        <div className="mb-8 flex flex-col gap-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search your inspiration…"
              className="w-full border border-zinc-800 rounded-2xl pl-9 pr-4 py-3 bg-zinc-900/60 backdrop-blur-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/10 text-zinc-200 placeholder:text-zinc-600 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-all font-medium ${
                  type === t
                    ? 'bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-900/30'
                    : 'border-zinc-800 text-zinc-500 bg-zinc-900/40 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                <span className="mr-1 opacity-60">{TYPE_ICONS[t]}</span>
                {t || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="text-4xl animate-pulse text-amber-500/50">✦</div>
            <p className="text-zinc-600 text-sm">Loading your inspiration…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="text-7xl font-serif text-zinc-800">"</div>
            <p className="text-zinc-500 text-center max-w-xs">
              {q || type ? 'Nothing matches your search.' : 'Your collection is empty. Start capturing what moves you.'}
            </p>
            {!q && !type && (
              <Link href="/capture" className="mt-2 text-sm text-amber-500 underline underline-offset-4 hover:text-amber-400">
                Capture your first inspiration →
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-[10px] text-zinc-700 mb-4 uppercase tracking-widest">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
            <div className="grid gap-4">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onDeleted={(id) => setItems(items.filter(i => i.id !== id))}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
