import { Footer } from '@/components/footer'
import { Features } from '@/components/landing/features'
import { FinalCta } from '@/components/landing/final-cta'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { LogoCloud } from '@/components/landing/logo-cloud'
import { Showcase } from '@/components/landing/showcase'
import { Statement } from '@/components/landing/statement'
import { Stats } from '@/components/landing/stats'
import { Testimonial } from '@/components/landing/testimonial'
import { Trust } from '@/components/landing/trust'
import { UseCases } from '@/components/landing/usecases'
import { Navbar } from '@/components/navbar'

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
