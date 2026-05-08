'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserBadge } from '@/components/UserBadge'

interface User {
  id: string
  username: string
  email: string
  ntfyTopic: string | null
  telegramChatId: number | null
  ingestApiKey: string
  createdAt: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '', ntfyTopic: '' })
  const [saveError, setSaveError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  async function fetchUsers() {
    setLoading(true)
    const res = await fetch('/lumina/api/users')
    if (res.status === 401) { setError('Unauthorized'); setLoading(false); return }
    const data = await res.json()
    setUsers(data.users ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setSaveError(null)
    const res = await fetch('/lumina/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setSaveError(data.error ?? 'Failed'); return }
    setForm({ username: '', email: '', password: '', ntfyTopic: '' })
    setCreating(false)
    fetchUsers()
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen text-white" style={{ background: 'radial-gradient(ellipse at top, #1c1408 0%, #0d0d0d 60%)' }}>
      <header className="sticky top-0 z-10 backdrop-blur-md bg-black/40 border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm">← Back</Link>
            <span className="text-zinc-700 mx-1">/</span>
            <span className="text-amber-500 text-xl">✦</span>
            <h1 className="font-serif text-2xl font-bold text-white tracking-tight">Users</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreating((v) => !v)}
              className="text-sm px-4 py-1.5 rounded-full border border-amber-600/40 text-amber-400 hover:bg-amber-600/10 transition-all"
            >
              {creating ? 'Cancel' : '+ New User'}
            </button>
            <UserBadge />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {creating && (
          <form onSubmit={createUser} className="mb-8 bg-zinc-900/60 border border-white/5 rounded-2xl px-6 py-5 flex flex-col gap-4">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Create User</h2>
            {saveError && <p className="text-red-400 text-sm">{saveError}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-widest">Username</label>
                <input
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-widest">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-widest">Password</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-widest">ntfy Topic (optional)</label>
                <input
                  value={form.ntfyTopic}
                  onChange={(e) => setForm({ ...form, ntfyTopic: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="self-end px-6 py-2 bg-amber-600 text-white rounded-full text-sm font-bold hover:bg-amber-500 transition-colors"
            >
              Create
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-20 text-amber-500/50 text-4xl animate-pulse">✦</div>
        ) : error ? (
          <p className="text-red-400 text-center py-20">{error}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {users.map((user) => (
              <div key={user.id} className="bg-zinc-900/60 border border-white/5 rounded-2xl px-6 py-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-semibold text-zinc-100">{user.username}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </div>
                  <span className="text-[10px] text-zinc-700 font-mono">
                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2 bg-zinc-800/40 rounded-lg px-3 py-2">
                    <span className="text-[10px] text-zinc-600 uppercase tracking-widest w-20 shrink-0">Ingest Key</span>
                    <code className="text-[11px] text-amber-300 flex-1 truncate">{user.ingestApiKey}</code>
                    <button
                      onClick={() => copy(user.ingestApiKey, `ingest-${user.id}`)}
                      className="text-[10px] text-zinc-600 hover:text-zinc-300 uppercase font-bold shrink-0"
                    >
                      {copied === `ingest-${user.id}` ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  {user.ntfyTopic && (
                    <div className="flex items-center gap-2 bg-zinc-800/40 rounded-lg px-3 py-2">
                      <span className="text-[10px] text-zinc-600 uppercase tracking-widest w-20 shrink-0">ntfy Topic</span>
                      <code className="text-[11px] text-zinc-300 flex-1">{user.ntfyTopic}</code>
                    </div>
                  )}
                  {user.telegramChatId && (
                    <div className="flex items-center gap-2 bg-zinc-800/40 rounded-lg px-3 py-2">
                      <span className="text-[10px] text-zinc-600 uppercase tracking-widest w-20 shrink-0">Telegram</span>
                      <code className="text-[11px] text-zinc-300 flex-1">{user.telegramChatId}</code>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
