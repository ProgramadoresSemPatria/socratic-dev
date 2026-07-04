-- ─── Ranking / points system ────────────────────────────────────────────────
-- Each completed challenge awards points (level base × independence). Points
-- accumulate on the profile; the leaderboard ranks by total_points.

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists total_points integer not null default 0;

-- Points awarded by that specific session (audit trail + dedup source).
alter table public.sessions
  add column if not exists points smallint;

-- ─── Atomic points increment (same pattern as bonus hints, migration 010) ───
create or replace function public.add_points(p_user uuid, p_amount integer)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set total_points = total_points + greatest(p_amount, 0)
   where id = p_user
  returning total_points;
$$;

-- Only service-role API routes may call it.
revoke all on function public.add_points(uuid, integer) from public, anon, authenticated;

-- ─── Copy the OAuth name into display_name on signup ────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'user_name',
      ''
    )), '')
  );
  return new;
end;
$$;

-- Backfill display_name for existing users from their auth metadata.
update public.profiles p
set display_name = nullif(trim(coalesce(
  u.raw_user_meta_data->>'name',
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'user_name',
  ''
)), '')
from auth.users u
where u.id = p.id
  and p.display_name is null;

-- ─── Backfill points for sessions completed before this migration ───────────
-- One earning session per (user, challenge): the most recent completed one.
-- Points = level base (10/25/50) × independence% (unknown independence = 100).
with earn as (
  select distinct on (s.user_id, s.challenge_id)
    s.id,
    round(
      (case c.level
        when 'beginner' then 10
        when 'intermediate' then 25
        else 50
      end) * coalesce(s.independence, 100) / 100.0
    )::smallint as pts
  from public.sessions s
  join public.challenges c on c.id = s.challenge_id
  where s.status = 'completed'
  order by s.user_id, s.challenge_id, s.started_at desc
)
update public.sessions s
set points = e.pts
from earn e
where s.id = e.id
  and s.points is null;

update public.profiles p
set total_points = coalesce((
  select sum(s.points)
  from public.sessions s
  where s.user_id = p.id and s.points is not null
), 0);

create index if not exists profiles_total_points_idx
  on public.profiles (total_points desc);
