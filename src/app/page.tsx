import { Footer } from '@/components/footer'
import { Navbar } from '@/components/navbar'
import { Features } from '@/features/landing/components/features'
import { FinalCta } from '@/features/landing/components/final-cta'
import { Hero } from '@/features/landing/components/hero'
import { HowItWorks } from '@/features/landing/components/how-it-works'
import { LogoCloud } from '@/features/landing/components/logo-cloud'
import { Modes } from '@/features/landing/components/modes'
import { Showcase } from '@/features/landing/components/showcase'
import { Statement } from '@/features/landing/components/statement'
import { Stats } from '@/features/landing/components/stats'
import { Testimonial } from '@/features/landing/components/testimonial'
import { Trust } from '@/features/landing/components/trust'
import { UseCases } from '@/features/landing/components/usecases'

export default function HomePage() {
  return (
    <div className='relative flex flex-1 flex-col overflow-x-hidden bg-white'>
      <Navbar />
      <main className='flex-1 pt-[88px] pb-8 md:pt-20'>
        <div className='container-main'>
          {/* Continuous bordered frame — sections separated by hairline dividers */}
          <div className='divide-y divide-[#DFE5E9] overflow-hidden rounded-xl border border-[#DFE5E9] bg-white'>
            <Hero />
            <LogoCloud />
            <Statement />
            <Showcase />
            <HowItWorks />
            <Modes />
            <Features />
            <UseCases />
            <Stats />
            <Trust />
            <Testimonial />
            <FinalCta />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
