// Rate limiting côté client : maximum 5 générations par heure glissante.

const KEY = 'interviewkit.generations.v1'
const MAX = 5
const WINDOW_MS = 60 * 60 * 1000

function read(): number[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

function write(timestamps: number[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(timestamps))
  } catch {
    /* ignore */
  }
}

export interface RateLimitStatus {
  ok: boolean
  /** Minutes avant la prochaine génération autorisée (si bloqué). */
  retryAfterMin: number
  remaining: number
}

export function checkRateLimit(): RateLimitStatus {
  const now = Date.now()
  const recent = read().filter((t) => now - t < WINDOW_MS)
  if (recent.length < MAX) {
    return { ok: true, retryAfterMin: 0, remaining: MAX - recent.length }
  }
  const oldest = Math.min(...recent)
  const retryAfterMin = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 60000))
  return { ok: false, retryAfterMin, remaining: 0 }
}

export function recordGeneration(): void {
  const now = Date.now()
  const recent = read().filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  write(recent)
}
