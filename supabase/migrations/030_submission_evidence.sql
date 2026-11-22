-- ─── LABS01-219 — points require evidence of work ───────────────────────────
-- Found while re-auditing Day 3, not in the investor's audit. It is finding
-- 3.1 ("farma ranking, liga e streak") surviving one level above the fix:
-- migration 027 revoked the browser's write path to `sessions`, but the
-- CLAIM of completion still came from the client. `completeSession`
-- (src/features/challenges/actions.ts) took `status` from the request body and
-- called award_session_points on 'completed' without checking anything.
--
-- The two tracks were broken differently, and the second one is worse:
--
--   code    — a correctness signal exists (the tests), the client computes it
--             honestly in the normal flow and the server simply never
--             verified it. Scoring without solving meant forging a request.
--   design  — NO correctness signal existed anywhere. submitDesign only
--             refused an empty canvas, so one box scored the whole challenge
--             in the NORMAL flow. Not a bypass: the rule was missing.
--
-- Design is the track that survives (the code track is hidden in LABS01-210
-- and removed in LABS01-215), so after that the ranking would be entirely
-- made of "drew one box" — and LABS01-216 reads that ranking for tier
-- progression.
--
-- Measured on 2026-11-22 before writing this: 297 sessions, 48 scored, 1
-- scored with no submission, 1 whose last submission equals the starter, 2
-- under 20s, all four from the same legitimate user (108 sessions, top of the
-- ranking at 242 points, two of the four with independence 84/88 — hints
-- cost credits, and nobody farming spends them). Zero streak rewards paid.
-- Farming all 91 challenges would be worth 2,120 points against a top of 242,
-- so exploitation would have been impossible to miss. No data to clean.
--
-- NOTE ON SCOPE: this is a FLOOR, not the scoring rule for design. The real
-- correctness signal for design is the rubric of LABS01-211 (Day 11), after
-- which the award should derive from its grade instead of a node count.

begin;

-- ─── 1. the evidence columns ────────────────────────────────────────────────
-- Three columns, and they do not carry the same amount of trust. That
-- difference is the point, so it is written down:
--
--   tests_passed / tests_total  the client already sends these to /api/review
--                               (today only to pick the prompt's tone), so
--                               they are CLIENT-DECLARED. A forged request
--                               still lies — but now it lies together with
--                               the code it claims passed, stored under its
--                               author's name and auditable forever.
--   node_count / edge_count     derived by the SERVER from the scene it
--                               already stores in `code`
--                               (design-review/route.ts), so they are
--                               VERIFIED. The surviving track is the one with
--                               the trustworthy evidence.
alter table public.code_submissions
  add column if not exists tests_passed integer,
  add column if not exists tests_total  integer,
  add column if not exists node_count   integer,
  add column if not exists edge_count   integer;

-- The award reads the submissions of one session, newest first.
create index if not exists code_submissions_session_idx
  on public.code_submissions (session_id, submitted_at desc);

-- ─── 2. the award requires evidence, per track ──────────────────────────────
-- Same signature and same contract as 021/027: NULL means "could not award",
-- 0 means "nothing to award" and a positive number is what was credited.
-- The evidence check comes FIRST, before the row is claimed with points = 0:
-- claiming it and then returning NULL would mark the session as scored and
-- deny a later, legitimate retry forever.
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
declare
  v_kind    text;
  v_tests   text;
  v_initial text;
  v_ok      boolean := false;
begin
  select c.kind, c.tests_source, c.initial_code
    into v_kind, v_tests, v_initial
  from challenges c
  where c.id = p_challenge;
  if not found then
    return null;
  end if;

  -- LABS01-219: evidence of work, by track. Measured coverage of the library
  -- on 2026-11-22: 45 code challenges with tests, 34 design, 12 code without
  -- tests (5 react, which the generator forces to have no tests, plus 7 with
  -- an empty tests_source).
  if v_kind = 'design' then
    -- A graph the server parsed itself. Three nodes and one edge is a floor,
    -- not a grade: the two real scored submissions that stored a scene have
    -- 19 nodes/19 edges and 5/4, so this refuses nothing legitimate.
    select exists (
      select 1 from code_submissions s
      where s.session_id = p_session
        and s.user_id = p_user
        and coalesce(s.node_count, 0) >= 3
        and coalesce(s.edge_count, 0) >= 1
    ) into v_ok;
  elsif coalesce(btrim(v_tests), '') <> '' then
    select exists (
      select 1 from code_submissions s
      where s.session_id = p_session
        and s.user_id = p_user
        and coalesce(s.tests_total, 0) > 0
        and s.tests_passed = s.tests_total
    ) into v_ok;
  else
    -- No tests to pass: the floor is that the student changed the starter.
    -- The client already refuses to submit an untouched editor; now the
    -- server does too.
    select exists (
      select 1 from code_submissions s
      where s.session_id = p_session
        and s.user_id = p_user
        and btrim(coalesce(s.code, '')) <> ''
        and btrim(coalesce(s.code, '')) <> btrim(coalesce(v_initial, ''))
    ) into v_ok;
  end if;

  if not v_ok then
    return null;
  end if;

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

-- ─── 3. read-only: would the new rule have refused anything already paid? ───
-- The rule applies going forward and the history is not re-judged (the
-- measurement found nothing worth cleaning). This block only reports how many
-- of the sessions already scored would fail the new gate, which is the honest
-- way to see how tight it is. Historical design submissions are expected to
-- fail it: `scene` is a recent field, so 10 of the 12 scored design sessions
-- stored the text summary and have no graph to count.
do $$
declare
  v_scored  integer;
  v_cols    integer;
  v_nogate  integer;
begin
  select count(*) into v_scored from public.sessions where points > 0;

  select count(*) into v_cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'code_submissions'
    and column_name in ('tests_passed', 'tests_total', 'node_count', 'edge_count');

  select count(*) into v_nogate
  from public.sessions s
  where s.points > 0
    and not exists (
      select 1 from public.code_submissions c where c.session_id = s.id
    );

  raise notice 'evidence columns (expected 4): %', v_cols;
  raise notice 'sessions already scored: %', v_scored;
  raise notice 'of those, with no submission at all: %', v_nogate;

  if v_cols <> 4 then
    raise exception 'the evidence columns were not created';
  end if;
end;
$$;

commit;
