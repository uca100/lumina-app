export function validateIngestKey(request: Request): boolean {
  const key = process.env.INGEST_API_KEY
  if (!key) return false
  const auth = request.headers.get('authorization') ?? ''
  return auth === `Bearer ${key}`
}
