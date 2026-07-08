const DAY_MS = 24 * 3600_000

export function calcStreak(
  startedAtDates: string[],
  now: Date = new Date(),
): number {
  if (startedAtDates.length === 0) return 0
  const days = [...new Set(startedAtDates.map((d) => d.slice(0, 10)))].sort(
    (a, b) => b.localeCompare(a),
  )

  const today = now.toISOString().slice(0, 10)
  const yesterday = new Date(now.getTime() - DAY_MS).toISOString().slice(0, 10)
  if (days[0] !== today && days[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const diff = (Date.parse(days[i - 1]) - Date.parse(days[i])) / DAY_MS
    if (diff === 1) streak++
    else break
  }
  return streak
}
