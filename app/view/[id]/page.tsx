'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Item } from '@/components/ItemCard'
import { isRTL } from '@/lib/utils/rtl'

const TYPE_BG: Record<string, string> = {
  Quote:       'from-sky-100 via-sky-50 to-white',
  Affirmation: 'from-emerald-100 via-emerald-50 to-white',
  Story:       'from-violet-100 via-violet-50 to-white',
  Thought:     'from-amber-100 via-amber-50 to-white',
  Lesson:      'from-rose-100 via-rose-50 to-white',
  Habit:       'from-teal-100 via-teal-50 to-white',
  Pattern:     'from-orange-100 via-orange-50 to-white',
}

const TYPE_ACCENT: Record<string, string> = {
  Quote:       'text-sky-700',
  Affirmation: 'text-emerald-700',
  Story:       'text-violet-700',
  Thought:     'text-amber-700',
  Lesson:      'text-rose-700',
  Habit:       'text-teal-700',
  Pattern:     'text-orange-700',
}

const TYPE_ICON: Record<string, string> = {
  Quote:       '💬',
  Affirmation: '⭐',
  Story:       '📚',
  Thought:     '💭',
  Lesson:      '🎓',
  Habit:       '🌱',
  Pattern:     '◇',
}

export default function ViewPage() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<Item | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/lumina/api/items/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then(setItem)
      .catch(() => setNotFound(true))
  }, [id])

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-stone-50 text-stone-400">
      <div className="text-5xl">✦</div>
      <p className="text-sm">Item not found</p>
      <Link href="/lumina" className="text-xs text-amber-500 hover:underline">Back to Lumina</Link>
    </div>
  )

  if (!item) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-4xl animate-pulse text-amber-300">✦</div>
    </div>
  )

  const bg = TYPE_BG[item.type] ?? TYPE_BG.Thought
  const accent = TYPE_ACCENT[item.type] ?? TYPE_ACCENT.Thought
  const icon = TYPE_ICON[item.type] ?? '✦'
  const bodyRTL = isRTL(item.body)
  const titleRTL = item.title ? isRTL(item.title) : false

  return (
    <div className={`min-h-screen bg-gradient-to-b ${bg} flex flex-col`}>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg">

          {/* type icon */}
          <div className="text-center mb-8">
            <span className="text-4xl">{icon}</span>
          </div>

          {/* quote mark for quotes */}
          {item.type === 'Quote' && (
            <div className={`font-serif text-8xl leading-none mb-2 select-none ${accent} opacity-20`}>"</div>
          )}

          {/* title */}
          {item.title && (
            <h1
              dir={titleRTL ? 'rtl' : 'ltr'}
              className={`font-serif text-3xl font-bold text-stone-800 mb-6 leading-snug${titleRTL ? ' text-right' : ''}`}
            >
              {item.title}
            </h1>
          )}

          {/* body */}
          <p
            dir={bodyRTL ? 'rtl' : 'ltr'}
            className={`text-stone-700 leading-relaxed mb-6 ${
              item.type === 'Quote' ? 'font-serif text-2xl italic' : 'text-xl'
            }${bodyRTL ? ' text-right' : ''}`}
          >
            {item.body}
          </p>

          {/* author */}
          {item.author && (
            <p className={`text-base italic ${accent} opacity-80`}>— {item.author}</p>
          )}
        </div>
      </main>

      {/* footer */}
      <footer className="text-center pb-8">
        <Link
          href={`/lumina/item/${item.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-600 transition-colors"
        >
          <span className="text-amber-400">✦</span> Open in Lumina
        </Link>
      </footer>

    </div>
  )
}
