'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Profile = {
  id: string
  email: string | null
  preferred_stack: string | null
  preferred_level: string | null
  total_challenges_completed: number
  total_hints_used: number
  created_at: string
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data as Profile
}

export async function updateProfile(input: {
  userId: string
  preferred_stack?: string
  preferred_level?: string
}): Promise<Profile | { error: string }> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      preferred_stack: input.preferred_stack,
      preferred_level: input.preferred_level,
    })
    .eq('id', input.userId)
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/profile')
  return data as Profile
}
