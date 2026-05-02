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

  const res = await fetch(`${NTFY_BASE}/${topic}`, {
    method: 'POST',
    headers: {
      'Title': (title ?? 'Lumina').replace(/[^\x00-\x7F]/g, '').trim() || 'Lumina',
      'Priority': 'default',
      'Tags': tag,
      'Content-Type': 'text/plain',
      'Markdown': 'yes',
      ...(clickUrl ? { 'Click': clickUrl } : {}),
    },
    body: message,
  })

  if (!res.ok) {
    console.error(`[Lumina] ntfy failed: ${res.status} ${await res.text()}`)
  }
}
