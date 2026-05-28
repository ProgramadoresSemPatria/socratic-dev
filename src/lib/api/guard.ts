import { supabaseAdmin } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export async function getAuthUser(req: Request): Promise<User | null> {
  const authz = req.headers.get('authorization') ?? ''
  const token = /^bearer\s+/i.test(authz) ? authz.replace(/^bearer\s+/i, '') : ''
  if (!token) return null
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

export async function requireUser(
  req: Request,
): Promise<{ user: User } | Response> {
  const user = await getAuthUser(req)
  if (!user) return jsonError('Não autenticado.', 401)
  return { user }
}

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status })
}

export function serverError(context: string, e: unknown): Response {
  console.error(`[${context}]`, e)
  return jsonError('Erro interno. Tente novamente.', 500)
}

type Bucket = { count: number; reset: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  if (b.count >= max) return false
  b.count++
  return true
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  return fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
}

export function tooMany(): Response {
  return jsonError('Muitas requisições. Aguarde um momento.', 429)
}

export const CAPS = {
  text: 20_000, // code / diagram summary / single field
  transcript: 40_000, // whole chat transcript
  imageBase64: 8_000_000, // ~6 MB decoded PNG
} as const

export function tooLarge(): Response {
  return jsonError('Payload muito grande.', 413)
}
