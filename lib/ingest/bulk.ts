import { bulkExtract } from '../ai/claude'
import { savePreclassified, Source } from './save'

const CHUNK_SIZE = 8000

// Detect and convert markdown pipe tables to clean readable text so the AI
// can extract items without being confused by | separators.
function preprocessMarkdownTable(text: string): string {
  const lines = text.trim().split('\n')
  const pipeLines = lines.filter(l => l.trim().startsWith('|'))
  if (pipeLines.length < 3) return text // not a table, return as-is

  const parseRow = (line: string) =>
    line.split('|').map(c => c.trim()).filter(Boolean)

  // Skip separator rows (|---|---|)
  const dataLines = pipeLines.filter(l => !/^\s*\|[\s\-:|]+\|\s*$/.test(l))
  if (dataLines.length === 0) return text

  const rows = dataLines.map(parseRow)
  const firstRow = rows[0]

  // Heuristic: first row is a header if all cells are short and have no periods
  const isHeader = firstRow.every(c => c.length < 40 && !c.includes('.'))
  const headers = isHeader ? firstRow : []
  const dataRows = isHeader ? rows.slice(1) : rows

  const readable = dataRows
    .filter(row => row.length > 0 && row.some(c => c.length > 0))
    .map(row => {
      if (headers.length >= 3 && row.length >= 2) {
        // 3-col table: [Title] | [Description] | [Examples/Authors]
        const title = row[0] ?? ''
        const body = row[1] ?? ''
        const examples = row[2] ?? ''
        const parts = [`**${title}**`]
        if (body) parts.push(body)
        if (examples) parts.push(`Examples: ${examples}`)
        return parts.join('\n')
      }
      if (headers.length === 2 && row.length >= 2) {
        return `**${row[0]}**\n${row[1]}`
      }
      // Fallback: join cells with newlines
      return row.join('\n')
    })
    .join('\n\n')

  return readable || text
}

function preprocessText(text: string): string {
  // If the text looks like a pipe table, convert it first
  const trimmed = text.trim()
  if (trimmed.split('\n').filter(l => l.trim().startsWith('|')).length >= 3) {
    return preprocessMarkdownTable(trimmed)
  }
  return trimmed
}

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
  const chunks = chunkText(preprocessText(text))
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
