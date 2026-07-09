'use server'

import { authActionUser } from '@/lib/api/guard'
import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath, updateTag } from 'next/cache'
import {
  leagueForUser,
  rankForUser,
  rankingForUser,
  type LeagueData,
  type RankingData,
} from './queries'

export type { LeagueData, LeagueEntry, RankingData, RankingEntry } from './queries'

export async function getRanking(
  token: string,
): Promise<RankingData | { error: string }> {
  const a = await authActionUser(token)
  if ('error' in a) return { error: 'Não autenticado.' }
  return rankingForUser(a.userId)
}

// Lightweight version for the navbar chip.
export async function getMyRank(
  token: string,
): Promise<{ position: number; points: number } | null> {
  const a = await authActionUser(token)
  if ('error' in a) return null
  return rankForUser(a.userId)
}

export async function getMyLeague(token: string): Promise<LeagueData> {
  const a = await authActionUser(token)
  if ('error' in a) return null
  return leagueForUser(a.userId)
}

export async function setDisplayName(args: {
  token: string
  name: string
}): Promise<{ ok: true } | { error: string }> {
  const a = await authActionUser(args.token)
  if ('error' in a) return { error: 'Não autenticado.' }
  const name = args.name.trim().slice(0, 40)
  if (name.length < 2) return { error: 'Nome muito curto.' }
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ display_name: name })
    .eq('id', a.userId)
  if (error) return { error: 'Não foi possível salvar o nome.' }
  updateTag('ranking')
  revalidatePath('/ranking')
  return { ok: true }
}
