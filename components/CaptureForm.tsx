'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserBadge } from '@/components/UserBadge'

const TYPES = ['Quote', 'Affirmation', 'Story', 'Thought', 'Lesson', 'Habit', 'Advice', 'Pattern'] as const

const TYPE_META: Record<string, { icon: string; color: string }> = {
  Quote:       { icon: '"',  color: 'border-sky-500 bg-sky-500/10 text-sky-300' },
  Affirmation: { icon: '✿', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-300' },
  Story:       { icon: '◈', color: 'border-violet-500 bg-violet-500/10 text-violet-300' },
  Thought:     { icon: '✦', color: 'border-amber-500 bg-amber-500/10 text-amber-300' },
  Lesson:      { icon: '✎', color: 'border-rose-500 bg-rose-500/10 text-rose-300' },
  Habit:       { icon: '⚓', color: 'border-teal-500 bg-teal-500/10 text-teal-300' },
  Advice:      { icon: '💡', color: 'border-indigo-500 bg-indigo-500/10 text-indigo-300' },
  Pattern:     { icon: '▤', color: 'border-orange-500 bg-orange-500/10 text-orange-300' },
}

export function CaptureForm() {
  const [body, setBody] = useState('')
  const [type, setType] = useState<typeof TYPES[number]>('Thought')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleClassify = async () => {
    if (!body.trim()) return
    try {
      const res = await fetch('/lumina/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      const data = await res.json()
      setType(data.type ?? 'Thought')
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async () => {
    if (!body.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/lumina/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, type, source: 'manual' }),
      })
      if (res.ok) {
        router.push('/')
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen text-white" style={{ background: 'radial-gradient(ellipse at top, #1c1408 0%, #0d0d0d 60%)' }}>
      <header className="sticky top-0 z-10 backdrop-blur-md bg-black/40 border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">← Lumina</Link>
            <span className="text-zinc-700">/</span>
            <h1 className="text-white font-semibold">Capture</h1>
          </div>
          <UserBadge />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8 pb-12">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                type === t 
                  ? TYPE_META[t].color 
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              <span className="mr-2 opacity-60">{TYPE_META[t].icon}</span>
              {t}
            </button>
          ))}
        </div>

        <div className="relative group">
          {type === 'Quote' && (
            <span className="absolute top-3 left-5 text-5xl font-serif text-zinc-700 leading-none select-none pointer-events-none">"</span>
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={type === 'Quote' ? 'Paste the quote here…' : type === 'Affirmation' ? 'Write your affirmation…' : type === 'Story' ? 'Tell the story…' : type === 'Lesson' ? 'What did you learn?' : type === 'Habit' ? 'Describe the habit or practice…' : type === 'Advice' ? 'Write the advice or guidance…' : type === 'Pattern' ? 'Describe the pattern you noticed…' : "What's on your mind?"}
            rows={7}
            className={`w-full bg-zinc-900/60 border border-zinc-700/60 backdrop-blur-sm rounded-2xl py-5 text-white text-lg leading-relaxed resize-none focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 placeholder:text-zinc-600 font-serif transition-all ${type === 'Quote' ? 'px-6 pt-12' : 'px-5'}`}
            autoFocus
          />
        </div>

        <div className="flex justify-between items-center gap-4">
          <button
            onClick={handleClassify}
            disabled={!body.trim() || saving}
            className="px-6 py-3 rounded-2xl bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            Magic Classify ✨
          </button>

          <button
            onClick={handleSubmit}
            disabled={!body.trim() || saving}
            className="flex-1 px-8 py-3.5 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20"
          >
            {saving ? '✦ Saving…' : '✦ Save to Lumina'}
          </button>
        </div>

      </div>
      </main>
    </div>
  )
}
