'use client'
import { useTranslations } from 'next-intl'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ease, duration, scrollTriggerDefaults } from '@/lib/motion'
import { useMagnetic } from '@/lib/useMagnetic'

gsap.registerPlugin(ScrollTrigger)

export function Footer() {
  const t = useTranslations('footer')
  const footerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.footer-line', {
        y: 24, opacity: 0, duration: duration.slow, ease: ease.outExpo, stagger: 0.1,
        scrollTrigger: { trigger: footerRef.current, start: scrollTriggerDefaults.start },
      })
    }, footerRef)
    return () => ctx.revert()
  }, [])

  return (
    <footer
      ref={footerRef}
      id="site-footer"
      style={{
        backgroundColor: 'transparent',
        color: 'var(--color-ink)',
        padding: 'clamp(48px, 7vw, 88px) 24px',
        position: 'relative', zIndex: 1,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          className="footer-line"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
              fontSize: 'clamp(20px, 3vw, 40px)',
              textTransform: 'uppercase', letterSpacing: '0.02em',
              color: 'var(--color-ink)', margin: 0, wordBreak: 'break-all',
            }}
          >
            ray70804@gmail.com
          </p>

          <div style={{ display: 'flex', gap: '24px' }}>
            <FooterLink href="https://github.com/" label="GitHub" />
            <FooterLink href="https://linkedin.com/" label="LinkedIn" />
          </div>
        </div>

        <p
          className="footer-line"
          style={{
            fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
            fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--color-text-secondary)', margin: 0,
          }}
        >
          © {new Date().getFullYear()} Ray. {t('rights')}.
        </p>
      </div>
    </footer>
  )
}

function FooterLink({ href, label }: { href: string; label: string }) {
  const underlineRef = useRef<HTMLSpanElement>(null)
  const magneticRef = useMagnetic<HTMLAnchorElement>(0.25)

  const onEnter = () => {
    gsap.to(underlineRef.current, { scaleX: 1, duration: duration.base, ease: ease.outExpo })
  }
  const onLeave = () => {
    gsap.to(underlineRef.current, { scaleX: 0, duration: duration.fast, ease: ease.hover })
  }

  return (
    <a
      ref={magneticRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
        fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--color-ink)',
        textDecoration: 'none', position: 'relative',
        display: 'inline-block', willChange: 'transform', paddingBottom: '2px',
      }}
    >
      {label}
      <span
        ref={underlineRef}
        aria-hidden
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          height: '1px', backgroundColor: 'var(--color-accent)',
          transform: 'scaleX(0)', transformOrigin: 'left center',
        }}
      />
    </a>
  )
}
