const NTFY_BASE = 'https://ntfy.sh'

const TYPE_EMOJI: Record<string, string> = {
  Quote: 'speech_balloon',
  Affirmation: 'star',
  Story: 'books',
  Thought: 'thought_balloon',
  Lesson: 'mortar_board',
  Habit: 'seedling',
  Pattern: 'diamond_shape_with_a_dot_inside',
}

export async function sendNtfy(message: string, title?: string, type?: string, clickUrl?: string) {
  const topic = process.env.NTFY_TOPIC
  if (!topic) return

  const tag = (type && TYPE_EMOJI[type]) ?? 'sparkles'

  const payload: Record<string, unknown> = {
    topic,
    message,
    title: title?.trim() || 'Lumina',
    tags: [tag],
    priority: 3,
  }

  if (clickUrl) {
    payload.click = clickUrl
    payload.actions = [{ action: 'view', label: 'Open in Lumina', url: clickUrl }]
  }

  const res = await fetch(NTFY_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    console.error(`[Lumina] ntfy failed: ${res.status} ${await res.text()}`)
  }
}
