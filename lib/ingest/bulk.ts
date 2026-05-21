import { bulkExtract } from '../ai/claude'
import { savePreclassified, Source } from './save'

const CHUNK_SIZE = 8000

function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text]
  const chunks: string[] = []
  const paragraphs = text.split(/\n{2,}/)
  let current = ''
  for (const para of paragraphs) {
    if (current.length + para.length + 2 > CHUNK_SIZE && current.length > 0) {
      chunks.push(current.trim())
      current = para
    } else {
      current = current ? `${current}\n\n${para}` : para
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

export async function bulkSave(
  text: string,
  source: Source,
  userId?: string
): Promise<{ saved: number; duplicates: number; failed: number; total: number }> {
  const chunks = chunkText(text)
  let saved = 0, duplicates = 0, failed = 0

  for (const chunk of chunks) {
    let extracted
    try {
      extracted = await bulkExtract(chunk)
    } catch (err) {
      console.error('[bulkSave] extraction failed for chunk:', err)
      failed++
      continue
    }

    for (const item of extracted) {
      try {
        const result = savePreclassified(item, source, userId)
        if (result.duplicate) duplicates++
        else saved++
      } catch (err) {
        console.error('[bulkSave] save failed for item:', item.title, err)
        failed++
      }
    }
  }

  return { saved, duplicates, failed, total: saved + duplicates + failed }
}
