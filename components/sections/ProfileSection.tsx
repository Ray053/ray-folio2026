'use client'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const INTRO =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.'

export function ProfileSection({ photoSrc }: { photoSrc?: string }) {
  const sectionRef = useRef<HTMLElement>(null)
  const textRef    = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.profile-photo', {
        y: 44, opacity: 0, duration: 0.9, ease: 'power4.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      })
      gsap.fromTo('.fill-word',
        { opacity: 0.16 },
        {
          opacity: 1, ease: 'none', duration: 0.4, stagger: 0.3,
          scrollTrigger: { trigger: textRef.current, start: 'top 80%', end: 'bottom 55%', scrub: true },
        }
      )

      // Photo parallax — image drifts inside its frame as you scroll
      gsap.fromTo('.profile-photo-img',
        { yPercent: -10 },
        {
          yPercent: 10, ease: 'none',
          scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: true },
        }
      )
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const words = INTRO.split(' ')

  return (
    <section
      ref={sectionRef}
      id="profile"
      style={{
        position: 'relative',
        padding: 'clamp(80px, 10vw, 140px) 24px',
        backgroundColor: 'transparent',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.85fr) minmax(0, 1.15fr)',
          gap: 'clamp(40px, 6vw, 88px)',
          alignItems: 'start',
        }}
      >
        {/* Left — photo */}
        <div className="profile-photo" style={{ position: 'sticky', top: '96px' }}>
          <div style={{
            aspectRatio: '4/5',
            borderRadius: 0,
            overflow: 'hidden',
            border: '2px solid var(--color-ink)',
            boxShadow: '8px 8px 0 var(--color-accent)',
            backgroundColor: 'var(--color-surface-2)',
            position: 'relative',
          }}>
            {photoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoSrc} alt="Profile" className="profile-photo-img" style={{
                position: 'absolute', left: 0, top: '-15%', width: '100%', height: '130%',
                objectFit: 'cover', willChange: 'transform',
              }} />
            ) : (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(160deg, var(--color-surface-2), var(--color-surface))',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '12px',
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

        {/* Right — intro text with scroll fill */}
        <div>
          <p className="mono-label" style={{ marginBottom: '20px' }}>
            {'// '}About Me
          </p>
          <p
            ref={textRef}
            style={{
              fontFamily: 'var(--font-syne), ui-sans-serif',
              fontSize: 'clamp(20px, 2.4vw, 34px)',
              fontWeight: 600,
              lineHeight: 1.45,
              letterSpacing: '-0.01em',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            {words.map((w, i) => (
              <span key={i} className="fill-word" style={{ opacity: 0.16 }}>
                {w}{' '}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}
