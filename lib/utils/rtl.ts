const HE_RE = /[֐-׿יִ-ﭏ]/

export function isRTL(text: string): boolean {
  return HE_RE.test(text)
}
