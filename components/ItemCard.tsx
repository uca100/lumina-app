'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { TagBadge } from './TagBadge'

export interface Item {
  id: string
  title: string | null
  body: string
  type: 'Quote' | 'Affirmation' | 'Story' | 'Thought'
  source: string
  author: string | null
  tags: string[]
  synced: number
  createdAt: number
}

const TYPE_CONFIG: Record<string, { label: string; accent: string; badge: string; quote: boolean }> = {
  Quote:       { label: 'Quote',       accent: 'border-l-sky-400',     badge: 'text-sky-700 bg-sky-50 border-sky-200',         quote: true  },
  Affirmation: { label: 'Affirmation', accent: 'border-l-emerald-400', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200', quote: false },
  Story:       { label: 'Story',       accent: 'border-l-violet-400',  badge: 'text-violet-700 bg-violet-50 border-violet-200', quote: false },
  Thought:     { label: 'Thought',     accent: 'border-l-amber-400',   badge: 'text-amber-700 bg-amber-50 border-amber-200',   quote: false },
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
      <article className={`relative bg-white border border-stone-100 border-l-4 ${cfg.accent} rounded-2xl px-6 py-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}>

        {/* header row */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>
            {cfg.label}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-stone-300">
              {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.preventDefault()}>
              <Link
                href={`/item/${item.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] px-2 py-0.5 rounded-full border border-stone-200 text-stone-400 hover:border-amber-400 hover:text-amber-600 transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-[11px] px-2 py-0.5 rounded-full border border-red-100 text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
              >
                {deleting ? '…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        {/* opening quote mark for quotes */}
        {cfg.quote && (
          <div className="text-5xl font-serif text-stone-100 leading-none mb-1 select-none">"</div>
        )}

        {item.title && (
          <h3 className="font-serif text-xl font-bold text-stone-800 mb-2 leading-snug group-hover:text-amber-900 transition-colors">
            {item.title}
          </h3>
        )}

        <p className={`text-stone-600 leading-relaxed mb-4 ${cfg.quote ? 'font-serif text-base italic' : 'text-sm'}`}>
          {preview}
        </p>

        {/* footer */}
        <div className="flex flex-wrap items-center gap-1.5 mt-auto">
          {attribution && (
            <span className="text-[11px] text-stone-400 italic mr-1">— {attribution}</span>
          )}
          {item.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
        </div>
      </article>
    </Link>
  )
}
