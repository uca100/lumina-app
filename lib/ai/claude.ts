import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

const SYSTEM_PROMPT = `You are a content classifier for a personal inspiration app called Lumina.
When given a piece of text, you will:
1. Classify it as one of: Quote, Affirmation, Story, or Thought
2. Extract the author if present (for quotes)
3. Suggest 3-5 concise tags that capture the theme, topic, or mood
4. Generate a short title (max 8 words) summarizing the content

Definitions:
- Quote: A memorable statement attributed to a specific person
- Affirmation: A positive self-directed statement meant to be repeated
- Story: A narrative or anecdote, longer-form
- Thought: A personal reflection, idea, or insight

Respond ONLY with valid JSON in this exact shape:
{
  "type": "Quote" | "Affirmation" | "Story" | "Thought",
  "author": string | null,
  "tags": string[],
  "title": string
}

No markdown, no explanation, only the JSON object.`

export async function classifyItem(body: string): Promise<{
  type: 'Quote' | 'Affirmation' | 'Story' | 'Thought'
  author: string | null
  tags: string[]
  title: string
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

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(text)
}
