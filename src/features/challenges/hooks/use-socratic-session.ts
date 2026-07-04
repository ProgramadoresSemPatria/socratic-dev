'use client'

import { SOLVE_CAP } from '@/domain/scoring'
import { useUser } from '@/features/auth/hooks/use-user'
import {
  buyHints as buyHintsAction,
  getHintBalance,
} from '@/features/hints/actions'
import type { ChatMsg } from '@/lib/ai/types'
import { track } from '@/lib/analytics'
import { getAccessToken } from '@/lib/api/client'
import * as React from 'react'
import { completeSession, startSession } from '../actions'
import { loadDraft, saveDraft } from '../draft'

export function useSocraticSession<TWork>(opts: {
  challenge: { id: string } | null
  initialWork: TWork
  initialMessages: ChatMsg[]
  paused?: boolean
}) {
  const { challenge, initialWork, initialMessages, paused = false } = opts
  const { user, loading: authLoading } = useUser()

  const [messages, setMessages] = React.useState<ChatMsg[]>([])
  const [input, setInput] = React.useState('')
  const [thinking, setThinking] = React.useState(false)
  const [independence, setIndependence] = React.useState(100)
  const [hintsUsed, setHintsUsed] = React.useState(0)
  const [elapsed, setElapsed] = React.useState(0)
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [work, setWork] = React.useState<TWork>(initialWork)
  const [ready, setReady] = React.useState(false)
  const [hintsRemaining, setHintsRemaining] = React.useState<number | null>(
    null,
  )
  const [buying, setBuying] = React.useState(false)
  const [buyError, setBuyError] = React.useState<string | null>(null)
  const [bought, setBought] = React.useState(false)

  const startedAtRef = React.useRef<number>(Date.now())
  const pausedAtRef = React.useRef<number | null>(null)
  const buyingRef = React.useRef(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const initRef = React.useRef(false)

  const elapsedNow = React.useCallback(
    () =>
      Math.floor(
        ((pausedAtRef.current ?? Date.now()) - startedAtRef.current) / 1000,
      ),
    [],
  )

  React.useEffect(() => {
    if (!challenge || !user || initRef.current) return
    initRef.current = true

    const draft = loadDraft<TWork>(challenge.id)
    if (draft) {
      setWork(draft.work)
      setMessages(draft.messages)
      setHintsUsed(draft.hintsUsed)
      setIndependence(draft.independence)
      const base = Number.isFinite(draft.elapsed) ? draft.elapsed : 0
      startedAtRef.current = Date.now() - base * 1000
      setElapsed(base)
    } else {
      setWork(initialWork)
      setMessages(initialMessages)
      startedAtRef.current = Date.now()
    }
    setReady(true)
    track('challenge_started', {
      challenge_id: challenge.id,
      resumed: !!draft,
    })

    getAccessToken().then((token) => {
      startSession({ token, challengeId: challenge.id })
        .then((d) => d?.id && setSessionId(d.id))
        .catch(() => {})
      getHintBalance(token)
        .then((b) => setHintsRemaining(b.remaining))
        .catch(() => {})
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge, user])

  React.useEffect(() => {
    if (paused) {
      if (pausedAtRef.current == null) pausedAtRef.current = Date.now()
      return
    }
    if (pausedAtRef.current != null) {
      startedAtRef.current += Date.now() - pausedAtRef.current
      pausedAtRef.current = null
    }
    setElapsed(elapsedNow())
    const t = setInterval(() => setElapsed(elapsedNow()), 1000)
    return () => clearInterval(t)
  }, [paused, elapsedNow])

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, thinking])

  React.useEffect(() => {
    if (!challenge || !initRef.current || messages.length === 0) return
    saveDraft<TWork>(challenge.id, {
      work,
      messages,
      hintsUsed,
      independence,
      elapsed: elapsedNow(),
    })
  }, [challenge, work, messages, hintsUsed, independence])

  function pushMessage(msg: ChatMsg) {
    setMessages((m) => [...m, msg])
  }

  function spend(cost: number, penalty: number) {
    setHintsUsed((h) => h + cost)
    setIndependence((i) => Math.max(0, i - penalty))
  }

  function applyHint(level: 1 | 2 | 3) {
    spend(1, level * 4)
    track('hint_used', { challenge_id: challenge?.id, level })
  }

  function spendSolve() {
    setIndependence(SOLVE_CAP)
    track('solve_used', { challenge_id: challenge?.id })
  }

  function syncRemaining(n: number | undefined) {
    if (typeof n === 'number') setHintsRemaining(n)
  }

  async function buyHints() {
    if (!user || buyingRef.current) return
    buyingRef.current = true
    setBuying(true)
    setBuyError(null)
    setBought(false)
    try {
      const token = await getAccessToken()
      await buyHintsAction(token)
      const b = await getHintBalance(token)
      setHintsRemaining(b.remaining)
      setBought(true)
      track('hints_purchased', { remaining: b.remaining })
      setTimeout(() => setBought(false), 2500)
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : '')
      setTimeout(() => setBuyError(null), 5000)
    } finally {
      buyingRef.current = false
      setBuying(false)
    }
  }

  function complete(
    durationSeconds: number,
    status: 'completed' | 'abandoned' = 'completed',
  ) {
    track('challenge_completed', {
      challenge_id: challenge?.id,
      status,
      duration_seconds: durationSeconds,
      independence,
      hints_used: hintsUsed,
    })
    if (!sessionId) return
    getAccessToken()
      .then((token) =>
        completeSession({ token, id: sessionId, durationSeconds, status }),
      )
      .catch(() => {})
  }

  return {
    user,
    authLoading,
    ready,
    messages,
    setMessages,
    pushMessage,
    input,
    setInput,
    thinking,
    setThinking,
    independence,
    hintsUsed,
    elapsed,
    sessionId,
    work,
    setWork,
    scrollRef,
    applyHint,
    spendSolve,
    syncRemaining,
    buyHints,
    buying,
    buyError,
    bought,
    hintsRemaining,
    complete,
  }
}
