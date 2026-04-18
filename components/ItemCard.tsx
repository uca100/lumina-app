'use client'

import Link from 'next/link'
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

const TYPE_STYLES: Record<string, string> = {
  Quote: 'text-blue-700 bg-blue-50 border-blue-200',
  Affirmation: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Story: 'text-purple-700 bg-purple-50 border-purple-200',
  Thought: 'text-amber-700 bg-amber-50 border-amber-200',
}

export function ItemCard({ item }: { item: Item }) {
  const preview = item.body.length > 200 ? item.body.slice(0, 200) + '…' : item.body

  return (
    <Link href={`/lumina/item/${item.id}`} className="block group">
      <div className="bg-[#faf7f2] border border-stone-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TYPE_STYLES[item.type] ?? ''}`}>
            {item.type}
          </span>
          <span className="text-xs text-stone-400">
            {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {item.title && (
          <h3 className="font-serif text-lg font-semibold text-stone-800 mb-1 leading-snug">
            {item.title}
          </h3>
        )}

        <p className="text-stone-600 text-sm leading-relaxed mb-3">{preview}</p>

        {item.author && (
          <p className="text-xs text-stone-400 italic mb-3">— {item.author}</p>
        )}

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
          </div>
        )}
      </div>
    </Link>
  )
}
