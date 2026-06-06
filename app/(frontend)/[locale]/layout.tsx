import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter, Syne, Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { ScrollProgress } from '@/components/ui/ScrollProgress'
import { PageTransition } from '@/components/ui/PageTransition'
import { SmoothScroll } from '@/components/ui/SmoothScroll'
import '../../globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' })
const syne = Syne({ variable: '--font-syne', subsets: ['latin'], display: 'swap' })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Portfolio — Ray',
  description: 'UX Designer Portfolio',
  icons: {
    icon: [
      { url: '/logo-light.svg', media: '(prefers-color-scheme: light)' },
      { url: '/logo-dark.svg',  media: '(prefers-color-scheme: dark)'  },
    ],
  },
}

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}

const themeScript = `(function(){var s=localStorage.getItem('theme'),p=window.matchMedia('(prefers-color-scheme: dark)').matches,d=s?s==='dark':p;if(d)document.documentElement.classList.add('dark');})()`

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${syne.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
      </head>
      <body style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <NextIntlClientProvider messages={messages}>
          <SmoothScroll>
            <LoadingScreen />
            <ScrollProgress />
            <Navbar />
            <main style={{ flex: 1 }}>
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </SmoothScroll>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
