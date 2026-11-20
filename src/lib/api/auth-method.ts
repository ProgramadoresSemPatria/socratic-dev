// LABS01-218 — which authentication method produced a session.
//
// Credentials live on the Borderless platform. The bridge in
// src/features/auth/actions.ts validates them there, creates the Supabase user
// WITHOUT a password and hands the client a one-time magic-link token, which
// src/app/login/page.tsx exchanges via verifyOtp. So a legitimate session is
// never established with a password, an OAuth provider or an anonymous
// sign-in.
//
// Those methods survive only as leftovers of the hackathon login: 14 accounts
// created before 2026-08-24 still carry a Supabase password, the GitHub
// provider stayed enabled, and /auth/v1/recover lets any user set a password
// on a passwordless account. Each one authenticates without ever asking the
// Borderless platform — which is the whole point of the bridge.
//
// This is a DENY list on purpose. An allow list would have to name the exact
// amr method the magic-link exchange records, and naming it wrong locks every
// user out. Denying the three methods the bridge provably never uses fails
// safe: an unknown or unparseable amr is allowed through, and the provider
// configuration in the Supabase dashboard remains the first line of defense.

export const BLOCKED_AUTH_METHODS: readonly string[] = [
  'password',
  'oauth',
  'anonymous',
]

type AmrEntry = { method?: string; timestamp?: number }

function decodeSegment(segment: string): unknown {
  const b64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  return JSON.parse(atob(padded))
}

/**
 * The method that produced the session, read from the JWT's `amr` claim.
 * Returns null when the token is not a JWT, carries no `amr`, or cannot be
 * parsed — callers must treat null as "unknown", never as "safe to block".
 *
 * Only call this on a token whose signature was already verified (the Auth
 * server validates it in getUserFromToken); this function does not verify it.
 */
export function sessionAuthMethod(token: string): string | null {
  try {
    const segment = token.split('.')[1]
    if (!segment) return null
    const claims = decodeSegment(segment) as { amr?: unknown }
    if (!Array.isArray(claims.amr) || claims.amr.length === 0) return null
    // Sessions can accumulate methods (e.g. a later MFA step). The most
    // recent one is what established the current access level.
    const latest = (claims.amr as AmrEntry[]).reduce((a, b) =>
      (b?.timestamp ?? 0) >= (a?.timestamp ?? 0) ? b : a,
    )
    return typeof latest?.method === 'string' ? latest.method : null
  } catch {
    return null
  }
}

/** True only when the token states a method the Borderless bridge never uses. */
export function isBlockedAuthMethod(token: string): boolean {
  const method = sessionAuthMethod(token)
  return method !== null && BLOCKED_AUTH_METHODS.includes(method)
}
