'use client'

import { Button } from '@/components/ui/button'
import { BriefingPanel } from '@/features/challenges/components/briefing-panel'
import { ChallengeSkeleton } from '@/features/challenges/components/challenge-skeleton'
import { ChatPanel } from '@/features/challenges/components/chat-panel'
import { ReviewModal } from '@/features/challenges/components/review-modal'
import { WorkspaceHeader } from '@/features/challenges/components/workspace-header'
import { useSocraticSession } from '@/features/challenges/hooks/use-socratic-session'
import type { Challenge } from '@/features/challenges/types'
import {
  buildSceneElements,
  exportScenePng,
  summarizeElements,
  type ExcalidrawApi,
} from '@/features/design/utils/scene'
import { apiFetch } from '@/lib/api/client'
import { useT } from '@/lib/i18n'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'
import { Loader2, Wand2 } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { DesignCanvas } from './design-canvas'

const POST = { method: 'POST', headers: { 'content-type': 'application/json' } }

const copy = {
  en: {
    intro:
      'Hi. Read the briefing on the left and tell me: where would you start this design?',
    replyFallback: "Couldn't respond right now.",
    analyzeFallback: "Couldn't analyze right now.",
    hintUnavailable: 'Hint unavailable.',
    solutionDrawn:
      'I drew the architecture on the canvas. Study the flow and why each piece is there.',
    teachWhy: 'Why each piece is here:',
    teachThink: 'Now you — before moving on:',
    solveFallback: "Couldn't solve it right now.",
    nothingDrawn:
      "You haven't drawn anything yet — start the diagram and submit again.",
    reviewFallback: "Couldn't generate the review.",
    canvasLabel: 'Canvas — draw your architecture',
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
    solutionDrawn:
      'Desenhei a arquitetura no canvas. Estude o fluxo e por que cada peça está ali.',
    teachWhy: 'Por que cada peça está aqui:',
    teachThink: 'Agora você — antes de seguir:',
    solveFallback: 'Não consegui resolver agora.',
    nothingDrawn:
      'Você ainda não desenhou nada — comece o diagrama e submeta de novo.',
    reviewFallback: 'Não foi possível gerar o review.',
    canvasLabel: 'Canvas — desenhe sua arquitetura',
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
  const t = useT(copy)
  const [challenge, setChallenge] = React.useState<Challenge | null>(null)
  const [loadError, setLoadError] = React.useState(false)
  const [activePanel, setActivePanel] = React.useState<
    'brief' | 'work' | 'chat'
  >('brief')
  const apiRef = React.useRef<ExcalidrawApi | null>(null)
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const intro = challenge?.intro || t.intro

  const s = useSocraticSession<readonly unknown[]>({
    challenge: challenge ? { id: challenge.id } : null,
    initialWork: [],
    initialMessages: [{ role: 'ai', text: intro }],
  })

  const [outcome, setOutcome] = React.useState<'pass' | 'fail'>('pass')

  const [reviewOpen, setReviewOpen] = React.useState(false)
  const [review, setReview] = React.useState<string | null>(null)
  const [reviewing, setReviewing] = React.useState(false)

  React.useEffect(() => {
    let active = true
    ;(async () => {
      const id =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('id')
          : null
      const { data, error } = id
        ? await supabase.from('challenges').select('*').eq('id', id).single()
        : await supabase
            .from('challenges')
            .select('*')
            .eq('kind', 'design')
            .order('created_at', { ascending: true })
            .limit(1)
            .single()
      if (!active) return
      if (error || !data) setLoadError(true)
      else setChallenge(data as unknown as Challenge)
    })().catch(() => {
      if (active) setLoadError(true)
    })
    return () => {
      active = false
    }
  }, [])

  function currentElements(): readonly unknown[] {
    return apiRef.current?.getSceneElements() ?? s.work
  }

  function tutorBody(extra: Record<string, unknown>) {
    return JSON.stringify({
      domain: 'design',
      title: challenge?.title ?? '',
      briefing: challenge?.client_briefing ?? '',
      code: summarizeElements(currentElements()),
      ...extra,
    })
  }

  async function sendUser() {
    if (!s.input.trim() || s.thinking || !challenge) return
    const text = s.input.trim()
    const next = [...s.messages, { role: 'user' as const, text }]
    s.setMessages(next)
    s.setInput('')
    s.setThinking(true)
    try {
      const res = await apiFetch('/api/tutor', {
        ...POST,
        body: tutorBody({ mode: 'reply', messages: next }),
      })
      const data = await res.json()
      s.pushMessage({
        role: 'ai',
        text: data.text || data.error || t.replyFallback,
      })
    } catch {
      s.pushMessage({ role: 'ai', text: t.errNetwork })
    } finally {
      s.setThinking(false)
    }
  }

  async function askAnalysis() {
    if (s.thinking || !challenge) return
    s.setThinking(true)
    try {
      const res = await apiFetch('/api/tutor', {
        ...POST,
        body: tutorBody({ mode: 'reply', messages: s.messages }),
      })
      const data = await res.json()
      s.pushMessage({
        role: 'ai',
        text: data.text || data.error || t.analyzeFallback,
      })
    } catch {
      s.pushMessage({ role: 'ai', text: t.errNetwork })
    } finally {
      s.setThinking(false)
    }
  }

  async function askHint(level: 1 | 2 | 3) {
    if (s.thinking || !challenge) return
    s.setThinking(true)
    try {
      const res = await apiFetch('/api/tutor', {
        ...POST,
        body: tutorBody({
          mode: 'hint',
          hintLevel: level,
          messages: s.messages,
          session_id: s.sessionId,
        }),
      })
      const data = await res.json()
      s.syncRemaining(data.remaining)
      if (data.text) s.applyHint(level)
      s.pushMessage({
        role: 'ai',
        text: data.text || data.error || t.hintUnavailable,
        hintLevel: level,
      })
    } catch {
      s.pushMessage({ role: 'ai', text: t.errNetwork })
    } finally {
      s.setThinking(false)
    }
  }

  async function askSolve() {
    if (s.thinking || !challenge) return
    s.setThinking(true)
    s.spendSolve()
    try {
      const res = await apiFetch('/api/solve', {
        ...POST,
        body: JSON.stringify({
          kind: 'design',
          title: challenge.title,
          briefing: challenge.client_briefing,
          work: summarizeElements(currentElements()),
          session_id: s.sessionId,
        }),
      })
      const data = await res.json()
      s.syncRemaining(data.remaining)
      if (Array.isArray(data.nodes) && data.nodes.length > 0) {
        const elements = await buildSceneElements(data.nodes, data.edges ?? [])
        apiRef.current?.updateScene({ elements })
        apiRef.current?.scrollToContent(elements, {
          fitToContent: true,
          animate: true,
        })
        s.setWork(elements)
        const teach = data.teach as
          | {
              flow?: string
              components?: { id: string; why: string }[]
              questions?: string[]
            }
          | undefined
        const labelOf = new Map(
          (data.nodes as { id: string; label?: string }[]).map((n) => [
            n.id,
            n.label ?? n.id,
          ]),
        )
        const parts: string[] = []
        if (teach?.flow) parts.push(teach.flow)
        if (teach?.components?.length) {
          parts.push('', `**${t.teachWhy}**`)
          for (const c of teach.components) {
            parts.push(`- **${labelOf.get(c.id) ?? c.id}** — ${c.why}`)
          }
        }
        if (teach?.questions?.length) {
          parts.push('', `**${t.teachThink}**`)
          for (const q of teach.questions) parts.push(`- ${q}`)
        }
        s.pushMessage({
          role: 'ai',
          text: parts.length ? parts.join('\n') : t.solutionDrawn,
        })
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
    if (!challenge || reviewing) return
    setReviewOpen(true)
    setReviewing(true)
    setReview(null)

    const elements = currentElements()
    if (elements.length === 0) {
      setOutcome('fail')
      setReview(t.nothingDrawn)
      s.complete(s.elapsed, 'abandoned')
      setReviewing(false)
      return
    }
    setOutcome('pass')
    s.complete(s.elapsed, 'completed')

    const summary = summarizeElements(elements)
    let imageBase64: string | null = null
    try {
      imageBase64 = apiRef.current ? await exportScenePng(apiRef.current) : null
    } catch {
      imageBase64 = null
    }

    try {
      const res = await apiFetch('/api/design-review', {
        ...POST,
        body: JSON.stringify({
          title: challenge.title,
          brief: challenge.client_briefing,
          summary,
          imageBase64,
          scene: JSON.stringify(elements),
          session_id: s.sessionId,
        }),
      })
      const data = await res.json()
      setReview(data.review || data.error || t.reviewFallback)
    } catch {
      setReviewOpen(false)
      s.pushMessage({ role: 'ai', text: t.errNetwork })
    } finally {
      setReviewing(false)
    }
  }

  function onCanvasChange(elements: readonly unknown[]) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => s.setWork(elements), 500)
  }

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
              'rounded-full px-3 py-1 font-mono text-[12px] transition-colors',
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
              disabled={s.thinking}
              className='gap-1.5 rounded-md text-muted-foreground hover:text-ink'
            >
              {s.thinking ? (
                <Loader2 className='size-3.5 animate-spin' />
              ) : (
                <Wand2 className='size-3.5' />
              )}
              {t.askAnalysis}
            </Button>
          </div>
          <div className='relative min-h-0 flex-1'>
            {s.ready ? (
              <DesignCanvas
                initialElements={s.work}
                onApi={(api) => {
                  apiRef.current = api
                }}
                onChange={onCanvasChange}
              />
            ) : (
              <div className='grid h-full place-items-center text-muted-foreground'>
                <Loader2 className='size-4 animate-spin' />
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
