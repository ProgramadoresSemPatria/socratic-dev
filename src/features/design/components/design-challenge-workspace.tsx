'use client'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { BriefingPanel } from '@/features/challenges/components/briefing-panel'
import { ChallengeSkeleton } from '@/features/challenges/components/challenge-skeleton'
import { ChatPanel } from '@/features/challenges/components/chat-panel'
import { ReviewModal } from '@/features/challenges/components/review-modal'
import { WorkspaceHeader } from '@/features/challenges/components/workspace-header'
import { getNextChallenge } from '@/features/challenges/actions'
import { useSocraticSession } from '@/features/challenges/hooks/use-socratic-session'
import type { Challenge } from '@/features/challenges/types'
import { layoutAiGraph } from '@/features/design/graph/layout'
import { summarizeGraph } from '@/features/design/graph/summarize'
import {
  coerceGraph,
  EMPTY_GRAPH,
  type DesignGraph,
} from '@/features/design/graph/types'
import { track } from '@/lib/analytics'
import { apiFetch, getAccessToken } from '@/lib/api/client'
import { useT } from '@/lib/i18n'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'
import { Wand2 } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { DesignCanvas, type DesignCanvasApi } from './design-canvas'

const POST = { method: 'POST', headers: { 'content-type': 'application/json' } }

type SolveStep = { nodeId: string; label: string; why: string }
// Drives the "solve it for me" walkthrough: the full diagram/explanation
// arrives in one API call, but is revealed one component at a time so the
// canvas builds up alongside the chat instead of dumping everything at once.
type SolveProgress = {
  graph: DesignGraph
  order: string[]
  steps: SolveStep[]
  revealed: number
  flow?: string
  questions?: string[]
}

const copy = {
  en: {
    intro:
      'Hi. Read the briefing on the left and tell me: where would you start this design?',
    replyFallback: "Couldn't respond right now.",
    analyzeFallback: "Couldn't analyze right now.",
    hintUnavailable: 'Hint unavailable.',
    teachThink: 'Now you, before moving on:',
    continueStep: (i: number, total: number) => `Continue (${i}/${total})`,
    solveBuilding:
      'Building the full solution — this takes ~30 seconds. Then I will walk you through it piece by piece.',
    solveFallback: "Couldn't solve it right now.",
    nothingDrawn:
      "You haven't drawn anything yet. Start the diagram and submit again.",
    reviewFallback: "Couldn't generate the review.",
    canvasLabel: 'Canvas: draw your architecture',
    askAnalysis: 'Ask for analysis',
    errNetwork: 'Lost connection to the tutor — try again.',
    notFound: 'Challenge not found',
    backToDashboard: 'Back to dashboard',
    panelBriefing: 'Briefing',
    panelWork: 'Canvas',
    panelTutor: 'Tutor',
  },
  pt: {
    intro:
      'Olá. Leia o briefing à esquerda e me diga: por onde você começa esse design?',
    replyFallback: 'Não consegui responder agora.',
    analyzeFallback: 'Não consegui analisar agora.',
    hintUnavailable: 'Hint indisponível.',
    teachThink: 'Agora você, antes de seguir:',
    continueStep: (i: number, total: number) => `Continuar (${i}/${total})`,
    solveBuilding:
      'Montando a solução completa — leva uns 30 segundos. Depois vou te guiar peça por peça.',
    solveFallback: 'Não consegui resolver agora.',
    nothingDrawn:
      'Você ainda não desenhou nada. Comece o diagrama e submeta de novo.',
    reviewFallback: 'Não foi possível gerar o review.',
    canvasLabel: 'Canvas: desenhe sua arquitetura',
    askAnalysis: 'Pedir análise',
    errNetwork: 'Sem conexão com o tutor — tente de novo.',
    notFound: 'Desafio não encontrado',
    backToDashboard: 'Voltar ao dashboard',
    panelBriefing: 'Briefing',
    panelWork: 'Canvas',
    panelTutor: 'Tutor',
  },
}

export function DesignChallengeWorkspace({ user }: { user: User }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idParam = searchParams.get('id')
  const t = useT(copy)
  const [challenge, setChallenge] = React.useState<Challenge | null>(null)
  const [loadError, setLoadError] = React.useState(false)

  React.useEffect(() => {
    let active = true
    // A nav click to the plain /design URL re-runs this (idParam goes back to
    // null) without unmounting the workspace, so drop the stale challenge —
    // otherwise a just-finished design stays on screen instead of the next one.
    setChallenge(null)
    setLoadError(false)
    ;(async () => {
      if (idParam) {
        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .eq('id', idParam)
          .single()
        if (!active) return
        if (error || !data) setLoadError(true)
        else setChallenge(data as unknown as Challenge)
        return
      }
      // No ?id=: pick the user's next unseen design challenge instead of the
      // oldest row (which ignores level/locale and repeats forever).
      const meta = user.user_metadata as
        | { preferred_level?: string }
        | undefined
      const next = await getNextChallenge({
        kind: 'design',
        level: (meta?.preferred_level ?? 'beginner') as
          | 'beginner'
          | 'intermediate'
          | 'advanced',
        token: await getAccessToken(),
      })
      if (!active) return
      if ('error' in next || !next?.id) setLoadError(true)
      else {
        router.replace(`?id=${next.id}`, { scroll: false })
        setChallenge(next as unknown as Challenge)
      }
    })().catch(() => {
      if (active) setLoadError(true)
    })
    return () => {
      active = false
    }
  }, [user.user_metadata, idParam, router])

  if (loadError)
    return (
      <div className='flex h-dvh flex-col items-center justify-center gap-4 bg-background'>
        <span className='font-mono text-4xl text-muted-foreground'>∅</span>
        <h1 className='text-xl font-light'>{t.notFound}</h1>
        <Button variant='outline' onClick={() => router.push('/dashboard')}>
          {t.backToDashboard}
        </Button>
      </div>
    )

  if (!challenge) return <ChallengeSkeleton />

  return <DesignChallengeSession key={challenge.id} challenge={challenge} />
}

function DesignChallengeSession({ challenge }: { challenge: Challenge }) {
  const router = useRouter()
  const t = useT(copy)
  const [activePanel, setActivePanel] = React.useState<
    'brief' | 'work' | 'chat'
  >('brief')
  const apiRef = React.useRef<DesignCanvasApi | null>(null)
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const intro = challenge.intro || t.intro

  const [reviewOpen, setReviewOpen] = React.useState(false)

  const s = useSocraticSession<DesignGraph>({
    challenge: { id: challenge.id },
    initialWork: EMPTY_GRAPH,
    initialMessages: [{ role: 'ai', text: intro }],
    paused: reviewOpen,
  })

  const [outcome, setOutcome] = React.useState<'pass' | 'fail'>('pass')
  const [review, setReview] = React.useState<string | null>(null)
  const [reviewing, setReviewing] = React.useState(false)
  const [solve, setSolve] = React.useState<SolveProgress | null>(null)

  // coerceGraph also absorbs drafts saved by the previous (Excalidraw)
  // canvas, which stored an element array — those come back empty.
  function currentGraph(): DesignGraph {
    return apiRef.current?.getGraph() ?? coerceGraph(s.work)
  }

  // LABS01-208: the challenge (title, briefing, kind) is read from the
  // session on the server, so the body carries only the diagram the student
  // drew and the session it belongs to.
  function tutorBody(extra: Record<string, unknown>) {
    return JSON.stringify({
      code: summarizeGraph(currentGraph()),
      session_id: s.sessionId,
      ...extra,
    })
  }

  async function sendUser() {
    if (!s.input.trim() || s.thinking || !s.sessionId) return
    const text = s.input.trim()
    const next = [...s.messages, { role: 'user' as const, text }]
    s.setMessages(next)
    s.setInput('')
    s.setThinking(true)
    try {
      const res = await apiFetch('/api/tutor', {
        ...POST,
        body: tutorBody({ mode: 'reply', text }),
      })
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        s.pushMessage({ role: 'ai', text: data.error || t.replyFallback })
      } else {
        await s.streamIntoMessage(res, { fallback: t.replyFallback })
      }
    } catch {
      s.pushMessage({ role: 'ai', text: t.errNetwork })
    } finally {
      s.setThinking(false)
    }
  }

  async function askAnalysis() {
    if (s.thinking || !s.sessionId) return
    s.setThinking(true)
    try {
      const res = await apiFetch('/api/tutor', {
        ...POST,
        body: tutorBody({ mode: 'reply' }),
      })
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        s.pushMessage({ role: 'ai', text: data.error || t.analyzeFallback })
      } else {
        await s.streamIntoMessage(res, { fallback: t.analyzeFallback })
      }
    } catch {
      s.pushMessage({ role: 'ai', text: t.errNetwork })
    } finally {
      s.setThinking(false)
    }
  }

  async function askHint(level: 1 | 2 | 3) {
    if (s.thinking || !s.sessionId) return
    s.setThinking(true)
    try {
      const res = await apiFetch('/api/tutor', {
        ...POST,
        body: tutorBody({ mode: 'hint', hintLevel: level }),
      })
      const remaining = res.headers.get('X-Hints-Remaining')
      if (remaining != null) s.syncRemaining(Number(remaining))
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        s.pushMessage({
          role: 'ai',
          text: data.error || t.hintUnavailable,
          hintLevel: level,
        })
      } else {
        s.applyHint(level)
        await s.streamIntoMessage(res, {
          hintLevel: level,
          fallback: t.hintUnavailable,
        })
      }
    } catch {
      s.pushMessage({ role: 'ai', text: t.errNetwork })
    } finally {
      s.setThinking(false)
    }
  }

  function revealSolveStep(progress: SolveProgress, index: number) {
    const revealed = new Set(progress.order.slice(0, index + 1))
    const visible: DesignGraph = {
      nodes: progress.graph.nodes.filter((n) => revealed.has(n.id)),
      edges: progress.graph.edges.filter(
        (e) => revealed.has(e.source) && revealed.has(e.target),
      ),
    }
    // The camera follows each step: zoom onto the component this step is
    // explaining instead of refitting the whole diagram every time.
    apiRef.current?.setGraph(visible, { focus: progress.order[index] })
    s.setWork(visible)

    const step = progress.steps[index]
    const isLast = index === progress.steps.length - 1
    const parts = [
      step.why ? `**${step.label}** — ${step.why}` : `**${step.label}**`,
    ]
    if (isLast) {
      if (progress.flow) parts.push('', progress.flow)
      if (progress.questions?.length) {
        parts.push('', `**${t.teachThink}**`)
        for (const q of progress.questions) parts.push(`- ${q}`)
      }
    }
    s.pushMessage({ role: 'ai', text: parts.join('\n') })
    setSolve({ ...progress, revealed: index + 1 })
  }

  function continueSolve() {
    if (!solve || solve.revealed >= solve.steps.length) return
    revealSolveStep(solve, solve.revealed)
  }

  async function askSolve() {
    // Mid-walkthrough: don't let a re-click spend hints on a fresh solve —
    // "Continue" is how the user advances the one already in progress.
    if (
      s.thinking ||
      !s.sessionId ||
      (solve && solve.revealed < solve.steps.length)
    )
      return
    s.setThinking(true)
    s.spendSolve()
    s.pushMessage({ role: 'ai', text: t.solveBuilding })
    try {
      const res = await apiFetch('/api/solve', {
        ...POST,
        body: JSON.stringify({
          work: summarizeGraph(currentGraph()),
          session_id: s.sessionId,
        }),
      })
      const data = await res.json()
      s.syncRemaining(data.remaining)
      if (Array.isArray(data.nodes) && data.nodes.length > 0) {
        const graph = layoutAiGraph(data.nodes, data.edges ?? [])
        const teach = data.teach as
          | {
              flow?: string
              components?: { id: string; why: string }[]
              questions?: string[]
            }
          | undefined
        const labelOf = new Map(graph.nodes.map((n) => [n.id, n.label]))
        // Reveal order follows the tutor's narrated flow (teach.components is
        // already client → ... → storage); any node it skipped is appended
        // last so nothing silently fails to draw.
        const fromTeach = (teach?.components ?? [])
          .map((c) => c.id)
          .filter((id, i, arr) => labelOf.has(id) && arr.indexOf(id) === i)
        const order = [
          ...fromTeach,
          ...[...labelOf.keys()].filter((id) => !fromTeach.includes(id)),
        ]
        const steps: SolveStep[] = order.map((id) => ({
          nodeId: id,
          label: labelOf.get(id) ?? id,
          why: teach?.components?.find((c) => c.id === id)?.why ?? '',
        }))
        const progress: SolveProgress = {
          graph,
          order,
          steps,
          revealed: 0,
          flow: teach?.flow,
          questions: teach?.questions,
        }
        revealSolveStep(progress, 0)
      } else {
        s.pushMessage({
          role: 'ai',
          text: data.error || t.solveFallback,
        })
      }
    } catch {
      s.pushMessage({ role: 'ai', text: t.errNetwork })
    } finally {
      s.setThinking(false)
    }
  }

  async function submitDesign() {
    if (reviewing) return
    track('challenge_submitted', { challenge_id: challenge.id, kind: 'design' })
    setReviewOpen(true)
    setReviewing(true)
    setReview(null)

    const graph = currentGraph()
    if (graph.nodes.length === 0) {
      setOutcome('fail')
      setReview(t.nothingDrawn)
      s.complete(s.elapsed, 'abandoned')
      setReviewing(false)
      return
    }
    setOutcome('pass')

    const summary = summarizeGraph(graph)
    let imageBase64: string | null
    try {
      imageBase64 = (await apiRef.current?.exportPng()) ?? null
    } catch {
      imageBase64 = null
    }

    // LABS01-208: the rubric's briefing comes from the session now.
    if (!s.sessionId) {
      setReview(t.reviewFallback)
      setReviewing(false)
      return
    }

    try {
      const res = await apiFetch('/api/design-review', {
        ...POST,
        body: JSON.stringify({
          summary,
          imageBase64,
          scene: JSON.stringify(graph),
          session_id: s.sessionId,
        }),
      })
      const data = await res.json()
      setReview(data.review || data.error || t.reviewFallback)
    } catch {
      setReviewOpen(false)
      s.pushMessage({ role: 'ai', text: t.errNetwork })
    } finally {
      // LABS01-219: after the review, which is what records the scene the
      // award counts. Drawing one box no longer scores the challenge — the
      // server needs a graph with at least three nodes and one edge that
      // resolves. The real grade comes with the rubric of LABS01-211.
      s.complete(s.elapsed, 'completed')
      setReviewing(false)
    }
  }

  function onCanvasChange(graph: DesignGraph) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => s.setWork(graph), 500)
  }

  return (
    <div className='relative flex h-dvh flex-col overflow-hidden bg-background'>
      <WorkspaceHeader
        title={challenge.title}
        elapsed={s.elapsed}
        independence={s.independence}
        submitting={reviewing}
        onSubmit={submitDesign}
      />

      <div className='flex shrink-0 items-center gap-1 border-b border-border bg-muted px-4 py-2 lg:hidden'>
        {(['brief', 'work', 'chat'] as const).map((p) => (
          <button
            key={p}
            type='button'
            onClick={() => setActivePanel(p)}
            className={cn(
              'cursor-pointer rounded-full px-3 py-1 font-mono text-[12px] transition-colors',
              activePanel === p
                ? 'bg-ink text-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {p === 'brief'
              ? t.panelBriefing
              : p === 'work'
                ? t.panelWork
                : t.panelTutor}
          </button>
        ))}
      </div>

      <div className='flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[360px_1fr_400px] lg:grid-rows-[minmax(0,1fr)]'>
        <aside
          className={cn(
            'min-h-0 overflow-y-auto border-border bg-muted lg:border-r',
            activePanel === 'brief' ? 'flex-1' : 'hidden lg:block',
          )}
        >
          <BriefingPanel challenge={challenge} />
        </aside>

        <section
          className={cn(
            'relative min-h-0 flex-col border-border lg:border-r',
            activePanel === 'work' ? 'flex flex-1' : 'hidden lg:flex',
          )}
        >
          <div className='flex h-10 shrink-0 items-center justify-between border-b border-border bg-muted px-4'>
            <div className='font-mono text-[12px] text-muted-foreground'>
              {t.canvasLabel}
            </div>
            <Button
              size='xs'
              variant='ghost'
              onClick={askAnalysis}
              loading={s.thinking}
              className='gap-1.5 rounded-md text-muted-foreground hover:text-ink'
            >
              <Wand2 className='size-3.5' />
              {t.askAnalysis}
            </Button>
          </div>
          <div className='relative min-h-0 flex-1'>
            {s.ready ? (
              <DesignCanvas
                initialGraph={coerceGraph(s.work)}
                onApi={(api) => {
                  apiRef.current = api
                }}
                onChange={onCanvasChange}
              />
            ) : (
              <div className='grid h-full place-items-center text-muted-foreground'>
                <Spinner className='size-4' />
              </div>
            )}
          </div>
        </section>

        <aside
          className={cn(
            'min-h-0 flex-col border-border bg-muted lg:border-l',
            activePanel === 'chat' ? 'flex flex-1' : 'hidden lg:flex',
          )}
        >
          <ChatPanel
            messages={s.messages}
            scrollRef={s.scrollRef}
            thinking={s.thinking}
            input={s.input}
            setInput={s.setInput}
            sendUser={sendUser}
            askHint={askHint}
            hintsUsed={s.hintsUsed}
            hintsRemaining={s.hintsRemaining}
            onSolve={askSolve}
            onBuy={s.buyHints}
            buying={s.buying}
            buyError={s.buyError}
            bought={s.bought}
            stepPrompt={
              solve && solve.revealed < solve.steps.length
                ? {
                    label: t.continueStep(solve.revealed, solve.steps.length),
                    onContinue: continueSolve,
                  }
                : null
            }
            sessionReady={s.sessionReady}
            sessionError={s.sessionError}
          />
        </aside>
      </div>

      <AnimatePresence>
        {reviewOpen && (
          <ReviewModal
            review={review}
            reviewing={reviewing}
            independence={s.independence}
            hintsUsed={s.hintsUsed}
            elapsed={s.elapsed}
            tests={null}
            outcome={outcome}
            sessionId={s.sessionId}
            onClose={() => setReviewOpen(false)}
            onComplete={() => router.push('/dashboard')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
