// LABS01-208 — the challenge behind a session, read on the server.
//
// Audit finding 3.3: every AI route took the challenge from the request body
// (`title`, `briefing`/`brief`, `tests`, `kind`/`domain`) while holding the
// `session_id` that identifies the real one. Two consequences: the tutor could
// be pointed at any problem the caller invented — a generic coding assistant
// on our card — and the review rubric graded against a prompt the student
// wrote. `body.tests` was the worst of them: it reaches the solve prompt as
// "TESTES OBRIGATÓRIOS", so an empty value turned a paid solve into a free
// code generator.
//
// This replaces ownsSession in the four AI routes: one query settles ownership
// AND context, so there is no reason left to trust the body.

import type { ChallengeKind } from '@/domain/challenge-kinds'
import { supabaseAdmin } from '@/lib/supabase/server'

export type SessionContext = {
  title: string
  briefing: string
  /** Empty for design challenges — only the code track ships tests. */
  tests: string
  kind: ChallengeKind
}

type ContextRow = {
  challenges: {
    title: string | null
    client_briefing: string | null
    tests_source: string | null
    kind: string | null
  } | null
}

/**
 * The challenge context for a session the user owns, or null when the session
 * does not exist or belongs to someone else — callers answer null with 403.
 *
 * Generated challenges are inserted into `challenges` before a session points
 * at them (src/lib/ai/generate-challenge.ts), so every session the workspace
 * can open has a row here.
 */
export async function sessionContext(
  userId: string,
  sessionId: string,
): Promise<SessionContext | null> {
  const { data } = await supabaseAdmin
    .from('sessions')
    .select('challenges(title, client_briefing, tests_source, kind)')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!data) return null

  const challenge = (data as ContextRow).challenges
  return {
    title: challenge?.title ?? '',
    briefing: challenge?.client_briefing ?? '',
    tests: challenge?.tests_source ?? '',
    kind: challenge?.kind === 'design' ? 'design' : 'code',
  }
}
