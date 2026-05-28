'use client'

import { Navbar } from '@/components/navbar'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetch } from '@/lib/api/client'
import { signOut, useUser } from '@/lib/auth/use-user'
import { supabase } from '@/lib/supabase'
import {
  ArrowRight,
  ChevronDown,
  Code2,
  GaugeCircle,
  Layers,
  LogOut,
  Trophy,
} from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

type Profile = {
  email: string
  total_challenges_completed: number
  total_hints_used: number
  created_at: string
  preferred_stack?: string | null
  preferred_level?: string | null
}

type Stats = {
  independence_score: number
  total_completed: number
  total_hints: number
}

const STACK_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'react', label: 'React' },
]
const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
]
const TRACK_OPTIONS = [
  { value: 'code', label: 'Código' },
  { value: 'design', label: 'System Design' },
]
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [loaded, setLoaded] = React.useState(false)
  const [track, setTrack] = React.useState('')
  const [stack, setStack] = React.useState('')
  const [level, setLevel] = React.useState('')
  const [saveState, setSaveState] = React.useState<SaveState>('idle')

  React.useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/profile')
  }, [loading, user, router])

  React.useEffect(() => {
    const meta = user?.user_metadata as
      | {
          preferred_track?: string
          preferred_stack?: string
          preferred_level?: string
        }
      | undefined
    if (meta?.preferred_track) setTrack(meta.preferred_track)
    if (meta?.preferred_stack) setStack(meta.preferred_stack)
    if (meta?.preferred_level) setLevel(meta.preferred_level)
  }, [user])

  async function savePrefs(
    nextTrack: string,
    nextStack: string,
    nextLevel: string,
  ) {
    setSaveState('saving')
    const { error } = await supabase.auth.updateUser({
      data: {
        preferred_track: nextTrack,
        preferred_stack: nextStack,
        preferred_level: nextLevel,
      },
    })
    if (error) {
      setSaveState('error')
      return
    }
    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 2000)
  }

  React.useEffect(() => {
    if (!user) return
    let active = true
    ;(async () => {
      const [p, s] = await Promise.all([
        apiFetch('/api/profile').then((r) => r.json()),
        apiFetch('/api/stats').then((r) => r.json()),
      ])
      if (!active) return
      if (p && !p.error) setProfile(p)
      if (s && !s.error) setStats(s)
      setLoaded(true)
    })()
    return () => {
      active = false
    }
  }, [user])

  const ready = !loading && !!user && loaded

  return (
    <div className='relative flex min-h-screen flex-1 flex-col bg-white'>
      <Navbar />

      <main className='flex-1 pt-[88px] pb-20 md:pt-24'>
        <div className='container-main w-full max-w-3xl'>
          <div className='shadow-soft-lg overflow-hidden rounded-xl border border-[#DFE5E9] bg-white'>
            <div className='relative overflow-hidden border-b border-[#DFE5E9] px-6 py-8 sm:px-10 sm:py-10'>
              <div
                className='absolute inset-0'
                style={{
                  background:
                    'linear-gradient(146.18deg, rgba(252, 243, 235, 0.6) 12.07%, rgba(223, 229, 233, 0.6) 45.37%, rgba(220, 215, 253, 0.6) 97.58%), white',
                }}
              />
              <div className='grid-pattern absolute inset-0 opacity-30' />

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className='relative z-10 flex items-center gap-4'
              >
                <div className='grid size-14 shrink-0 place-items-center rounded-2xl bg-primary font-mono text-xl font-semibold text-primary-foreground uppercase ring-4 ring-white/50'>
                  {(user?.email?.[0] ?? 'u').toUpperCase()}
                </div>
                <div className='min-w-0'>
                  <div className='mb-1 font-mono text-[11px] tracking-[0.08em] text-[#6b6478] uppercase'>
                    Seu perfil
                  </div>
                  <h1 className='type-h3 truncate'>{user?.email ?? '—'}</h1>
                  {ready && profile && (
                    <p className='mt-1 text-sm text-[#6b6478]'>
                      Membro desde{' '}
                      {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </motion.div>
            </div>

            <div className='px-6 py-7 sm:px-10 sm:py-8'>
              {!ready ? (
                <ProfileSkeleton />
              ) : (
                <>
                  <div className='grid grid-cols-3 gap-3'>
                    <Stat
                      icon={Trophy}
                      label='Concluídos'
                      value={String(stats?.total_completed ?? 0)}
                    />
                    <Stat
                      icon={GaugeCircle}
                      label='Independência'
                      value={`${stats?.independence_score ?? 100}%`}
                    />
                    <Stat
                      icon={Layers}
                      label='Hints usados'
                      value={String(stats?.total_hints ?? 0)}
                    />
                  </div>

                  <div className='mt-3 rounded-2xl border border-[#DFE5E9] bg-[#F7F9FA] p-6'>
                    <div className='mb-4 flex items-center justify-between'>
                      <div className='flex items-center gap-2 font-mono text-[11px] tracking-wider text-[#6b6478] uppercase'>
                        <Code2 className='size-3.5' />
                        Preferências
                      </div>
                      <SaveBadge state={saveState} />
                    </div>
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                      <SelectField
                        label='Trilha'
                        value={track}
                        placeholder='Escolher trilha'
                        options={TRACK_OPTIONS}
                        onChange={(v) => {
                          setTrack(v)
                          savePrefs(v, stack, level)
                        }}
                      />
                      {track !== 'design' && (
                        <SelectField
                          label='Stack (código)'
                          value={stack}
                          placeholder='Escolher stack'
                          options={STACK_OPTIONS}
                          onChange={(v) => {
                            setStack(v)
                            savePrefs(track, v, level)
                          }}
                        />
                      )}
                      <SelectField
                        label='Dificuldade'
                        value={level}
                        placeholder='Escolher nível'
                        options={LEVEL_OPTIONS}
                        onChange={(v) => {
                          setLevel(v)
                          savePrefs(track, stack, v)
                        }}
                      />
                    </div>
                    <p className='mt-4 text-[13px] text-[#6b6478]'>
                      Os próximos desafios são gerados com base nessas escolhas —
                      salvam automaticamente.
                    </p>
                  </div>

                  <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:items-center'>
                    <Link
                      href='/onboarding'
                      className='group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-[15px] font-medium tracking-tight text-primary-foreground transition-colors hover:bg-primary/90'
                    >
                      Novo desafio
                      <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
                    </Link>
                    <Link
                      href='/dashboard'
                      className='inline-flex items-center justify-center rounded-xl border border-[#1b1916]/20 px-6 py-3 text-[15px] font-medium tracking-tight text-[#1b1916] transition-colors hover:bg-[#1b1916]/5'
                    >
                      Ver dashboard
                    </Link>
                    <button
                      type='button'
                      onClick={async () => {
                        await signOut()
                        router.push('/')
                      }}
                      className='inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-[#6b6478] transition-colors hover:bg-[#1b1916]/5 hover:text-[#1b1916] sm:ml-auto'
                    >
                      <LogOut className='size-4' />
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div>
      <div className='grid grid-cols-3 gap-3'>
        {[0, 1, 2].map((i) => (
          <div key={i} className='rounded-2xl border border-[#DFE5E9] p-5'>
            <Skeleton className='mb-3 size-9 rounded-xl' />
            <Skeleton className='h-7 w-12' />
            <Skeleton className='mt-2 h-3 w-16' />
          </div>
        ))}
      </div>
      <div className='mt-3 rounded-2xl border border-[#DFE5E9] p-6'>
        <Skeleton className='mb-4 h-3 w-40' />
        <div className='grid grid-cols-2 gap-3'>
          <Skeleton className='h-14 rounded-xl' />
          <Skeleton className='h-14 rounded-xl' />
        </div>
      </div>
      <div className='mt-6 flex gap-3'>
        <Skeleton className='h-11 w-36 rounded-full' />
        <Skeleton className='h-11 w-32 rounded-full' />
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: string
}) {
  return (
    <div className='rounded-2xl border border-[#DFE5E9] bg-white p-5'>
      <div className='mb-3 grid size-11 place-items-center rounded-xl bg-[#dad8ea]/55 text-[#1b1916]'>
        <Icon className='size-5' strokeWidth={1.5} />
      </div>
      <div className='font-heading text-3xl font-semibold tracking-tight tabular-nums text-[#1b1916]'>
        {value}
      </div>
      <div className='mt-1 text-[12px] text-[#6b6478]'>{label}</div>
    </div>
  )
}

function SelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className='mb-1.5 block font-mono text-[10px] tracking-wider text-[#6b6478] uppercase'>
        {label}
      </label>
      <div className='relative'>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className='w-full appearance-none rounded-xl border border-[#DFE5E9] bg-white px-4 py-2.5 pr-10 text-[15px] font-medium text-[#1b1916] outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
        >
          <option value='' disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className='pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#6b6478]' />
      </div>
    </div>
  )
}

function SaveBadge({ state }: { state: SaveState }) {
  if (state === 'idle') return null
  const map = {
    saving: ['Salvando…', 'text-[#6b6478]'],
    saved: ['Salvo ✓', 'text-mint'],
    error: ['Erro ao salvar', 'text-red-600'],
  } as const
  const [text, cls] = map[state]
  return <span className={`font-mono text-[11px] ${cls}`}>{text}</span>
}
