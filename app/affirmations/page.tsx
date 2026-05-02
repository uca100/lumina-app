'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Item } from '@/components/ItemCard'
import { isRTL } from '@/lib/utils/rtl'

function dateSeed(): number {
  return new Date().toDateString().split('').reduce((a, c) => a + c.charCodeAt(0), 0)
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function AffirmationsPage() {
  const [allAffirmations, setAllAffirmations] = useState<Item[]>([])
  const [order, setOrder] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [randomOffset, setRandomOffset] = useState(0)

  const [pinnedItems, setPinnedItems] = useState<Item[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/lumina/api/items?pinned=1').then((r) => r.json()),
      fetch('/lumina/api/items?type=Affirmation').then((r) => r.json()),
      fetch('/lumina/api/affirmations/order').then((r) => r.json()),
    ]).then(([pinnedData, affirmationsData, orderData]: [Item[], Item[], { order: string[] }]) => {
      setPinnedItems(pinnedData)
      setAllAffirmations(affirmationsData)
      setOrder(orderData.order)
      setLoading(false)
    })
  }, [])

  const pinned = pinnedItems
  const pool = allAffirmations.filter((a) => a.pinned !== 1)

  // Sort pinned by stored order
  const orderedPinned = order.length > 0
    ? [
        ...order.map((id) => pinned.find((a) => a.id === id)).filter(Boolean) as Item[],
        ...pinned.filter((a) => !order.includes(a.id)),
      ]
    : pinned

  const seed = dateSeed()
  const todaySource = pool.length > 0 ? pool : (orderedPinned.length > 0 ? orderedPinned : [])
  const todayPick = todaySource.length > 0 ? todaySource[(seed + randomOffset) % todaySource.length] : null

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #0a1a12 0%, #0d1f17 100%)' }}>
      <div className="text-4xl animate-pulse text-emerald-400">✿</div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0a1a12 0%, #0d1f17 50%, #0e1c14 100%)' }}>

      <header className="sticky top-0 z-10 backdrop-blur-md bg-black/40 border-b border-emerald-900/30 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-emerald-800 hover:text-emerald-500 text-sm transition-colors">
            ← Lumina
          </Link>
          <Link
            href="/affirmations/settings"
            className="text-xs px-3 py-1.5 border border-emerald-900/60 rounded-full text-emerald-700 hover:border-emerald-500/40 hover:text-emerald-400 transition-all"
          >
            ⚙ Settings
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">

        {/* Date + greeting */}
        <div className="mb-10 text-center">
          <p className="text-emerald-700 text-xs uppercase tracking-widest mb-1">{today}</p>
          <h1 className="font-serif text-3xl text-emerald-100">{greeting()}</h1>
        </div>

        {orderedPinned.length === 0 && pool.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 text-emerald-800">✿</div>
            <p className="text-emerald-700 text-lg font-serif italic mb-6">No affirmations yet</p>
            <Link href="/affirmations/settings" className="inline-block px-6 py-2.5 bg-emerald-600/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm hover:bg-emerald-600/30 transition-all">
              Set up your daily affirmations →
            </Link>
          </div>
        )}

        {/* Daily reading list */}
        {orderedPinned.length > 0 && (
          <section className="mb-12">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 mb-6 text-center">Your Daily Affirmations</p>
            <div className="flex flex-col gap-8">
              {orderedPinned.map((item, i) => {
                const titleRTL = item.title ? isRTL(item.title) : false
                const bodyRTL = isRTL(item.body)
                return (
                  <div key={item.id} className="flex gap-4 items-start">
                    <span className="font-serif text-emerald-800 text-lg mt-0.5 select-none w-5 shrink-0 text-right">{i + 1}</span>
                    <div className="flex-1">
                      {item.title && (
                        <p
                          dir={titleRTL ? 'rtl' : 'ltr'}
                          className={`font-serif text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1${titleRTL ? ' text-right rtl-text' : ''}`}
                        >
                          {item.title}
                        </p>
                      )}
                      <p
                        dir={bodyRTL ? 'rtl' : 'ltr'}
                        className={`font-serif text-xl text-emerald-100 leading-relaxed${bodyRTL ? ' text-right rtl-text' : ''}`}
                      >
                        {item.body}
                      </p>
                      {item.author && (
                        <p className="text-emerald-700 text-sm italic mt-1">— {item.author}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Divider + Today's random pick */}
        {todayPick && pool.length > 0 && (
          <>
            <div className="border-t border-emerald-900/40 mb-10" />
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 mb-5 text-center">Today&apos;s Pick</p>
              <div className="bg-emerald-950/40 border border-emerald-800/20 rounded-2xl px-7 py-7 text-center">
                {todayPick.title && (
                  <p
                    dir={isRTL(todayPick.title) ? 'rtl' : 'ltr'}
                    className={`font-serif text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-3${isRTL(todayPick.title) ? ' text-right rtl-text' : ''}`}
                  >
                    {todayPick.title}
                  </p>
                )}
                <p
                  dir={isRTL(todayPick.body) ? 'rtl' : 'ltr'}
                  className={`font-serif text-lg text-emerald-200 leading-relaxed italic${isRTL(todayPick.body) ? ' text-right rtl-text' : ''}`}
                >
                  {todayPick.body}
                </p>
                {todayPick.author && (
                  <p className="text-emerald-700 text-sm mt-3">— {todayPick.author}</p>
                )}
                {pool.length > 1 && (
                  <button
                    onClick={() => setRandomOffset((o) => o + 1)}
                    className="mt-4 text-xs text-emerald-800 hover:text-emerald-500 transition-colors"
                  >
                    Show another →
                  </button>
                )}
              </div>
            </section>
          </>
        )}

        {/* Footer */}
        <div className="mt-14 text-center">
          <Link href="/reminders" className="text-xs text-emerald-900 hover:text-emerald-600 transition-colors">
            ⏰ Set a daily reminder
          </Link>
        </div>

      </main>
    </div>
  )
}
