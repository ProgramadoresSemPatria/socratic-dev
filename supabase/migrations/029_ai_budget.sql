-- ─── LABS01-203 — spend caps for the AI calls ───────────────────────────────
-- Closes the second half of audit finding 3.5 (ANALYSIS-2026-11-09): "no
-- per-user AI spend cap: the `ai_usage` ledger records but nothing enforces".
--
-- The ledger (026) is a ledger. Measured on 2026-11-19 it held 81 rows and
-- US$ 0.79 of spend since 2026-08-29, and nothing in the codebase read it:
-- `ai_usage` appeared in exactly one place outside the generated types, the
-- insert in src/lib/ai/usage.ts. So no number anywhere could answer "has this
-- user already spent too much this month?".
--
-- WHY NOT JUST AGGREGATE `ai_usage` AT REQUEST TIME, which is what the audit
-- suggests. Two reasons in the current code:
--
--   (a) The ledger row is written AFTER the response completes, and without
--       being awaited (`void stream.finalMessage().then(...)` in client.ts).
--       N calls fired together all read the same pre-burst total and all pass.
--       A cap that a Promise.all walks through is not a cap.
--   (b) The insert sits in a try/catch that swallows errors on purpose, so a
--       failed write makes that spend invisible forever — and a cap reading
--       the ledger would then allow more.
--
-- So the cap is a reservation counter, in the exact shape that already works
-- in this project for requests (check_rate_limit, migration 014): one counter
-- row, insert ... on conflict do update, returning — a single atomic round
-- trip. The caller reserves a pessimistic estimate BEFORE the call and
-- reconciles against the real token count when it lands. `ai_usage` stays
-- untouched as the audit trail and the source of real cost.

begin;

-- ─── 1. the counters ────────────────────────────────────────────────────────
-- One row per bucket. A bucket is a scope plus a period:
--   user:<uuid>:2026-11      per-user month  (the cap the audit asks for)
--   user:<uuid>:2026-11-20   per-user day    (the brake on speed)
--   global:2026-11           whole product   (insurance against a new bug)
-- Amounts are micro-dollars (1 USD = 1e6) so the counter stays integer.
create table if not exists public.ai_budget (
  bucket       text primary key,
  micros       bigint not null default 0,
  window_start timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.ai_budget enable row level security;
-- No policies: only the service role touches this. A client has no reason to
-- read the budget, and exposing it would leak our unit economics (same
-- reasoning as ai_usage in 026).
revoke all on table public.ai_budget from anon, authenticated;

-- Buckets are never deleted by the application; a monthly prune job can use
-- this. ~30 day-buckets per active user per month is the growth rate.
create index if not exists ai_budget_updated_idx
  on public.ai_budget (updated_at);

-- ─── 2. reserve, atomically, across every bucket at once ────────────────────
-- Returns NULL when the call is allowed. Returns the name of the first bucket
-- that would be exceeded otherwise — and in that case gives every reservation
-- back, because the call will not happen. One round trip for all buckets, and
-- the whole function body is one transaction.
create or replace function public.check_ai_budget(
  p_buckets text[],
  p_limits  bigint[],
  p_micros  bigint
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  i       integer;
  n       integer;
  v_total bigint;
  v_cost  bigint := greatest(0, coalesce(p_micros, 0));
  v_over  text := null;
begin
  n := coalesce(array_length(p_buckets, 1), 0);
  if n = 0 then
    return null;
  end if;
  if n is distinct from coalesce(array_length(p_limits, 1), 0) then
    raise exception 'check_ai_budget: % buckets but % limits',
      n, coalesce(array_length(p_limits, 1), 0);
  end if;

  for i in 1..n loop
    insert into public.ai_budget as b (bucket, micros)
    values (p_buckets[i], v_cost)
    on conflict (bucket) do update
      set micros = b.micros + v_cost,
          updated_at = now()
    returning b.micros into v_total;

    if v_total > p_limits[i] and v_over is null then
      v_over := p_buckets[i];
    end if;
  end loop;

  if v_over is not null then
    for i in 1..n loop
      update public.ai_budget
         set micros = greatest(0, micros - v_cost),
             updated_at = now()
       where bucket = p_buckets[i];
    end loop;
  end if;

  return v_over;
end;
$$;

-- ─── 3. reconcile the estimate against the real cost ────────────────────────
-- p_delta is signed: positive gives micros back (the estimate was pessimistic,
-- which is the normal case), negative charges the difference (the call cost
-- more than reserved).
create or replace function public.settle_ai_budget(
  p_buckets text[],
  p_delta   bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  i integer;
  n integer;
begin
  n := coalesce(array_length(p_buckets, 1), 0);
  if n = 0 or coalesce(p_delta, 0) = 0 then
    return;
  end if;
  for i in 1..n loop
    update public.ai_budget
       set micros = greatest(0, micros - p_delta),
           updated_at = now()
     where bucket = p_buckets[i];
  end loop;
end;
$$;

revoke all on function public.check_ai_budget(text[], bigint[], bigint)
  from public, anon, authenticated;
revoke all on function public.settle_ai_budget(text[], bigint)
  from public, anon, authenticated;

-- ─── 4. read-only check ─────────────────────────────────────────────────────
do $$
declare
  v_funcs  integer;
  v_rows   integer;
  v_ledger integer;
begin
  select count(*) into v_funcs
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('check_ai_budget', 'settle_ai_budget');

  select count(*) into v_rows from public.ai_budget;
  select count(*) into v_ledger from public.ai_usage;

  raise notice 'budget functions (expected 2): %', v_funcs;
  raise notice 'budget buckets (expected 0 on a fresh install): %', v_rows;
  raise notice 'ai_usage rows the caps will be measured against: %', v_ledger;

  if v_funcs <> 2 then
    raise exception 'check_ai_budget / settle_ai_budget were not created';
  end if;
end;
$$;

commit;
