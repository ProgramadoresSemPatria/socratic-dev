'use client'

import { Footer } from '@/components/footer'
import { Navbar } from '@/components/navbar'
import { RequireAuth } from '@/components/require-auth'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getMyLeague,
  getRanking,
  setDisplayName,
  type LeagueData,
  type RankingData,
} from '@/features/ranking/actions'
import { getAccessToken } from '@/lib/api/client'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Check, Swords, Trophy } from 'lucide-react'
import * as React from 'react'

const copy = {
  en: {
    eyebrow: 'Ranking',
    headline: 'Who earns without',
    flourish: 'copying.',
    intro:
      'Every completed challenge is worth points: level base × your independence. Ask for the answer and you earn nothing.',
    you: 'you',
    points: 'pts',
    yourPosition: 'Your position',
    yourPoints: 'Your points',
    empty: 'Nobody has scored yet. Complete a challenge and open the board.',
    loadError: "Couldn't load the ranking.",
    retry: 'Reload',
    namePrompt: 'Pick a name to show on the board (right now you appear masked):',
    namePlaceholder: 'Your name',
    nameSave: 'Save',
    nameSaved: 'Name saved.',
    howTitle: 'How points work',
    howBody:
      'Beginner 10 · Intermediate 25 · Advanced 50 — multiplied by your independence on that challenge. Each challenge counts once; "solve for me" zeroes the independence, so it earns 0.',
    leagueEyebrow: 'Your league',
    leagueTitle: 'Season',
    leagueEnds: 'ends',
    leagueHint:
      'A small group of up to 25 people competing for 4 weeks. Score a challenge this season to join.',
    leagueEmpty:
      'Nobody in your league scored yet — take the lead with one challenge.',
  },
  pt: {
    eyebrow: 'Ranking',
    headline: 'Quem pontua sem',
    flourish: 'colar.',
    intro:
      'Cada desafio completado vale pontos: base do nível × sua independência. Pediu a resposta pronta, não pontua.',
    you: 'você',
    points: 'pts',
    yourPosition: 'Sua posição',
    yourPoints: 'Seus pontos',
    empty: 'Ninguém pontuou ainda. Complete um desafio e inaugure o placar.',
    loadError: 'Não foi possível carregar o ranking.',
    retry: 'Recarregar',
    namePrompt: 'Escolha um nome para exibir no placar (hoje você aparece mascarado):',
    namePlaceholder: 'Seu nome',
    nameSave: 'Salvar',
    nameSaved: 'Nome salvo.',
    howTitle: 'Como funcionam os pontos',
    howBody:
      'Iniciante 10 · Intermediário 25 · Avançado 50 — multiplicado pela sua independência naquele desafio. Cada desafio conta uma vez; o "resolver pra mim" zera a independência, então vale 0.',
    leagueEyebrow: 'Sua liga',
    leagueTitle: 'Temporada',
    leagueEnds: 'termina',
    leagueHint:
      'Um grupo pequeno de até 25 pessoas competindo por 4 semanas. Pontue um desafio nesta temporada pra entrar.',
    leagueEmpty:
      'Ninguém da sua liga pontuou ainda — assuma a liderança com um desafio.',
  },
}

export default function RankingPage() {
  return <RequireAuth next='/ranking'>{() => <RankingView />}</RequireAuth>
}

function RankingView() {
  const t = useT(copy)
  const [data, setData] = React.useState<RankingData | null>(null)
  const [league, setLeague] = React.useState<LeagueData>(null)
  const [error, setError] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const token = await getAccessToken()
      const [r, l] = await Promise.all([
        getRanking(token),
        getMyLeague(token).catch(() => null),
      ])
      if ('error' in r) setError(true)
      else setData(r)
      setLeague(l)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <Navbar />
      <main className='container-main flex-1 pt-[120px] pb-20'>
        <div className='mx-auto max-w-[720px]'>
          <p className='eyebrow'>{t.eyebrow}</p>
          <h1 className='type-h2 mt-4'>
            {t.headline}{' '}
            <span className='font-serif italic'>{t.flourish}</span>
          </h1>
          <p className='mt-4 max-w-[52ch] text-base text-muted-foreground'>
            {t.intro}
          </p>

          {loading ? (
            <div className='mt-10 space-y-2'>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className='h-14 w-full rounded-xl' />
              ))}
            </div>
          ) : error || !data ? (
            <div className='border-destructive/30 bg-destructive/5 text-destructive mt-10 rounded-xl border px-5 py-4 text-sm'>
              {t.loadError}{' '}
              <button
                type='button'
                onClick={load}
                className='cursor-pointer font-medium underline underline-offset-2'
              >
                {t.retry}
              </button>
            </div>
          ) : (
            <>
              <div className='mt-8 grid grid-cols-2 gap-3 sm:max-w-[400px]'>
                <MeStat label={t.yourPosition} value={`#${data.me.position}`} />
                <MeStat
                  label={t.yourPoints}
                  value={`${data.me.points} ${t.points}`}
                />
              </div>

              {!data.me.hasName && <NamePrompt onSaved={load} />}

              <LeagueSection league={league} />

              {data.entries.filter((e) => e.points > 0).length === 0 ? (
                <p className='mt-10 text-sm text-muted-foreground'>
                  {t.empty}
                </p>
              ) : (
                <ol className='mt-8 overflow-hidden rounded-xl border border-border'>
                  {data.entries
                    .filter((e) => e.points > 0)
                    .map((e) => (
                      <li
                        key={e.position}
                        className={cn(
                          'flex items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0',
                          e.isMe ? 'bg-primary/[0.06]' : 'bg-card',
                        )}
                      >
                        <span
                          className={cn(
                            'w-10 shrink-0 font-mono text-[13px] tabular-nums',
                            e.position <= 3
                              ? 'text-primary'
                              : 'text-muted-foreground',
                          )}
                        >
                          #{e.position}
                        </span>
                        {e.position <= 3 && (
                          <Trophy
                            className='size-4 shrink-0 text-primary'
                            strokeWidth={1.5}
                          />
                        )}
                        <span className='min-w-0 flex-1 truncate text-sm font-medium text-ink'>
                          {e.name}
                          {e.isMe && (
                            <span className='ml-2 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] tracking-wider text-primary uppercase'>
                              {t.you}
                            </span>
                          )}
                        </span>
                        <span className='shrink-0 font-mono text-[13px] text-muted-foreground tabular-nums'>
                          {e.points} {t.points}
                        </span>
                      </li>
                    ))}
                </ol>
              )}

              <div className='mt-8 rounded-xl border border-border bg-muted/40 px-5 py-4'>
                <div className='font-mono text-[10px] tracking-wider text-muted-foreground uppercase'>
                  {t.howTitle}
                </div>
                <p className='mt-1.5 text-[13px] leading-relaxed text-muted-foreground'>
                  {t.howBody}
                </p>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

function LeagueSection({ league }: { league: LeagueData }) {
  const t = useT(copy)
  if (!league) {
    return (
      <div className='mt-8 flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-5 py-4'>
        <Swords className='mt-0.5 size-4 shrink-0 text-primary' strokeWidth={1.5} />
        <p className='text-[13px] leading-relaxed text-muted-foreground'>
          {t.leagueHint}
        </p>
      </div>
    )
  }
  const daysLeft = Math.max(
    0,
    Math.ceil((Date.parse(league.endsAt) - Date.now()) / (24 * 3600_000)),
  )
  const scored = league.entries.filter((e) => e.points > 0)
  return (
    <section className='mt-8'>
      <div className='flex items-baseline justify-between gap-3'>
        <p className='eyebrow'>{t.leagueEyebrow}</p>
        <span className='font-mono text-[11px] text-muted-foreground'>
          {t.leagueTitle} {league.season} · {t.leagueEnds} {daysLeft}d
        </span>
      </div>
      {scored.length === 0 ? (
        <p className='mt-3 text-sm text-muted-foreground'>{t.leagueEmpty}</p>
      ) : (
        <ol className='mt-3 overflow-hidden rounded-xl border border-primary/25'>
          {scored.map((e) => (
            <li
              key={e.position}
              className={cn(
                'flex items-center gap-4 border-b border-border px-5 py-3 last:border-b-0',
                e.isMe ? 'bg-primary/[0.06]' : 'bg-card',
              )}
            >
              <span
                className={cn(
                  'w-8 shrink-0 font-mono text-[13px] tabular-nums',
                  e.position === 1 ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                #{e.position}
              </span>
              <span className='min-w-0 flex-1 truncate text-sm font-medium text-ink'>
                {e.name}
                {e.isMe && (
                  <span className='ml-2 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] tracking-wider text-primary uppercase'>
                    {t.you}
                  </span>
                )}
              </span>
              <span className='shrink-0 font-mono text-[13px] text-muted-foreground tabular-nums'>
                {e.points} {t.points}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function MeStat({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-xl border border-border bg-card px-5 py-4'>
      <div className='font-mono text-[10px] tracking-wider text-muted-foreground uppercase'>
        {label}
      </div>
      <div className='font-heading mt-1 text-[28px] leading-none font-light text-ink tabular-nums'>
        {value}
      </div>
    </div>
  )
}

function NamePrompt({ onSaved }: { onSaved: () => void }) {
  const t = useT(copy)
  const [name, setName] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function save() {
    if (saving || name.trim().length < 2) return
    setSaving(true)
    setError(null)
    try {
      const token = await getAccessToken()
      const r = await setDisplayName({ token, name })
      if ('error' in r) {
        setError(r.error)
        return
      }
      setSaved(true)
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <p className='mt-6 flex items-center gap-1.5 text-sm text-primary'>
        <Check className='size-4' /> {t.nameSaved}
      </p>
    )
  }

  return (
    <div className='mt-6 rounded-xl border border-primary/20 bg-primary/[0.05] px-5 py-4'>
      <p className='text-[13px] text-muted-foreground'>{t.namePrompt}</p>
      <div className='mt-3 flex gap-2'>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 40))}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder={t.namePlaceholder}
          className='h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-ink outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
        />
        <button
          type='button'
          onClick={save}
          disabled={saving || name.trim().length < 2}
          className='bg-ink hover:bg-primary h-9 cursor-pointer rounded-lg px-4 text-sm font-medium text-background transition-colors disabled:cursor-not-allowed disabled:opacity-50'
        >
          {t.nameSave}
        </button>
      </div>
      {error && <p className='text-destructive mt-2 text-xs'>{error}</p>}
    </div>
  )
}
