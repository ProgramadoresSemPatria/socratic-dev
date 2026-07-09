'use client'

import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { RequireAuth } from '@/components/require-auth'
import { Skeleton } from '@/components/ui/skeleton'
import { getEditorial } from '@/features/challenges/actions'
import { FormattedText } from '@/features/challenges/components/formatted-text'
import {
  getCommunitySolutions,
  type CommunitySolution,
} from '@/features/solutions/actions'
import { getAccessToken } from '@/lib/api/client'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { ChevronDown, Lock, Users } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import * as React from 'react'

const copy = {
  en: {
    eyebrow: 'Community',
    title: 'How others solved it',
    empty:
      'No shared solutions yet. Enable "Community solutions" in your profile to share yours — and check back later.',
    locked: 'Solve the challenge first — no spoilers here.',
    lockedCta: 'Open the challenge',
    notFound: 'Challenge not found.',
    you: 'you',
    independent: 'independent',
    back: 'Back to dashboard',
    profileCta: 'Sharing settings',
    editorialTitle: 'What this challenge teaches',
  },
  pt: {
    eyebrow: 'Comunidade',
    title: 'Como outros resolveram',
    empty:
      'Nenhuma solução compartilhada ainda. Ative "Soluções da comunidade" no seu perfil pra compartilhar a sua — e volte depois.',
    locked: 'Resolva o desafio primeiro — sem spoiler por aqui.',
    lockedCta: 'Abrir o desafio',
    notFound: 'Desafio não encontrado.',
    you: 'você',
    independent: 'independente',
    back: 'Voltar ao dashboard',
    profileCta: 'Configurar compartilhamento',
    editorialTitle: 'O que este desafio ensina',
  },
}

type State =
  | { kind: 'loading' }
  | { kind: 'locked' }
  | { kind: 'not-found' }
  | { kind: 'ready'; title: string; solutions: CommunitySolution[] }

// Compact by default: a row per author, code revealed on demand so people
// can pick whose solution to study.
function SolutionCard({
  sol,
  youLabel,
  indLabel,
}: {
  sol: CommunitySolution
  youLabel: string
  indLabel: string
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <article className='overflow-hidden rounded-lg border border-border bg-card'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className='flex w-full cursor-pointer flex-wrap items-center gap-2.5 px-5 py-3.5 text-left transition-colors duration-200 hover:bg-secondary'
      >
        <span className='text-sm font-medium text-ink'>{sol.name}</span>
        {sol.isMe && (
          <span className='rounded-full bg-lime px-2 py-0.5 font-mono text-[10px] uppercase text-ink dark:text-background'>
            {youLabel}
          </span>
        )}
        <span className='ml-auto flex items-center gap-3'>
          {typeof sol.independence === 'number' && (
            <span
              className={cn(
                'font-mono text-[11px]',
                sol.independence > 70
                  ? 'text-primary'
                  : 'text-muted-foreground',
              )}
            >
              {sol.independence}% {indLabel}
            </span>
          )}
          <ChevronDown
            className={cn(
              'size-4 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180',
            )}
            strokeWidth={1.5}
          />
        </span>
      </button>
      {open && (
        <pre className='overflow-x-auto border-t border-border px-5 py-4 font-mono text-[13px] leading-relaxed text-ink'>
          <code>{sol.code}</code>
        </pre>
      )}
    </article>
  )
}

function SolutionsContent({ challengeId }: { challengeId: string }) {
  const t = useT(copy)
  const [state, setState] = React.useState<State>({ kind: 'loading' })
  const [editorial, setEditorial] = React.useState<string | null | undefined>(
    undefined,
  )

  React.useEffect(() => {
    if (state.kind !== 'ready') return
    let active = true
    ;(async () => {
      const token = await getAccessToken()
      const r = await getEditorial(token, challengeId)
      if (active) setEditorial('error' in r ? null : r.text)
    })().catch(() => {
      if (active) setEditorial(null)
    })
    return () => {
      active = false
    }
  }, [state.kind, challengeId])

  React.useEffect(() => {
    let active = true
    ;(async () => {
      const token = await getAccessToken()
      const r = await getCommunitySolutions(token, challengeId)
      if (!active) return
      if ('error' in r) {
        setState({
          kind: r.error === 'not-completed' ? 'locked' : 'not-found',
        })
      } else {
        setState({ kind: 'ready', title: r.title, solutions: r.solutions })
      }
    })().catch(() => {
      if (active) setState({ kind: 'not-found' })
    })
    return () => {
      active = false
    }
  }, [challengeId])

  return (
    <div className='relative flex min-h-screen flex-1 flex-col bg-background'>
      <Navbar />
      <main className='container-main flex-1 pt-[110px] pb-24'>
        <p className='eyebrow'>{t.eyebrow}</p>
        <h1 className='type-h2 mt-2'>{t.title}</h1>

        {state.kind === 'loading' && (
          <div className='mt-10 flex flex-col gap-4'>
            <Skeleton className='h-6 w-72' />
            <Skeleton className='h-48 w-full rounded-lg' />
            <Skeleton className='h-48 w-full rounded-lg' />
          </div>
        )}

        {state.kind === 'locked' && (
          <div className='mt-10 flex flex-col items-start gap-5 rounded-lg border border-border bg-card px-6 py-10'>
            <Lock className='size-5 text-primary' strokeWidth={1.5} />
            <p className='type-body max-w-md'>{t.locked}</p>
            <Button
              variant='ink'
              render={<Link href={`/challenge?id=${challengeId}`} />}
            >
              {t.lockedCta}
            </Button>
          </div>
        )}

        {state.kind === 'not-found' && (
          <div className='mt-10 rounded-lg border border-border bg-card px-6 py-10'>
            <p className='type-body'>{t.notFound}</p>
          </div>
        )}

        {state.kind === 'ready' && (
          <>
            <p className='type-body mt-2 text-muted-foreground'>
              {state.title}
            </p>

            {editorial === undefined ? (
              <Skeleton className='mt-8 h-40 w-full rounded-lg' />
            ) : editorial ? (
              <section className='mt-8 rounded-lg border border-primary/25 bg-primary/[0.04] px-6 py-5'>
                <p className='font-mono text-[10px] tracking-wider text-primary uppercase'>
                  {t.editorialTitle}
                </p>
                <div className='type-body mt-3'>
                  <FormattedText text={editorial} />
                </div>
              </section>
            ) : null}
            {state.solutions.length === 0 ? (
              <div className='mt-10 flex flex-col items-start gap-5 rounded-lg border border-border bg-card px-6 py-10'>
                <Users className='size-5 text-primary' strokeWidth={1.5} />
                <p className='type-body max-w-lg'>{t.empty}</p>
                <Button variant='outline' render={<Link href='/profile' />}>
                  {t.profileCta}
                </Button>
              </div>
            ) : (
              <div className='mt-10 flex flex-col gap-3'>
                {state.solutions.map((sol, i) => (
                  <SolutionCard key={i} sol={sol} youLabel={t.you} indLabel={t.independent} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default function SolutionsPage() {
  const params = useParams<{ id: string }>()
  return (
    <RequireAuth next={`/solutions/${params.id}`}>
      {() => <SolutionsContent challengeId={params.id} />}
    </RequireAuth>
  )
}
