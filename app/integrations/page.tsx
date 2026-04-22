'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Config {
  ingestKey: string
  emailEnabled: boolean
  emailUser: string
  baseUrl: string
  ntfyTopic: string
  telegramBotToken: boolean
}

export default function IntegrationsPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)
  const [regResult, setRegResult] = useState<string | null>(null)

  useEffect(() => {
    fetch('/lumina/api/config')
      .then(r => r.json())
      .then(d => {
        if (!d.baseUrl) d.baseUrl = window.location.origin
        setConfig(d)
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
      setRegResult(data.ok ? 'Success! Your bot is ready.' : `Error: ${data.description || 'Failed'}`)
    } catch (e) {
      setRegResult('Connection failed.')
    }
    setRegistering(false)
  }

  if (!config) return null

  const ingestUrl = `${config.baseUrl}/lumina/api/ingest/shortcut`

  return (
    <div className="min-h-screen text-white bg-black">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-black/40 border-b border-white/5 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2 group">
            <span className="text-amber-500 text-xl group-hover:scale-110 transition-transform">✦</span>
            <h1 className="font-serif text-2xl font-bold text-white tracking-tight">Lumina</h1>
          </Link>
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Exit
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        <h2 className="text-4xl font-serif font-bold mb-4">Connect iPhone</h2>
        <p className="text-zinc-500 mb-12">The simplest ways to use Lumina on the go.</p>

        <div className="space-y-8">
          
          {/* 1. Telegram: The "Everything" App */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0088cc] flex items-center justify-center text-2xl">✈</div>
              <div>
                <h3 className="text-xl font-bold">Easy Mode: Telegram</h3>
                <p className="text-sm text-zinc-500">Save notes and get reminders in one chat.</p>
              </div>
            </div>

            <div className="space-y-4 text-zinc-300 text-sm leading-relaxed">
              <p><strong>To Save:</strong> Just send a message, link, or photo to your Lumina Bot.</p>
              <p><strong>To Get Reminders:</strong> Lumina will message you here automatically.</p>
              
              <button 
                onClick={setupTelegram}
                disabled={registering}
                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {registering ? 'Connecting...' : 'Click to Link Telegram Bot'}
              </button>
              {regResult && <p className="text-center text-xs font-mono text-amber-500">{regResult}</p>}
            </div>
          </div>

          {/* 2. Email */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-2xl">✉</div>
              <h3 className="text-xl font-bold">Save via Email</h3>
            </div>
            <p className="text-sm text-zinc-400">
              Forward any email to your connected inbox. Lumina reads it every 15 minutes.
            </p>
            {config.emailEnabled ? (
              <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 flex justify-between items-center">
                <code className="text-amber-200 text-xs">{config.emailUser}</code>
                <button onClick={() => copyToClipboard(config.emailUser, 'email')} className="text-[10px] text-zinc-500 hover:text-white uppercase font-bold">
                  {copied === 'email' ? 'Copied' : 'Copy'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-600">Email not set up in .env yet.</p>
            )}
          </div>

          {/* 3. Notes / Google Keep */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-700 flex items-center justify-center text-2xl">📝</div>
              <h3 className="text-xl font-bold">Save from Notes / Keep</h3>
            </div>
            <p className="text-sm text-zinc-400">
              To save text directly from other apps, use an iPhone Shortcut.
            </p>
            
            <details className="group border-t border-white/5 pt-4">
              <summary className="text-xs font-bold text-amber-500 uppercase tracking-widest cursor-pointer list-none flex items-center gap-2">
                <span>View Shortcut Settings</span>
                <span className="group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <div className="pt-4 space-y-4">
                <div className="text-[11px] text-zinc-500 space-y-2">
                  <p>1. Create a Shortcut: "Receive text from Share Sheet"</p>
                  <p>2. Add "Get Contents of URL" action:</p>
                </div>
                <div className="bg-black p-4 rounded-xl border border-zinc-800 space-y-3">
                  <div>
                    <span className="text-[9px] text-zinc-600 uppercase block">URL</span>
                    <code className="text-[10px] text-amber-200 block truncate">{ingestUrl}</code>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-600 uppercase block">Method</span>
                    <code className="text-[10px] text-zinc-400 block">POST</code>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-600 uppercase block">Header (Authorization)</span>
                    <code className="text-[10px] text-amber-200 block truncate">Bearer {config.ingestKey}</code>
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* 4. Drafts */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl">📋</div>
              <div>
                <h3 className="text-xl font-bold">Save from Drafts</h3>
                <p className="text-sm text-zinc-500">Capture quick notes and flush them to Lumina in bulk.</p>
              </div>
            </div>
            <details className="group border-t border-white/5 pt-4">
              <summary className="text-xs font-bold text-amber-500 uppercase tracking-widest cursor-pointer list-none flex items-center gap-2">
                <span>View Drafts Action Scripts</span>
                <span className="group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <div className="pt-4 space-y-4 text-xs text-zinc-400">
                <div>
                  <p className="text-zinc-500 mb-2 uppercase tracking-widest text-[10px]">Action 1 — Send current draft immediately</p>
                  <pre className="bg-black p-4 rounded-xl border border-zinc-800 text-[10px] text-amber-200 overflow-x-auto whitespace-pre-wrap">{`const LUMINA_URL = "${config.baseUrl}/lumina/api/ingest/shortcut";
const INGEST_KEY = "${config.ingestKey}";
const TYPE_MAP = { quote: "Quote", affirmation: "Affirmation", story: "Story", thought: "Thought", lesson: "Lesson", habit: "Habit" };
const THEMATIC = ["lessons", "inspiring"];

// Read type + thematic tags from the draft's tags
let typeHint = null;
const extraTags = [];
for (const t of draft.tags) {
  const lower = t.toLowerCase();
  if (TYPE_MAP[lower]) typeHint = TYPE_MAP[lower];
  else if (THEMATIC.includes(lower)) extraTags.push(lower);
}

const payload = { body: draft.content, title: draft.title || undefined };
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
                  <p className="text-zinc-500 mb-2 uppercase tracking-widest text-[10px]">Action 2 — Flush all drafts tagged &quot;lumina&quot;</p>
                  <p className="text-[10px] text-zinc-600 mb-3 leading-relaxed">Tags control how items are classified. Add <code className="text-zinc-400">quote</code>, <code className="text-zinc-400">affirmation</code>, <code className="text-zinc-400">story</code>, <code className="text-zinc-400">thought</code>, <code className="text-zinc-400">lesson</code>, or <code className="text-zinc-400">habit</code> to skip AI and set the type directly. Add <code className="text-zinc-400">lessons</code> or <code className="text-zinc-400">inspiring</code> to tag the item. Only <code className="text-zinc-400">lumina</code>? AI handles everything.</p>
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

    const payload = { body: d.content, title: d.title || undefined };
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

          {/* 5. ntfy Push Notifications */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-700 flex items-center justify-center text-2xl">🔔</div>
              <div>
                <h3 className="text-xl font-bold">Push Notifications (ntfy)</h3>
                <p className="text-sm text-zinc-500">Get Lumina reminders as native iOS push notifications.</p>
              </div>
            </div>
            {config.ntfyTopic ? (
              <div className="space-y-3 text-sm text-zinc-400">
                <p>Subscribe to your topic in the <strong className="text-white">ntfy</strong> iOS app:</p>
                <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 flex justify-between items-center">
                  <code className="text-amber-200 text-xs">{config.ntfyTopic}</code>
                  <button onClick={() => copyToClipboard(config.ntfyTopic, 'ntfy')} className="text-[10px] text-zinc-500 hover:text-white uppercase font-bold">
                    {copied === 'ntfy' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-zinc-500">Reminders will arrive as push notifications automatically. No Telegram needed.</p>
              </div>
            ) : (
              <p className="text-xs text-zinc-600">Set <code className="text-zinc-400">NTFY_TOPIC</code> in .env.local to enable push notifications.</p>
            )}
          </div>

          {/* 6. iPhone Reminders App */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/80 flex items-center justify-center text-2xl">⏰</div>
              <h3 className="text-xl font-bold">Native Reminders</h3>
            </div>
            <p className="text-sm text-zinc-400">
              Want Lumina items to show up in your Apple Reminders app?
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Create an <strong>Automation</strong> in the Shortcuts app that runs daily and calls this link to get a random item:
            </p>
            <code className="block bg-black p-3 rounded-xl border border-zinc-800 text-[10px] text-amber-200 truncate">
              {config.baseUrl}/lumina/api/reminders/random
            </code>
          </div>

        </div>

        <div className="mt-20 text-center">
          <p className="text-zinc-700 text-xs">Lumina v0.3.0 • iPhone Integration Guide</p>
        </div>
      </main>
    </div>
  )
}
