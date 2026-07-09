import { leagueForUser, rankingForUser } from '@/features/ranking/queries'
import { getServerUser } from '@/lib/supabase/server-client'
import { redirect } from 'next/navigation'
import { RankingView } from './ranking-view'

// Server Component: the user comes from the session cookie and the board
// arrives already rendered in the HTML — no auth→fetch waterfall.
export default async function RankingPage() {
  const user = await getServerUser()
  if (!user) redirect('/login?next=/ranking')

  const [data, league] = await Promise.all([
    rankingForUser(user.id),
    leagueForUser(user.id).catch(() => null),
  ])

  return <RankingView data={data} league={league} />
}
