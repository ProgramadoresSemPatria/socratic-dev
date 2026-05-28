-- ─── Hint credits move to a server-controlled column ────────────────────────
-- bonus_hints used to live in auth user_metadata, which the user can write
-- directly via supabase.auth.updateUser({data}) → they could grant themselves
-- unlimited hints. Move it to profiles and lock down writes.

alter table public.profiles
  add column if not exists bonus_hints integer not null default 0;

-- The broad "update your own profile" policy let a logged-in user write ANY
-- column (incl. bonus_hints) through the anon client. Profile writes now go
-- exclusively through service-role API routes, so drop the user-update policy.
drop policy if exists "Users can update their own profile" on public.profiles;

-- ─── Atomic credit operations (avoid read-modify-write races) ────────────────

-- Spend `p_amount` bonus credits only if the balance is sufficient.
-- Returns the new balance, or NULL when there aren't enough credits.
create or replace function public.consume_bonus_hints(p_user uuid, p_amount integer)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set bonus_hints = bonus_hints - p_amount
   where id = p_user
     and bonus_hints >= p_amount
  returning bonus_hints;
$$;

-- Grant a pack of bonus credits atomically. Returns the new balance.
create or replace function public.add_bonus_hints(p_user uuid, p_amount integer)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set bonus_hints = bonus_hints + p_amount
   where id = p_user
  returning bonus_hints;
$$;

-- Only the service role should call these (API routes); revoke from clients.
revoke all on function public.consume_bonus_hints(uuid, integer) from public, anon, authenticated;
revoke all on function public.add_bonus_hints(uuid, integer) from public, anon, authenticated;
