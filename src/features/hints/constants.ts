// Hints economy. Free daily allowance + purchasable bonus credits (stored in
// the user's auth metadata as `bonus_hints`). Bonus is only consumed after the
// daily free allowance runs out, and does not reset daily.
export const FREE_DAILY_HINTS = 10

// "Resolver pra mim" — the expensive last-resort that reveals the full
// solution. Costs many hint credits and tanks the independence score.
export const SOLVE_COST = 5
export const SOLVE_INDEPENDENCE_PENALTY = 40
