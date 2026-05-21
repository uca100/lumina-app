'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserBadge } from '@/components/UserBadge'

interface Config {
  ingestKey: string
  emailEnabled: boolean
  emailUser: string
  baseUrl: string
  ntfyTopic: string
  telegramBotUsername: string | null
  telegramChatId: number | null
  version: string
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${active ? 'bg-emerald-900/50 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
      {label}
    </span>
  )
}

function CopyButton({ text, label, onCopy, copied }: { text: string; label: string; onCopy: (t: string, l: string) => void; copied: string | null }) {
  return (
    <button onClick={() => onCopy(text, label)} className="text-[10px] text-zinc-500 hover:text-white uppercase font-bold tracking-widest shrink-0">
      {copied === label ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function CodeRow({ label, value, copyLabel, onCopy, copied }: { label: string; value: string; copyLabel: string; onCopy: (t: string, l: string) => void; copied: string | null }) {
  return (
    <div className="bg-black rounded-xl border border-zinc-800 p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        {label && <span className="text-[9px] text-zinc-600 uppercase tracking-widest block mb-0.5">{label}</span>}
        <code className="text-[11px] text-amber-200 truncate block">{value}</code>
      </div>
      <CopyButton text={value} label={copyLabel} onCopy={onCopy} copied={copied} />
    </div>
  )
}

export default function IntegrationsPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)
  const [regResult, setRegResult] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/lumina/api/config').then(r => r.json()),
      fetch('/lumina/api/auth/me').then(r => r.json()),
    ]).then(([cfg, me]) => {
      if (!cfg.baseUrl) cfg.baseUrl = window.location.origin
      if (me?.ingestApiKey) {
        cfg.ingestKey = me.ingestApiKey
        cfg.ntfyTopic = me.ntfyTopic ?? cfg.ntfyTopic
        cfg.telegramChatId = me.telegramChatId ?? null
      }
      setConfig(cfg)
    })
  }, [])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  async function setupTelegram() {
    setRegistering(true)
    try {
      const res = await fetch('/lumina/api/ingest/telegram-register', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config?.ingestKey}` }
      })
      const data = await res.json()
      setRegResult(data.ok ? '✓ Webhook registered. Bot is ready.' : `Error: ${data.description || 'Failed'}`)
    } catch {
      setRegResult('Connection failed.')
    }
    setRegistering(false)
  }

  if (!config) return null

  const ingestUrl = `${config.baseUrl}/lumina/api/ingest/shortcut`
  const telegramConnected = !!config.telegramChatId
  const emailConnected = config.emailEnabled

  return (
    <div className="min-h-screen text-white bg-black">
      <header className="sticky top-0 z-10 backdrop-blur-md bg-black/40 border-b border-white/5 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2 group">
            <span className="text-amber-500 text-xl group-hover:scale-110 transition-transform">✦</span>
            <h1 className="font-serif text-2xl font-bold text-white tracking-tight">Lumina</h1>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">← Exit</Link>
            <UserBadge />
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h2 className="text-4xl font-serif font-bold mb-3">Integrations</h2>
          <p className="text-zinc-500">All the ways to get content into Lumina.</p>
        </div>

        {/* 1. Telegram */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0088cc] flex items-center justify-center text-2xl">✈</div>
              <div>
                <h3 className="text-xl font-bold">Telegram Bot</h3>
                <p className="text-sm text-zinc-500">Save, browse, and get reminders from one chat.</p>
              </div>
            </div>
            <StatusBadge active={telegramConnected} label={telegramConnected ? 'Connected' : 'Not linked'} />
          </div>

          {!telegramConnected && (
            <div className="space-y-3 text-sm text-zinc-400">
              <p>Register the webhook, then open the bot and send a message — your chat ID gets linked automatically.</p>
              <button
                onClick={setupTelegram}
                disabled={registering}
                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {registering ? 'Connecting...' : 'Link Bot'}
              </button>
              {regResult && <p className="text-center text-xs font-mono text-amber-500">{regResult}</p>}
              {config.telegramBotUsername && (
                <p className="text-xs text-center text-zinc-500">
                  Then open{' '}
                  <a href={`https://t.me/${config.telegramBotUsername}`} target="_blank" rel="noreferrer" className="text-[#0088cc] font-mono hover:underline">
                    @{config.telegramBotUsername}
                  </a>{' '}
                  and send any message.
                </p>
              )}
            </div>
          )}

          {/* Commands reference — always visible */}
          <details className="group border-t border-white/5 pt-5">
            <summary className="text-xs font-bold text-amber-500 uppercase tracking-widest cursor-pointer list-none flex items-center gap-2">
              <span>Commands</span>
              <span className="group-open:rotate-180 transition-transform">↓</span>
            </summary>
            <div className="pt-4 space-y-4 text-xs text-zinc-400">
              <div className="space-y-2">
                <p className="text-zinc-500 uppercase tracking-widest text-[10px]">Save</p>
                <p>Send any text → AI classifies and saves it automatically.</p>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                  {['/quote', '/lesson', '/thought', '/story', '/habit', '/affirmation'].map(cmd => (
                    <code key={cmd} className="bg-zinc-800 px-2 py-1 rounded text-amber-200">{cmd} &lt;text&gt;</code>
                  ))}
                </div>
                <p className="text-zinc-500 text-[11px]">Force a specific type — AI still generates title and tags.</p>
              </div>
              <div className="space-y-2">
                <p className="text-zinc-500 uppercase tracking-widest text-[10px]">Bulk Import</p>
                <code className="bg-zinc-800 px-2 py-1 rounded text-amber-200 font-mono text-[11px] block">/bulk &lt;wall of text&gt;</code>
                <p className="text-[11px] text-zinc-500">AI splits the text into individual items and saves them all to the review queue.</p>
              </div>
              <div className="space-y-2">
                <p className="text-zinc-500 uppercase tracking-widest text-[10px]">Browse</p>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                  {['/random', '/random quote', '/today', '/last', '/last 10', '/search <query>', '/stats', '/help'].map(cmd => (
                    <code key={cmd} className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">{cmd}</code>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* 2. Email */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-2xl">✉</div>
              <div>
                <h3 className="text-xl font-bold">Email</h3>
                <p className="text-sm text-zinc-500">Mention <code className="text-amber-300">lumina</code> to save. Polled every 15 min.</p>
              </div>
            </div>
            <StatusBadge active={emailConnected} label={emailConnected ? 'Active' : 'Not set up'} />
          </div>

          {emailConnected ? (
            <div className="space-y-4 text-sm text-zinc-400">
              <CodeRow label="Connected inbox" value={config.emailUser} copyLabel="email" onCopy={copyToClipboard} copied={copied} />
              <div className="space-y-3 border-t border-white/5 pt-4">
                <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold">How it works</p>
                <div className="space-y-2 text-xs text-zinc-400">
                  <div className="flex gap-3">
                    <span className="text-amber-500 shrink-0">→</span>
                    <span>Any unread email with <code className="text-amber-300">lumina</code> or <code className="text-amber-300">#lumina</code> in the <strong className="text-white">subject or body</strong> gets saved. Email is marked read and labeled <code className="text-amber-300">lumina</code> in Gmail.</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-amber-500 shrink-0">→</span>
                    <span>All other emails are left completely untouched.</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 border-t border-white/5 pt-4">
                <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold">Bulk Import via Email</p>
                <p className="text-xs text-zinc-400">Include <code className="text-amber-300">bulk</code> in the subject alongside <code className="text-amber-300">lumina</code> and AI will split the entire body into individual items.</p>
                <div className="bg-black rounded-xl border border-zinc-800 p-3 space-y-1">
                  <div><span className="text-[9px] text-zinc-600 uppercase">Subject</span><code className="text-[11px] text-amber-200 block">lumina bulk — Book notes</code></div>
                  <div><span className="text-[9px] text-zinc-600 uppercase">Body</span><code className="text-[11px] text-zinc-400 block">paste your wall of text here...</code></div>
                </div>
                <p className="text-[11px] text-zinc-500">Up to 16,000 characters, auto-batched. All items go to the review queue.</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-600">Add <code className="text-zinc-400">EMAIL_IMAP_*</code> vars to pi5 <code className="text-zinc-400">.env.local</code> to enable.</p>
          )}
        </div>

        {/* 3. Drafts */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl">📋</div>
            <div>
              <h3 className="text-xl font-bold">Drafts App</h3>
              <p className="text-sm text-zinc-500">Capture quick notes and flush them to Lumina.</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Tags control classification. Add <code className="text-zinc-300">quote</code>, <code className="text-zinc-300">lesson</code>, <code className="text-zinc-300">thought</code>, <code className="text-zinc-300">story</code>, <code className="text-zinc-300">habit</code>, or <code className="text-zinc-300">affirmation</code> to force a type. Add <code className="text-zinc-300">lessons</code> or <code className="text-zinc-300">inspiring</code> as thematic tags. Just <code className="text-zinc-300">lumina</code>? AI handles everything.
          </p>
          <details className="group border-t border-white/5 pt-4">
            <summary className="text-xs font-bold text-amber-500 uppercase tracking-widest cursor-pointer list-none flex items-center gap-2">
              <span>View Action Scripts</span>
              <span className="group-open:rotate-180 transition-transform">↓</span>
            </summary>
            <div className="pt-4 space-y-5 text-xs text-zinc-400">
              <div>
                <p className="text-zinc-500 mb-2 uppercase tracking-widest text-[10px]">Action 1 — Send current draft</p>
                <pre className="bg-black p-4 rounded-xl border border-zinc-800 text-[10px] text-amber-200 overflow-x-auto whitespace-pre-wrap">{`const LUMINA_URL = "${config.baseUrl}/lumina/api/ingest/shortcut";
const INGEST_KEY = "${config.ingestKey}";
const TYPE_MAP = { quote: "Quote", affirmation: "Affirmation", story: "Story", thought: "Thought", lesson: "Lesson", habit: "Habit" };
const THEMATIC = ["lessons", "inspiring"];

let typeHint = null;
const extraTags = [];
for (const t of draft.tags) {
  const lower = t.toLowerCase();
  if (TYPE_MAP[lower]) typeHint = TYPE_MAP[lower];
  else if (THEMATIC.includes(lower)) extraTags.push(lower);
}

const payload = { body: draft.content };
if (typeHint) payload.type = typeHint;
if (extraTags.length) payload.tags = extraTags;

const http = new HTTP();
const response = http.request({
  url: LUMINA_URL, method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${INGEST_KEY}\` },
  data: payload
});

if (response.success) {
  const res = JSON.parse(response.responseText);
  if (res.duplicate) app.displayInfoMessage("Already in Lumina — skipped");
  else app.displaySuccessMessage(\`Saved as \${res.type} ✓\`);
} else {
  app.displayErrorMessage("Error: " + response.statusCode);
  context.fail();
}`}</pre>
              </div>
              <div>
                <p className="text-zinc-500 mb-2 uppercase tracking-widest text-[10px]">Action 2 — Flush all drafts tagged "lumina"</p>
                <pre className="bg-black p-4 rounded-xl border border-zinc-800 text-[10px] text-amber-200 overflow-x-auto whitespace-pre-wrap">{`const LUMINA_URL = "${config.baseUrl}/lumina/api/ingest/shortcut";
const INGEST_KEY = "${config.ingestKey}";
const TAG = "lumina";
const TYPE_MAP = { quote: "Quote", affirmation: "Affirmation", story: "Story", thought: "Thought", lesson: "Lesson", habit: "Habit" };
const THEMATIC = ["lessons", "inspiring"];

const drafts = Draft.query("", "inbox", [TAG]);
if (drafts.length === 0) {
  app.displayInfoMessage("No drafts tagged 'lumina'");
} else {
  let sent = 0, failed = 0, skipped = 0;
  for (const d of drafts) {
    let typeHint = null;
    const extraTags = [];
    for (const t of d.tags) {
      const lower = t.toLowerCase();
      if (TYPE_MAP[lower]) typeHint = TYPE_MAP[lower];
      else if (THEMATIC.includes(lower)) extraTags.push(lower);
    }

    const payload = { body: d.content };
    if (typeHint) payload.type = typeHint;
    if (extraTags.length) payload.tags = extraTags;

    const http = new HTTP();
    const response = http.request({
      url: LUMINA_URL, method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${INGEST_KEY}\` },
      data: payload
    });
    if (response.success) {
      const res = JSON.parse(response.responseText);
      d.removeTag(TAG); d.isArchived = true; d.update();
      if (res.duplicate) skipped++; else sent++;
    } else { failed++; }
  }
  let msg = \`Sent \${sent} draft(s) ✓\`;
  if (skipped) msg += \`, \${skipped} already existed\`;
  if (failed) app.displayErrorMessage(\`\${sent} sent, \${failed} failed\`);
  else app.displaySuccessMessage(msg);
}`}</pre>
              </div>
            </div>
          </details>
        </div>

        {/* 4. iOS Shortcuts */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-700 flex items-center justify-center text-2xl">⚡</div>
            <div>
              <h3 className="text-xl font-bold">iOS Shortcuts</h3>
              <p className="text-sm text-zinc-500">Save selected text from any app via the share sheet.</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Create a Shortcut: <strong className="text-zinc-300">Receive text from Share Sheet</strong> → <strong className="text-zinc-300">Get Contents of URL</strong> with the settings below.
          </p>
          <div className="bg-black rounded-xl border border-zinc-800 p-4 space-y-3">
            <CodeRow label="URL" value={ingestUrl} copyLabel="shortcut-url" onCopy={copyToClipboard} copied={copied} />
            <div>
              <span className="text-[9px] text-zinc-600 uppercase block mb-1">Method</span>
              <code className="text-[11px] text-zinc-400">POST</code>
            </div>
            <CodeRow label='Header — Authorization' value={`Bearer ${config.ingestKey}`} copyLabel="shortcut-key" onCopy={copyToClipboard} copied={copied} />
            <div>
              <span className="text-[9px] text-zinc-600 uppercase block mb-1">Body (JSON)</span>
              <code className="text-[11px] text-zinc-400">{`{ "body": "<Shortcut Input>" }`}</code>
            </div>
          </div>
        </div>

        {/* 5. ntfy */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-700 flex items-center justify-center text-2xl">🔔</div>
            <div>
              <h3 className="text-xl font-bold">Push Notifications</h3>
              <p className="text-sm text-zinc-500">Reminders delivered via ntfy — no Telegram needed.</p>
            </div>
          </div>
          {config.ntfyTopic ? (
            <div className="space-y-3 text-sm text-zinc-400">
              <p className="text-xs">Subscribe to your topic in the <strong className="text-white">ntfy</strong> iOS app:</p>
              <CodeRow label="Your topic" value={config.ntfyTopic} copyLabel="ntfy" onCopy={copyToClipboard} copied={copied} />
            </div>
          ) : (
            <p className="text-xs text-zinc-600">Set <code className="text-zinc-400">NTFY_TOPIC</code> in .env.local to enable push notifications.</p>
          )}
        </div>

        <div className="text-center pt-4">
          <p className="text-zinc-700 text-xs">Lumina v{config.version}</p>
        </div>
      </main>
    </div>
  )
}
