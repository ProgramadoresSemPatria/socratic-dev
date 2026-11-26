-- ─── LABS01-204 — os grants que a produção tem e o repositório não ──────────
-- Encontrado em 25/11, na PRIMEIRA vez que as migrations foram aplicadas numa
-- base vazia. Não está na auditoria do investidor; é consequência direta do
-- que ela pediu (achado 3.6, "testar RLS contra um Supabase local").
--
-- O QUE ACONTECEU. As 001 a 030 nunca criam um grant de leitura. Elas nem
-- precisavam: em maio, quando o projeto foi criado, as default privileges da
-- plataforma davam todos os privilégios de DML a `anon`, `authenticated` e
-- `service_role` em cada tabela nova do schema `public`. Por isso a `027`
-- consegue *revogar* insert/update/delete de `sessions` — o privilégio existia.
--
-- Nas imagens atuais do Supabase local, a default privilege do papel
-- `postgres` em `public` é apenas `Dxtm` (TRUNCATE, REFERENCES, TRIGGER,
-- MAINTAIN). Sem SELECT. Medido em 25/11:
--
--   pg_default_acl → postgres @ public → anon=Dxtm, authenticated=Dxtm
--
-- Consequência: um banco construído a partir deste repositório **não serve a
-- aplicação**. Todo `select` do cliente morre com 42501. A única tabela que
-- funcionava era `tutor_messages`, porque a `028` escreve o grant na mão.
--
-- A PRODUÇÃO ESTÁ CERTA — conferido em 25/11 com a anon key pública, uma
-- requisição de leitura por tabela:
--
--   challenges        200, com linhas        (policy "Anyone can view")
--   sessions          200, []                (grant existe, RLS filtrou)
--   code_submissions  200, []                (idem)
--   hints_used        200, []                (idem)
--   tutor_messages    200, []                (idem)
--   profiles          200, []                (idem)
--   ai_budget         401, 42501             (029 revogou — e funciona)
--
-- Então isto não corrige a produção: corrige o REPOSITÓRIO, que descrevia um
-- banco que não roda o produto. `grant` é aditivo, então aplicar isto na
-- produção não muda nada lá — os privilégios já estão concedidos. O ganho é
-- que, daqui para frente, `supabase db reset` produz um banco igual ao de
-- produção, e é isso que dá sentido aos testes de RLS.
--
-- NÃO concede insert, update nem delete. A `027` revogou esses três em
-- `sessions`, `code_submissions` e `hints_used`, e a `028` em
-- `tutor_messages`; reconcedê-los aqui desfaria a correção dos achados 3.1 e
-- 3.2. O cliente lê; quem escreve é o service role.
--
-- PENDÊNCIA REGISTRADA, não resolvida aqui: destas seis tabelas, o navegador
-- só lê `challenges` de fato (as duas workspaces, via
-- `createBrowserClient`) — todo o resto passa por rota ou server action com o
-- service role. Ou seja, `anon` carrega SELECT em cinco tabelas que ninguém
-- consulta pelo cliente. Não é porta aberta (a RLS não devolve linha nenhuma
-- para quem não é o dono, como as sete medições acima mostram), mas é
-- superfície a menos de graça. Apertar isso é mudança com risco de quebra
-- real — se alguma tela passar a ler direto, ela para — então vira item
-- próprio, não carona nesta migration.

begin;

-- A biblioteca compartilhada: é a única leitura que o navegador faz de fato.
grant select on public.challenges to anon, authenticated;

-- O resto espelha o que a produção expõe. Em todas elas a policy de SELECT é
-- `auth.uid() = user_id` (ou `= id`), de modo que o grant sozinho não mostra
-- nada: quem não é o dono recebe zero linhas.
grant select on public.profiles          to anon, authenticated;
grant select on public.sessions          to anon, authenticated;
grant select on public.code_submissions  to anon, authenticated;
grant select on public.hints_used        to anon, authenticated;
-- `tutor_messages` já recebeu o seu na 028; repetido aqui só para o conjunto
-- ficar legível num lugar. `grant` é idempotente.
grant select on public.tutor_messages    to anon, authenticated;

-- E o que continua fechado, explicitamente, para que um `grant` futuro
-- distraído não abra: economia do produto (026, 029) e infraestrutura.
revoke all on table public.ai_usage    from anon, authenticated;
revoke all on table public.ai_budget   from anon, authenticated;
revoke all on table public.rate_limits from anon, authenticated;

-- ─── conferência ────────────────────────────────────────────────────────────
-- Roda no fim da própria migration: se a plataforma mudar as default
-- privileges outra vez, é aqui que se descobre, e não em produção.
do $$
declare
  v_missing text;
begin
  select string_agg(t, ', ') into v_missing
  from unnest(array[
    'challenges', 'profiles', 'sessions',
    'code_submissions', 'hints_used', 'tutor_messages'
  ]) as t
  where not has_table_privilege('authenticated', 'public.' || t, 'select');

  if v_missing is not null then
    raise exception 'authenticated ainda não lê: %', v_missing;
  end if;

  select string_agg(t, ', ') into v_missing
  from unnest(array['sessions', 'code_submissions', 'hints_used', 'tutor_messages']) as t
  where has_table_privilege('authenticated', 'public.' || t, 'insert');

  if v_missing is not null then
    raise exception 'authenticated voltou a poder escrever em: %', v_missing;
  end if;



  raise notice 'grants conferidos: 6 tabelas legíveis, nenhuma escrita, orçamento fechado';
end;
$$;

commit;
