'use client'

import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { ChevronDown, Code2, Library, Network, Trophy, Users } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import * as React from 'react'
import { copy } from './copy'

type MenuItem = {
  href: string
  icon: typeof Code2
  title: string
  desc: string
  question: string
}

// One open panel at a time: hovering another trigger switches instantly
// instead of letting the close-delay stack two panels on top of each other.
type MenuGroupCtx = {
  active: string | null
  open: (id: string) => void
  scheduleClose: (id: string) => void
  close: () => void
}

const MenuGroupContext = React.createContext<MenuGroupCtx | null>(null)

export function NavMenuGroup({ children }: { children: React.ReactNode }) {
  const [active, setActive] = React.useState<string | null>(null)
  const timer = React.useRef<number | null>(null)

  const cancelClose = React.useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [])
  const open = React.useCallback(
    (id: string) => {
      cancelClose()
      setActive(id)
    },
    [cancelClose],
  )
  const scheduleClose = React.useCallback(
    (id: string) => {
      cancelClose()
      timer.current = window.setTimeout(() => {
        setActive((cur) => (cur === id ? null : cur))
      }, 140)
    },
    [cancelClose],
  )
  const close = React.useCallback(() => {
    cancelClose()
    setActive(null)
  }, [cancelClose])

  React.useEffect(() => cancelClose, [cancelClose])

  const ctx = React.useMemo(
    () => ({ active, open, scheduleClose, close }),
    [active, open, scheduleClose, close],
  )
  return (
    <MenuGroupContext.Provider value={ctx}>
      {children}
    </MenuGroupContext.Provider>
  )
}

function NavMenu({
  id,
  label,
  items,
  footer,
}: {
  id: string
  label: string
  items: MenuItem[]
  footer: { href: string; label: string }
}) {
  const group = React.useContext(MenuGroupContext)
  const ref = React.useRef<HTMLDivElement>(null)
  const open = group?.active === id

  React.useEffect(() => {
    if (!open || !group) return
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        group?.close()
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') group?.close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, group])

  if (!group) return null

  return (
    <div
      ref={ref}
      className='relative hidden md:block'
      onMouseEnter={() => group.open(id)}
      onMouseLeave={() => group.scheduleClose(id)}
    >
      <button
        type='button'
        onClick={() => (open ? group.close() : group.open(id))}
        aria-expanded={open}
        className={cn(
          'flex cursor-pointer items-center gap-1 px-3 py-2 text-sm font-medium transition-colors duration-200',
          open ? 'text-ink' : 'text-muted-foreground hover:text-ink',
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            'size-3.5 transition-transform duration-200',
            open && 'rotate-180',
          )}
          strokeWidth={1.5}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className='border-border bg-background absolute top-full left-0 z-10 mt-2 w-[340px] overflow-hidden rounded-2xl border shadow-xl'
          >
            <div className='p-2'>
              {items.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={group.close}
                  className='group/item hover:bg-secondary flex gap-3 rounded-xl p-3 transition-colors duration-200'
                >
                  <span className='border-border bg-background text-ink group-hover/item:border-primary/40 group-hover/item:text-primary mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border transition-colors duration-200'>
                    <item.icon className='size-4' strokeWidth={1.5} />
                  </span>
                  <span className='flex flex-col gap-0.5'>
                    <span className='text-ink text-sm font-medium'>
                      {item.title}
                    </span>
                    <span className='text-muted-foreground text-[13px]'>
                      {item.desc}
                    </span>
                    <span className='text-primary font-serif text-[13px] italic'>
                      {item.question}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href={footer.href}
              onClick={group.close}
              className='border-border text-muted-foreground hover:text-ink hover:bg-secondary block border-t px-5 py-3 text-[13px] font-medium transition-colors duration-200'
            >
              {footer.label} →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function TrainMenu({ loggedIn }: { loggedIn: boolean }) {
  const t = useT(copy)
  return (
    <NavMenu
      id='train'
      label={t.train}
      items={[
        {
          href: loggedIn ? '/challenge' : '/onboarding',
          icon: Code2,
          title: t.trackCode,
          desc: t.trackCodeDesc,
          question: t.trackCodeQ,
        },
        {
          href: loggedIn ? '/design' : '/onboarding',
          icon: Network,
          title: t.trackDesign,
          desc: t.trackDesignDesc,
          question: t.trackDesignQ,
        },
      ]}
      footer={{
        href: loggedIn ? '/dashboard' : '/challenges',
        label: loggedIn ? t.resume : t.explore,
      }}
    />
  )
}

export function CommunityMenu() {
  const t = useT(copy)
  return (
    <NavMenu
      id='community'
      label={t.community}
      items={[
        {
          href: '/challenges',
          icon: Library,
          title: t.library,
          desc: t.libraryDesc,
          question: t.libraryQ,
        },
        {
          href: '/ranking',
          icon: Trophy,
          title: t.ranking,
          desc: t.rankingDesc,
          question: t.rankingQ,
        },
        {
          href: '/solutions',
          icon: Users,
          title: t.solutionsTitle,
          desc: t.solutionsDesc,
          question: t.solutionsQ,
        },
      ]}
      footer={{ href: '/#metodo', label: t.how }}
    />
  )
}
