'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TagBadge } from '@/components/TagBadge'
import Link from 'next/link'
import { Item } from '@/components/ItemCard'

const TYPES = ['Quote', 'Affirmation', 'Story', 'Thought'] as const

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
    router.push('/lumina')
  }

  if (!item) return <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-400">Loading…</div>

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-[#faf7f2] border-b border-stone-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/lumina" className="text-stone-500 hover:text-stone-700 text-sm">← Back</Link>
          <div className="flex gap-2">
            {!editing && (
              <>
                <button onClick={() => setEditing(true)} className="text-sm px-3 py-1 border border-stone-200 rounded-full text-stone-500 hover:border-amber-400 hover:text-amber-600 transition-colors">Edit</button>
                <button onClick={del} disabled={deleting} className="text-sm px-3 py-1 border border-red-200 rounded-full text-red-400 hover:bg-red-50 transition-colors">{deleting ? '…' : 'Delete'}</button>
              </>
            )}
            {editing && (
              <>
                <button onClick={() => setEditing(false)} className="text-sm px-3 py-1 border border-stone-200 rounded-full text-stone-500">Cancel</button>
                <button onClick={save} disabled={saving} className="text-sm px-4 py-1 bg-amber-500 text-black font-semibold rounded-full hover:bg-amber-400 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {!editing ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-stone-200 text-stone-500">{item.type}</span>
              <span className="text-xs text-stone-400">{new Date(item.createdAt).toLocaleDateString()}</span>
              {item.synced === 0 && <span className="text-xs text-amber-500">● Pending sync</span>}
            </div>

            {item.title && <h2 className="font-serif text-3xl font-bold text-stone-800 mb-4 leading-tight">{item.title}</h2>}
            <p className="text-stone-700 text-lg leading-relaxed mb-4 whitespace-pre-wrap font-serif">{item.body}</p>
            {item.author && <p className="text-stone-400 italic mb-6">— {item.author}</p>}

            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-xs text-stone-500 mb-1 uppercase tracking-wider">Type</label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button key={t} onClick={() => setForm({ ...form, type: t })} className={`px-3 py-1 rounded-full text-sm border transition-colors ${form.type === t ? 'bg-amber-500 text-black border-amber-500' : 'border-stone-200 text-stone-500'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1 uppercase tracking-wider">Title</label>
              <input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1 uppercase tracking-wider">Body</label>
              <textarea value={form.body ?? ''} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={8} className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:outline-none focus:border-amber-400 resize-none font-serif text-lg" />
            </div>
            {form.type === 'Quote' && (
              <div>
                <label className="block text-xs text-stone-500 mb-1 uppercase tracking-wider">Author</label>
                <input value={form.author ?? ''} onChange={(e) => setForm({ ...form, author: e.target.value })} className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:outline-none focus:border-amber-400" />
              </div>
            )}
            <div>
              <label className="block text-xs text-stone-500 mb-1 uppercase tracking-wider">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(form.tags ?? []).map((tag) => (
                  <span key={tag} onClick={() => setForm({ ...form, tags: (form.tags ?? []).filter((t) => t !== tag) })} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer hover:bg-red-100 hover:text-red-700">{tag} ×</span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} placeholder="Add tag…" className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                <button onClick={addTag} className="px-3 py-2 border border-stone-200 rounded-xl text-sm text-stone-500 hover:border-amber-400">Add</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
