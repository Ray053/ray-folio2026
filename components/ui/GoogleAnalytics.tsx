'use client'
import { useEffect, useState } from 'react'
import Script from 'next/script'

const GA_ID = 'G-90YZEWMJ0K'
const STORAGE_KEY = 'cookie-consent'

/**
 * Loads gtag.js only once the visitor has accepted the cookie notice —
 * either already accepted in a past visit (checked on mount) or accepted
 * just now (CookieConsent fires 'cookie-consent-accepted' on click, so GA
 * turns on immediately without needing a reload).
 */
export function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'accepted') setEnabled(true)
    } catch {}
    const onAccept = () => setEnabled(true)
    window.addEventListener('cookie-consent-accepted', onAccept)
    return () => window.removeEventListener('cookie-consent-accepted', onAccept)
  }, [])

  if (!enabled) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
      `}</Script>
    </>
  )
}
