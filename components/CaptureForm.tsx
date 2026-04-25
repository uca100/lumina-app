'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TYPES = ['Quote', 'Affirmation', 'Story', 'Thought', 'Lesson', 'Habit', 'Pattern'] as const

const TYPE_META: Record<string, { icon: string; color: string }> = {
  Quote:       { icon: '"',  color: 'border-sky-500 bg-sky-500/10 text-sky-300' },
  Affirmation: { icon: '✿', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-300' },
  Story:       { icon: '◈', color: 'border-violet-500 bg-violet-500/10 text-violet-300' },
  Thought:     { icon: '◎', color: 'border-amber-500 bg-amber-500/10 text-amber-300' },
  Lesson:      { icon: '◆', color: 'border-rose-500 bg-rose-500/10 text-rose-300' },
  Habit:       { icon: '⬡', color: 'border-teal-500 bg-teal-500/10 text-teal-300' },
  Pattern:     { icon: '◇', color: 'border-orange-500 bg-orange-500/10 text-orange-300' },
}

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
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(ellipse at top, #1a1208 0%, #0d0d0d 60%)' }}>

      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-amber-900/20 blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto w-full px-6 py-10 flex-1 flex flex-col gap-6">

        {/* header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-amber-500">✦</span>
              <h1 className="font-serif text-3xl font-bold text-white tracking-tight">Capture</h1>
            </div>
            <p className="text-zinc-500 text-sm">What moved you today?</p>
          </div>
          <button onClick={() => router.push('/')} className="text-zinc-600 hover:text-zinc-400 transition-colors text-sm">
            ✕
          </button>
        </div>

        {/* main textarea */}
        <div className="relative">
          {type === 'Quote' && (
            <span className="absolute top-3 left-5 text-5xl font-serif text-zinc-700 leading-none select-none pointer-events-none">"</span>
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={type === 'Quote' ? 'Paste the quote here…' : type === 'Affirmation' ? 'Write your affirmation…' : type === 'Story' ? 'Tell the story…' : type === 'Lesson' ? 'What did you learn?' : type === 'Habit' ? 'Describe the habit or practice…' : type === 'Pattern' ? 'Describe the pattern you noticed…' : "What's on your mind?"}
            rows={7}
            className={`w-full bg-zinc-900/60 border border-zinc-700/60 backdrop-blur-sm rounded-2xl py-5 text-white text-lg leading-relaxed resize-none focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 placeholder:text-zinc-600 font-serif transition-all ${type === 'Quote' ? 'px-6 pt-12' : 'px-5'}`}
            autoFocus
          />
        </div>

        {/* AI classify */}
        {body.trim() && (
          <button
            onClick={classify}
            disabled={classifying}
            className="self-start flex items-center gap-2 text-sm text-amber-400 border border-amber-500/40 px-4 py-2 rounded-full hover:bg-amber-500/10 transition-all disabled:opacity-40"
          >
            {classifying
              ? <><span className="animate-spin inline-block">⟳</span> Classifying…</>
              : <><span>✦</span> Auto-classify with AI</>
            }
          </button>
        )}

        {/* type selector */}
        <div>
          <label className="block text-[10px] text-zinc-500 mb-2 uppercase tracking-widest">Type</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => {
              const m = TYPE_META[t]
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border font-medium transition-all ${
                    type === t ? m.color + ' border-opacity-100' : 'border-zinc-700/60 text-zinc-500 hover:border-zinc-500'
                  }`}
                >
                  <span>{m.icon}</span> {t}
                </button>
              )
            })}
          </div>
        </div>

        {/* title */}
        <div>
          <label className="block text-[10px] text-zinc-500 mb-1.5 uppercase tracking-widest">Title <span className="normal-case text-zinc-600">(optional)</span></label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short headline…"
            className="w-full bg-zinc-900/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500/60 placeholder:text-zinc-600"
          />
        </div>

        {/* author */}
        {type === 'Quote' && (
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1.5 uppercase tracking-widest">Author</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Who said this?"
              className="w-full bg-zinc-900/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500/60 placeholder:text-zinc-600"
            />
          </div>
        )}

        {/* tags */}
        <div>
          <label className="block text-[10px] text-zinc-500 mb-1.5 uppercase tracking-widest">Tags</label>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  className="inline-flex items-center gap-1 px-3 py-0.5 text-xs rounded-full bg-amber-900/30 text-amber-300 border border-amber-700/40 cursor-pointer hover:bg-red-900/30 hover:text-red-300 hover:border-red-700/40 transition-colors"
                >
                  {tag} ×
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
              placeholder="Add a tag, press Enter"
              className="flex-1 bg-zinc-900/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500/60 text-sm placeholder:text-zinc-600"
            />
            <button onClick={addTag} className="px-4 py-2 border border-zinc-700/60 rounded-xl text-zinc-500 hover:border-amber-500/40 hover:text-amber-400 transition-colors text-sm">
              Add
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm bg-red-950/30 border border-red-800/30 rounded-xl px-4 py-2">{error}</p>}

        {/* actions */}
        <div className="flex gap-3 mt-auto pt-6 border-t border-zinc-800/60">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 rounded-xl border border-zinc-700/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-all text-sm"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!body.trim() || saving}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-30 shadow-lg shadow-amber-900/20 text-sm tracking-wide"
          >
            {saving ? '✦ Saving…' : '✦ Save to Lumina'}
          </button>
        </div>

      </div>
    </div>
  )
}
