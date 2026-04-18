'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TagBadge } from './TagBadge'

const TYPES = ['Quote', 'Affirmation', 'Story', 'Thought'] as const

export function CaptureForm() {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [author, setAuthor] = useState('')
  const [type, setType] = useState<typeof TYPES[number]>('Thought')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [classifying, setClassifying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function classify() {
    if (!body.trim()) return
    setClassifying(true)
    setError('')
    try {
      const res = await fetch('/lumina/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) throw new Error('Classification failed')
      const data = await res.json()
      setType(data.type ?? 'Thought')
      setAuthor(data.author ?? '')
      setTags(data.tags ?? [])
      setTitle(data.title ?? '')
    } catch {
      setError('Could not classify — check API key or network.')
    } finally {
      setClassifying(false)
    }
  }

  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  async function save() {
    if (!body.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/lumina/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, title: title || null, type, author: author || null, tags }),
      })
      if (!res.ok) throw new Error('Save failed')
      router.push('/')
    } catch {
      setError('Could not save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-6 py-10 flex-1 flex flex-col gap-6">
        <div>
          <h1 className="font-serif text-4xl font-bold tracking-tight mb-1">Capture</h1>
          <p className="text-zinc-500 text-sm">Drop a thought, quote, story, or affirmation.</p>
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What inspired you today?"
          rows={6}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white text-lg leading-relaxed resize-none focus:outline-none focus:border-amber-500 placeholder:text-zinc-600 font-serif"
          autoFocus
        />

        {body.trim() && (
          <button
            onClick={classify}
            disabled={classifying}
            className="self-start text-sm text-amber-400 border border-amber-500 px-4 py-1.5 rounded-full hover:bg-amber-500 hover:text-black transition-colors disabled:opacity-50"
          >
            {classifying ? 'Classifying…' : '✦ Auto-classify with AI'}
          </button>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${type === t ? 'bg-amber-500 text-black border-amber-500 font-semibold' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Title (optional)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short headline…"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {(type === 'Quote') && (
          <div>
            <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Author</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Who said this?"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                onClick={() => setTags(tags.filter((t) => t !== tag))}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-amber-900/40 text-amber-300 border border-amber-700 cursor-pointer hover:bg-red-900/40 hover:text-red-300 hover:border-red-700 transition-colors"
              >
                {tag} ×
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
              placeholder="Add a tag, press Enter"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500 text-sm"
            />
            <button onClick={addTag} className="px-4 py-2 border border-zinc-700 rounded-xl text-zinc-400 hover:border-amber-500 hover:text-amber-400 transition-colors text-sm">
              Add
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 mt-auto pt-4 border-t border-zinc-800">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!body.trim() || saving}
            className="flex-1 px-6 py-2.5 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save to Lumina'}
          </button>
        </div>
      </div>
    </div>
  )
}
