'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TagBadge } from '@/components/TagBadge'
import Link from 'next/link'
import { Item } from '@/components/ItemCard'

const TYPES = ['Quote', 'Affirmation', 'Story', 'Thought'] as const

const TYPE_ACCENT: Record<string, string> = {
  Quote:       'from-sky-50 to-white border-sky-100',
  Affirmation: 'from-emerald-50 to-white border-emerald-100',
  Story:       'from-violet-50 to-white border-violet-100',
  Thought:     'from-amber-50 to-white border-amber-100',
}

const TYPE_BADGE: Record<string, string> = {
  Quote:       'text-sky-700 bg-sky-50 border-sky-200',
  Affirmation: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Story:       'text-violet-700 bg-violet-50 border-violet-200',
  Thought:     'text-amber-700 bg-amber-50 border-amber-200',
}

export default function ItemPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [item, setItem] = useState<Item | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Item>>({})
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch(`/lumina/api/items/${id}`).then((r) => r.json()).then((data) => {
      setItem(data)
      setForm(data)
    })
  }, [id])

  function addTag() {
    const t = tagInput.trim()
    if (t && !(form.tags ?? []).includes(t)) setForm({ ...form, tags: [...(form.tags ?? []), t] })
    setTagInput('')
  }

  async function save() {
    setSaving(true)
    await fetch(`/lumina/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const updated = await fetch(`/lumina/api/items/${id}`).then((r) => r.json())
    setItem(updated)
    setForm(updated)
    setEditing(false)
    setSaving(false)
  }

  async function del() {
    if (!confirm('Delete this item?')) return
    setDeleting(true)
    await fetch(`/lumina/api/items/${id}`, { method: 'DELETE' })
    router.push('/')
  }

  if (!item) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #fdf8f0 0%, #f5f0e8 100%)' }}>
      <div className="text-4xl animate-pulse text-amber-300">✦</div>
    </div>
  )

  const accent = TYPE_ACCENT[item.type] ?? TYPE_ACCENT.Thought
  const badge = TYPE_BADGE[item.type] ?? TYPE_BADGE.Thought

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #fdf8f0 0%, #f5f0e8 50%, #ede8df 100%)' }}>

      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 border-b border-stone-200/60 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 text-sm transition-colors">
            ← <span className="text-amber-500">✦</span> Lumina
          </Link>
          <div className="flex gap-2">
            {!editing && (
              <>
                <button onClick={() => setEditing(true)} className="text-sm px-4 py-1.5 border border-stone-200 rounded-full text-stone-500 hover:border-amber-400 hover:text-amber-600 transition-all">
                  Edit
                </button>
                <button onClick={del} disabled={deleting} className="text-sm px-4 py-1.5 border border-red-200 rounded-full text-red-400 hover:bg-red-50 transition-all">
                  {deleting ? '…' : 'Delete'}
                </button>
              </>
            )}
            {editing && (
              <>
                <button onClick={() => setEditing(false)} className="text-sm px-4 py-1.5 border border-stone-200 rounded-full text-stone-500 hover:border-stone-300 transition-all">
                  Cancel
                </button>
                <button onClick={save} disabled={saving} className="text-sm px-5 py-1.5 bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold rounded-full hover:shadow-md hover:shadow-amber-200 disabled:opacity-40 transition-all">
                  {saving ? '✦ Saving…' : '✦ Save'}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {!editing ? (
          <div>
            {/* card shell */}
            <div className={`bg-gradient-to-b ${accent} border rounded-3xl px-8 py-10 shadow-sm mb-6`}>

              <div className="flex items-center gap-3 mb-6">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${badge}`}>
                  {item.type}
                </span>
                <span className="text-xs text-stone-300">{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                {item.synced === 0 && <span className="text-xs text-amber-500 ml-auto">● Pending sync</span>}
              </div>

              {item.type === 'Quote' && (
                <div className="text-7xl font-serif text-stone-200 leading-none mb-2 select-none">"</div>
              )}

              {item.title && (
                <h2 className="font-serif text-3xl font-bold text-stone-800 mb-5 leading-tight">{item.title}</h2>
              )}

              <p className={`text-stone-700 leading-relaxed mb-5 ${item.type === 'Quote' ? 'font-serif text-xl italic' : 'text-lg'}`}>
                {item.body}
              </p>

              {item.author && (
                <p className="text-stone-400 italic text-sm">— {item.author}</p>
              )}
            </div>

            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 px-2">
                {item.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5">

            <div>
              <label className="block text-[10px] text-stone-400 mb-2 uppercase tracking-widest">Type</label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, type: t })}
                    className={`px-4 py-1.5 rounded-full text-sm border font-medium transition-all ${
                      form.type === t
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'border-stone-200 text-stone-400 bg-white hover:border-amber-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-stone-400 mb-1.5 uppercase tracking-widest">Title</label>
              <input
                value={form.title ?? ''}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-stone-400 mb-1.5 uppercase tracking-widest">Body</label>
              <textarea
                value={form.body ?? ''}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={8}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none font-serif text-lg transition-all"
              />
            </div>

            {form.type === 'Quote' && (
              <div>
                <label className="block text-[10px] text-stone-400 mb-1.5 uppercase tracking-widest">Author</label>
                <input
                  value={form.author ?? ''}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] text-stone-400 mb-1.5 uppercase tracking-widest">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(form.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    onClick={() => setForm({ ...form, tags: (form.tags ?? []).filter((t) => t !== tag) })}
                    className="inline-flex items-center gap-1 px-3 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                  >
                    {tag} ×
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  placeholder="Add tag…"
                  className="flex-1 border border-stone-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:border-amber-400 transition-all"
                />
                <button onClick={addTag} className="px-4 py-2 border border-stone-200 rounded-xl text-sm text-stone-400 hover:border-amber-400 hover:text-amber-600 transition-all">
                  Add
                </button>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
