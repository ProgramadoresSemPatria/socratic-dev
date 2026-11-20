// LABS01-208 — reading and writing the tutor transcript (migration 028).
//
// The conversation is the product, so it cannot simply be dropped to stop the
// forged-`assistant` attack (audit 3.3): the tutor has to remember the
// questions it already asked. It lives in `tutor_messages` instead, which the
// client can read but never write — and the request body no longer carries a
// role at all.

import { supabaseAdmin } from '@/lib/supabase/server'
import type { StoredTurn } from '@/lib/ai/tutor-history'
import { captureException } from '@/lib/report-error'

/** Turns loaded per call. Long conversations are trimmed by char budget too. */
const HISTORY_LIMIT = 60

/**
 * The stored turns of a session, oldest first. Returns an empty history on a
 * read error: a degraded answer beats a dead chat, and the hole this closes is
 * about what the client can *claim*, not about what we remember.
 */
export async function loadTranscript(
  userId: string,
  sessionId: string,
): Promise<StoredTurn[]> {
  // Ordered by `seq`, not `created_at`: both rows of a turn are written in one
  // insert and share the transaction timestamp, so `created_at` cannot tell
  // the question from the answer (migration 028).
  const { data, error } = await supabaseAdmin
    .from('tutor_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .order('seq', { ascending: false })
    .limit(HISTORY_LIMIT)
  if (error) {
    captureException(error)
    return []
  }
  return ((data ?? []) as StoredTurn[]).slice().reverse()
}

/**
 * Appends this turn: the student's message (when there was one) and whatever
 * the model produced. Called while the response stream is still open, so the
 * write finishes inside the request. Never throws — a lost transcript row must
 * not break an answer the student already read.
 */
export async function saveTurns(
  userId: string,
  sessionId: string,
  turns: { role: 'user' | 'assistant'; content: string }[],
): Promise<void> {
  const rows = turns
    .filter((t) => t.content.trim().length > 0)
    .map((t) => ({
      session_id: sessionId,
      user_id: userId,
      role: t.role,
      content: t.content,
    }))
  if (!rows.length) return
  const { error } = await supabaseAdmin.from('tutor_messages').insert(rows)
  if (error) captureException(error)
}
