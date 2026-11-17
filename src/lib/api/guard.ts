import { supabaseAdmin } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import { isBlockedAuthMethod } from './auth-method'

export async function getUserFromToken(
  token: string | null | undefined,
): Promise<User | null> {
  if (!token) return null
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null
  // LABS01-218: the token is valid, but credentials belong to the Borderless
  // platform. A session established with a password, an OAuth provider or an
  // anonymous sign-in never passed through the platform check, so it is not a
  // session this product grants access to. Read after getUser, which is what
  // verifies the signature.
  if (isBlockedAuthMethod(token)) return null
  return data.user
}

export async function getAuthUser(req: Request): Promise<User | null> {
  const authz = req.headers.get('authorization') ?? ''
  const token = /^bearer\s+/i.test(authz) ? authz.replace(/^bearer\s+/i, '') : ''
  return getUserFromToken(token)
}

export async function requireUser(
  req: Request,
): Promise<{ user: User } | Response> {
  const user = await getAuthUser(req)
  if (!user) return jsonError('Não autenticado.', 401)
  return { user }
}

export async function authActionUser(
  token: string | null | undefined,
): Promise<{ userId: string } | { error: string }> {
  const user = await getUserFromToken(token)
  if (!user) return { error: 'Não autenticado.' }
  return { userId: user.id }
}

// LABS01-201 — the API routes take `session_id` from the request body, and
// /replay/[id] renders the latest submission of a session, so a foreign id is
// a defacement vector (audit 3.2). Migration 027 also enforces this with a
// trigger; checking here fails fast, with a useful status, before the AI call.
export async function ownsSession(
  userId: string,
  sessionId: string,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle()
  return data !== null
}

export function notOwner(): Response {
  return jsonError('Sessão inválida.', 403)
}

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status })
}

export function serverError(context: string, e: unknown): Response {
  console.error(`[${context}]`, e)
  return jsonError('Erro interno. Tente novamente.', 500)
}

// Durable fixed-window limit via Supabase (migration 014). Fails open on DB
// errors so a transient outage doesn't block the whole app.
export async function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc(
    'check_rate_limit' as never,
    {
      p_key: key,
      p_max: max,
      p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
    } as never,
  )
  if (error) {
    console.error('[rateLimit]', error)
    return true
  }
  return data !== false
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  return fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
}

export function tooMany(): Response {
  return jsonError('Muitas requisições. Aguarde um momento.', 429)
}

export const CAPS = {
  text: 20_000,
  transcript: 40_000,
  imageBase64: 8_000_000,
} as const

export function tooLarge(): Response {
  return jsonError('Payload muito grande.', 413)
}
