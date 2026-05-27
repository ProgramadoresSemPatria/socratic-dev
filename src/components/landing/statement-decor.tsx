'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef, type CSSProperties } from 'react'

const dither = (tilt: number): CSSProperties => ({
  background: `repeating-linear-gradient(${tilt}deg, rgba(110,86,207,0.20) 0px, rgba(110,86,207,0.20) 1px, transparent 1px, transparent 4px), radial-gradient(circle at 50% 45%, rgba(150,128,243,0.55) 0%, rgba(123,108,224,0.18) 48%, transparent 72%)`,
  WebkitMaskImage:
    'radial-gradient(60% 60% at 50% 50%, #000 20%, transparent 82%)',
  maskImage: 'radial-gradient(60% 60% at 50% 50%, #000 20%, transparent 82%)',
  filter: 'blur(2.5px)',
})

export function StatementDecor() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const yTopLeft = useTransform(scrollYProgress, [0, 1], [-70, 80])
  const yBottomRight = useTransform(scrollYProgress, [0, 1], [80, -70])

  return (
    <div ref={ref} aria-hidden className='pointer-events-none absolute inset-0'>
      <motion.div
        style={reduce ? undefined : { y: yTopLeft }}
        className='absolute -top-[6%] left-[3%] hidden w-[170px] sm:block lg:w-[250px]'
      >
        <motion.div
          className='aspect-square'
          style={dither(120)}
          animate={reduce ? undefined : { y: [0, -12, 0], rotate: [-6, -2, -6] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <motion.div
        style={reduce ? undefined : { y: yBottomRight }}
        className='absolute -right-[2%] -bottom-[14%] hidden w-[200px] sm:block lg:w-[300px]'
      >
        <motion.div
          className='aspect-square'
          style={dither(60)}
          animate={reduce ? undefined : { y: [0, 14, 0], rotate: [6, 10, 6] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  )
}
