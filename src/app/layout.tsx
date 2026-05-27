import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { DM_Mono, DM_Sans, Noto_Serif } from 'next/font/google'
import './globals.css'

const dmSansHeading = DM_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['300', '400', '500', '600', '700'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

const notoSerif = Noto_Serif({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Socratic.dev — A IA que te faz pensar',
  description:
    'Um ambiente de código onde a IA nunca te dá a resposta — ela te faz chegar lá. Para devs que querem aprender de verdade na era da IA.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='pt-BR'
      className={cn(
        'h-full antialiased',
        dmSans.variable,
        dmSansHeading.variable,
        dmMono.variable,
        notoSerif.variable,
        'font-sans',
      )}
    >
      <body className='flex min-h-full flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary'>
        {children}
      </body>
    </html>
  )
}
