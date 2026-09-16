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
import { CookieConsent } from '@/components/ui/CookieConsent'
import { GoogleAnalytics } from '@/components/ui/GoogleAnalytics'
import { CustomCursor } from '@/components/ui/CustomCursor'
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
      <body style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {/* Sets .dark on <html> before hydration so there's no flash of the
            wrong theme. suppressHydrationWarning on <html> above covers the
            resulting className mismatch between the server markup and this. */}
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function () {
            try {
              var saved = localStorage.getItem('theme');
              var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
              document.documentElement.classList.toggle('dark', dark);
            } catch (e) {}
          })();
        `}</Script>
        <GoogleAnalytics />
        <NextIntlClientProvider messages={messages}>
          <SmoothScroll>
            <CustomCursor />
            <LoadingScreen />
            <ScrollProgress />
            <Navbar />
            <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
            <CookieConsent />
          </SmoothScroll>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
