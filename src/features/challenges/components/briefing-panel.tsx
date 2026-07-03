'use client'

import { stackById } from '@/domain/stacks'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Building, Sparkles } from 'lucide-react'
import type { Challenge } from '../types'

const copy = {
  en: {
    eyebrow: 'Client brief',
    houseRule: 'House rule',
    houseRuleBody:
      "The tutor won't give you the answer. It asks questions. If you want a direct hint, you pay in independence points.",
    levels: {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    },
  },
  pt: {
    eyebrow: 'Briefing do cliente',
    houseRule: 'Regra da casa',
    houseRuleBody:
      'O tutor não vai te dar a resposta. Ele faz perguntas. Se você quiser um hint direto, paga em pontos de independência.',
    levels: {
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado',
    },
  },
}

function stackLabel(c: Challenge): string {
  if (c.kind === 'design') return 'System Design'
  return stackById(c.stack)?.label ?? c.stack
}

const PERSONA_RE = /^Cliente:\s*([^()]+?)\s*\(([^)]+)\)\s*—\s*(.+)$/

function parsePersona(brief: string): {
  persona: { name: string; role: string; company: string } | null
  body: string
} {
  const [first, ...rest] = brief.split('\n')
  const m = first?.match(PERSONA_RE)
  if (!m) return { persona: null, body: brief }
  return {
    persona: { name: m[1].trim(), role: m[2].trim(), company: m[3].trim() },
    body: rest.join('\n').trim(),
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-pastel-lavender',
  'bg-pastel-sage',
  'bg-pastel-sand',
  'bg-pastel-lilac',
  'bg-pastel-greige',
]

function avatarClass(name: string): string {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

type Block =
  | { kind: 'h'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'p'; text: string }

function parseBlocks(body: string): Block[] {
  const blocks: Block[] = []
  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const bullet = line.match(/^[-•*]\s+(.*)$/)
    if (bullet) {
      const last = blocks[blocks.length - 1]
      if (last?.kind === 'ul') last.items.push(bullet[1])
      else blocks.push({ kind: 'ul', items: [bullet[1]] })
    } else if (line.length < 64 && line.endsWith(':')) {
      blocks.push({ kind: 'h', text: line.slice(0, -1) })
    } else {
      blocks.push({ kind: 'p', text: line })
    }
  }
  return blocks
}

export function BriefingPanel({ challenge }: { challenge: Challenge }) {
  const t = useT(copy)
  const { persona, body } = parsePersona(challenge.client_briefing)
  const blocks = parseBlocks(persona ? body : challenge.client_briefing)

  return (
    <div className='p-6'>
      <p className='eyebrow mb-5 flex items-center gap-2'>
        <Building className='size-3' strokeWidth={1.5} />
        {t.eyebrow}
      </p>

      <h2 className='mb-3 font-heading text-2xl leading-tight font-light tracking-tight text-ink'>
        {challenge.title}
      </h2>

      <div className='mb-6 flex items-center gap-2 font-mono text-[11px] text-muted-foreground'>
        <span className='rounded-full border border-border px-2.5 py-0.5'>
          {stackLabel(challenge)}
        </span>
        <span className='rounded-full border border-border px-2.5 py-0.5'>
          {(t.levels as Record<string, string>)[challenge.level] ??
            challenge.level}
        </span>
      </div>

      {persona && (
        <div className='mb-6 flex items-center gap-3 rounded-lg bg-pastel-mist p-3'>
          <div
            className={`grid size-11 shrink-0 place-items-center rounded-full font-heading text-sm font-light text-ink ${avatarClass(persona.name)}`}
          >
            {initials(persona.name)}
          </div>
          <div className='min-w-0'>
            <div className='truncate font-heading text-[15px] font-medium text-ink'>
              {persona.name}
            </div>
            <div className='truncate font-mono text-[11px] text-muted-foreground'>
              {persona.role} · {persona.company}
            </div>
          </div>
        </div>
      )}

      <div className='space-y-3 text-sm leading-relaxed text-aubergine'>
        {blocks.map((b, i) =>
          b.kind === 'h' ? (
            <h3
              key={i}
              className={cn(
                'font-heading text-lg font-light tracking-tight text-ink',
                i > 0 && 'mt-5 border-t border-border pt-5',
              )}
            >
              {b.text}
            </h3>
          ) : b.kind === 'ul' ? (
            <ul key={i} className='space-y-1.5'>
              {b.items.map((item, j) => (
                <li key={j} className='flex gap-2.5'>
                  <span className='mt-[10px] h-px w-3 shrink-0 bg-ink/40' />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p key={i}>{b.text}</p>
          ),
        )}

        <div className='mt-6 rounded-lg bg-pastel-lilac p-4'>
          <div className='mb-1.5 flex items-center gap-2 font-mono text-[11px] tracking-wider text-primary uppercase'>
            <Sparkles className='size-3.5' strokeWidth={1.5} />
            {t.houseRule}
          </div>
          <p className='text-[13px] leading-relaxed text-aubergine'>
            {t.houseRuleBody}
          </p>
        </div>
      </div>
    </div>
  )
}
