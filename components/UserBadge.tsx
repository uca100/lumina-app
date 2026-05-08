'use client'

import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export function UserBadge() {
  const user = useCurrentUser()
  const router = useRouter()

  async function logout() {
    await fetch('/lumina/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-zinc-500 hidden sm:block">{user.username}</span>
      <button
        onClick={logout}
        className="text-[11px] px-2.5 py-1 border border-zinc-800 rounded-full text-zinc-600 hover:border-zinc-600 hover:text-zinc-400 transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}
