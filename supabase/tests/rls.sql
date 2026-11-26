-- LABS01-204 — what the browser can and cannot do, against a real Postgres.
--
-- Audit finding 3.6: nothing tests RLS. The route tests
-- (src/app/api/*/route.test.ts) cover the application's own guards against an
-- in-memory stand-in, which is the right tool for "did the route answer 403" —
-- and the wrong tool for "would Postgres have stopped it anyway". Grants,
-- policies, triggers and security-definer functions only exist in a database,
-- so they are checked here, after `supabase db reset` has replayed all 30
-- migrations into an empty one.
--
-- Run:
--   supabase start
--   supabase db reset
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
--
-- Style: plain assertions that `raise exception` on failure, the same idiom
-- the migrations themselves use (028, 029, 030) — no pgTAP, so there is no
-- test framework to install, no temp tables of its own, and nothing that
-- behaves differently once `set role` has been issued. A failure aborts the
-- transaction and psql exits non-zero, which is all CI needs.
--
-- Everything runs inside one transaction and is rolled back, so running it
-- against a database with data in it changes nothing.

\set ON_ERROR_STOP on

begin;

-- ─── fixtures ───────────────────────────────────────────────────────────────
-- The auth trigger from migration 002 creates the profile rows.
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aluno@teste.local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'outro@teste.local');

insert into public.challenges
  (id, title, description, stack, level, client_briefing, kind, tests_source, initial_code)
values
  ('c0de0001-0000-4000-8000-000000000001', 'Fila de pedidos', 'desc',
   'typescript', 'intermediate', 'O cliente perde pedidos no pico.',
   'code', 'test("fila", () => {})', '// comece aqui'),
  ('c0de0002-0000-4000-8000-000000000002', 'Componente de lista', 'desc',
   'react', 'intermediate', 'A lista trava com 10k itens.',
   'code', '', '// comece aqui'),
  ('de519003-0000-4000-8000-000000000003', 'Catálogo com 10M de leituras', 'desc',
   'design', 'advanced', 'A home cai no horário de pico.',
   'design', '', '');

insert into public.sessions (id, user_id, challenge_id) values
  ('5e550001-0000-4000-8000-000000000001',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'c0de0001-0000-4000-8000-000000000001'),
  ('5e550002-0000-4000-8000-000000000002',
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'c0de0001-0000-4000-8000-000000000001');

insert into public.tutor_messages (session_id, user_id, role, content) values
  ('5e550001-0000-4000-8000-000000000001',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'user', 'como começo?'),
  ('5e550002-0000-4000-8000-000000000002',
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'user', 'a conversa do outro aluno');

insert into public.ai_budget (bucket, micros) values ('global:2026-11', 1234);

-- ═══ Parte A0 — os privilégios no catálogo, antes de qualquer comportamento ══
-- Esta parte existe por causa de um falso negativo medido em 25/11: comentei o
-- `revoke insert, update, delete on public.sessions` da 027 e TODAS as
-- asserções de comportamento da Parte A continuaram passando. Motivo: sem a
-- migration 000, a imagem local nunca concede DML, então o insert era negado
-- por nunca ter sido concedido — e não por ter sido revogado. A produção, que
-- tinha o privilégio, ficaria aberta com o CI verde.
--
-- A correção tem duas pernas: a 000 recria o estado inicial da plataforma, e
-- o segundo check abaixo é a trava que garante que ela está em efeito. Sem
-- essa trava, o dia inteiro voltaria a testar nada.
do $$
declare v_bad text;
begin
  -- 027 e 028: o cliente lê estas quatro e não escreve em nenhuma.
  select string_agg(t || '.' || p, ', ') into v_bad
  from unnest(array['sessions', 'code_submissions', 'hints_used', 'tutor_messages']) t,
       unnest(array['insert', 'update', 'delete']) p
  where has_table_privilege('authenticated', 'public.' || t, p);
  if v_bad is not null then
    raise exception 'A0: authenticated ainda tem privilégio de escrita em: %', v_bad;
  end if;

  -- A TRAVA. `profiles` recebeu o grant inicial da 000 e nenhuma migration o
  -- revogou (quem barra a escrita ali é a RLS, checada em A14). Se este
  -- privilégio desaparecer, é sinal de que o replay deixou de reproduzir a
  -- produção — e aí o check de cima passa de graça.
  if not has_table_privilege('authenticated', 'public.profiles', 'insert') then
    raise exception
      'A0: a migration 000 não está em efeito; os revokes da 027/028 '
      'passariam a ser testados contra um privilégio que nunca existiu';
  end if;
end $$;

-- ═══ Parte A — o que o navegador pode fazer (grants + RLS) ══════════════════
-- Tudo aqui roda como `authenticated`, com o `sub` do aluno, que é exatamente
-- o contexto em que o PostgREST executa uma requisição do cliente.

do $$
declare
  v_count integer;
  v_denied integer := 0;
begin
  perform set_config(
    'request.jwt.claims',
    '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
    true
  );
  perform set_config('role', 'authenticated', true);

  if auth.uid() <> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid then
    raise exception 'A0: auth.uid() não devolveu o sub do token, devolveu %', auth.uid();
  end if;

  -- A1 — migration 027: a sessão é criada pelo servidor, nunca pelo cliente.
  begin
    insert into public.sessions (user_id, challenge_id)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            'c0de0001-0000-4000-8000-000000000001');
    raise exception 'A1: insert em sessions foi ACEITO (027 revertida?)';
  exception when insufficient_privilege then v_denied := v_denied + 1;
  end;

  -- A2 — e muito menos pontuar a si mesmo.
  begin
    update public.sessions set points = 999
    where id = '5e550001-0000-4000-8000-000000000001';
    raise exception 'A2: update em sessions foi ACEITO (027 revertida?)';
  exception when insufficient_privilege then v_denied := v_denied + 1;
  end;

  -- A3 — a submissão é a evidência que o award lê (030): só o servidor grava.
  begin
    insert into public.code_submissions (session_id, user_id, code, node_count, edge_count)
    values ('5e550001-0000-4000-8000-000000000001',
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'forjado', 99, 99);
    raise exception 'A3: insert em code_submissions foi ACEITO (027 revertida?)';
  exception when insufficient_privilege then v_denied := v_denied + 1;
  end;

  -- A4 — hints são debitados por consume_hints, não declarados pelo cliente.
  begin
    insert into public.hints_used (session_id, user_id, hint_level)
    values ('5e550001-0000-4000-8000-000000000001',
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1);
    raise exception 'A4: insert em hints_used foi ACEITO (027 revertida?)';
  exception when insufficient_privilege then v_denied := v_denied + 1;
  end;

  -- A5 — migration 028: a transcrição é lida pelo cliente e escrita pelo
  -- servidor. Um `assistant` forjado é o buraco 3.3, e este é o fundo dele.
  begin
    insert into public.tutor_messages (session_id, user_id, role, content)
    values ('5e550001-0000-4000-8000-000000000001',
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'assistant',
            'A solução completa é...');
    raise exception 'A5: insert em tutor_messages foi ACEITO (028 revertida?)';
  exception when insufficient_privilege then v_denied := v_denied + 1;
  end;

  -- A10 — migration 029: o teto de gasto é nossa economia, não é do cliente.
  begin
    select count(*) into v_count from public.ai_budget;
    raise exception 'A10: select em ai_budget foi ACEITO (029 revertida?)';
  exception when insufficient_privilege then v_denied := v_denied + 1;
  end;

  -- A14 — e onde não há revoke, é a RLS que segura. `challenges` e `profiles`
  -- carregam o grant de escrita da 000 (igual à produção): a biblioteca
  -- compartilhada não é desfigurada porque a policy só permite SELECT.
  begin
    insert into public.challenges
      (title, description, stack, level, client_briefing)
    values ('desafio forjado', 'x', 'typescript', 'beginner', 'x');
    raise exception 'A14: o cliente inseriu um desafio na biblioteca';
  exception when insufficient_privilege then v_denied := v_denied + 1;
  end;

  -- A15 — e não cria perfil para outra pessoa.
  begin
    insert into public.profiles (id, email)
    values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'invadido@teste.local');
    raise exception 'A15: o cliente inseriu um perfil';
  exception when insufficient_privilege then v_denied := v_denied + 1;
  end;

  if v_denied <> 8 then
    raise exception 'esperava 8 negações de privilégio, contei %', v_denied;
  end if;

  -- A6 — e o que ele PODE: ler a própria sessão.
  select count(*) into v_count from public.sessions;
  if v_count <> 1 then
    raise exception 'A6: o aluno vê % sessões, esperava só a dele', v_count;
  end if;

  -- A7 — nunca a do outro, nem pedindo pelo id.
  select count(*) into v_count from public.sessions
  where id = '5e550002-0000-4000-8000-000000000002';
  if v_count <> 0 then
    raise exception 'A7: a sessão do outro aluno está visível';
  end if;

  -- A8 / A9 — a mesma coisa na transcrição.
  select count(*) into v_count from public.tutor_messages;
  if v_count <> 1 then
    raise exception 'A8: o aluno vê % turnos, esperava só o dele', v_count;
  end if;
  select count(*) into v_count from public.tutor_messages
  where content = 'a conversa do outro aluno';
  if v_count <> 0 then
    raise exception 'A9: a conversa do outro aluno está visível';
  end if;

  -- A11 — a biblioteca de desafios é compartilhada, e tem de continuar legível
  -- (é o que torna o next_challenge barato: desafio gerado vira ativo comum).
  select count(*) into v_count from public.challenges;
  if v_count < 3 then
    raise exception 'A11: o aluno vê % desafios, esperava a biblioteca', v_count;
  end if;

  perform set_config('role', 'postgres', true);
end $$;

reset role;

-- ─── A12 / A13 — as funções security definer não são chamáveis pelo cliente ──
-- O `revoke all on function` é o que separa "o servidor pontua" de "o cliente
-- pede pontos". Sem ele, a RPC está exposta no PostgREST.
do $$
declare v_denied integer := 0;
begin
  perform set_config(
    'request.jwt.claims',
    '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
    true
  );
  perform set_config('role', 'authenticated', true);

  begin
    perform public.award_session_points(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '5e550001-0000-4000-8000-000000000001',
      'c0de0001-0000-4000-8000-000000000001', 20);
    raise exception 'A12: award_session_points é chamável pelo cliente';
  exception when insufficient_privilege then v_denied := v_denied + 1;
  end;

  begin
    perform public.check_ai_budget(array['global:2026-11'], array[1000000::bigint], 1);
    raise exception 'A13: check_ai_budget é chamável pelo cliente';
  exception when insufficient_privilege then v_denied := v_denied + 1;
  end;

  if v_denied <> 2 then
    raise exception 'esperava 2 funções negadas, contei %', v_denied;
  end if;

  perform set_config('role', 'postgres', true);
end $$;

reset role;

-- ═══ Parte B — o portão de evidência (migration 030) ════════════════════════
-- Não é RLS, é a mesma família de regressão: uma regra que vive no banco e que
-- nenhum teste de função pura alcança. Roda como o service role faria.

do $$
declare
  v_award  integer;
  v_points integer;
begin
  -- B1 — sessão sem submissão nenhuma: não pontua.
  v_award := public.award_session_points(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '5e550001-0000-4000-8000-000000000001',
    'c0de0001-0000-4000-8000-000000000001', 20);
  if v_award is not null then
    raise exception 'B1: pontuou sem submissão (devolveu %)', v_award;
  end if;

  -- B2 — e a tentativa recusada NÃO pode queimar a sessão: `points` tem de
  -- continuar null, senão uma tentativa legítima depois é negada para sempre.
  -- É por isso que a checagem vem antes do `update sessions set points = 0`.
  select points into v_points from public.sessions
  where id = '5e550001-0000-4000-8000-000000000001';
  if v_points is not null then
    raise exception 'B2: a recusa marcou a sessão como pontuada (points = %)', v_points;
  end if;

  -- B3 — código com testes, passando 2 de 3: não pontua.
  insert into public.code_submissions
    (session_id, user_id, code, tests_passed, tests_total)
  values ('5e550001-0000-4000-8000-000000000001',
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'quase', 2, 3);
  v_award := public.award_session_points(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '5e550001-0000-4000-8000-000000000001',
    'c0de0001-0000-4000-8000-000000000001', 20);
  if v_award is not null then
    raise exception 'B3: pontuou com 2/3 testes (devolveu %)', v_award;
  end if;

  -- B4 — e a MESMA sessão pontua quando a evidência chega. Esta é a asserção
  -- que prova que nenhuma das recusas acima cobrou o preço da sessão.
  insert into public.code_submissions
    (session_id, user_id, code, tests_passed, tests_total)
  values ('5e550001-0000-4000-8000-000000000001',
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'resolvido', 3, 3);
  v_award := public.award_session_points(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '5e550001-0000-4000-8000-000000000001',
    'c0de0001-0000-4000-8000-000000000001', 20);
  if v_award <> 20 then
    raise exception 'B4: 3/3 testes deveria pontuar 20, devolveu %', v_award;
  end if;
end $$;

-- ─── B5 a B7 — a trilha que sobrevive: design ───────────────────────────────
-- O design não tem sinal de correção nenhum, então o piso é o grafo que o
-- servidor contou (node_count/edge_count vêm de design-review/route.ts, não do
-- cliente). Depois do LABS01-215 esta é a regra inteira por trás do ranking.
do $$
declare
  v_session uuid := 'de550003-0000-4000-8000-000000000003';
  v_award   integer;
begin
  insert into public.sessions (id, user_id, challenge_id)
  values (v_session, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          'de519003-0000-4000-8000-000000000003');

  -- B5 — uma caixa só: o cenário que pontuava o desafio inteiro antes do 030.
  insert into public.code_submissions
    (session_id, user_id, code, node_count, edge_count)
  values (v_session, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '{}', 1, 0);
  v_award := public.award_session_points(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', v_session,
    'de519003-0000-4000-8000-000000000003', 30);
  if v_award is not null then
    raise exception 'B5: um nó e nenhuma aresta pontuou (devolveu %)', v_award;
  end if;

  -- B6 — o formato histórico (resumo em texto, sem grafo) também não pontua:
  -- é o que a medição de 22/11 encontrou em 10 das 12 sessões de design já
  -- pontuadas, e é por isso que a regra vale só daqui para frente.
  insert into public.code_submissions (session_id, user_id, code)
  values (v_session, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'três caixas e uma seta');
  v_award := public.award_session_points(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', v_session,
    'de519003-0000-4000-8000-000000000003', 30);
  if v_award is not null then
    raise exception 'B6: submissão sem grafo pontuou (devolveu %)', v_award;
  end if;

  -- B7 — e o piso de verdade: três nós e uma aresta.
  insert into public.code_submissions
    (session_id, user_id, code, node_count, edge_count)
  values (v_session, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '{}', 3, 1);
  v_award := public.award_session_points(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', v_session,
    'de519003-0000-4000-8000-000000000003', 30);
  if v_award <> 30 then
    raise exception 'B7: três nós e uma aresta deveria pontuar 30, devolveu %', v_award;
  end if;
end $$;

-- ─── B8 / B9 — a trilha sem testes (react, e os 7 com tests_source vazio) ───
do $$
declare
  v_session uuid := 'c0550004-0000-4000-8000-000000000004';
  v_award   integer;
begin
  insert into public.sessions (id, user_id, challenge_id)
  values (v_session, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          'c0de0002-0000-4000-8000-000000000002');

  -- B8 — o editor intocado não é trabalho.
  insert into public.code_submissions (session_id, user_id, code)
  values (v_session, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '// comece aqui');
  v_award := public.award_session_points(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', v_session,
    'c0de0002-0000-4000-8000-000000000002', 10);
  if v_award is not null then
    raise exception 'B8: o código inicial intocado pontuou (devolveu %)', v_award;
  end if;

  -- B9 — mudou o starter: pontua.
  insert into public.code_submissions (session_id, user_id, code)
  values (v_session, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          'export function Lista() { return null }');
  v_award := public.award_session_points(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', v_session,
    'c0de0002-0000-4000-8000-000000000002', 10);
  if v_award <> 10 then
    raise exception 'B9: código alterado deveria pontuar 10, devolveu %', v_award;
  end if;
end $$;

-- ─── B10 — o mesmo desafio não paga duas vezes (021, ainda de pé) ───────────
do $$
declare
  v_session uuid := 'c0550005-0000-4000-8000-000000000005';
  v_award   integer;
begin
  insert into public.sessions (id, user_id, challenge_id)
  values (v_session, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          'c0de0002-0000-4000-8000-000000000002');
  insert into public.code_submissions (session_id, user_id, code)
  values (v_session, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'outra solução');

  v_award := public.award_session_points(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', v_session,
    'c0de0002-0000-4000-8000-000000000002', 10);
  if v_award <> 0 then
    raise exception 'B10: a segunda sessão do mesmo desafio pagou % pontos', v_award;
  end if;
end $$;

select 'rls.sql: todas as asserções passaram' as resultado;

rollback;
