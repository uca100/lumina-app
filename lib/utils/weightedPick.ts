export function weightedPick<T extends { mark: number }>(items: T[]): T {
  const weights = items.map(i => Math.max(i.mark, 1))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}
