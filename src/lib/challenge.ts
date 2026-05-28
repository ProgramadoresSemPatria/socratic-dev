import type { RunnerLanguage } from '@/lib/runner/types'

export type Challenge = {
  id: string
  title: string
  description: string
  stack: string
  level: string
  client_briefing: string
  initial_code: string
  tests_source: string
  intro: string
}

export const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
}

export function challengeLanguage(stack: string): RunnerLanguage {
  return stack === 'javascript' ? 'js' : 'ts'
}

export function starterCode(challenge: Challenge): string {
  if (challenge.initial_code) return challenge.initial_code
  return [
    `// ${challenge.title}`,
    `//`,
    `// ${challenge.description || 'Leia o briefing à esquerda e implemente a solução.'}`,
    `// Exporte sua função para que os testes possam acessá-la (exports.<nome>).`,
    ``,
    `export function solucao(/* parâmetros */) {`,
    `  // TODO: implemente sua solução aqui`,
    ``,
    `}`,
    ``,
  ].join('\n')
}

export function challengeIntro(challenge: Challenge): string {
  return (
    challenge.intro ||
    'Olá. Leia o briefing à esquerda e me diga: qual o primeiro passo pra resolver isso?'
  )
}
