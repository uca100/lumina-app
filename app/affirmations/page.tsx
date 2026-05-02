'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Item } from '@/components/ItemCard'
import { isRTL } from '@/lib/utils/rtl'

function dateSeed(): number {
  return new Date().toDateString().split('').reduce((a, c) => a + c.charCodeAt(0), 0)
}

function AffirmationCard({ item, featured }: { item: Item; featured?: boolean }) {
  const titleRTL = item.title ? isRTL(item.title) : false
  const bodyRTL = isRTL(item.body)

  if (featured) {
    return (
      <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/60 border border-emerald-500/20 rounded-3xl px-8 py-10 text-center shadow-xl shadow-emerald-900/20">
        <div className="text-emerald-400/40 text-6xl font-serif leading-none mb-4 select-none">✦</div>
        {item.title && (
          <h2
            dir={titleRTL ? 'rtl' : 'ltr'}
            className={`font-serif text-2xl font-bold text-emerald-100 mb-4 leading-snug${titleRTL ? ' text-right rtl-text' : ''}`}
          >
            {item.title}
          </h2>
        )}
        <p
          dir={bodyRTL ? 'rtl' : 'ltr'}
          className={`text-emerald-200 text-xl leading-relaxed font-serif italic${bodyRTL ? ' text-right rtl-text' : ''}`}
        >
          {item.body}
        </p>
        {item.author && (
          <p className="mt-4 text-emerald-500 text-sm italic">— {item.author}</p>
        )}
        <Link
          href={`/item/${item.id}`}
          className="inline-block mt-6 text-xs text-emerald-600 hover:text-emerald-400 transition-colors"
        >
          View →
        </Link>
      </div>
    )
  }

  return (
    <Link href={`/item/${item.id}`} className="block group">
      <div className="bg-zinc-900/60 border border-white/5 border-l-4 border-l-emerald-500/60 rounded-2xl px-5 py-4 hover:bg-zinc-900/80 hover:border-white/10 transition-all duration-200 hover:-translate-y-0.5">
        {item.title && (
          <h3
            dir={titleRTL ? 'rtl' : 'ltr'}
            className={`font-serif text-base font-bold text-zinc-100 mb-1.5 leading-snug group-hover:text-emerald-200 transition-colors${titleRTL ? ' text-right rtl-text' : ''}`}
          >
            {item.title}
          </h3>
        )}
        <p
          dir={bodyRTL ? 'rtl' : 'ltr'}
          className={`text-zinc-400 text-sm leading-relaxed${bodyRTL ? ' text-right rtl-text' : ''}`}
        >
          {item.body.length > 160 ? item.body.slice(0, 160) + '…' : item.body}
        </p>
        {item.author && (
          <p className="mt-1.5 text-zinc-600 text-xs italic">— {item.author}</p>
        )}
      </div>
    </Link>
  )
}

export default function AffirmationsPage() {
  const [allAffirmations, setAllAffirmations] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    fetch('/lumina/api/items?type=Affirmation')
      .then((r) => r.json())
      .then((data: Item[]) => {
        setAllAffirmations(data)
        setLoading(false)
      })
  }, [])

  const pinned = allAffirmations.filter((a) => a.pinned === 1)
  const pool = allAffirmations.filter((a) => a.pinned !== 1)

  const seed = dateSeed()
  const todaySource = pool.length > 0 ? pool : pinned
  const todayPick = todaySource.length > 0
    ? todaySource[(seed + offset) % todaySource.length]
    : null

  function showAnother() {
    setOffset((o) => o + 1)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #0a1a12 0%, #0d1f17 100%)' }}>
      <div className="text-4xl animate-pulse text-emerald-400">✿</div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0a1a12 0%, #0d1f17 50%, #0e1c14 100%)' }}>

      <header className="sticky top-0 z-10 backdrop-blur-md bg-black/40 border-b border-emerald-900/30 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-400 text-sm transition-colors">
            ← <span className="text-amber-500">✦</span> Lumina
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-lg">✿</span>
            <h1 className="font-serif text-lg font-bold text-emerald-100">Affirmations</h1>
          </div>
          <Link
            href="/reminders"
            className="text-xs px-3 py-1.5 border border-emerald-900/60 rounded-full text-emerald-700 hover:border-emerald-500/40 hover:text-emerald-400 transition-all"
            title="Set daily reminder"
          >
            ⏰ Remind me
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-10">

        {/* Today's Affirmation */}
        {todayPick && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Today&apos;s Affirmation</p>
              {todaySource.length > 1 && (
                <button
                  onClick={showAnother}
                  className="text-xs text-emerald-700 hover:text-emerald-400 transition-colors"
                >
                  Show another →
                </button>
              )}
            </div>
            <AffirmationCard item={todayPick} featured />
          </section>
        )}

        {/* Pinned / Daily Affirmations */}
        {pinned.length > 0 && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-4">Daily Affirmations</p>
            <div className="flex flex-col gap-3">
              {pinned.map((item) => (
                <AffirmationCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* More Affirmations */}
        {pool.length > 0 && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-4">More Affirmations</p>
            <div className="flex flex-col gap-3">
              {pool.map((item) => (
                <AffirmationCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {allAffirmations.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 text-emerald-800">✿</div>
            <p className="text-emerald-700 text-lg font-serif italic mb-2">No affirmations yet</p>
            <p className="text-emerald-800 text-sm mb-6">Capture something that inspires you and set its type to Affirmation.</p>
            <Link
              href="/capture"
              className="inline-block px-6 py-2.5 bg-emerald-600/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm hover:bg-emerald-600/30 transition-all"
            >
              + Add Affirmation
            </Link>
          </div>
        )}

      </main>
    </div>
  )
}
