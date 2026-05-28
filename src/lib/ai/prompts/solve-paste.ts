import type { ChallengeKind } from '@/domain/challenge-kinds'

const CODE_SYS = `Você resolve um desafio de programação. Retorne APENAS o código da solução final, completo e correto, na linguagem da stack, com "export" nas funções pedidas. SEM markdown, SEM cercas de código, SEM explicação — somente o código que vai direto no editor.`

const DESIGN_SYS = `Você resolve um desafio de SYSTEM DESIGN (arquitetura) para INICIANTES — seja didático, explique como para quem nunca viu arquitetura.
Responda APENAS com JSON válido (sem markdown):
{ "nodes": [{ "id": string, "label": string, "type": string, "note": string }], "edges": [{ "from": string, "to": string, "label": string }] }
- nodes: 4 a 6 componentes. "type" DEVE ser um de: "client","gateway","service","database","cache","queue","storage","external".
- "label": 1 a 3 palavras (ex.: "API de pedidos", "Postgres", "Redis"). "note": no MÁXIMO 4 palavras, linguagem simples (ex.: "guarda os pedidos", "leitura rápida", "avisa serviços").
- edges: "label" = 1 a 2 palavras (ex.: "envia", "consulta", "salva", "avisa"). from/to = ids de nodes existentes.
- FLUXO ESTRITAMENTE LINEAR de cima pra baixo: cada nó liga só ao PRÓXIMO passo. NÃO crie arestas que pulam etapas (ex.: cliente direto pro banco) — isso faz a seta cruzar por cima de outro componente. Idealmente 1 aresta por par.
- Varie os "type" (não use "service" pra tudo) pra formar camadas distintas: client em cima, depois gateway/service, e bancos/storage embaixo.
- Português do Brasil, tom de quem ensina um leigo.`

export function solvePasteSystem(kind: ChallengeKind): string {
  return kind === 'design' ? DESIGN_SYS : CODE_SYS
}
