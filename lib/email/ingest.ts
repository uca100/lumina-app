import { ImapFlow } from 'imapflow'
import { classifyAndSave } from '../ingest/save'
import { bulkSave } from '../ingest/bulk'

export async function checkEmail() {
  const host = process.env.EMAIL_IMAP_HOST
  const user = process.env.EMAIL_IMAP_USER
  const pass = process.env.EMAIL_IMAP_PASS
  if (!host || !user || !pass) return

  const client = new ImapFlow({
    host,
    port: Number(process.env.EMAIL_IMAP_PORT ?? 993),
    secure: true,
    auth: { user, pass },
    logger: false,
  })

  const trigger = (process.env.EMAIL_TRIGGER ?? 'lumina').toLowerCase()
  const label = process.env.EMAIL_LABEL ?? 'lumina'

  await client.connect()
  try {
    const lock = await client.getMailboxLock('INBOX')
    try {
      const matched: number[] = []
      const messages = client.fetch({ seen: false }, { envelope: true, bodyStructure: true, source: true, uid: true })
      for await (const msg of messages) {
        if (!msg.source || !msg.uid) continue
        const raw = msg.source.toString()
        const body = extractBody(raw)
        const subject = msg.envelope?.subject ?? ''

        // Only process emails that mention the trigger in subject or body
        if (!subject.toLowerCase().includes(trigger) && !body.toLowerCase().includes(trigger)) continue
        if (!body.trim()) continue

        const isBulk = subject.toLowerCase().includes('bulk')
        if (isBulk) {
          // Bulk: AI splits the body into multiple items
          await bulkSave(body.slice(0, 16000), 'email')
        } else {
          const combined = subject ? `${subject}\n\n${body}` : body
          await classifyAndSave(combined.slice(0, 4000), 'email', { title: subject || undefined })
        }
        matched.push(msg.uid)
      }

      if (matched.length) {
        await client.messageFlagsAdd(matched, ['\\Seen'], { uid: true })
        // Apply label — create it first if needed, skip silently if it fails
        try {
          await client.mailboxCreate(label)
        } catch { /* already exists */ }
        await client.messageCopy(matched, label, { uid: true }).catch(() => {})
      }
    } finally {
      lock.release()
    }
  } finally {
    await client.logout()
  }
}

function extractBody(raw: string): string {
  // Find plain text part in multipart email or return decoded body
  const lines = raw.split('\r\n')
  let inBody = false
  let inPlainText = false
  const bodyLines: string[] = []

  for (const line of lines) {
    if (!inBody && line === '') {
      inBody = true
      inPlainText = true
      continue
    }
    if (inBody && inPlainText) {
      if (line.startsWith('--')) break
      bodyLines.push(line)
    }
  }

  return bodyLines
    .join('\n')
    .replace(/=\r?\n/g, '') // quoted-printable soft line breaks
    .replace(/=[0-9A-F]{2}/gi, (m) => String.fromCharCode(parseInt(m.slice(1), 16)))
    .trim()
}
