<div align="center">

# socratic.dev

**A IA nunca te dá a resposta. Ela te leva até ela.**

Um tutor de programação socrático: você resolve desafios reais de código e de arquitetura,
e a IA responde pergunta com pergunta — como um bom tech lead num pair programming.

[Stack](#stack) · [Como funciona](#como-funciona) · [Rodando localmente](#rodando-localmente) · [Arquitetura](#arquitetura) · [Deploy](#deploy)

</div>

---

## O problema

Ferramentas de IA hoje entregam a resposta pronta. Você cola, funciona, e não aprendeu nada.
Na entrevista — ou no trabalho de verdade — a cola não está lá.

**socratic.dev inverte isso.** A IA tem uma única regra inquebrável: **nunca revelar a solução.**
Ela pergunta, provoca, aponta o próximo passo — e te força a pensar. O aprendizado acontece
no esforço, não na resposta.

## Duas trilhas

| Trilha | O que você faz | Como a IA avalia |
|---|---|---|
| **Código** | Resolve desafios num editor Monaco de verdade, com testes escondidos que rodam no navegador | Tutor socrático via texto + testes reais executados em sandbox |
| **System Design** *(arquitetura)* | Desenha a arquitetura num canvas Excalidraw — serviços, bancos, filas, fluxo de dados | A IA **enxerga o diagrama** (visão) e interroga cada decisão de distribuição/escala |

Do nível iniciante ao nível big-tech — a dificuldade escala com o seu perfil.

## Como funciona

```
Onboarding  →  escolhe trilha + stack + nível
            →  a IA GERA (ou reaproveita) um desafio sob medida

Workspace   →  você resolve (código no Monaco / arquitetura no Excalidraw)
            →  conversa com o tutor: ele só faz perguntas
            →  pede um hint quando trava (custa do seu saldo)

Submit      →  Código:  roda os testes escondidos → passou/falhou real
            →  Design:  exporta o PNG → Claude analisa a imagem → feedback
            →  métricas: independência, hints usados, tempo
```

### A IA é indispensável por design

Tire a IA e o produto deixa de existir. Ela não é um enfeite — ela **gera os desafios**,
**conduz o diálogo socrático**, **analisa o diagrama de arquitetura por visão** e **mede sua
independência**. Não há fallback estático: sem IA, não há desafio, não há tutor, não há avaliação.

## Recursos

- **Tutor socrático** — `claude-sonnet-4-6` com prompts que proíbem revelar a solução; modos separados para código e design.
- **Editor Monaco + runner real** — testes JS/TS rodam num **Web Worker** isolado (transpilação via `sucrase`), com timeout. Nada é hardcoded; o verde só aparece se os testes passam.
- **Canvas Excalidraw + Claude Vision** — o diagrama vira PNG e é analisado por visão; o chat usa um *resumo de texto* dos elementos pra economizar tokens, e a visão só é chamada no submit.
- **Geração inteligente de desafios** — a dificuldade depende fortemente do nível; avançado mira testes estilo FAANG.
- **Biblioteca reaproveitável** — todo desafio gerado vira pool compartilhado: a próxima pessoa recebe na hora, sem regenerar (menos espera, menos custo). Deduplicação para não repetir.
- **Economia de hints (SaaS)** — saldo diário grátis + compra de mais hints + "Resolver pra mim" como último recurso (caro), que **aplica** a solução direto no editor / canvas.
- **Resolver pra mim** — não devolve texto: escreve o código no Monaco, ou monta o diagrama no Excalidraw (layout em camadas, didático, com legendas nas setas).
- **Dashboard** — heatmap de atividade estilo GitHub, anel de independência, histórico paginado com retomar de onde parou.
- **Drafts persistentes** — código + chat sobrevivem a um F5 (localStorage).

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, React Compiler) |
| UI | **React 19**, **Tailwind v4**, Base UI, Motion, Recharts, Lucide |
| Editor / Canvas | **Monaco** (código) · **Excalidraw** (arquitetura) |
| IA | **Claude** via `@anthropic-ai/sdk` (texto + visão, adaptive thinking + effort) |
| Backend | **Supabase** — Postgres, Auth, RLS |
| Execução de código | **Web Worker** + `sucrase` (sandbox no navegador) |
| Linguagem | **TypeScript** (strict) |

## Rodando localmente

**Pré-requisitos:** Node 20+, uma conta [Supabase](https://supabase.com) e uma chave da [Anthropic](https://console.anthropic.com).

```bash
# 1. Instalar dependências (peer-deps do Excalidraw exigem a flag)
npm install --legacy-peer-deps

# 2. Configurar variáveis de ambiente
cp .env.example .env.local   # e preencha os valores

# 3. Aplicar as migrations no seu projeto Supabase
supabase link --project-ref <seu-ref>
supabase db push

# 4. Subir o dev server
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=        # URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # chave anon (pública)
SUPABASE_SERVICE_ROLE_KEY=       # chave service-role (servidor — nunca exponha no client)
ANTHROPIC_API_KEY=               # chave da API da Anthropic
```

> `.env.local` está no `.gitignore`. **Nunca** commite chaves. Em produção, configure no painel da Vercel.

## Arquitetura

```
src/
├─ app/
│  ├─ page.tsx              Landing
│  ├─ onboarding/           Escolha de trilha → gera/reaproveita desafio
│  ├─ challenge/            Workspace de CÓDIGO (Monaco + runner + chat)
│  ├─ design/               Workspace de SYSTEM DESIGN (Excalidraw + chat)
│  ├─ challenges/           Biblioteca de desafios (paginada, dedupe)
│  ├─ dashboard/            Progresso (heatmap, independência, histórico)
│  ├─ profile/              Preferências (trilha, stack, nível)
│  └─ api/
│     ├─ next-challenge/     Reaproveita do pool ou gera (alavanca de velocidade)
│     ├─ generate-challenge/ Geração via IA
│     ├─ tutor/              Diálogo socrático (domain: code | design)
│     ├─ solve/              "Resolver pra mim" (aplica no editor/canvas)
│     ├─ design-review/      Análise por VISÃO do diagrama
│     ├─ review/             Avaliação de submissão de código
│     ├─ hints/ + hints/buy  Economia de hints
│     └─ sessions/ stats/ profile/ signup/
├─ components/
│  ├─ landing/  challenge/  design/  ui/  navbar, footer, logo…
├─ lib/
│  ├─ ai/        client (Claude texto+visão), generate-challenge
│  ├─ session/   useSocraticSession (máquina de estado compartilhada)
│  ├─ runner/    execução de código em Web Worker
│  ├─ design/    scene (build/summarize/export do Excalidraw)
│  └─ auth/ challenge/ hints/ draft/ supabase…
└─ supabase/migrations/     001–009
```

**Banco** (`public`): `profiles`, `challenges`, `sessions`, `hints_used`, `code_submissions` — com RLS.

**Reuso central:** um hook `useSocraticSession` extrai a máquina de estado (chat, hints, independência,
tempo, sessão, draft) usada pelas duas trilhas — `/challenge` e `/design` só montam `sendUser`/`askHint`/`submit` em cima dela.

## Deploy

O alvo é **Vercel + Supabase** (Supabase é gerenciado — sem deploy próprio).

1. Importe o repositório na **Vercel** (detecta Next.js automaticamente).
2. Configure as **4 variáveis de ambiente** acima.
3. Após o deploy, no **Supabase → Authentication → URL Configuration**, defina **Site URL** e **Redirect URLs** (`https://seu-dominio/**`) para o login funcionar em produção.

```bash
npm run build   # valida o build de produção antes de subir
```

## Scripts

| Comando | O quê |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Build de produção |
| `npm run start` | Servir o build |
| `npm run format` | Prettier |

---

<div align="center">
Feito para a hackathon HB01-2026
</div>
