'use client'
import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import gsap from 'gsap'

export type AboutInfo = {
  name?: string
  bio?: string
  photoSrc?: string
  email?: string
  github?: string
  linkedin?: string
  cvSrc?: string
}

export function AboutSection({ info }: { info?: AboutInfo }) {
  const t = useTranslations('about')
  const wrapRef = useRef<HTMLDivElement>(null)
  const bioParas = info?.bio ? info.bio.split('\n').filter(Boolean) : null

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.about-photo', {
        x: -40,
        opacity: 0,
        duration: 0.9,
        ease: 'power4.out',
        delay: 0.1,
      })
      gsap.from('.about-line', {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: 'power4.out',
        stagger: 0.1,
        delay: 0.25,
      })
    }, wrapRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={wrapRef}>
      {/* Page header */}
      <div style={{
        padding: 'clamp(64px, 8vw, 120px) 24px clamp(32px, 4vw, 56px)',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <p className="about-line" style={{
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          marginBottom: '16px',
        }}>
          {t('eyebrow')}
        </p>
        <h1 className="about-line" style={{
          fontFamily: 'var(--font-syne), ui-sans-serif',
          fontSize: 'clamp(40px, 5vw, 72px)',
          fontWeight: 700,
          lineHeight: 1.0,
          letterSpacing: '-0.03em',
          color: 'var(--color-text-primary)',
          margin: 0,
        }}>
          {info?.name || 'Ray'}
        </h1>
      </div>

      {/* Divider */}
      <div style={{
        height: '1px',
        backgroundColor: 'var(--color-border)',
        maxWidth: '1200px',
        margin: '0 auto',
      }} />

      {/* Main content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(48px, 6vw, 96px) 24px clamp(80px, 10vw, 140px)',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 3fr)',
        gap: 'clamp(40px, 6vw, 96px)',
        alignItems: 'start',
      }}>

        {/* Photo */}
        <div className="about-photo" style={{ position: 'sticky', top: '96px' }}>
          <div style={{
            aspectRatio: '3/4',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            position: 'relative',
          }}>
            {info?.photoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.photoSrc} alt={info.name || 'Profile'} style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              }} />
            ) : (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(160deg, var(--color-surface-2) 0%, var(--color-surface) 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="1.2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
                  Photo via CMS
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

          {/* Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 className="about-line" style={{
              fontFamily: 'var(--font-syne), ui-sans-serif',
              fontSize: 'clamp(20px, 2vw, 28px)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}>
              {t('role')}
            </h2>

            {(bioParas ?? [t('bio1'), t('bio2')]).map((para, i) => (
              <p key={i} className="about-line" style={{
                fontSize: '16px',
                lineHeight: 1.8,
                color: 'var(--color-text-secondary)',
                margin: 0,
              }}>
                {para}
              </p>
            ))}
          </div>

          {/* Divider */}
          <div className="about-line" style={{
            height: '1px',
            backgroundColor: 'var(--color-border)',
          }} />

          {/* Contact */}
          <div className="about-line" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              margin: 0,
            }}>
              {t('contactHeading')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <ContactRow label="Email" value={info?.email || 'ray70804@gmail.com'} href={`mailto:${info?.email || 'ray70804@gmail.com'}`} />
              {info?.github && <ContactRow label="GitHub" value={info.github.replace(/^https?:\/\//, '')} href={info.github} />}
              {info?.linkedin && <ContactRow label="LinkedIn" value={info.linkedin.replace(/^https?:\/\//, '')} href={info.linkedin} />}
              {!info?.github && <ContactRow label="GitHub" value="github.com/ray" href="https://github.com/" />}
              {!info?.linkedin && <ContactRow label="LinkedIn" value="linkedin.com/in/ray" href="https://linkedin.com/" />}
            </div>
          </div>

          {/* CV */}
          <div className="about-line">
            <a
              href={info?.cvSrc || '/cv.pdf'}
              download
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                textDecoration: 'none',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-accent)'
                e.currentTarget.style.background = 'color-mix(in srgb, var(--color-accent) 6%, transparent)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {t('downloadCV')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContactRow({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
      <span style={{
        fontSize: '12px',
        color: 'var(--color-text-muted)',
        width: '64px',
        flexShrink: 0,
      }}>
        {label}
      </span>
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        style={{
          fontSize: '15px',
          color: 'var(--color-text-secondary)',
          textDecoration: 'none',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-accent)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
      >
        {value}
      </a>
    </div>
  )
}
