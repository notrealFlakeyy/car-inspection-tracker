const MOJIBAKE_PATTERN = /[ÃÂâ]/

export function normalizeText(value: string): string {
  if (!MOJIBAKE_PATTERN.test(value)) return value

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff)
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return value
  }
}
