export type CaseKind = 'api' | 'ui' | 'algo' | 'debug' | 'sql' | 'cli'

const PALETTES: Record<CaseKind, string> = {
  api: 'linear-gradient(135deg, #f4efe9, #e7eaed)',
  ui: 'linear-gradient(135deg, #efe9f8, #e7eaed)',
  algo: 'linear-gradient(135deg, #ebe6f6, #f4efe9)',
  debug: 'linear-gradient(135deg, #f6ece9, #e7eaed)',
  sql: 'linear-gradient(135deg, #e7eaed, #efe9f8)',
  cli: 'linear-gradient(135deg, #eceae5, #e9e6f4)',
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className='w-full max-w-[320px] overflow-hidden rounded-xl border border-black/[0.06] bg-white/80 shadow-soft backdrop-blur-sm'>
      {children}
    </div>
  )
}

function PanelHead({ label }: { label: string }) {
  return (
    <div className='flex items-center gap-1.5 border-b border-black/[0.05] px-3 py-2'>
      <span className='size-2 rounded-full bg-[#e5564f]/60' />
      <span className='size-2 rounded-full bg-[#e8b339]/60' />
      <span className='size-2 rounded-full bg-[#3fa46a]/60' />
      <span className='ml-1.5 font-mono text-[10px] text-[#6b6478]'>{label}</span>
    </div>
  )
}

function Api() {
  return (
    <Panel>
      <PanelHead label='GET /api/pedidos' />
      <pre className='px-3.5 py-3 font-mono text-[11.5px] leading-[1.6]'>
        <div className='text-[#3fa46a]'>200 OK</div>
        <div className='text-[#6b6478]'>{'{'}</div>
        <div>
          <span className='pl-3 text-[#6E56CF]'>"id"</span>
          <span className='text-[#1b1916]'>: 7,</span>
        </div>
        <div>
          <span className='pl-3 text-[#6E56CF]'>"total"</span>
          <span className='text-[#1b1916]'>: 240,</span>
        </div>
        <div>
          <span className='pl-3 text-[#6E56CF]'>"itens"</span>
          <span className='text-[#1b1916]'>: 3</span>
        </div>
        <div className='text-[#6b6478]'>{'}'}</div>
      </pre>
    </Panel>
  )
}

function Ui() {
  return (
    <Panel>
      <PanelHead label='Checkout.tsx' />
      <div className='space-y-2.5 px-4 py-4'>
        <div className='h-3 w-2/3 rounded bg-[#1b1916]/10' />
        <div className='h-7 rounded-md border border-black/[0.07] bg-white' />
        <div className='h-7 rounded-md border border-black/[0.07] bg-white' />
        <div className='flex gap-2 pt-1'>
          <div className='h-7 flex-1 rounded-md bg-[#6E56CF]' />
          <div className='h-7 w-12 rounded-md border border-black/[0.08] bg-white' />
        </div>
      </div>
    </Panel>
  )
}

function Algo() {
  const node = 'fill-white stroke-[#6E56CF]'
  return (
    <Panel>
      <PanelHead label='árvore · O(log n)' />
      <div className='px-3 py-4'>
        <svg viewBox='0 0 200 110' className='w-full'>
          <line x1='100' y1='22' x2='55' y2='62' stroke='#c9c3e6' strokeWidth='2' />
          <line x1='100' y1='22' x2='145' y2='62' stroke='#c9c3e6' strokeWidth='2' />
          <line x1='55' y1='62' x2='32' y2='96' stroke='#c9c3e6' strokeWidth='2' />
          <line x1='55' y1='62' x2='78' y2='96' stroke='#c9c3e6' strokeWidth='2' />
          <line x1='145' y1='62' x2='168' y2='96' stroke='#c9c3e6' strokeWidth='2' />
          <circle cx='100' cy='22' r='13' className='fill-[#6E56CF]' />
          <circle cx='55' cy='62' r='11' className={node} strokeWidth='2' />
          <circle cx='145' cy='62' r='11' className={node} strokeWidth='2' />
          <circle cx='32' cy='96' r='9' className={node} strokeWidth='2' />
          <circle cx='78' cy='96' r='9' className={node} strokeWidth='2' />
          <circle cx='168' cy='96' r='9' className={node} strokeWidth='2' />
        </svg>
      </div>
    </Panel>
  )
}

function Debug() {
  return (
    <Panel>
      <PanelHead label='media.test.js' />
      <pre className='px-3.5 py-3 font-mono text-[11px] leading-[1.7]'>
        <div className='text-[#c0392b]'>✕ TypeError: divisão por zero</div>
        <div className='text-[#6b6478]'>
          {'  '}at <span className='text-[#1b1916]'>media</span> (media.js:
          <span className='text-[#6E56CF]'>4</span>)
        </div>
        <div className='text-[#6b6478]'>
          {'  '}at <span className='text-[#1b1916]'>test</span> (media.test.js:8)
        </div>
        <div className='mt-1.5 text-[#3fa46a]'>? notas = [] — e agora?</div>
      </pre>
    </Panel>
  )
}

function Sql() {
  return (
    <Panel>
      <PanelHead label='query.sql' />
      <div className='px-3.5 py-3'>
        <pre className='font-mono text-[11px] leading-[1.6]'>
          <div>
            <span className='text-[#6E56CF]'>SELECT</span>
            <span className='text-[#1b1916]'> user, </span>
            <span className='text-[#6E56CF]'>SUM</span>
            <span className='text-[#1b1916]'>(total)</span>
          </div>
          <div>
            <span className='text-[#6E56CF]'>FROM</span>
            <span className='text-[#1b1916]'> pedidos </span>
            <span className='text-[#6E56CF]'>GROUP BY</span>
            <span className='text-[#1b1916]'> user</span>
          </div>
        </pre>
        <div className='mt-2.5 overflow-hidden rounded-md border border-black/[0.06] font-mono text-[10.5px]'>
          <div className='flex bg-[#1b1916]/[0.04] text-[#6b6478]'>
            <span className='flex-1 px-2 py-1'>user</span>
            <span className='w-16 px-2 py-1'>total</span>
          </div>
          <div className='flex border-t border-black/[0.05] text-[#1b1916]'>
            <span className='flex-1 px-2 py-1'>ana</span>
            <span className='w-16 px-2 py-1'>1.240</span>
          </div>
          <div className='flex border-t border-black/[0.05] text-[#1b1916]'>
            <span className='flex-1 px-2 py-1'>rui</span>
            <span className='w-16 px-2 py-1'>980</span>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function Cli() {
  return (
    <Panel>
      <PanelHead label='terminal' />
      <pre className='px-3.5 py-3 font-mono text-[11.5px] leading-[1.7]'>
        <div>
          <span className='text-[#6E56CF]'>$</span>
          <span className='text-[#1b1916]'> socratic run desafio</span>
        </div>
        <div className='text-[#6b6478]'>▸ rodando testes…</div>
        <div className='text-[#e8a13a]'>● 0/3 — o tutor fez uma pergunta</div>
        <div className='text-[#3fa46a]'>✓ pista revelada</div>
      </pre>
    </Panel>
  )
}

const CONTENT: Record<CaseKind, () => React.ReactElement> = {
  api: Api,
  ui: Ui,
  algo: Algo,
  debug: Debug,
  sql: Sql,
  cli: Cli,
}

export function CaseVisual({ kind }: { kind: CaseKind }) {
  const Body = CONTENT[kind]
  return (
    <div
      aria-hidden
      className='absolute inset-0 grid place-items-center p-5'
      style={{ background: PALETTES[kind] }}
    >
      <Body />
    </div>
  )
}
