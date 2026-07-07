create or replace function public.consume_hints(
  p_user uuid,
  p_session uuid,
  p_level integer,
  p_cost integer,
  p_is_solve boolean,
  p_free_limit integer,
  p_week_start timestamptz
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bonus integer;
  v_used integer;
  v_free_remaining integer;
  v_from_bonus integer;
begin
  select bonus_hints into v_bonus
  from profiles
  where id = p_user
  for update;
  if not found then
    return null;
  end if;

  select count(*) into v_used
  from hints_used
  where user_id = p_user and used_at >= p_week_start;

  v_free_remaining := greatest(0, p_free_limit - v_used);
  if v_free_remaining + v_bonus < p_cost then
    return null;
  end if;

  v_from_bonus := greatest(0, p_cost - v_free_remaining);
  if v_from_bonus > 0 then
    update profiles set bonus_hints = bonus_hints - v_from_bonus
    where id = p_user;
  end if;

  insert into hints_used (session_id, user_id, hint_level, is_solve)
  select p_session, p_user, p_level, p_is_solve
  from generate_series(1, p_cost);

  return v_free_remaining + v_bonus - p_cost;
end;
$$;

revoke all on function public.consume_hints(uuid, uuid, integer, integer, boolean, integer, timestamptz) from public, anon, authenticated;

create or replace function public.award_session_points(
  p_user uuid,
  p_session uuid,
  p_challenge uuid,
  p_points integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1 from profiles where id = p_user for update;

  update sessions
     set points = 0
   where id = p_session and user_id = p_user and points is null;
  if not found then
    return null;
  end if;

  if exists (
    select 1 from sessions
    where user_id = p_user
      and challenge_id = p_challenge
      and points > 0
      and id <> p_session
  ) then
    return 0;
  end if;

  update sessions set points = greatest(p_points, 0) where id = p_session;
  update profiles set total_points = total_points + greatest(p_points, 0)
  where id = p_user;
  return greatest(p_points, 0);
end;
$$;

revoke all on function public.award_session_points(uuid, uuid, uuid, integer) from public, anon, authenticated;

create index if not exists challenges_kind_level_stack_idx
  on public.challenges (kind, level, stack);
