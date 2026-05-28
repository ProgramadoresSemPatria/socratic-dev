'use client'

import type { ChatMsg } from '@/lib/ai/types'
import { useUser } from '@/lib/auth/use-user'
import { loadDraft, saveDraft } from '@/lib/draft'
import { SOLVE_COST, SOLVE_INDEPENDENCE_PENALTY } from '@/lib/hints'
import * as React from 'react'

export function useSocraticSession<TWork>(opts: {
  challenge: { id: string } | null
  initialWork: TWork
  initialMessages: ChatMsg[]
}) {
  const { challenge, initialWork, initialMessages } = opts
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

  const startedAtRef = React.useRef<number>(Date.now())
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const initRef = React.useRef(false)

  React.useEffect(() => {
    if (!challenge || !user || initRef.current) return
    initRef.current = true

    const draft = loadDraft<TWork>(challenge.id)
    if (draft) {
      setWork(draft.work)
      setMessages(draft.messages)
      setHintsUsed(draft.hintsUsed)
      setIndependence(draft.independence)
      // Resume from accumulated active time; anchor "now" so the live timer
      // continues from there (legacy drafts without `elapsed` start at 0).
      const base = Number.isFinite(draft.elapsed) ? draft.elapsed : 0
      startedAtRef.current = Date.now() - base * 1000
      setElapsed(base)
    } else {
      setWork(initialWork)
      setMessages(initialMessages)
      startedAtRef.current = Date.now()
    }
    setReady(true)

    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, challenge_id: challenge.id }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.id && setSessionId(d.id))
      .catch(() => {})

    fetch(`/api/hints?user_id=${user.id}`)
      .then((r) => r.json())
      .then((b) => {
        if (typeof b?.remaining === 'number') setHintsRemaining(b.remaining)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge, user])

  React.useEffect(() => {
    // Derive from the anchor each tick (monotonic, immune to drift/throttling).
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000)),
      1000,
    )
    return () => clearInterval(t)
  }, [])

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
      elapsed: Math.floor((Date.now() - startedAtRef.current) / 1000),
    })
  }, [challenge, work, messages, hintsUsed, independence])

  function pushMessage(msg: ChatMsg) {
    setMessages((m) => [...m, msg])
  }

  function spend(cost: number, level: 1 | 2 | 3, penalty: number) {
    setHintsUsed((h) => h + cost)
    setIndependence((i) => Math.max(0, i - penalty))
    setHintsRemaining((r) => (r === null ? r : Math.max(0, r - cost)))
    if (sessionId && user) {
      fetch('/api/hints', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: user.id,
          hint_level: level,
          cost,
        }),
      }).catch(() => {})
    }
  }

  function applyHint(level: 1 | 2 | 3) {
    spend(1, level, level * 4)
  }

  function spendSolve() {
    spend(SOLVE_COST, 3, SOLVE_INDEPENDENCE_PENALTY)
  }

  async function buyHints() {
    if (!user) return
    try {
      await fetch('/api/hints/buy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      })
      const b = await fetch(`/api/hints?user_id=${user.id}`).then((r) =>
        r.json(),
      )
      if (typeof b?.remaining === 'number') setHintsRemaining(b.remaining)
    } catch {
      // ignore
    }
  }

  function complete(durationSeconds: number) {
    if (!sessionId) return
    fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        duration_seconds: durationSeconds,
      }),
    }).catch(() => {})
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
    buyHints,
    hintsRemaining,
    complete,
  }
}
