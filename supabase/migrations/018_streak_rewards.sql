create table if not exists public.streak_rewards (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  awarded_on  date not null,
  streak_days integer not null,
  hints       integer not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, awarded_on)
);

alter table public.streak_rewards enable row level security;

create policy "Users can view their own streak rewards"
  on public.streak_rewards for select
  using (auth.uid() = user_id);

create or replace function public.award_streak_hints(
  p_user uuid,
  p_streak integer,
  p_hints integer,
  p_awarded_on date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into streak_rewards (user_id, awarded_on, streak_days, hints)
  values (p_user, p_awarded_on, p_streak, greatest(p_hints, 0))
  on conflict (user_id, awarded_on) do nothing;
  if not found then
    return null;
  end if;

  update profiles set bonus_hints = bonus_hints + greatest(p_hints, 0)
  where id = p_user;
  return greatest(p_hints, 0);
end;
$$;

revoke all on function public.award_streak_hints(uuid, integer, integer, date) from public, anon, authenticated;
