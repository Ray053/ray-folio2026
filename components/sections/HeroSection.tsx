'use client'
import { useRef, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ParticleCursor } from '@/components/three/ParticleCursor'

gsap.registerPlugin(ScrollTrigger)

function HeroText() {
  const t = useTranslations('hero')
  return (
    <>
      <h1 style={{
        fontFamily: 'var(--font-syne), ui-sans-serif',
        fontSize: 'clamp(56px, 9vw, 128px)',
        fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.03em',
        textTransform: 'uppercase',
        color: 'var(--color-text-primary)', margin: 0,
      }}>
        Ray
      </h1>

      <div className="hard-block" style={{
        marginTop: '24px', maxWidth: '380px',
        padding: '20px 22px', borderRadius: 0,
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <p className="mono-label" style={{ margin: 0 }}>
          {'// '}{t('role')}
        </p>
        <p style={{
          fontSize: 'clamp(14px, 1.2vw, 16px)', lineHeight: 1.6,
          color: 'var(--color-text-secondary)', margin: 0,
        }}>
          {t('tagline')}
        </p>
        <a href="/cv.pdf" download style={{
          alignSelf: 'flex-start', marginTop: '4px',
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px 10px 18px', borderRadius: 0,
          border: '2px solid var(--color-ink)', boxShadow: '4px 4px 0 var(--color-ink)',
          background: 'var(--color-accent)', color: '#fff',
          fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
          fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          textDecoration: 'none',
        }}>
          {t('downloadCV')}
          <span style={{
            width: '26px', height: '26px', borderRadius: 0,
            background: 'var(--color-acid)', color: 'var(--color-ink)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>↗</span>
        </a>
      </div>
    </>
  )
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const textRef    = useRef<HTMLDivElement>(null)
  const [lowPower, setLowPower] = useState(false)

  // Detect mobile / touch devices to reduce cost
  useEffect(() => {
    setLowPower(window.matchMedia('(max-width: 768px), (pointer: coarse)').matches)
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Text: parallax UP — moves faster than scroll, feels like a foreground layer
      gsap.to(textRef.current, {
        y: -100,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '55% top',
          scrub: 1.2,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'transparent',
      }}
    >
      {/* Blue halo — makes the orb read as a light source */}
      <div aria-hidden style={{
        position: 'absolute', zIndex: 0, pointerEvents: 'none',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 'min(90vw, 900px)', height: 'min(90vw, 900px)',
        background: 'radial-gradient(circle, var(--color-shadow-accent) 0%, transparent 60%)',
        filter: 'blur(40px)',
      }} />

      {/* Stage backdrop — backlight glow + horizon */}
      <div className="hero-stage" />

      {/* Bauhaus geometric motifs */}
      <div aria-hidden style={{
        position: 'absolute', zIndex: 1, pointerEvents: 'none',
        right: 'clamp(24px, 9vw, 140px)', top: '20%',
        width: 'clamp(56px, 7vw, 104px)', height: 'clamp(56px, 7vw, 104px)',
        background: 'var(--color-acid)', border: '2px solid var(--color-ink)',
        transform: 'rotate(-8deg)',
      }} />
      <div aria-hidden style={{
        position: 'absolute', zIndex: 1, pointerEvents: 'none',
        right: 'clamp(90px, 16vw, 260px)', bottom: '22%',
        width: 'clamp(40px, 5vw, 72px)', height: 'clamp(40px, 5vw, 72px)',
        borderRadius: '9999px',
        background: 'transparent', border: '3px solid var(--color-accent)',
      }} />

      {/* Left gradient — sits BELOW the canvas so the figure isn't clipped */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        background: 'linear-gradient(to right, var(--color-background) 22%, transparent 60%)',
        opacity: 1,
        pointerEvents: 'none',
      }} />

      {/* The travelling ball is rendered by the page-level fixed JourneyBall layer. */}

      {!lowPower && <ParticleCursor />}

      {/* Text — separate ref for scroll animation */}
      <div
        ref={textRef}
        style={{
          position: 'relative',
          zIndex: 20,
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '0 24px',
          willChange: 'transform, opacity',
        }}
      >
        <HeroText />
      </div>
    </section>
  )
}
