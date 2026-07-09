-- ─── Topic tags + cached editorial ──────────────────────────────────────────
-- topics: generated with the challenge, used for library filtering.
-- editorial: "what this challenge teaches", generated once on first request
-- after completion and served from the row for everyone else.

alter table public.challenges
  add column if not exists topics text[] not null default '{}',
  add column if not exists editorial text;

-- ─── Seasonal leagues ────────────────────────────────────────────────────────
-- Small cohorts (25 people) per 4-week season: competing against 25 is
-- motivating, competing against everyone is invisible. Users join on their
-- first scoring completion of the season; season points accumulate separately
-- from lifetime total_points.

create table if not exists public.league_members (
  season     text not null,
  cohort     integer not null,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  points     integer not null default 0,
  joined_at  timestamptz not null default now(),
  primary key (season, user_id)
);

create index if not exists league_members_cohort_idx
  on public.league_members (season, cohort, points desc);

alter table public.league_members enable row level security;
-- No client policies: reads/writes go through service-role actions.

-- Assign the user to the first cohort with room (or open a new one). The
-- advisory lock serializes concurrent joins so cohorts never overfill.
create or replace function public.join_league(p_user uuid, p_season text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cohort integer;
begin
  select cohort into v_cohort
  from league_members
  where season = p_season and user_id = p_user;
  if found then
    return v_cohort;
  end if;

  perform pg_advisory_xact_lock(hashtext('league:' || p_season));

  select cohort into v_cohort
  from league_members
  where season = p_season
  group by cohort
  having count(*) < 25
  order by cohort
  limit 1;

  if v_cohort is null then
    select coalesce(max(cohort), 0) + 1 into v_cohort
    from league_members
    where season = p_season;
  end if;

  insert into league_members (season, cohort, user_id)
  values (p_user, p_season, v_cohort)
  on conflict (season, user_id) do nothing;

  select cohort into v_cohort
  from league_members
  where season = p_season and user_id = p_user;
  return v_cohort;
end;
$$;

create or replace function public.add_league_points(
  p_user uuid,
  p_season text,
  p_amount integer
)
returns void
language sql
security definer
set search_path = public
as $$
  update league_members
     set points = points + greatest(p_amount, 0)
   where season = p_season and user_id = p_user;
$$;

revoke all on function public.join_league(uuid, text) from public, anon, authenticated;
revoke all on function public.add_league_points(uuid, text, integer) from public, anon, authenticated;
