'use client'

import { Logo } from '@/components/logo'
import { signUp } from '@/features/auth/actions'
import { supabase } from '@/lib/supabase/client'
import { ArrowRight, Loader2 } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className='grid min-h-screen place-items-center bg-white'>
          <Loader2 className='size-5 animate-spin text-[#6b6478]' />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const explicitNext = params.get('next')

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (mode === 'signup') {
        const result = await signUp({ email, password })
        if ('error' in result) throw new Error(result.error)
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      // Honor an explicit ?next (came from a gated page). Otherwise route by
      // state: already onboarded → dashboard (no surprise challenge); not yet
      // → onboarding to pick prefs + the first challenge.
      const onboarded = !!(
        data.user?.user_metadata as { preferred_level?: string } | undefined
      )?.preferred_level
      router.replace(explicitNext || (onboarded ? '/dashboard' : '/onboarding'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='relative flex min-h-screen flex-1 flex-col bg-white'>
      <header className='flex h-16 shrink-0 items-center px-6 sm:px-10'>
        <Logo />
      </header>

      <main className='flex flex-1 items-center justify-center px-4 pb-16'>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className='w-full max-w-[400px]'
        >
          <h1 className='type-h3 mb-2'>
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </h1>
          <p className='type-body mb-8 text-[#6b6478]'>
            {mode === 'login'
              ? 'Acesse para começar um desafio e acompanhar seu progresso.'
              : 'Leva 30 segundos. Sem cartão.'}
          </p>

          <form onSubmit={submit} className='flex flex-col gap-3'>
            <input
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='seu@email.com'
              className='rounded-xl border border-[#DFE5E9] bg-white px-4 py-3 text-[#1b1916] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
            />
            <input
              type='password'
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='senha (mín. 6 caracteres)'
              className='rounded-xl border border-[#DFE5E9] bg-white px-4 py-3 text-[#1b1916] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
            />

            {error && <p className='text-sm text-[#c0392b]'>{error}</p>}
            {notice && <p className='text-sm text-[#6b6478]'>{notice}</p>}

            <button
              type='submit'
              disabled={busy}
              className='group mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-medium tracking-tight text-primary-foreground transition-colors duration-300 hover:bg-primary/90 disabled:opacity-50'
            >
              {busy ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                <>
                  {mode === 'login' ? 'Entrar' : 'Criar conta'}
                  <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
                </>
              )}
            </button>
          </form>

          <button
            type='button'
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError(null)
              setNotice(null)
            }}
            className='mt-5 text-sm text-[#6b6478] transition-colors hover:text-[#1b1916]'
          >
            {mode === 'login'
              ? 'Não tem conta? Criar uma'
              : 'Já tem conta? Entrar'}
          </button>

          <div className='mt-8'>
            <Link
              href='/'
              className='text-sm text-[#6b6478] transition-colors hover:text-[#1b1916]'
            >
              ← Voltar ao site
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
