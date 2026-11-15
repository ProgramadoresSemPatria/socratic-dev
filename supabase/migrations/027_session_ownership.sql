-- ─── LABS01-200 + LABS01-201 — session ownership ────────────────────────────
-- Closes audit findings 3.1, 3.2 and 3.4 (ANALYSIS-2026-11-09).
--
-- 3.1  `sessions` carried `for all using (auth.uid() = user_id)`. With only a
--      USING clause, Postgres reuses it as the WITH CHECK clause, so a
--      logged-in user could INSERT already-completed sessions and UPDATE
--      `points`, `independence` and `status` on their own rows straight from
--      the browser with the anon key — farming the ranking, the league and
--      the streak.
-- 3.2  /api/review and /api/design-review insert into `code_submissions` with
--      whatever `session_id` the request body carries. /replay/[id] renders
--      the most recent submission for a session, so anyone holding a shared
--      replay link could overwrite what that public page shows.
-- 3.4  `consume_hints` never checked that `p_session` belongs to `p_user`, so
--      hint and solve rows could be charged against someone else's session.
--      Worse, `award_session_points` (migration 021) blocks the award when an
--      earlier solve exists on the challenge, filtering on the SESSION owner
--      but never on the hint row's own `user_id`. Together: spend 5 of your
--      own credits as a solve on a victim's session — session ids leak
--      through public replay links — and the victim's award for that
--      challenge is permanently zeroed.
--
-- Every write to these three tables already goes through the service role
-- (src/lib/supabase/server.ts); the browser client only reads `challenges`.
-- The client therefore needs no write path here at all, and taking it away
-- breaks nothing in the app.

begin;

-- ─── 1. sessions: client reads, server writes (LABS01-200) ──────────────────
drop policy if exists "Users can manage their own sessions" on public.sessions;

drop policy if exists "Users can view their own sessions" on public.sessions;
create policy "Users can view their own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.sessions from anon, authenticated;

-- ─── 2. code_submissions: client reads, server writes (LABS01-201) ──────────
drop policy if exists "Users can manage their own submissions"
  on public.code_submissions;

drop policy if exists "Users can view their own submissions"
  on public.code_submissions;
create policy "Users can view their own submissions"
  on public.code_submissions for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.code_submissions from anon, authenticated;

-- ─── 3. hints_used: client reads, server writes (LABS01-201) ────────────────
-- Credits are granted by consume_hints (security definer, migration 015), so
-- the direct insert policy only ever let a user write rows the accounting
-- never asked for.
drop policy if exists "Users can insert their own hints" on public.hints_used;

revoke insert, update, delete on public.hints_used from anon, authenticated;

-- ─── 4. The ownership invariant, enforced in the database (LABS01-201) ──────
-- RLS does not constrain the service role, and the API routes take
-- `session_id` from the request body. A trigger closes finding 3.2 for every
-- caller — including a route added later that forgets the check.
create or replace function public.assert_session_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.sessions s
    where s.id = new.session_id
      and s.user_id = new.user_id
  ) then
    raise exception 'session % does not belong to user %',
      new.session_id, new.user_id
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists code_submissions_session_owner on public.code_submissions;
create trigger code_submissions_session_owner
  before insert or update of session_id, user_id on public.code_submissions
  for each row execute function public.assert_session_owner();

drop trigger if exists hints_used_session_owner on public.hints_used;
create trigger hints_used_session_owner
  before insert or update of session_id, user_id on public.hints_used
  for each row execute function public.assert_session_owner();

-- ─── 5. consume_hints checks the owner too (LABS01-201 / finding 3.4) ───────
-- Same signature and same contract as migration 015: NULL means "could not
-- charge", which the callers already translate into 429. Checking here (and
-- not only in the trigger) keeps a forged session_id from spending the
-- attacker's own credits before the insert aborts the transaction.
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
  -- LABS01-201: charge only against a session the caller owns.
  if not exists (
    select 1 from sessions
    where id = p_session and user_id = p_user
  ) then
    return null;
  end if;

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

revoke all on function public.consume_hints(
  uuid, uuid, integer, integer, boolean, integer, timestamptz
) from public, anon, authenticated;

revoke all on function public.assert_session_owner() from public, anon, authenticated;

-- ─── 5b. award_session_points counts only the owner's solves (finding 3.4) ──
-- Migration 021 blocks the award when an earlier solve exists on the same
-- challenge, but it joined `hints_used` to the session and filtered on
-- `s.user_id` only — never on `h.user_id`. Combined with the hole above, an
-- attacker could spend 5 of their own credits as a solve against a victim's
-- session (session ids leak through replay links) and permanently zero the
-- victim's award for that challenge. Same body as 021 plus `h.user_id`.
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
      and points is not null
      and id <> p_session
  ) then
    return 0;
  end if;

  if exists (
    select 1
    from hints_used h
    join sessions s on s.id = h.session_id
    where s.user_id = p_user
      and h.user_id = p_user          -- LABS01-201: not someone else's solve
      and s.challenge_id = p_challenge
      and h.is_solve
      and h.session_id <> p_session
  ) then
    return 0;
  end if;

  update sessions set points = greatest(p_points, 0) where id = p_session;
  update profiles set total_points = total_points + greatest(p_points, 0)
  where id = p_user;
  return greatest(p_points, 0);
end;
$$;

revoke all on function public.award_session_points(uuid, uuid, uuid, integer)
  from public, anon, authenticated;

-- ─── 6. Report rows that already violate the invariant ──────────────────────
-- Read-only: the trigger only guards new writes, so anything already in the
-- table stays. These counts tell us whether the holes were ever exploited.
do $$
declare
  v_subs  integer;
  v_hints integer;
  v_dup   integer;
  v_zero  integer;
begin
  select count(*) into v_subs
  from public.code_submissions c
  join public.sessions s on s.id = c.session_id
  where s.user_id <> c.user_id;

  select count(*) into v_hints
  from public.hints_used h
  join public.sessions s on s.id = h.session_id
  where s.user_id <> h.user_id;

  -- 3.1: more than one scoring session for the same (user, challenge) means
  -- points were awarded twice for one challenge.
  select count(*) into v_dup
  from (
    select user_id, challenge_id
    from public.sessions
    where points > 0
    group by user_id, challenge_id
    having count(*) > 1
  ) d;

  -- 3.4: an award zeroed because somebody else's solve landed on one of the
  -- owner's sessions for that challenge.
  select count(*) into v_zero
  from public.sessions s
  where s.points = 0
    and exists (
      select 1
      from public.hints_used h
      join public.sessions hs on hs.id = h.session_id
      where hs.user_id = s.user_id
        and hs.challenge_id = s.challenge_id
        and h.is_solve
        and h.user_id <> s.user_id
    );

  raise notice 'cross-user code_submissions: %', v_subs;
  raise notice 'cross-user hints_used: %', v_hints;
  raise notice 'challenges scored more than once: %', v_dup;
  raise notice 'awards zeroed by a foreign solve: %', v_zero;
end;
$$;

commit;
