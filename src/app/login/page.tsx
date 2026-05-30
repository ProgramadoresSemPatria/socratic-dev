'use client'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
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
  const [loadingOAuth, setLoadingOAuth] = useState(false)

  async function submit(e: React.SubmitEvent) {
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

  async function signInWithGithub() {
    setLoadingOAuth(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
      })
      if (error) throw error
      router.replace(explicitNext || '/onboarding')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Falha na autenticação GitHub OAuth',
      )
      setLoadingOAuth(false)
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

          <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-3'>
              <Button
                onClick={signInWithGithub}
                variant='outline'
                size='lg'
                loading={loadingOAuth}
                className='rounded-xl [&_svg]:size-5!'
              >
                {!loadingOAuth && (
                  <svg
                    className='fill-foreground'
                    width='24'
                    height='24'
                    viewBox='0 0 1024 1024'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      fillRule='evenodd'
                      clipRule='evenodd'
                      d='M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z'
                      transform='scale(64)'
                    ></path>
                  </svg>
                )}
                Entrar com GitHub
              </Button>
              {error && <p className='text-sm text-[#c0392b]'>{error}</p>}
            </div>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <div className='h-px flex-1 bg-input' />
              <span>ou</span>
              <div className='h-px flex-1 bg-input' />
            </div>

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
                className='group mt-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-medium tracking-tight text-primary-foreground transition-colors duration-300 hover:bg-primary/90 disabled:opacity-50'
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
          </div>

          <button
            type='button'
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError(null)
              setNotice(null)
            }}
            className='mt-5 cursor-pointer text-sm text-[#6b6478] transition-colors hover:text-[#1b1916]'
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
