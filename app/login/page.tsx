'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'setup'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if already logged in — use redirect:'manual' so a proxy redirect
    // (307 to login) doesn't look like a successful response (r.ok=true).
    fetch('/lumina/api/auth/me', { redirect: 'manual' }).then(r => {
      if (r.ok) router.replace('/')
    })
  }, [router])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const endpoint = mode === 'setup' ? '/lumina/api/auth/setup' : '/lumina/api/auth/login'
    const body = mode === 'setup' ? { username, email, password } : { username, password }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const from = searchParams.get('from') ?? '/'
      router.push(from)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
      if (res.status === 403 && mode === 'setup') {
        setMode('login')
        setError('Setup already complete — please log in.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at top, #1c1408 0%, #0d0d0d 60%)' }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-amber-900/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="text-amber-500 text-3xl mb-2">✦</div>
          <h1 className="font-serif text-3xl font-bold text-white">Lumina</h1>
          <p className="text-zinc-500 text-sm mt-1">your inspiration</p>
        </div>

        <form onSubmit={submit} className="bg-zinc-900/60 border border-white/5 rounded-2xl px-6 py-7 backdrop-blur-sm flex flex-col gap-4">
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1.5 uppercase tracking-widest">Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full border border-zinc-800 rounded-xl px-4 py-2.5 bg-zinc-900 text-zinc-200 focus:outline-none focus:border-amber-500/50 transition-all text-sm"
            />
          </div>

          {mode === 'setup' && (
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1.5 uppercase tracking-widest">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-zinc-800 rounded-xl px-4 py-2.5 bg-zinc-900 text-zinc-200 focus:outline-none focus:border-amber-500/50 transition-all text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] text-zinc-500 mb-1.5 uppercase tracking-widest">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-zinc-800 rounded-xl px-4 py-2.5 bg-zinc-900 text-zinc-200 focus:outline-none focus:border-amber-500/50 transition-all text-sm"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-br from-amber-400 to-amber-600 text-black font-bold rounded-xl hover:from-amber-300 hover:to-amber-500 disabled:opacity-40 transition-all text-sm"
          >
            {loading ? '✦ …' : mode === 'setup' ? 'Create account' : 'Sign in'}
          </button>

          <button
            type="button"
            onClick={() => { setMode(m => m === 'login' ? 'setup' : 'login'); setError('') }}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors text-center"
          >
            {mode === 'login' ? 'First time? Set up account →' : '← Back to sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
