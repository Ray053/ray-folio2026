'use client'
import { useRef, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ParticleCursor } from '@/components/three/ParticleCursor'
import { WebcamToggle } from '@/components/ui/WebcamToggle'

gsap.registerPlugin(ScrollTrigger)

function HeroText() {
  const t = useTranslations('hero')
  return (
    <>
      <p style={{
        fontFamily: 'var(--font-syne), ui-sans-serif',
        fontSize: 'clamp(13px, 1.2vw, 16px)',
        fontWeight: 500,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--color-accent)',
        marginBottom: '16px',
      }}>
        {t('role')}
      </p>
      <h1 style={{
        fontFamily: 'var(--font-syne), ui-sans-serif',
        fontSize: 'clamp(48px, 7vw, 96px)',
        fontWeight: 700,
        lineHeight: 1.0,
        letterSpacing: '-0.03em',
        color: 'var(--color-text-primary)',
        margin: 0,
        textShadow: '0 2px 24px rgba(0,0,0,0.35)',
      }}>
        Ray
      </h1>
      <p style={{
        marginTop: '24px',
        fontSize: 'clamp(15px, 1.3vw, 18px)',
        color: 'var(--color-text-secondary)',
        maxWidth: '400px',
        lineHeight: 1.6,
        textShadow: '0 1px 12px rgba(0,0,0,0.3)',
      }}>
        {t('tagline')}
      </p>
    </>
  )
}

const NoiseBlobScene = dynamic(
  () => import('@/components/three/NoiseBlobScene').then(m => m.NoiseBlobScene),
  { ssr: false }
)

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const blobRef    = useRef<HTMLDivElement>(null)
  const textRef    = useRef<HTMLDivElement>(null)
  const [cam, setCam] = useState(false)
  const [inView, setInView] = useState(true)

  // Pause the R3F render loop when the hero scrolls out of view
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '100px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const base = {
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1.2,
      }

      // Blob: parallax DOWN — moves slower than scroll, feels like a deep background layer
      gsap.fromTo(blobRef.current,
        { y: -50 },
        { y: 180, ease: 'none', scrollTrigger: base }
      )

      // Text: parallax UP — moves faster than scroll, feels like a foreground layer
      gsap.to(textRef.current, {
        y: -100,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { ...base, end: '55% top' },
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
        backgroundColor: 'var(--color-background)',
      }}
    >
      {/* Stage backdrop — backlight glow + horizon */}
      <div className="hero-stage" />

      {/* Left gradient — sits BELOW the canvas so the figure isn't clipped */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        background: 'linear-gradient(to right, var(--color-background) 28%, transparent 65%)',
        opacity: cam ? 0.35 : 1,
        transition: 'opacity 0.8s ease',
        pointerEvents: 'none',
      }} />

      {/* Blob / figure — above the mask so the full figure reads */}
      <div
        ref={blobRef}
        style={{
          position: 'absolute',
          inset: '-60px',
          zIndex: 2,
          willChange: 'transform',
        }}
      >
        <NoiseBlobScene active={cam} inView={inView} />
      </div>

      <ParticleCursor />

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

      {/* Webcam toggle — bottom right */}
      <div style={{
        position: 'absolute',
        bottom: 'clamp(20px, 4vw, 36px)',
        right: 'clamp(20px, 4vw, 36px)',
        zIndex: 25,
      }}>
        <WebcamToggle active={cam} onChange={setCam} />
      </div>
    </section>
  )
}
