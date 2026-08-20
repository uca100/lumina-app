import { GoogleGenAI, Type } from '@google/genai'
import { FALLBACK_MODEL, PRIMARY_MODEL, recordAiFailure, recordAiSuccess } from './status'

const SYSTEM_PROMPT = `You are a content classifier for a personal inspiration app called Lumina.
When given a piece of text, you will:
1. Classify it as one of: Quote, Affirmation, Story, Thought, Lesson, Habit, or Advice
2. Extract the author if present (for quotes)
3. Choose 3–5 tags from the vocabulary below
4. Generate a short title (max 7 words, no articles like "A" or "The" at start)
5. Generate a summary: copy the opening 1–2 sentences of the content exactly as written. Never paraphrase or reword — preserve the original language and phrasing. If the content is a single short sentence, copy it exactly.

Language rule: generate the title and summary in the same language as the input content. If the input is Hebrew, output Hebrew. If English, output English.

Definitions:
- Quote: A memorable statement attributed to a specific person
- Affirmation: A positive self-directed statement meant to be repeated
- Story: A narrative or anecdote, longer-form
- Thought: A personal reflection, idea, or insight
- Lesson: A key takeaway, learning, or principle derived from experience
- Habit: A routine, practice, or behavioral pattern worth building
- Advice: Practical guidance, suggestions, or wisdom for action (e.g., business, career, or life decisions)

## Tag vocabulary (use ONLY these, all lowercase, pick the most specific fit):
mindset, growth, resilience, identity, self-belief, confidence, courage, fear, ego, clarity
gratitude, presence, awareness, acceptance, peace, joy, love, pain, grief, loneliness
stoicism, philosophy, meaning, purpose, truth, wisdom, perspective, paradox, buddhism
discipline, consistency, focus, habits, rest, energy, health, sleep
creativity, learning, reading, writing, thinking, curiosity, excellence, mastery
leadership, communication, relationships, trust, kindness, family, community
money, career, ambition, risk, failure, success, work, productivity, business, strategy, marketing, sales
mortality, time, urgency, patience, change, uncertainty, faith, spirituality

Rules for tags:
- Never use the type name (quote, lesson, etc.) as a tag
- Never use the author's name as a tag
- Do not repeat similar concepts (e.g., pick one of resilience/strength/perseverance)
- Prefer specific over generic (e.g., "stoicism" over "philosophy" if clearly stoic)

Respond ONLY with valid JSON matching the schema. No markdown, no explanation.`

const TAG_VOCAB = `mindset, growth, resilience, identity, self-belief, confidence, courage, fear, ego, clarity
gratitude, presence, awareness, acceptance, peace, joy, love, pain, grief, loneliness
stoicism, philosophy, meaning, purpose, truth, wisdom, perspective, paradox, buddhism
discipline, consistency, focus, habits, rest, energy, health, sleep
creativity, learning, reading, writing, thinking, curiosity, excellence, mastery
leadership, communication, relationships, trust, kindness, family, community
money, career, ambition, risk, failure, success, work, productivity, business, strategy, marketing, sales
mortality, time, urgency, patience, change, uncertainty, faith, spirituality`

const BULK_SYSTEM_PROMPT = `You are a content extraction assistant for a personal inspiration app called Lumina.

Given a wall of text, identify all distinct standalone items — quotes, insights, lessons, affirmations, stories, thoughts, or advice. Each item must make sense on its own without surrounding context.

For each item:
1. Extract the exact original text as "body" — do not paraphrase, shorten, or reword
2. Classify as one of: Quote, Affirmation, Story, Thought, Lesson, Habit, Advice
3. Extract author if clearly attributed in the text (null otherwise)
4. Generate a short title (max 7 words, no leading "A" or "The")
5. Choose 3–5 tags ONLY from this vocabulary:
${TAG_VOCAB}
6. Generate summary: copy the opening 1–2 sentences of the item verbatim

Language rule: title and summary must be in the same language as the item content.

Tag rules:
- Never use the type name as a tag
- Never use the author's name as a tag
- No near-duplicates (pick one of resilience/strength/perseverance)

Respond ONLY with a valid JSON array matching the schema — no markdown, no explanation.
Minimum item body length: 20 characters. Ignore headings, page numbers, and filler text.
If the entire input is one item, return an array with one element.`

const ITEM_TYPES = ['Quote', 'Affirmation', 'Story', 'Thought', 'Lesson', 'Habit', 'Advice'] as const

export type ItemType = (typeof ITEM_TYPES)[number]

export type ClassifyResult = {
  type: ItemType
  author: string | null
  tags: string[]
  title: string
  summary: string
}

export type BulkItem = ClassifyResult & { body: string }

const classifySchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: [...ITEM_TYPES] },
    author: { type: Type.STRING, nullable: true },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
  },
  required: ['type', 'author', 'tags', 'title', 'summary'],
}

const bulkSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      body: { type: Type.STRING },
      type: { type: Type.STRING, enum: [...ITEM_TYPES] },
      author: { type: Type.STRING, nullable: true },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
      title: { type: Type.STRING },
      summary: { type: Type.STRING },
    },
    required: ['body', 'type', 'author', 'tags', 'title', 'summary'],
  },
}

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing')
  }
  return new GoogleGenAI({ apiKey })
}

function parseJsonText(raw: string | undefined): unknown {
  if (!raw?.trim()) throw new Error('Empty AI response')
  const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  return JSON.parse(cleaned)
}

function isModelUnavailable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /not found|404|unsupported|does not exist|model/i.test(msg)
}

async function generateJson(opts: {
  system: string
  user: string
  schema: object
  maxOutputTokens: number
}): Promise<{ text: string; model: string }> {
  const ai = getClient()
  const models = [PRIMARY_MODEL, FALLBACK_MODEL]
  let lastErr: unknown

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: opts.user,
        config: {
          systemInstruction: opts.system,
          responseMimeType: 'application/json',
          responseSchema: opts.schema,
          maxOutputTokens: opts.maxOutputTokens,
          temperature: 0.2,
        },
      })
      const text = response.text
      if (!text?.trim()) throw new Error('Empty AI response')
      return { text, model }
    } catch (err) {
      lastErr = err
      if (model === PRIMARY_MODEL && isModelUnavailable(err)) continue
      throw err
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Gemini request failed')
}

export async function bulkExtract(text: string): Promise<BulkItem[]> {
  try {
    const { text: raw, model } = await generateJson({
      system: BULK_SYSTEM_PROMPT,
      user: text,
      schema: bulkSchema,
      maxOutputTokens: 8192,
    })
    const parsed = parseJsonText(raw)
    if (!Array.isArray(parsed)) throw new Error('Bulk extract did not return an array')
    recordAiSuccess(model)
    return parsed as BulkItem[]
  } catch (err) {
    recordAiFailure(err)
    throw err
  }
}

export async function classifyItem(body: string): Promise<ClassifyResult> {
  try {
    const { text: raw, model } = await generateJson({
      system: SYSTEM_PROMPT,
      user: body,
      schema: classifySchema,
      maxOutputTokens: 512,
    })
    const parsed = parseJsonText(raw) as ClassifyResult
    recordAiSuccess(model)
    return parsed
  } catch (err) {
    recordAiFailure(err)
    throw err
  }
}
