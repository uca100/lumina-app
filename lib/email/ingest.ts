import { ImapFlow } from 'imapflow'
import { classifyAndSave } from '../ingest/save'

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

  await client.connect()
  try {
    const lock = await client.getMailboxLock('INBOX')
    try {
      const messages = client.fetch({ seen: false }, { envelope: true, bodyStructure: true, source: true })
      for await (const msg of messages) {
        if (!msg.source) continue
        const raw = msg.source.toString()
        // extract plain text body from raw email
        const body = extractBody(raw)
        const subject = msg.envelope?.subject ?? ''
        if (!body.trim()) continue

        const combined = subject ? `${subject}\n\n${body}` : body
        await classifyAndSave(combined.slice(0, 4000), 'email', { title: subject || undefined })
        await client.messageFlagsAdd(msg.seq, ['\\Seen'])
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
