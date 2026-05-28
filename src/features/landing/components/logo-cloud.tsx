'use client'

const stack = [
  'Claude',
  'TypeScript',
  'Next.js',
  'React',
  'Monaco',
  'Node.js',
  'Tailwind',
  'Vercel',
]

export function LogoCloud() {
  return (
    <section className='py-6'>
      <div className='relative overflow-hidden'>
        <div className='flex w-max animate-marquee hover:[animation-play-state:paused]'>
          {[0, 1].map((dup) => (
            <div key={dup} className='flex' aria-hidden={dup === 1}>
              {stack.map((name) => (
                <div
                  key={`${dup}-${name}`}
                  className='flex flex-shrink-0 items-center justify-center px-6 sm:px-8'
                >
                  <span className='font-heading text-xl font-medium tracking-tight text-[#1b1916]/35 grayscale sm:text-2xl'>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
