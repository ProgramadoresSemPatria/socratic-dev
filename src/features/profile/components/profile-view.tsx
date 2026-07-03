'use client'

import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { signOut } from '@/features/auth/hooks/use-user'
import { getDashboardStats } from '@/features/dashboard/actions'
import type { Stats } from '@/features/dashboard/types'
import { Halftone, glyph } from '@/features/landing/components/halftone'
import { getProfile, type Profile } from '@/features/profile/actions'
import { getAccessToken } from '@/lib/api/client'
import { useLocale, useT, type Locale } from '@/lib/i18n'
import { supabase } from '@/lib/supabase/client'
import { useTheme, type ThemeSetting } from '@/lib/theme'
import type { User } from '@supabase/supabase-js'
import { ArrowRight, LogOut } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

const STACK_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'react', label: 'React' },
]

const LANGUAGE_OPTIONS: readonly { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'pt', label: 'PT' },
]

const copy = {
  en: {
    dateLocale: 'en-US',
    levelOptions: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
    ],
    trackOptions: [
      { value: 'code', label: 'Code' },
      { value: 'design', label: 'System Design' },
    ],
    avatarAlt: 'Your avatar',
    yourProfile: 'Your profile',
    memberSince: 'Member since',
    statCompleted: 'Completed',
    statIndependence: 'Independence',
    statHints: 'Hints used',
    preferences: 'Preferences',
    prefsNote:
      'Your next challenges are based on these choices. Changes save automatically.',
    trackLabel: 'Track',
    trackDesc: 'What kind of challenges you get next.',
    trackPlaceholder: 'Pick a track',
    stackLabel: 'Stack',
    stackDesc: 'Language for code challenges.',
    stackPlaceholder: 'Pick a stack',
    difficultyLabel: 'Difficulty',
    difficultyDesc: 'How hard the next one should be.',
    levelPlaceholder: 'Pick a level',
    appearanceLabel: 'Appearance',
    appearanceDesc: 'Light, dark, or follow your system.',
    themeOptions: [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'system', label: 'System' },
    ],
    languageLabel: 'Language',
    languageDesc: 'Interface language.',
    redoSetup: 'Redo setup',
    signOut: 'Sign out',
    loadError: "Couldn't load your data.",
    retry: 'Retry',
  },
  pt: {
    dateLocale: 'pt-BR',
    levelOptions: [
      { value: 'beginner', label: 'Iniciante' },
      { value: 'intermediate', label: 'Intermediário' },
      { value: 'advanced', label: 'Avançado' },
    ],
    trackOptions: [
      { value: 'code', label: 'Código' },
      { value: 'design', label: 'System Design' },
    ],
    avatarAlt: 'Seu avatar',
    yourProfile: 'Seu perfil',
    memberSince: 'Membro desde',
    statCompleted: 'Concluídos',
    statIndependence: 'Independência',
    statHints: 'Hints usados',
    preferences: 'Preferências',
    prefsNote:
      'Seus próximos desafios são baseados nessas escolhas. As alterações são salvas automaticamente.',
    trackLabel: 'Trilha',
    trackDesc: 'O tipo de desafio que você recebe.',
    trackPlaceholder: 'Escolher trilha',
    stackLabel: 'Stack',
    stackDesc: 'Linguagem dos desafios de código.',
    stackPlaceholder: 'Escolher stack',
    difficultyLabel: 'Dificuldade',
    difficultyDesc: 'O quão difícil deve ser o próximo.',
    levelPlaceholder: 'Escolher nível',
    appearanceLabel: 'Aparência',
    appearanceDesc: 'Claro, escuro ou seguir o sistema.',
    themeOptions: [
      { value: 'light', label: 'Claro' },
      { value: 'dark', label: 'Escuro' },
      { value: 'system', label: 'Sistema' },
    ],
    languageLabel: 'Idioma',
    languageDesc: 'Idioma da interface.',
    redoSetup: 'Refazer setup',
    signOut: 'Sair',
    loadError: 'Não foi possível carregar seus dados.',
    retry: 'Tentar novamente',
  },
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function ProfileView({ user }: { user: User }) {
  const router = useRouter()
  const t = useT(copy)
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useLocale()
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [loaded, setLoaded] = React.useState(false)
  const [loadError, setLoadError] = React.useState(false)
  const [reloadKey, setReloadKey] = React.useState(0)
  const [track, setTrack] = React.useState('')
  const [stack, setStack] = React.useState('')
  const [level, setLevel] = React.useState('')
  const [saveState, setSaveState] = React.useState<SaveState>('idle')

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
      try {
        const token = await getAccessToken()
        const [p, s] = await Promise.all([
          getProfile(token),
          getDashboardStats(token),
        ])
        if (!active) return
        if (p) setProfile(p)
        else setLoadError(true)
        if (s && !('error' in s)) setStats(s)
        else setLoadError(true)
      } catch {
        if (active) setLoadError(true)
      } finally {
        if (active) setLoaded(true)
      }
    })()
    return () => {
      active = false
    }
  }, [user, reloadKey])

  function retryLoad() {
    setLoaded(false)
    setLoadError(false)
    setReloadKey((k) => k + 1)
  }

  const ready = !!user && loaded
  const avatarUrl = (user?.user_metadata as { avatar_url?: string } | undefined)
    ?.avatar_url

  return (
    <div className='relative flex min-h-screen flex-1 flex-col bg-background'>
      <Navbar />

      <main className='flex-1 pt-[88px] pb-20 md:pt-24'>
        <div className='container-main w-full max-w-3xl'>
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className='relative overflow-hidden rounded-lg bg-pastel-greige px-6 py-10 sm:px-10 sm:py-12'
          >
            <div className='pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-25 mix-blend-multiply dark:mix-blend-screen'>
              <Halftone
                draw={glyph('{ }', 2)}
                ambient
                spacing={7}
                className='absolute inset-0'
              />
            </div>
            <div className='relative flex items-center gap-5 sm:gap-6'>
              {avatarUrl ? (
                <div className='relative size-20 shrink-0 overflow-hidden rounded-full border border-border sm:size-24'>
                  <Image
                    src={avatarUrl}
                    alt={t.avatarAlt}
                    fill
                    className='object-cover'
                  />
                </div>
              ) : (
                <div className='grid size-20 shrink-0 place-items-center rounded-full border border-border bg-background font-heading text-3xl font-light text-ink uppercase sm:size-24 sm:text-4xl'>
                  {(user?.email?.[0] ?? 'u').toUpperCase()}
                </div>
              )}
              <div className='min-w-0'>
                <p className='eyebrow mb-2'>{t.yourProfile}</p>
                <h1 className='type-h3 truncate'>{user?.email ?? '—'}</h1>
                {ready && profile && (
                  <p className='mt-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase'>
                    {t.memberSince}{' '}
                    {new Date(profile.created_at).toLocaleDateString(
                      t.dateLocale,
                    )}
                  </p>
                )}
              </div>
            </div>
          </motion.header>

          {!ready ? (
            <ProfileSkeleton />
          ) : (
            <>
              {loadError ? (
                <section className='mt-12 flex flex-col items-center rounded-lg border border-border bg-card px-6 py-10 text-center'>
                  <p className='text-sm text-muted-foreground'>{t.loadError}</p>
                  <Button
                    variant='outline'
                    className='mt-5'
                    onClick={retryLoad}
                  >
                    {t.retry}
                  </Button>
                </section>
              ) : (
                <section className='mt-12 grid grid-cols-1 gap-y-6 sm:grid-cols-3'>
                  <StatCol
                    value={String(stats?.total_completed ?? 0)}
                    label={t.statCompleted}
                  />
                  <StatCol
                    value={`${stats?.independence_score ?? 100}%`}
                    label={t.statIndependence}
                  />
                  <StatCol
                    value={String(stats?.total_hints ?? 0)}
                    label={t.statHints}
                  />
                </section>
              )}

              <section className='mt-14'>
                <div className='flex items-end justify-between gap-4 border-b border-border pb-4'>
                  <div>
                    <p className='eyebrow'>{t.preferences}</p>
                    <p className='mt-2 max-w-md text-sm text-muted-foreground'>
                      {t.prefsNote}
                    </p>
                  </div>
                  <SaveBadge state={saveState} />
                </div>

                <SettingRow label={t.trackLabel} description={t.trackDesc}>
                  <SelectControl
                    ariaLabel={t.trackLabel}
                    value={track}
                    placeholder={t.trackPlaceholder}
                    options={t.trackOptions}
                    onChange={(v) => {
                      setTrack(v)
                      savePrefs(v, stack, level)
                    }}
                  />
                </SettingRow>

                {track !== 'design' && (
                  <SettingRow label={t.stackLabel} description={t.stackDesc}>
                    <SelectControl
                      ariaLabel={t.stackLabel}
                      value={stack}
                      placeholder={t.stackPlaceholder}
                      options={STACK_OPTIONS}
                      onChange={(v) => {
                        setStack(v)
                        savePrefs(track, v, level)
                      }}
                    />
                  </SettingRow>
                )}

                <SettingRow
                  label={t.difficultyLabel}
                  description={t.difficultyDesc}
                >
                  <SelectControl
                    ariaLabel={t.difficultyLabel}
                    value={level}
                    placeholder={t.levelPlaceholder}
                    options={t.levelOptions}
                    onChange={(v) => {
                      setLevel(v)
                      savePrefs(track, stack, v)
                    }}
                  />
                </SettingRow>

                <SettingRow
                  label={t.appearanceLabel}
                  description={t.appearanceDesc}
                >
                  <Segmented
                    value={theme}
                    options={t.themeOptions}
                    onChange={(v) => setTheme(v as ThemeSetting)}
                  />
                </SettingRow>

                <SettingRow
                  label={t.languageLabel}
                  description={t.languageDesc}
                >
                  <Segmented
                    value={locale}
                    options={LANGUAGE_OPTIONS}
                    onChange={(v) => setLocale(v as Locale)}
                  />
                </SettingRow>
              </section>

              <div className='mt-10 flex flex-col-reverse gap-5 sm:flex-row sm:items-center sm:justify-between'>
                <Link
                  href='/onboarding'
                  className='group/link inline-flex items-center gap-1.5 text-sm font-medium text-ink'
                >
                  <span className='link-underline'>{t.redoSetup}</span>
                  <ArrowRight className='size-3.5 transition-transform group-hover/link:translate-x-0.5' />
                </Link>
                <Button
                  variant='ghost'
                  className='self-start text-destructive hover:text-destructive sm:self-auto'
                  onClick={async () => {
                    await signOut()
                    router.push('/')
                  }}
                >
                  <LogOut className='size-4' /> {t.signOut}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCol({ value, label }: { value: string; label: string }) {
  return (
    <div className='border-border sm:border-l sm:pl-8 sm:first:border-l-0 sm:first:pl-0'>
      <div className='font-heading text-[44px] leading-none font-light tracking-tight text-ink tabular-nums sm:text-[56px]'>
        {value}
      </div>
      <div className='mt-3 font-mono text-[11px] tracking-wider text-muted-foreground uppercase'>
        {label}
      </div>
    </div>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col gap-3 border-b border-border py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8'>
      <div className='min-w-0'>
        <div className='font-medium text-ink'>{label}</div>
        <div className='mt-0.5 text-sm text-muted-foreground'>
          {description}
        </div>
      </div>
      <div className='shrink-0'>{children}</div>
    </div>
  )
}

function SelectControl({
  ariaLabel,
  value,
  placeholder,
  options,
  onChange,
}: {
  ariaLabel: string
  value: string
  placeholder: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <Select
      items={options}
      value={value || null}
      onValueChange={(v) => onChange((v as string | null) ?? '')}
    >
      <SelectTrigger aria-label={ariaLabel} className='w-full sm:w-[200px]'>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className='inline-flex rounded-full border border-border p-0.5'>
      {options.map((o) => (
        <button
          key={o.value}
          type='button'
          onClick={() => onChange(o.value)}
          className={`min-h-10 rounded-full px-3.5 py-2 font-mono text-[11px] tracking-wider uppercase transition-colors ${
            value === o.value
              ? 'bg-ink text-background'
              : 'text-muted-foreground hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div>
      <div className='mt-12 grid grid-cols-1 gap-y-6 sm:grid-cols-3'>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className='border-border sm:border-l sm:pl-8 sm:first:border-l-0 sm:first:pl-0'
          >
            <Skeleton className='h-11 w-16 sm:h-14' />
            <Skeleton className='mt-3 h-3 w-20' />
          </div>
        ))}
      </div>
      <div className='mt-14 border-b border-border pb-4'>
        <Skeleton className='h-3 w-28' />
        <Skeleton className='mt-3 h-3.5 w-64' />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className='flex items-center justify-between border-b border-border py-5'
        >
          <div>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='mt-2 h-3 w-44' />
          </div>
          <Skeleton className='h-9 w-[180px] rounded-full' />
        </div>
      ))}
      <div className='mt-10 flex items-center justify-between'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-9 w-28 rounded-full' />
      </div>
    </div>
  )
}

const badgeCopy = {
  en: {
    saving: 'Saving…',
    saved: 'Saved ✓',
    error: 'Save failed',
  },
  pt: {
    saving: 'Salvando…',
    saved: 'Salvo ✓',
    error: 'Erro ao salvar',
  },
}

function SaveBadge({ state }: { state: SaveState }) {
  const t = useT(badgeCopy)
  if (state === 'idle') return null
  const map = {
    saving: [t.saving, 'text-muted-foreground'],
    saved: [t.saved, 'text-mint'],
    error: [t.error, 'text-destructive'],
  } as const
  const [text, cls] = map[state]
  return <span className={`shrink-0 font-mono text-[11px] ${cls}`}>{text}</span>
}
