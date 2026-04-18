'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ItemCard, Item } from '@/components/ItemCard'

const TYPES = ['', 'Quote', 'Affirmation', 'Story', 'Thought'] as const

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
    <div className="min-h-screen bg-stone-50">
      <header className="bg-[#faf7f2] border-b border-stone-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <h1 className="font-serif text-2xl font-bold text-stone-800">✦ Lumina</h1>
          <div className="flex gap-2">
            <button
              onClick={triggerSync}
              disabled={syncing}
              className="text-xs px-3 py-1.5 border border-stone-300 rounded-full text-stone-500 hover:border-amber-400 hover:text-amber-600 transition-colors disabled:opacity-50"
            >
              {syncing ? 'Syncing…' : 'Sync Notion'}
            </button>
            <Link
              href="/capture"
              className="text-sm px-4 py-1.5 bg-amber-500 text-black font-semibold rounded-full hover:bg-amber-400 transition-colors"
            >
              + Capture
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6">
        <div className="flex flex-col gap-4 mb-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your inspiration…"
            className="w-full border border-stone-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:border-amber-400 text-stone-700"
          />
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${type === t ? 'bg-amber-500 text-black border-amber-500 font-semibold' : 'border-stone-200 text-stone-500 hover:border-amber-300 bg-white'}`}
              >
                {t || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-stone-400 py-20">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone-400 mb-4">No inspiration yet.</p>
            <Link href="/capture" className="text-amber-600 underline">Capture your first item</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
        )}
      </main>
    </div>
  )
}
