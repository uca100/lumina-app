const NTFY_BASE = 'https://ntfy.sh'

const TYPE_EMOJI: Record<string, string> = {
  Quote: 'speech_balloon',
  Affirmation: 'star',
  Story: 'books',
  Thought: 'thought_balloon',
  Lesson: 'mortar_board',
  Habit: 'seedling',
}

export async function sendNtfy(message: string, title?: string, type?: string) {
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
    },
    body: message,
  })

  if (!res.ok) {
    console.error(`[Lumina] ntfy failed: ${res.status} ${await res.text()}`)
  }
}
