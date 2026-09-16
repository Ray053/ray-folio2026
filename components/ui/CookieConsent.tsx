'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import gsap from 'gsap'
import { ease, duration } from '@/lib/motion'
import { useMagnetic } from '@/lib/useMagnetic'

const STORAGE_KEY = 'cookie-consent'

/**
 * Honest cookie/local-storage notice — covers localStorage for theme, the
 * locale cookie next-intl already sets, and Google Analytics, which only
 * loads after Accept (see GoogleAnalytics.tsx, gated on this same
 * localStorage key / the 'cookie-consent-accepted' event fired below).
 */
export function CookieConsent() {
  const t = useTranslations('cookieConsent')
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLSpanElement>(null)
  const acceptRef = useMagnetic<HTMLButtonElement>(0.3)

  useEffect(() => {
    setMounted(true)
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {}
  }, [])

  // Pop in from the bottom-left after a beat — late enough to not compete
  // with the loading-screen / hero entrance animations already running.
  useEffect(() => {
    if (!visible || !cardRef.current) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    gsap.fromTo(cardRef.current,
      { y: 40, opacity: 0, rotate: reduce ? 0 : -1.5 },
      {
        y: 0, opacity: 1, rotate: 0,
        duration: reduce ? 0.2 : duration.slower,
        ease: ease.outBack,
        delay: reduce ? 0 : 0.9,
      })
  }, [visible])

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, 'accepted') } catch {}
    window.dispatchEvent(new Event('cookie-consent-accepted'))
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduce) {
      gsap.to(iconRef.current, { rotate: 360, duration: duration.slow, ease: ease.hover })
    }
    gsap.to(cardRef.current, {
      y: 40, opacity: 0,
      duration: reduce ? 0.15 : duration.base,
      ease: ease.inOut,
      delay: reduce ? 0 : 0.15,
      onComplete: () => setVisible(false),
    })
  }

  if (!mounted || !visible) return null

  return createPortal(
    <div style={{
      position: 'fixed', zIndex: 45,
      left: 'clamp(16px, 3vw, 32px)', right: 'clamp(16px, 3vw, 32px)',
      bottom: 'clamp(16px, 3vw, 32px)',
      display: 'flex', justifyContent: 'flex-start',
      pointerEvents: 'none',
    }}>
      <div
        ref={cardRef}
        className="hard-block"
        role="dialog"
        aria-label={t('message')}
        style={{
          pointerEvents: 'auto',
          maxWidth: '380px', width: '100%',
          padding: '18px 20px',
          display: 'flex', flexDirection: 'column', gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span ref={iconRef} aria-hidden style={{ fontSize: '20px', lineHeight: 1, flexShrink: 0, display: 'inline-block' }}>
            🍪
          </span>
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: 0 }}>
            {t('message')}
          </p>
        </div>
        <button
          ref={acceptRef}
          onClick={accept}
          style={{
            alignSelf: 'flex-end',
            padding: '8px 16px', border: '2px solid var(--color-ink)',
            background: 'var(--color-accent)', color: '#fff',
            fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
            fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
            boxShadow: '3px 3px 0 var(--color-ink)',
            cursor: 'pointer', willChange: 'transform',
          }}
        >
          {t('accept')}
        </button>
      </div>
    </div>,
    document.body,
  )
}
