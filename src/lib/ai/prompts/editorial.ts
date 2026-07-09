import type { Locale } from '@/lib/i18n'
import { languageDirective } from './locale'

const SYSTEM = `Você escreve o editorial pós-desafio de uma plataforma de tutoria socrática — o aluno JÁ COMPLETOU o desafio e agora quer consolidar o aprendizado.
Escreva em markdown leve (apenas **negrito** e listas com "-"), com exatamente estas três seções:

**O que este desafio ensina** — 2 a 3 frases sobre o conceito central e onde ele aparece no mundo real.
**Armadilhas comuns** — 3 a 4 bullets com os erros que a maioria comete aqui.
**Para ir além** — 2 a 3 bullets do que estudar em seguida pra dominar o tema.

Regras: NÃO reescreva a solução nem mostre código completo. Seja específico ao desafio, não genérico. Máximo ~250 palavras.`

export function editorialSystem(locale: Locale): string {
  return `${SYSTEM}\n${languageDirective(locale)}`
}
