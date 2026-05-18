'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserBadge } from '@/components/UserBadge'

export default function AdminPage() {
  const [backfilling, setBackfilling] = useState(false)
  const [backfillResult, setBackfillResult] = useState<string | null>(null)

  async function backfillTags() {
    setBackfilling(true)
    setBackfillResult(null)
    const res = await fetch('/lumina/api/items/backfill', { method: 'POST' })
    const data = await res.json()
    setBackfillResult(
      data.total === 0
        ? 'All items already tagged'
        : `Tagged ${data.fixed} item${data.fixed !== 1 ? 's' : ''}${data.failed ? ` (${data.failed} failed)` : ''}`
    )
    setBackfilling(false)
  }

  return (
    <div className="min-h-screen text-white" style={{ background: 'radial-gradient(ellipse at top, #1c1408 0%, #0d0d0d 60%)' }}>
      <header className="sticky top-0 z-10 backdrop-blur-md bg-black/40 border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">← Lumina</Link>
            <span className="text-zinc-700">/</span>
            <h1 className="text-white font-semibold">Admin</h1>
          </div>
          <UserBadge />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Nav */}
        <div className="flex gap-3">
          <Link
            href="/admin/users"
            className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:border-amber-500/50 hover:text-amber-400 transition-all"
          >
            👤 Users
          </Link>
        </div>

        {/* Backfill tool */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
          <div>
            <h2 className="text-white font-semibold">Re-classify untagged items</h2>
            <p className="text-zinc-500 text-sm mt-1">
              Runs AI classification on items that have no tags. Assigns type, tags, title, and summary.
            </p>
          </div>
          <button
            onClick={backfillTags}
            disabled={backfilling}
            className="px-5 py-2 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-all disabled:opacity-50"
          >
            {backfilling ? '✦ Running…' : '✦ Run backfill'}
          </button>
          {backfillResult && (
            <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
              {backfillResult}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
