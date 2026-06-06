'use client'
import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const PLACEHOLDER_THUMBNAILS = [
  { id: '1', aspectRatio: '9/16' },
  { id: '2', aspectRatio: '9/16' },
  { id: '3', aspectRatio: '9/16' },
]

export function DanceTeaser() {
  const t = useTranslations('danceTeaser')
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.dance-text', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: 'power4.out',
        scrollTrigger: { trigger: '.dance-text', start: 'top 88%' },
      })
      gsap.from('.dance-thumb', {
        y: 40,
        opacity: 0,
        duration: 0.6,
        ease: 'power4.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '.dance-thumbs', start: 'top 85%' },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        padding: 'clamp(64px, 8vw, 112px) 24px',
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '48px',
          alignItems: 'center',
        }}
      >
        {/* Left: text */}
        <div className="dance-text">
          <p style={{
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            marginBottom: '12px',
          }}>
            {t('eyebrow')}
          </p>

          <h2 style={{
            fontFamily: 'var(--font-syne), ui-sans-serif',
            fontSize: 'clamp(28px, 3.5vw, 48px)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: 'var(--color-text-primary)',
            margin: '0 0 16px',
          }}>
            {t('heading')}
          </h2>

          <p style={{
            fontSize: '15px',
            color: 'var(--color-text-muted)',
            maxWidth: '320px',
            lineHeight: 1.7,
            margin: '0 0 28px',
          }}>
            {t('description')}
          </p>

          <Link
            href="/dance"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '2px',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.color = 'var(--color-text-primary)'
              el.style.borderColor = 'var(--color-text-primary)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.color = 'var(--color-text-secondary)'
              el.style.borderColor = 'var(--color-border)'
            }}
          >
            {t('cta')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        {/* Right: thumbnail strip */}
        <div
          className="dance-thumbs"
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          {PLACEHOLDER_THUMBNAILS.map((thumb, i) => (
            <div
              key={thumb.id}
              className="dance-thumb"
              style={{
                width: `${88 - i * 8}px`,
                aspectRatio: thumb.aspectRatio,
                borderRadius: '8px',
                backgroundColor: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
                flexShrink: 0,
                opacity: 1 - i * 0.18,
                transform: `scale(${1 - i * 0.04})`,
                position: 'relative',
              }}
            >
              {/* Placeholder shimmer */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(160deg, var(--color-surface-2), var(--color-surface))`,
              }} />
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg
                  width="18" height="18"
                  viewBox="0 0 24 24" fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="1.5"
                >
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
