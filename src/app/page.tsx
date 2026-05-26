import { Footer } from '@/components/footer'
import { Comparison } from '@/components/landing/comparison'
import { CTA } from '@/components/landing/cta'
import { Hero } from '@/components/landing/hero'
import { Manifesto } from '@/components/landing/manifesto'
import { Method } from '@/components/landing/method'
import { Problem } from '@/components/landing/problem'
import { Navbar } from '@/components/navbar'

export default function HomePage() {
  return (
    <div className='relative flex flex-1 flex-col overflow-x-hidden'>
      <Navbar />
      <main className='flex-1'>
        <Hero />
        <Problem />
        <Method />
        <Comparison />
        <Manifesto />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
