'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { isRTL } from '@/lib/utils/rtl'
import { UserBadge } from '@/components/UserBadge'

interface QueueItem {
  id: string
  title: string | null
  body: string
  type: string
  source: string
  author: string | null
  tags: string[]
  status: 'draft' | 'review' | 'published'
  mark: number
  createdAt: number
}

const TYPE_BADGE: Record<string, string> = {
  Quote:       'text-sky-400 bg-sky-500/10 border-sky-500/30',
  Affirmation: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  Story:       'text-violet-400 bg-violet-500/10 border-violet-500/30',
  Thought:     'text-amber-400 bg-amber-500/10 border-amber-500/30',
  Lesson:      'text-rose-400 bg-rose-500/10 border-rose-500/30',
  Habit:       'text-teal-400 bg-teal-500/10 border-teal-500/30',
  Pattern:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
}

const SOURCE_ICON: Record<string, string> = {
  telegram: '✈',
  whatsapp: '💬',
  email: '✉',
  voice: '🎙',
  shortcut: '⌘',
  manual: '✦',
}

export default function QueuePage() {
  const [reviewItems, setReviewItems] = useState<QueueItem[]>([])
  const [draftItems, setDraftItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<Record<string, boolean>>({})

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    const [reviewRes, draftRes] = await Promise.all([
      fetch('/lumina/api/items?status=review&limit=200'),
      fetch('/lumina/api/items?status=draft&limit=200'),
    ])
    const [review, draft] = await Promise.all([reviewRes.json(), draftRes.json()])
    setReviewItems(review)
    setDraftItems(draft)
    setLoading(false)
  }, [])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  async function setStatus(id: string, status: 'draft' | 'review' | 'published') {
    setActing((a) => ({ ...a, [id]: true }))
    await fetch(`/lumina/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setReviewItems((items) => items.filter((i) => i.id !== id))
    setDraftItems((items) => items.filter((i) => i.id !== id))
    setActing((a) => ({ ...a, [id]: false }))
  }

  async function setMark(id: string, mark: number) {
    await fetch(`/lumina/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark }),
    })
    setReviewItems((items) => items.map((i) => i.id === id ? { ...i, mark } : i))
    setDraftItems((items) => items.map((i) => i.id === id ? { ...i, mark } : i))
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item?')) return
    setActing((a) => ({ ...a, [id]: true }))
    await fetch(`/lumina/api/items/${id}`, { method: 'DELETE' })
    setReviewItems((items) => items.filter((i) => i.id !== id))
    setDraftItems((items) => items.filter((i) => i.id !== id))
    setActing((a) => ({ ...a, [id]: false }))
  }

  const total = reviewItems.length + draftItems.length

  return (
    <div className="min-h-screen text-white" style={{ background: 'radial-gradient(ellipse at top, #1c1408 0%, #0d0d0d 60%)' }}>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-amber-900/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-10 backdrop-blur-md bg-black/40 border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm">← Back</Link>
            <span className="text-zinc-700 mx-1">/</span>
            <span className="text-amber-500 text-xl">✦</span>
            <h1 className="font-serif text-2xl font-bold text-white tracking-tight">Inbox</h1>
            {!loading && total > 0 && (
              <span className="text-[11px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded-full font-mono">{total}</span>
            )}
          </div>
          <UserBadge />
        </div>
      </header>

      <main className="relative max-w-3xl mx-auto px-6 py-8">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="text-4xl animate-pulse text-amber-500/50">✦</div>
            <p className="text-zinc-600 text-sm">Loading queue…</p>
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="text-5xl text-zinc-700">✓</div>
            <p className="text-zinc-500 text-center">Inbox zero. Nothing waiting for review.</p>
            <Link href="/" className="mt-2 text-sm text-amber-500 underline underline-offset-4 hover:text-amber-400">
              Go to feed →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-10">

            {reviewItems.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Pending Review</h2>
                  <span className="text-[10px] text-zinc-700 font-mono">{reviewItems.length}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {reviewItems.map((item) => (
                    <QueueCard
                      key={item.id}
                      item={item}
                      acting={!!acting[item.id]}
                      onPublish={() => setStatus(item.id, 'published')}
                      onMoveToDraft={() => setStatus(item.id, 'draft')}
                      onDelete={() => deleteItem(item.id)}
                      onMark={(m) => setMark(item.id, m)}
                    />
                  ))}
                </div>
              </section>
            )}

            {draftItems.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Drafts</h2>
                  <span className="text-[10px] text-zinc-700 font-mono">{draftItems.length}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {draftItems.map((item) => (
                    <QueueCard
                      key={item.id}
                      item={item}
                      acting={!!acting[item.id]}
                      onPublish={() => setStatus(item.id, 'published')}
                      onMoveToReview={() => setStatus(item.id, 'review')}
                      onDelete={() => deleteItem(item.id)}
                      onMark={(m) => setMark(item.id, m)}
                    />
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </main>
    </div>
  )
}

function QueueCard({
  item,
  acting,
  onPublish,
  onMoveToDraft,
  onMoveToReview,
  onDelete,
  onMark,
}: {
  item: QueueItem
  acting: boolean
  onPublish: () => void
  onMoveToDraft?: () => void
  onMoveToReview?: () => void
  onDelete: () => void
  onMark: (mark: number) => void
}) {
  const typeBadge = TYPE_BADGE[item.type] ?? TYPE_BADGE.Thought
  const preview = item.body.length > 160 ? item.body.slice(0, 160) + '…' : item.body
  const bodyRTL = isRTL(item.body)
  const titleRTL = item.title ? isRTL(item.title) : false
  const sourceIcon = SOURCE_ICON[item.source] ?? '•'

  return (
    <article className="bg-zinc-900/60 border border-white/5 rounded-2xl px-5 py-4 backdrop-blur-sm flex gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${typeBadge}`}>
            {item.type}
          </span>
          <span className="text-[11px] text-zinc-600" title={item.source}>{sourceIcon} {item.source}</span>
          <span className="text-[11px] text-zinc-700 ml-auto">
            {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {item.title && (
          <p dir={titleRTL ? 'rtl' : 'ltr'} className={`font-serif font-semibold text-zinc-200 mb-1 leading-snug${titleRTL ? ' text-right' : ''}`}>
            {item.title}
          </p>
        )}
        <p dir={bodyRTL ? 'rtl' : 'ltr'} className={`text-zinc-500 text-sm leading-relaxed${bodyRTL ? ' text-right' : ''}`}>
          {preview}
        </p>
        {item.author && (
          <p className="text-zinc-700 text-xs italic mt-1">— {item.author}</p>
        )}

        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3].map((m) => (
            <button
              key={m}
              onClick={() => onMark(m)}
              title={m === 1 ? 'Low' : m === 2 ? 'Medium' : 'High'}
              className={`text-[10px] w-6 h-5 rounded flex items-center justify-center border transition-all ${item.mark === m ? (m === 3 ? 'border-amber-500/60 text-amber-400 bg-amber-500/10' : m === 1 ? 'border-zinc-600 text-zinc-400 bg-zinc-800/60' : 'border-zinc-500/60 text-zinc-300 bg-zinc-700/40') : 'border-zinc-800 text-zinc-700 hover:border-zinc-600 hover:text-zinc-500'}`}
            >
              {m}
            </button>
          ))}
          <span className="text-[10px] text-zinc-700 ml-0.5">mark</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 shrink-0 justify-center">
        <button
          onClick={onPublish}
          disabled={acting}
          className="text-[11px] px-3 py-1.5 rounded-full bg-emerald-600/20 border border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/60 transition-all disabled:opacity-40 font-medium"
        >
          {acting ? '…' : '✓ Publish'}
        </button>
        <Link
          href={`/item/${item.id}?edit=true&from=queue`}
          className="text-[11px] px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-all text-center"
        >
          Edit
        </Link>
        {onMoveToDraft && (
          <button
            onClick={onMoveToDraft}
            disabled={acting}
            className="text-[11px] px-3 py-1.5 rounded-full border border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400 transition-all disabled:opacity-40"
          >
            → Draft
          </button>
        )}
        {onMoveToReview && (
          <button
            onClick={onMoveToReview}
            disabled={acting}
            className="text-[11px] px-3 py-1.5 rounded-full border border-amber-800/40 text-amber-700 hover:border-amber-600/60 hover:text-amber-500 transition-all disabled:opacity-40"
          >
            → Review
          </button>
        )}
        <button
          onClick={onDelete}
          disabled={acting}
          className="text-[11px] px-3 py-1.5 rounded-full border border-red-900/40 text-red-600/60 hover:bg-red-950/30 hover:text-red-400 transition-all disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </article>
  )
}
