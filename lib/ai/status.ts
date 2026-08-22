import { hostname } from 'os'
import { notifyNoc } from '@/lib/noc/telegram'

export type AiStatus = {
  ok: boolean
  provider: 'gemini'
  model: string | null
  error: string | null
  checkedAt: number
  cached: boolean
}

const CACHE_MS = 60_000
/** At most one down-alert while continuously unhealthy (recovery→failure always alerts). */
const NOC_ALERT_COOLDOWN_MS = 30 * 60_000
const PRIMARY_MODEL = 'gemini-3.1-flash-lite'
const FALLBACK_MODEL = 'gemini-2.5-flash-lite'

let cache: Omit<AiStatus, 'cached'> | null = null
let lastNocAlertAt = 0
/** Last ok we already considered for NOC edge detection (null = never notified path). */
let lastReportedOk: boolean | null = null

function humanizeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()
  if (!process.env.GEMINI_API_KEY?.trim()) {
    return 'GEMINI_API_KEY is missing — add it to /usr/local/lumina/.env.local and restart'
  }
  if (lower.includes('api key') || lower.includes('invalid') || lower.includes('401') || lower.includes('403')) {
    return 'GEMINI_API_KEY is invalid or unauthorized — check Google AI Studio'
  }
  if (lower.includes('permission') || lower.includes('disabled') || lower.includes('billing') || lower.includes('organization')) {
    return 'Gemini API access is disabled for this key/org — check Google AI Studio'
  }
  if (lower.includes('quota') || lower.includes('rate') || lower.includes('resource_exhausted')) {
    return 'Gemini quota exceeded — wait or check free-tier limits'
  }
  return msg.slice(0, 200) || 'AI unavailable'
}

function hostLabel(): string {
  return process.env.HOSTNAME?.trim() || hostname() || 'unknown'
}

/**
 * Notify nocbot when AI is down. Debounced while still down; always fires on
 * recovery→failure (or first failure after process start).
 */
function maybeAlertNocAiDown(error: string) {
  const now = Date.now()
  const transitionToDown = lastReportedOk !== false
  const cooledDown = now - lastNocAlertAt >= NOC_ALERT_COOLDOWN_MS

  if (!transitionToDown && !cooledDown) {
    lastReportedOk = false
    return
  }

  lastReportedOk = false
  lastNocAlertAt = now

  const msg =
    `🚨 Lumina AI down\n` +
    `app=Lumina\n` +
    `host=${hostLabel()}\n` +
    `provider=gemini\n` +
    `reason=${error}`

  void notifyNoc(msg)
}

function markAiOk() {
  lastReportedOk = true
}

export function getCachedAiStatus(): AiStatus | null {
  if (!cache) return null
  return { ...cache, cached: true }
}

export function recordAiSuccess(model: string) {
  cache = {
    ok: true,
    provider: 'gemini',
    model,
    error: null,
    checkedAt: Date.now(),
  }
  markAiOk()
}

export function recordAiFailure(err: unknown) {
  const error = humanizeError(err)
  cache = {
    ok: false,
    provider: 'gemini',
    model: cache?.model ?? null,
    error,
    checkedAt: Date.now(),
  }
  maybeAlertNocAiDown(error)
}

export async function getAiStatus(force = false): Promise<AiStatus> {
  if (!force && cache && Date.now() - cache.checkedAt < CACHE_MS) {
    return { ...cache, cached: true }
  }

  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) {
    const error = 'GEMINI_API_KEY is missing — add it to /usr/local/lumina/.env.local and restart'
    cache = {
      ok: false,
      provider: 'gemini',
      model: null,
      error,
      checkedAt: Date.now(),
    }
    maybeAlertNocAiDown(error)
    return { ...cache, cached: false }
  }

  try {
    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey: key })

    let usedModel = PRIMARY_MODEL
    try {
      await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: 'Reply with exactly: OK',
        config: { maxOutputTokens: 8, temperature: 0 },
      })
    } catch (primaryErr) {
      const msg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr)
      if (/not found|404|unsupported|does not exist/i.test(msg)) {
        usedModel = FALLBACK_MODEL
        await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: 'Reply with exactly: OK',
          config: { maxOutputTokens: 8, temperature: 0 },
        })
      } else {
        throw primaryErr
      }
    }

    cache = {
      ok: true,
      provider: 'gemini',
      model: usedModel,
      error: null,
      checkedAt: Date.now(),
    }
    markAiOk()
    return { ...cache, cached: false }
  } catch (err) {
    const error = humanizeError(err)
    cache = {
      ok: false,
      provider: 'gemini',
      model: null,
      error,
      checkedAt: Date.now(),
    }
    maybeAlertNocAiDown(error)
    return { ...cache, cached: false }
  }
}

export { PRIMARY_MODEL, FALLBACK_MODEL, NOC_ALERT_COOLDOWN_MS }
