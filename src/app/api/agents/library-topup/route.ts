import { STACKS } from '@/domain/stacks'
import { generateChallenge, type GenLevel } from '@/lib/ai/generate-challenge'
import { jsonError, rateLimit, tooMany } from '@/lib/api/guard'
import type { Locale } from '@/lib/i18n'
import { supabaseAdmin } from '@/lib/supabase/server'

export const maxDuration = 300

const LEVELS: GenLevel[] = ['beginner', 'intermediate', 'advanced']
const LOCALES: Locale[] = ['en', 'pt']

type Slice = {
  kind: 'code' | 'design'
  stack: string
  level: GenLevel
  locale: Locale
}

function allSlices(): Slice[] {
  const slices: Slice[] = []
  for (const locale of LOCALES) {
    for (const level of LEVELS) {
      for (const s of STACKS) {
        slices.push({ kind: 'code', stack: s.id, level, locale })
      }
      slices.push({ kind: 'design', stack: 'design', level, locale })
    }
  }
  return slices
}

async function sliceCount(s: Slice): Promise<number> {
  let q = supabaseAdmin
    .from('challenges')
    .select('id', { count: 'exact', head: true })
    .eq('kind', s.kind)
    .eq('level', s.level)
    .eq('locale', s.locale)
  if (s.kind === 'code') q = q.eq('stack', s.stack)
  const { count, error } = await q
  if (error) throw new Error(`count ${s.kind}/${s.stack}: ${error.message}`)
  return count ?? 0
}

export async function POST(req: Request) {
  const secret = process.env.AGENT_SECRET
  if (!secret) {
    return jsonError('AGENT_SECRET não configurado no servidor.', 500)
  }
  if (req.headers.get('x-agent-secret') !== secret) {
    return jsonError('Não autorizado.', 401)
  }

  // LABS01-203: this was the only AI route with no rate limit at all — the
  // secret was the whole defence. It is also the most expensive request in the
  // product (up to 6 challenges, two AI calls each, ~US$ 0.155 measured) and
  // it runs without a user, so no per-user cap can ever reach it: only the
  // global bucket does. Two runs an hour is more than a library top-up cron
  // needs, and the key is per route because there is no user to key on.
  if (!(await rateLimit('agent:library-topup', 2, 3_600_000))) return tooMany()

  const body = (await req.json().catch(() => ({}))) as {
    target?: number
    maxGenerations?: number
  }
  const target = Math.min(20, Math.max(1, body.target ?? 5))
  const maxGenerations = Math.min(6, Math.max(1, body.maxGenerations ?? 3))

  const slices = allSlices()
  const counts = await Promise.all(slices.map(sliceCount)).catch(
    (e: Error) => e,
  )
  if (counts instanceof Error) return jsonError(counts.message, 502)

  const deficits = slices
    .map((slice, i) => ({ slice, count: counts[i], missing: target - counts[i] }))
    .filter((d) => d.missing > 0)
    .sort((a, b) => b.missing - a.missing)

  const generated: { slice: Slice; title: string }[] = []
  const errors: { slice: Slice; error: string }[] = []

  for (const { slice } of deficits.slice(0, maxGenerations)) {
    try {
      const { data, error } = await generateChallenge({
        kind: slice.kind,
        stack: slice.kind === 'code' ? slice.stack : undefined,
        level: slice.level,
        locale: slice.locale,
      })
      if (error) {
        errors.push({ slice, error: error.message })
      } else {
        generated.push({
          slice,
          title: String((data as { title?: string } | null)?.title ?? ''),
        })
      }
    } catch (e) {
      errors.push({
        slice,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  return Response.json({
    target,
    slicesBelowTarget: deficits.length,
    remainingAfterRun: Math.max(0, deficits.length - generated.length),
    generated,
    errors,
  })
}
