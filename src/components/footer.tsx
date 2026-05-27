import Link from 'next/link'
import { Logo } from './logo'

export function Footer() {
  return (
    <footer className='mt-8'>
      <div className='container-main'>
        <div className='flex flex-col items-center gap-4 rounded-xl border border-[#DFE5E9] bg-white px-6 py-6 text-sm text-[#6b6478] sm:flex-row sm:justify-between sm:px-8'>
          <Logo />

          <nav className='flex items-center gap-5'>
            <Link href='#' className='transition-colors hover:text-[#1b1916]'>
              Privacidade
            </Link>
            <Link href='#' className='transition-colors hover:text-[#1b1916]'>
              Termos
            </Link>
            <span className='text-[#6b6478]'>© 2026 Socratic.dev</span>
          </nav>
        </div>
      </div>
    </footer>
  )
}
