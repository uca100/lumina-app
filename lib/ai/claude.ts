import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

const SYSTEM_PROMPT = `You are a content classifier for a personal inspiration app called Lumina.
When given a piece of text, you will:
1. Classify it as one of: Quote, Affirmation, Story, Thought, Lesson, Habit, or Pattern
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
- Pattern: A recurring theme, structure, or principle observed across experience or knowledge

## Tag vocabulary (use ONLY these, all lowercase, pick the most specific fit):
mindset, growth, resilience, identity, self-belief, confidence, courage, fear, ego, clarity
gratitude, presence, awareness, acceptance, peace, joy, love, pain, grief, loneliness
stoicism, philosophy, meaning, purpose, truth, wisdom, perspective, paradox
discipline, consistency, focus, habits, rest, energy, health, sleep
creativity, learning, reading, writing, thinking, curiosity, excellence, mastery
leadership, communication, relationships, trust, kindness, family, community
money, career, ambition, risk, failure, success, work, productivity
mortality, time, urgency, patience, change, uncertainty, faith, spirituality

Rules for tags:
- Never use the type name (quote, lesson, etc.) as a tag
- Never use the author's name as a tag
- Do not repeat similar concepts (e.g., pick one of resilience/strength/perseverance)
- Prefer specific over generic (e.g., "stoicism" over "philosophy" if clearly stoic)

Respond ONLY with valid JSON in this exact shape:
{
  "type": "Quote" | "Affirmation" | "Story" | "Thought" | "Lesson" | "Habit" | "Pattern",
  "author": string | null,
  "tags": string[],
  "title": string,
  "summary": string
}

No markdown, no explanation, only the JSON object.`

export async function classifyItem(body: string): Promise<{
  type: 'Quote' | 'Affirmation' | 'Story' | 'Thought' | 'Lesson' | 'Habit' | 'Pattern'
  author: string | null
  tags: string[]
  title: string
  summary: string
}> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 256,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: body }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const text = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  return JSON.parse(text)
}
