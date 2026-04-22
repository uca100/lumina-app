'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { TagBadge } from './TagBadge'

export interface Item {
  id: string
  title: string | null
  body: string
  type: 'Quote' | 'Affirmation' | 'Story' | 'Thought' | 'Lesson' | 'Habit'
  source: string
  author: string | null
  tags: string[]
  synced: number
  createdAt: number
}

const TYPE_CONFIG: Record<string, { label: string; border: string; badge: string; quote: boolean }> = {
  Quote:       { label: 'Quote',       border: 'border-l-sky-500/60',     badge: 'text-sky-400 bg-sky-500/10 border-sky-500/30',         quote: true  },
  Affirmation: { label: 'Affirmation', border: 'border-l-emerald-500/60', badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', quote: false },
  Story:       { label: 'Story',       border: 'border-l-violet-500/60',  badge: 'text-violet-400 bg-violet-500/10 border-violet-500/30', quote: false },
  Thought:     { label: 'Thought',     border: 'border-l-amber-500/60',   badge: 'text-amber-400 bg-amber-500/10 border-amber-500/30',   quote: false },
  Lesson:      { label: 'Lesson',      border: 'border-l-rose-500/60',    badge: 'text-rose-400 bg-rose-500/10 border-rose-500/30',      quote: false },
  Habit:       { label: 'Habit',       border: 'border-l-teal-500/60',    badge: 'text-teal-400 bg-teal-500/10 border-teal-500/30',      quote: false },
}

export function ItemCard({ item, onDeleted }: { item: Item; onDeleted?: (id: string) => void }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.Thought
  const preview = item.body.length > 220 ? item.body.slice(0, 220) + '…' : item.body
  const attribution = item.author || (item.source !== 'manual' ? item.source : null)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this item?')) return
    setDeleting(true)
    await fetch(`/lumina/api/items/${item.id}`, { method: 'DELETE' })
    if (onDeleted) onDeleted(item.id)
    else router.refresh()
  }

  return (
    <Link href={`/item/${item.id}`} className="block group">
      <article className={`relative bg-zinc-900/60 border border-white/5 border-l-4 ${cfg.border} rounded-2xl px-6 py-5 backdrop-blur-sm hover:bg-zinc-900/80 hover:border-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30`}>

        {/* header row */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>
            {cfg.label}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-700">
              {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.preventDefault()}>
              <Link
                href={`/item/${item.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-500 hover:border-amber-500/50 hover:text-amber-400 transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-[11px] px-2 py-0.5 rounded-full border border-red-900/50 text-red-500/60 hover:bg-red-950/40 hover:text-red-400 transition-colors disabled:opacity-40"
              >
                {deleting ? '…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        {cfg.quote && (
          <div className="text-5xl font-serif text-zinc-700 leading-none mb-1 select-none">"</div>
        )}

        {item.title && (
          <h3 className="font-serif text-xl font-bold text-zinc-100 mb-2 leading-snug group-hover:text-amber-100 transition-colors">
            {item.title}
          </h3>
        )}

        <p className={`text-zinc-400 leading-relaxed mb-4 ${cfg.quote ? 'font-serif text-base italic text-zinc-300' : 'text-sm'}`}>
          {preview}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          {attribution && (
            <span className="text-[11px] text-zinc-600 italic mr-1">— {attribution}</span>
          )}
          {item.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
        </div>
      </article>
    </Link>
  )
}
