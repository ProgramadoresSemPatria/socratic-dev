// 4-week league seasons, anchored at Monday 2026-01-05 00:00 BRT (UTC-3).
// Pure math — no cron: the current season is derived from the clock.
const SEASON_EPOCH_UTC = Date.UTC(2026, 0, 5, 3)
const SEASON_MS = 4 * 7 * 24 * 3600_000

export function seasonIndex(now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - SEASON_EPOCH_UTC) / SEASON_MS))
}

export function seasonKey(now: number = Date.now()): string {
  return `S${seasonIndex(now) + 1}`
}

export function seasonEndsAt(now: number = Date.now()): Date {
  return new Date(SEASON_EPOCH_UTC + (seasonIndex(now) + 1) * SEASON_MS)
}
