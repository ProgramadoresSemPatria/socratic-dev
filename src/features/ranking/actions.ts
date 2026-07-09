'use server'

import { seasonEndsAt, seasonKey } from '@/domain/season'
import { authActionUser } from '@/lib/api/guard'
import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath, unstable_cache, updateTag } from 'next/cache'

export type RankingEntry = {
  position: number
  name: string
  points: number
  isMe: boolean
}

export type RankingData = {
  entries: RankingEntry[]
  me: { position: number; points: number; hasName: boolean }
}

const TOP_LIMIT = 50

const getTopProfiles = unstable_cache(
  async () => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, email, total_points')
      .order('total_points', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(TOP_LIMIT)
    if (error) throw new Error(error.message)
    return data
  },
  ['ranking-top'],
  { revalidate: 60, tags: ['ranking'] },
)

function publicName(
  displayName: string | null,
  email: string | null,
): string {
  if (displayName?.trim()) return displayName.trim()
  const local = (email ?? '').split('@')[0]
  if (!local) return 'anon'
  return local.length <= 3 ? `${local}***` : `${local.slice(0, 3)}***`
}

export async function getRanking(
  token: string,
): Promise<RankingData | { error: string }> {
  const a = await authActionUser(token)
  if ('error' in a) return { error: 'Não autenticado.' }

  let rows: {
    id: string
    display_name: string | null
    email: string | null
    total_points: number
  }[]
  let me: { display_name: string | null; total_points: number } | null
  try {
    const [top, meR] = await Promise.all([
      getTopProfiles(),
      supabaseAdmin
        .from('profiles')
        .select('display_name, total_points')
        .eq('id', a.userId)
        .maybeSingle(),
    ])
    rows = (top ?? []) as unknown as typeof rows
    me = meR.data as unknown as typeof me
  } catch {
    return { error: 'Não foi possível carregar o ranking.' }
  }
  const myPoints = me?.total_points ?? 0

  const { count } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gt('total_points', myPoints)
  const myPosition = (count ?? 0) + 1

  return {
    entries: rows.map((r, i) => ({
      position: i + 1,
      name: publicName(r.display_name, r.email),
      points: r.total_points,
      isMe: r.id === a.userId,
    })),
    me: {
      position: myPosition,
      points: myPoints,
      hasName: !!me?.display_name?.trim(),
    },
  }
}

export async function getMyRank(
  token: string,
): Promise<{ position: number; points: number } | null> {
  const a = await authActionUser(token)
  if ('error' in a) return null
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('total_points')
    .eq('id', a.userId)
    .maybeSingle()
  const points =
    (data as unknown as { total_points: number } | null)?.total_points ?? 0
  const { count } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gt('total_points', points)
  return { position: (count ?? 0) + 1, points }
}

export type LeagueEntry = {
  position: number
  name: string
  points: number
  isMe: boolean
}

export type LeagueData = {
  season: string
  endsAt: string
  entries: LeagueEntry[]
} | null

// The user's 25-person cohort for the current 4-week season. Null until they
// score their first completion of the season (joined lazily on completion).
export async function getMyLeague(token: string): Promise<LeagueData> {
  const a = await authActionUser(token)
  if ('error' in a) return null

  const season = seasonKey()
  const { data: mine } = await supabaseAdmin
    .from('league_members')
    .select('cohort')
    .eq('season', season)
    .eq('user_id', a.userId)
    .maybeSingle()
  const cohort = (mine as { cohort: number } | null)?.cohort
  if (cohort === undefined) return null

  const { data: members } = await supabaseAdmin
    .from('league_members')
    .select('user_id, points')
    .eq('season', season)
    .eq('cohort', cohort)
    .order('points', { ascending: false })
    .order('joined_at', { ascending: true })
    .limit(25)
  const rows = (members ?? []) as unknown as {
    user_id: string
    points: number
  }[]

  const { data: profs } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, email')
    .in(
      'id',
      rows.map((r) => r.user_id),
    )
  const byId = new Map(
    ((profs ?? []) as unknown as {
      id: string
      display_name: string | null
      email: string | null
    }[]).map((p) => [p.id, p]),
  )

  return {
    season,
    endsAt: seasonEndsAt().toISOString(),
    entries: rows.map((r, i) => {
      const p = byId.get(r.user_id)
      return {
        position: i + 1,
        name: publicName(p?.display_name ?? null, p?.email ?? null),
        points: r.points,
        isMe: r.user_id === a.userId,
      }
    }),
  }
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
