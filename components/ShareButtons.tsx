'use client'

import { useState } from 'react'

const PUBLIC_BASE = 'https://myweb.tail075174.ts.net/lumina'

interface ShareButtonsProps {
  id: string
  title: string | null
  body: string
  author: string | null
  variant?: 'light' | 'dark'
  className?: string
}

export function ShareButtons({ id, title, body, author, variant = 'light', className = '' }: ShareButtonsProps) {
  const [feedback, setFeedback] = useState<'copy' | 'link' | null>(null)

  const base = variant === 'dark'
    ? 'text-[11px] px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-500 transition-colors'
    : 'text-xs px-3 py-1.5 rounded-full border border-zinc-300 text-stone-500 transition-colors'

  const copyHover = variant === 'dark' ? 'hover:border-sky-500/50 hover:text-sky-400' : 'hover:border-sky-400 hover:text-sky-600'
  const shareHover = variant === 'dark' ? 'hover:border-emerald-500/50 hover:text-emerald-400' : 'hover:border-emerald-400 hover:text-emerald-600'

  function buildClipboardText(): string {
    const parts: string[] = []
    if (title) parts.push(title)
    parts.push(body)
    if (author) parts.push(`— ${author}`)
    parts.push('✦ Lumina')
    return parts.join('\n\n')
  }

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(buildClipboardText())
      setFeedback('copy')
      setTimeout(() => setFeedback(null), 1500)
    } catch { /* clipboard write failed silently */ }
  }

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(`${PUBLIC_BASE}/view/${id}`)
      setFeedback('link')
      setTimeout(() => setFeedback(null), 1500)
    } catch { /* clipboard write failed silently */ }
  }

  return (
    <div className={`flex gap-1 ${className}`} onClick={(e) => e.stopPropagation()}>
      <button onClick={handleCopy} className={`${base} ${copyHover}`} title="Copy content">
        {feedback === 'copy' ? 'Copied!' : 'Copy'}
      </button>
      <button onClick={handleShare} className={`${base} ${shareHover}`} title="Copy share link">
        {feedback === 'link' ? 'Link copied!' : 'Share'}
      </button>
    </div>
  )
}
