import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TagBadge } from './TagBadge'

export interface Item {
  id: string
  title: string | null
  body: string
  type: 'Quote' | 'Affirmation' | 'Story' | 'Thought' | 'Lesson' | 'Habit' | 'Pattern' | 'Advice'
  source: string
  author: string | null
  tags: string[]
  synced: number
  pinned: number
  status: 'draft' | 'review' | 'published'
  mark: number
  summary: string | null
  createdAt: number
  updatedAt: number
}

const TYPE_CONFIG: Record<string, { label: string, border: string, badge: string, quote: boolean }> = {
  Quote:       { label: 'Quote',       border: 'border-l-sky-500/60',     badge: 'text-sky-400 bg-sky-500/10 border-sky-500/30',             quote: true  },
  Affirmation: { label: 'Affirmation', border: 'border-l-emerald-500/60', badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', quote: false },
  Story:       { label: 'Story',       border: 'border-l-violet-500/60',  badge: 'text-violet-400 bg-violet-500/10 border-violet-500/30',    quote: false },
  Thought:     { label: 'Thought',     border: 'border-l-amber-500/60',   badge: 'text-amber-400 bg-amber-500/10 border-amber-500/30',       quote: false },
  Lesson:      { label: 'Lesson',      border: 'border-l-rose-500/60',    badge: 'text-rose-400 bg-rose-500/10 border-rose-500/30',          quote: false },
  Habit:       { label: 'Habit',       border: 'border-l-teal-500/60',    badge: 'text-teal-400 bg-teal-500/10 border-teal-500/30',          quote: false },
  Advice:      { label: 'Advice',      border: 'border-l-indigo-500/60', badge: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30', quote: false },
  Pattern:     { label: 'Pattern',     border: 'border-l-orange-500/60',  badge: 'text-orange-400 bg-orange-500/10 border-orange-500/30',    quote: false },
}

export function ItemCard({ item, onDeleted, onTagClick }: { item: Item; onDeleted?: (id: string) => void; onTagClick?: (tag: string) => void }) {
  const router = useRouter()
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.Thought
  
  const isHebrew = (text: string) => /[\u0590-\u05FF]/.test(text)
  const bodyRTL = isHebrew(item.body)
  const titleRTL = item.title ? isHebrew(item.title) : false

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this item?')) return
    
    const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' })
    if (res.ok) onDeleted?.(item.id)
  }

  return (
    <Link href={`/item/${item.id}`}>
      <article className={`group relative bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700/80 rounded-2xl p-6 transition-all active:scale-[0.98] ${config.border} border-l-4`}>
        <div className="flex justify-between items-start mb-4 gap-4">
          <div className="flex flex-wrap gap-2">
            <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full border ${config.badge}`}>
              {config.label}
            </span>
            {item.pinned === 1 && (
              <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full border text-amber-400 bg-amber-500/10 border-amber-500/30">
                Pinned
              </span>
            )}
            {item.status === 'review' && (
              <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full border text-rose-400 bg-rose-500/10 border-rose-500/30">
                Review
              </span>
            )}
          </div>
          
          <button 
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-2 -m-2 text-zinc-500 hover:text-rose-400 transition-all"
            title="Delete item"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {item.title && (
          <h2 className={`text-xl font-bold text-zinc-100 mb-3 group-hover:text-white transition-colors leading-tight ${titleRTL ? 'text-right rtl-text' : ''}`}>
            {item.title}
          </h2>
        )}

        <div className="relative">
          {config.quote && (
            <span className="absolute -top-2 -left-3 text-4xl text-zinc-800 font-serif select-none pointer-events-none">"</span>
          )}
          <p className={`text-zinc-400 leading-relaxed line-clamp-4 ${bodyRTL ? 'text-right rtl-text' : ''} ${config.quote ? 'italic font-serif' : ''}`}>
            {item.body}
          </p>
        </div>

        {item.author && (
          <div className={`mt-4 text-sm font-medium text-zinc-500 ${bodyRTL ? 'text-right' : ''}`}>
             — {item.author}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {item.tags.map(tag => (
            <TagBadge 
              key={tag} 
              tag={tag}
              onClick={onTagClick ? (e) => { e.preventDefault(); e.stopPropagation(); onTagClick(tag) } : undefined}
            />
          ))}
        </div>
      </article>
    </Link>
  )
}
