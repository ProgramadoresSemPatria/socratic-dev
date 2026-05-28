'use client'

import { useUser } from '@/features/auth/hooks/use-user'
import {
  SOLVE_COST,
  SOLVE_INDEPENDENCE_PENALTY,
} from '@/features/hints/constants'
import type { ChatMsg } from '@/lib/ai/types'
import * as React from 'react'
import { loadDraft, saveDraft } from '../draft'

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
      startedAtRef.current = draft.startedAt
      setElapsed(Math.floor((Date.now() - draft.startedAt) / 1000))
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
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
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
      startedAt: startedAtRef.current,
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
