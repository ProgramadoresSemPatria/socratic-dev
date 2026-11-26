// LABS01-204 — an in-memory stand-in for `supabaseAdmin`.
//
// Audit finding 3.6: 111 tests, all of pure functions, none of authorization.
// The reason the route tests did not exist is that every route's first act is
// a database round trip — `requireUser` verifies the token with Supabase and
// `sessionContext` reads the session — so testing a route meant either
// pointing it at production or not testing it at all. Days 3 and 4 ended with
// four checks deferred for exactly that reason (the 400/403 answers, the
// budget refusal, the stream that breaks mid-answer).
//
// This models the slice of PostgREST the server actually uses. It is
// deliberately NOT a Postgres: it does not enforce RLS, triggers, grants or
// constraints, because those are tested against a real database
// (supabase/tests/*.sql). What it does is let the route's own logic run — the
// order of its guards, what reaches the prompt, what it writes — with the
// database answering predictably.
//
// Scope, so nobody mistakes it for more than it is:
//   - filters: eq, gte, in
//   - one level of embedded relation, `rel(cols)`, resolved through a
//     `<rel without the trailing s>_id` column
//   - order (one column), limit, maybeSingle, single, head+count
//   - insert (assigns id, created_at and a monotonic seq, like the identity
//     column migration 028 added)
//   - rpc, through handlers a test can replace
// Anything else is an unimplemented-on-purpose throw rather than a silent
// wrong answer, because a mock that quietly returns undefined is how an
// assertion ends up passing for the wrong reason.

export type Row = Record<string, unknown>

type Op = 'eq' | 'gte' | 'in'
type Filter = { col: string; op: Op; value: unknown }

export type RpcResult = { data?: unknown; error?: { message: string } | null }
export type RpcHandler = (args: Row) => RpcResult

type QueryResult = {
  data: unknown
  error: { message: string } | null
  count: number | null
}

const UUID_CHARS = '0123456789abcdef'

/** Deterministic ids: the same seeding order always produces the same uuids. */
function makeUuid(n: number): string {
  const hex = (len: number, seed: number) =>
    Array.from(
      { length: len },
      (_, i) => UUID_CHARS[(seed * 7 + i * 13 + len) % 16],
    ).join('')
  const tail = String(n).padStart(12, '0')
  return `${hex(8, n)}-${hex(4, n)}-4${hex(3, n)}-8${hex(3, n)}-${tail}`
}

function defaultRpcHandlers(): Record<string, RpcHandler> {
  return {
    // migration 014 — true means "under the limit"
    check_rate_limit: () => ({ data: true }),
    // migration 029 — null means "allowed"; a string is the bucket that blew
    check_ai_budget: () => ({ data: null }),
    settle_ai_budget: () => ({ data: null }),
    // migration 016 — hints remaining, or null when there are none left
    consume_hints: () => ({ data: 34 }),
  }
}

export class FakeSupabase {
  tables: Record<string, Row[]> = {}
  /** access token -> the user `auth.getUser` resolves it to */
  tokens = new Map<string, { id: string; email?: string }>()
  rpcHandlers: Record<string, RpcHandler> = defaultRpcHandlers()
  /** table name -> error message, to exercise the failure paths */
  tableErrors: Record<string, string> = {}
  rpcCalls: { name: string; args: Row }[] = []
  selects: { table: string; columns: string; filters: Filter[] }[] = []
  private nextId = 1
  private nextSeq = 1

  reset(): void {
    this.tables = {}
    this.tokens.clear()
    this.rpcHandlers = defaultRpcHandlers()
    this.tableErrors = {}
    this.rpcCalls = []
    this.selects = []
    this.nextId = 1
    this.nextSeq = 1
  }

  // ─── seeding ──────────────────────────────────────────────────────────────

  id(): string {
    return makeUuid(this.nextId++)
  }

  private table(name: string): Row[] {
    this.tables[name] ??= []
    return this.tables[name]
  }

  seed(table: string, row: Row): string {
    const id = typeof row.id === 'string' ? row.id : this.id()
    this.table(table).push({ created_at: new Date().toISOString(), ...row, id })
    return id
  }

  /** A user whose bearer token `requireUser` will accept. */
  seedUser(token: string, userId: string = this.id()): string {
    this.tokens.set(token, { id: userId })
    this.seed('profiles', { id: userId, bonus_hints: 0, total_points: 0 })
    return userId
  }

  /** A challenge plus a session on it, which is what every AI route needs. */
  seedSession(args: {
    userId: string
    title?: string
    briefing?: string
    tests?: string
    kind?: 'code' | 'design' | 'react'
  }): { sessionId: string; challengeId: string } {
    const challengeId = this.seed('challenges', {
      title: args.title ?? 'Fila de pedidos',
      client_briefing: args.briefing ?? 'O cliente perde pedidos no pico.',
      tests_source: args.tests ?? '',
      kind: args.kind ?? 'code',
      initial_code: '// comece aqui',
    })
    const sessionId = this.seed('sessions', {
      user_id: args.userId,
      challenge_id: challengeId,
      points: null,
    })
    return { sessionId, challengeId }
  }

  // ─── inspection ───────────────────────────────────────────────────────────

  rows(table: string): Row[] {
    return this.tables[table] ?? []
  }

  rpcArgs(name: string): Row[] {
    return this.rpcCalls.filter((c) => c.name === name).map((c) => c.args)
  }

  failTable(table: string, message: string): void {
    this.tableErrors[table] = message
  }

  rpc(name: string, handler: RpcHandler): void {
    this.rpcHandlers[name] = handler
  }

  // ─── the client surface ───────────────────────────────────────────────────

  get client() {
    // Arrow functions on purpose: they close over the instance, so the object
    // the routes receive stays bound to this store without aliasing `this`.
    return {
      auth: {
        getUser: async (token?: string) => {
          const user = token ? this.tokens.get(token) : undefined
          if (!user) {
            return {
              data: { user: null },
              error: { message: 'invalid JWT', status: 401 },
            }
          }
          return { data: { user: { ...user, app_metadata: {} } }, error: null }
        },
      },
      from: (table: string) => new FakeQuery(this, table),
      rpc: async (name: string, args: Row) => {
        this.rpcCalls.push({ name, args: { ...args } })
        const handler = this.rpcHandlers[name]
        if (!handler) {
          throw new Error(`[supabase-mock] no handler for rpc "${name}"`)
        }
        const out = handler(args)
        return { data: out.data ?? null, error: out.error ?? null }
      },
    }
  }

  /** What `vi.mock('@/lib/supabase/server')` should return. */
  get module() {
    return { supabaseAdmin: this.client }
  }

  nextSequence(): number {
    return this.nextSeq++
  }
}

class FakeQuery implements PromiseLike<QueryResult> {
  private columns = '*'
  private filters: Filter[] = []
  private orderBy: { col: string; ascending: boolean } | null = null
  private max: number | null = null
  private head = false
  private wantCount = false
  private inserted: Row[] | null = null

  constructor(
    private db: FakeSupabase,
    private name: string,
  ) {}

  select(columns = '*', opts?: { count?: string; head?: boolean }): this {
    this.columns = columns
    this.head = opts?.head === true
    this.wantCount = opts?.count !== undefined
    return this
  }

  insert(rows: Row | Row[]): this {
    const list = Array.isArray(rows) ? rows : [rows]
    this.inserted = list.map((row) => ({
      id: this.db.id(),
      created_at: new Date().toISOString(),
      seq: this.db.nextSequence(),
      ...row,
    }))
    return this
  }

  eq(col: string, value: unknown): this {
    this.filters.push({ col, op: 'eq', value })
    return this
  }

  gte(col: string, value: unknown): this {
    this.filters.push({ col, op: 'gte', value })
    return this
  }

  in(col: string, value: unknown[]): this {
    this.filters.push({ col, op: 'in', value })
    return this
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    this.orderBy = { col, ascending: opts?.ascending !== false }
    return this
  }

  limit(n: number): this {
    this.max = n
    return this
  }

  async maybeSingle(): Promise<{
    data: unknown
    error: { message: string } | null
  }> {
    const res = await this.run()
    if (res.error) return { data: null, error: res.error }
    const list = res.data as Row[]
    return { data: list[0] ?? null, error: null }
  }

  async single(): Promise<{
    data: unknown
    error: { message: string } | null
  }> {
    const res = await this.run()
    if (res.error) return { data: null, error: res.error }
    const list = res.data as Row[]
    if (list.length !== 1) {
      return {
        data: null,
        error: { message: 'JSON object requested, multiple (or no) rows' },
      }
    }
    return { data: list[0], error: null }
  }

  then<R1 = QueryResult, R2 = never>(
    onFulfilled?: ((v: QueryResult) => R1 | PromiseLike<R1>) | null,
    onRejected?: ((e: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.run().then(onFulfilled, onRejected)
  }

  private async run(): Promise<QueryResult> {
    const failure = this.db.tableErrors[this.name]
    if (failure) {
      return { data: null, error: { message: failure }, count: null }
    }

    if (this.inserted) {
      this.db.tables[this.name] ??= []
      this.db.tables[this.name].push(...this.inserted)
      return { data: this.inserted, error: null, count: this.inserted.length }
    }

    this.db.selects.push({
      table: this.name,
      columns: this.columns,
      filters: [...this.filters],
    })

    let rows = (this.db.tables[this.name] ?? []).filter((row) =>
      this.filters.every((f) => matches(row[f.col], f)),
    )

    if (this.orderBy) {
      const { col, ascending } = this.orderBy
      rows = [...rows].sort((a, b) => {
        const x = a[col]
        const y = b[col]
        const cmp = x === y ? 0 : (x as number) > (y as number) ? 1 : -1
        return ascending ? cmp : -cmp
      })
    }
    if (this.max !== null) rows = rows.slice(0, this.max)

    const count = this.wantCount ? rows.length : null
    if (this.head) return { data: null, error: null, count }
    return { data: rows.map((r) => project(this.db, r, this.columns)), error: null, count }
  }
}

function matches(actual: unknown, filter: Filter): boolean {
  switch (filter.op) {
    case 'eq':
      return actual === filter.value
    case 'gte':
      return String(actual) >= String(filter.value)
    case 'in':
      return (filter.value as unknown[]).includes(actual)
  }
}

/** Splits "a, b, rel(c, d)" at the top level only. */
function splitColumns(columns: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const ch of columns) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

function project(db: FakeSupabase, row: Row, columns: string): Row {
  if (columns.trim() === '*') return { ...row }
  const out: Row = {}
  for (const part of splitColumns(columns)) {
    const embed = part.match(/^([a-z_]+)\s*\(([^)]*)\)$/i)
    if (!embed) {
      out[part] = row[part]
      continue
    }
    const [, relation, relColumns] = embed
    // PostgREST resolves this through the foreign key; the mock resolves it
    // through the naming convention the schema happens to follow
    // (sessions.challenge_id -> challenges.id).
    const fk = `${relation.replace(/s$/, '')}_id`
    const target = (db.tables[relation] ?? []).find((r) => r.id === row[fk])
    out[relation] = target ? project(db, target, relColumns) : null
  }
  return out
}

/** One instance per test file; call `reset()` in `beforeEach`. */
export const supabaseMock = new FakeSupabase()
