'use client'

import { useEffect, useState } from 'react'

interface CurrentUser {
  id: string
  username: string
  email: string
  ntfyTopic: string | null
  telegramChatId: number | null
  ingestApiKey: string
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    fetch('/lumina/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(setUser)
      .catch(() => setUser(null))
  }, [])

  return user
}
