import Link from 'next/link'
import { Logo } from './logo'

export function Footer() {
  return (
    <footer className='relative mt-20 border-t border-white/[0.05]'>
      <div className='mx-auto max-w-6xl px-4 py-14'>
        <div className='grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr_1fr]'>
          <div>
            <Logo />
            <p className='mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground'>
              A IA que nunca te dá a resposta — ela te faz chegar lá.
            </p>
          </div>

          <FooterCol
            title='Produto'
            items={[
              { label: 'Como funciona', href: '#metodo' },
              { label: 'Desafios', href: '/onboarding' },
              { label: 'Dashboard', href: '/dashboard' },
            ]}
          />
          <FooterCol
            title='Empresa'
            items={[
              { label: 'Manifesto', href: '#precos' },
              { label: 'Hackathon', href: '#' },
              { label: 'Contato', href: '#' },
            ]}
          />
          <FooterCol
            title='Legal'
            items={[
              { label: 'Privacidade', href: '#' },
              { label: 'Termos', href: '#' },
            ]}
          />
        </div>

        <div className='mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/[0.04] pt-6 font-mono text-xs text-muted-foreground/70 sm:flex-row sm:items-center'>
          <div>© 2026 Socratic.dev · Hackathon Project</div>
          <div className='flex items-center gap-1.5'>
            <span className='size-1 animate-pulse rounded-full bg-mint' />
            online — powered by Claude
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  items,
}: {
  title: string
  items: { label: string; href: string }[]
}) {
  return (
    <div>
      <div className='mb-3 font-mono text-[11px] tracking-wider text-muted-foreground/60 uppercase'>
        {title}
      </div>
      <ul className='space-y-2.5'>
        {items.map((it) => (
          <li key={it.label}>
            <Link
              href={it.href}
              className='text-sm text-foreground/80 transition-colors hover:text-foreground'
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
