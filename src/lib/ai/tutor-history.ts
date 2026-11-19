// LABS01-208 — building the tutor's multi-turn history from stored rows.
//
// The route used to map `body.messages` straight into turns, with the role
// coming from the client, so an `assistant` turn could be forged (audit 3.3).
// Rows now come from `tutor_messages`; this module turns them into what the
// Messages API takes, and is pure so the shape is testable without a database.

import type { ChatTurn, TextBlock } from './client'

export type StoredTurn = { role: string; content: string }

/** Mirrors CAPS.transcript in src/lib/api/guard.ts, without importing it. */
export const TRANSCRIPT_CHARS = 40_000

/** Shown when a conversation starts with the tutor instead of the student. */
export const FIRST_TURN_PLACEHOLDER = '(início — primeira interação)'

function turn(role: 'user' | 'assistant', content: string): ChatTurn {
  return { role, content }
}

/**
 * The conversation prefix for one tutor call.
 *
 * - `stored` is the transcript in ascending `created_at` order.
 * - `newUserText` is the message the student just typed, if any (hint and
 *   solve requests carry none).
 *
 * The oldest turns are dropped first when the transcript exceeds `maxChars`,
 * the first turn is always `user` (the API requires it), and the last turn
 * carries the cache breakpoint so the prefix caches and grows incrementally.
 * Volatile content — the student's current code and the task — goes in the
 * final user turn the caller appends after this one.
 */
export function buildHistory(
  stored: StoredTurn[],
  newUserText?: string,
  maxChars: number = TRANSCRIPT_CHARS,
): ChatTurn[] {
  const turns: ChatTurn[] = []

  let budget = maxChars
  const fresh = newUserText?.trim() ?? ''
  if (fresh) budget -= fresh.length

  // Walk backwards: when the transcript is long, the recent turns are the
  // ones worth keeping.
  const kept: ChatTurn[] = []
  for (let i = stored.length - 1; i >= 0; i--) {
    const row = stored[i]
    const content = row?.content?.trim() ?? ''
    if (!content) continue
    if (content.length > budget) break
    budget -= content.length
    kept.push(turn(row.role === 'assistant' ? 'assistant' : 'user', content))
  }
  turns.push(...kept.reverse())

  if (fresh) turns.push(turn('user', fresh))

  if (!turns.length || turns[0].role !== 'user') {
    turns.unshift(turn('user', FIRST_TURN_PLACEHOLDER))
  }

  const last = turns[turns.length - 1]
  const block: TextBlock = {
    type: 'text',
    text: typeof last.content === 'string' ? last.content : '',
    cache_control: { type: 'ephemeral' },
  }
  turns[turns.length - 1] = { role: last.role, content: [block] }

  return turns
}
