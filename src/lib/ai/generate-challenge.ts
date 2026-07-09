import { askClaude } from '@/lib/ai/client'
import type { Locale } from '@/lib/i18n'
import { supabaseAdmin } from '../supabase/server'
import { parseAiJson } from './parse-json'
import { challengeSystem, levelGuide } from './prompts/challenge-generator'

export type GenLevel = 'beginner' | 'intermediate' | 'advanced'

function parseChallenge(raw: string, locale: Locale): Record<string, unknown> {
  try {
    return parseAiJson(raw)
  } catch {
    throw new Error(
      locale === 'pt'
        ? 'A geração veio incompleta. Tente de novo.'
        : 'The generation came back incomplete. Try again.',
    )
  }
}

async function existingTitles(
  kind: 'code' | 'design',
  level: GenLevel,
  stack: string,
): Promise<string[]> {
  let q = supabaseAdmin
    .from('challenges')
    .select('title')
    .eq('kind', kind)
    .eq('level', level)
  if (kind === 'code') q = q.eq('stack', stack)
  // Only the most recent titles: with a large library, dumping every title
  // into the prompt inflates cost and drowns the "avoid these" instruction.
  const { data } = await q.order('created_at', { ascending: false }).limit(40)
  return (data ?? []).map((c) => String(c.title)).filter(Boolean)
}

function parseTopics(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((t) => String(t).toLowerCase().trim().replace(/\s+/g, '-'))
    .filter((t) => t.length > 0 && t.length <= 30)
    .slice(0, 4)
}

function avoidLine(titles: string[]): string {
  if (titles.length === 0) return ''
  return `\n\nESTES desafios JÁ EXISTEM — gere um tema CLARAMENTE diferente (não repita nem só troque o nome):\n- ${titles.join('\n- ')}`
}

// Generates a fresh challenge with the AI and persists it. Returns the
// Supabase insert result ({ data, error }). May throw on AI errors — callers
// should wrap with aiErrorResponse. Passes the existing titles so the AI
// avoids generating near-duplicates.
export async function generateChallenge(opts: {
  kind: 'code' | 'design'
  stack?: string
  level: GenLevel
  userPrompt?: string
  locale?: Locale
}) {
  const locale: Locale = opts.locale ?? 'en'
  const stackMap: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    react: 'react',
    python: 'python',
  }
  const stack = stackMap[opts.stack ?? ''] ?? 'typescript'
  const avoid = avoidLine(await existingTitles(opts.kind, opts.level, stack))
  const userTheme = opts.userPrompt?.trim()
    ? `\n\nO ALUNO PEDIU especificamente um desafio sobre o seguinte tema (siga isto à risca, é o coração do pedido):\n"""\n${opts.userPrompt.trim().slice(0, 800)}\n"""`
    : ''
  const noTestsNote =
    stack === 'react'
      ? '\n\nIMPORTANTE: tests_source deve ser "" (string vazia). initial_code deve ser um componente TSX com "export default function App()". Sem testes automáticos — o aluno vê o resultado no preview visual.'
      : stack === 'python'
        ? '\n\nIMPORTANTE: tests_source deve ser "" (string vazia). initial_code deve ser Python 3 válido (def + pass, sem export). Sem runner automático no browser nesta versão.'
        : ''

  if (opts.kind === 'design') {
    const raw = await askClaude({
      system: challengeSystem('design', locale),
      user: `Gere um desafio de system design (arquitetura) novo. nível: ${opts.level}.\n\n${levelGuide('design', opts.level)}${userTheme}${avoid}`,
      maxTokens: 2600,
      effort: 'medium',
    })
    const json = parseChallenge(raw, locale)
    return supabaseAdmin
      .from('challenges')
      .insert({
        title: String(json.title ?? 'Desafio de Design System'),
        description: String(json.description ?? ''),
        stack: 'design',
        level: opts.level,
        client_briefing: String(json.client_briefing ?? ''),
        intro: String(json.intro ?? ''),
        kind: 'design',
        topics: parseTopics(json.topics),
      })
      .select()
      .single()
  }

  const raw = await askClaude({
    system: challengeSystem('code', locale),
    user: `Gere um desafio novo. stack: ${stack}. nível: ${opts.level}.\n\n${levelGuide('code', opts.level)}${userTheme}${avoid}${noTestsNote}`,
    maxTokens: opts.level === 'advanced' ? 8000 : 4500,
    effort: opts.level === 'advanced' ? 'high' : 'medium',
  })
  const json = parseChallenge(raw, locale)
  return supabaseAdmin
    .from('challenges')
    .insert({
      title: String(json.title ?? 'Desafio'),
      description: String(json.description ?? ''),
      stack,
      level: opts.level,
      client_briefing: String(json.client_briefing ?? ''),
      intro: String(json.intro ?? ''),
      initial_code: String(json.initial_code ?? ''),
      tests_source: String(json.tests_source ?? ''),
      topics: parseTopics(json.topics),
    })
    .select()
    .single()
}
