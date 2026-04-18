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
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #fdf8f0 0%, #f5f0e8 50%, #ede8df 100%)' }}>

      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 border-b border-stone-200/60 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-amber-500 text-xl">✦</span>
            <h1 className="font-serif text-2xl font-bold text-stone-800 tracking-tight">Lumina</h1>
            <span className="text-stone-300 text-sm hidden sm:block">/ your inspiration</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={triggerSync}
              disabled={syncing}
              className="text-xs px-3 py-1.5 border border-stone-200 rounded-full text-stone-400 hover:border-amber-300 hover:text-amber-600 transition-all disabled:opacity-40"
            >
              {syncing ? '⟳ Syncing…' : '⟳ Notion'}
            </button>
            <Link
              href="/capture"
              className="text-sm px-5 py-1.5 bg-gradient-to-br from-amber-400 to-amber-600 text-white font-semibold rounded-full shadow-sm hover:shadow-amber-200 hover:shadow-md transition-all"
            >
              + Capture
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {/* Search + filters */}
        <div className="mb-8 flex flex-col gap-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 text-sm">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search your inspiration…"
              className="w-full border border-stone-200 rounded-2xl pl-9 pr-4 py-3 bg-white/80 backdrop-blur-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 text-stone-700 transition-all shadow-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-all font-medium ${
                  type === t
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200'
                    : 'border-stone-200 text-stone-400 bg-white/70 hover:border-amber-300 hover:text-amber-600'
                }`}
              >
                <span className="mr-1 opacity-70">{TYPE_ICONS[t]}</span>
                {t || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="text-4xl animate-pulse text-amber-300">✦</div>
            <p className="text-stone-400 text-sm">Loading your inspiration…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="text-6xl text-stone-200 font-serif">"</div>
            <p className="text-stone-400 text-center max-w-xs">
              {q || type ? 'Nothing matches your search.' : 'Your collection is empty. Start capturing what moves you.'}
            </p>
            {!q && !type && (
              <Link href="/capture" className="mt-2 text-sm text-amber-600 underline underline-offset-4 hover:text-amber-700">
                Capture your first inspiration →
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-stone-300 mb-4 uppercase tracking-widest">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
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
