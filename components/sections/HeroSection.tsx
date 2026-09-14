'use client'
import { useRef, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ParticleCursor } from '@/components/three/ParticleCursor'
import { useMagnetic } from '@/lib/useMagnetic'

gsap.registerPlugin(ScrollTrigger)

function HeroText() {
  const t = useTranslations('hero')
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.35)
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
        <a ref={ctaRef} href="/cv.pdf" download style={{
          alignSelf: 'flex-start', marginTop: '4px',
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px 10px 18px', borderRadius: 0,
          border: '2px solid var(--color-ink)', boxShadow: '4px 4px 0 var(--color-ink)',
          background: 'var(--color-accent)', color: '#fff',
          fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
          fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          textDecoration: 'none', willChange: 'transform',
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
      {/* The translucent sculpture floats over the copy without capturing clicks. */}

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
