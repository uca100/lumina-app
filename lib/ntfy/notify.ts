const NTFY_BASE = 'https://ntfy.sh'

export async function sendNtfy(message: string, title?: string) {
  const topic = process.env.NTFY_TOPIC
  if (!topic) return

  await fetch(`${NTFY_BASE}/${topic}`, {
    method: 'POST',
    headers: {
      'Title': title ?? 'Lumina',
      'Priority': 'default',
      'Tags': 'sparkles',
      'Content-Type': 'text/plain',
    },
    body: message,
  })
}
