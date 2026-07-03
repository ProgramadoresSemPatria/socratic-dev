'use client'

import { Spinner } from '@/components/ui/spinner'
import { useUser } from '@/features/auth/hooks/use-user'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import * as React from 'react'

type Props = {
  next: string
  fallback?: React.ReactNode
  children: (user: User) => React.ReactNode
}

const defaultFallback = (
  <div className='grid min-h-dvh place-items-center bg-background'>
    <Spinner className='size-6 text-muted-foreground' />
  </div>
)

export function RequireAuth({ next, fallback, children }: Props) {
  const router = useRouter()
  const { user, loading } = useUser()

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(next)}`)
    }
  }, [loading, user, next, router])

  if (loading) return <>{fallback ?? defaultFallback}</>
  if (!user) return <>{fallback ?? defaultFallback}</>
  return <>{children(user)}</>
}
