'use client'
import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AmbientGlow } from '@/components/ui/AmbientGlow'

gsap.registerPlugin(ScrollTrigger)

export type ProjectItem = {
  id: string
  slug: string
  title: string
  tags: string[]
  year: number
  coverColor: string
  videoSrc?: string
  coverSrc?: string
}

// Project clips used when a project has no video of its own (so hover still plays).
const SAMPLE_VIDEOS = ['/taichung.webm', '/chuanghua.mp4']

const PLACEHOLDER_PROJECTS: ProjectItem[] = [
  { id: '1', slug: 'healthcare-app-redesign', title: 'Healthcare App Redesign', tags: ['UX Research', 'Product Design'], year: 2025, coverColor: '#0033FF' },
  { id: '2', slug: 'e-commerce-checkout', title: 'E-Commerce Checkout Flow', tags: ['Interaction Design', 'Testing'], year: 2024, coverColor: '#001A80' },
  { id: '3', slug: 'design-system', title: 'Design System at Scale', tags: ['Design Systems', 'Components'], year: 2024, coverColor: '#3D6BFF' },
]

export function ProjectsSection({ projects }: { projects?: ProjectItem[] }) {
  const t = useTranslations('projects')
  const router = useRouter()
  const PROJECTS = projects && projects.length ? projects : PLACEHOLDER_PROJECTS
  const sectionRef = useRef<HTMLElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const xTo = useRef<((v: number) => void) | null>(null)
  const yTo = useRef<((v: number) => void) | null>(null)

  const [active, setActive]   = useState<number | null>(null)
  const [current, setCurrent] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Smooth cursor follow — global listener so the card tracks anywhere
  useEffect(() => {
    if (!mounted) return
    const onMouseMove = (e: MouseEvent) => {
      if (!previewRef.current) return
      if (!xTo.current) {
        xTo.current = gsap.quickTo(previewRef.current, 'x', { duration: 0.4, ease: 'power3' })
        yTo.current = gsap.quickTo(previewRef.current, 'y', { duration: 0.4, ease: 'power3' })
      }
      xTo.current?.(e.clientX + 24)
      yTo.current?.(e.clientY - 90)
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [mounted])

  // Show / hide preview
  useEffect(() => {
    gsap.to(previewRef.current, {
      opacity: active !== null ? 1 : 0,
      scale:   active !== null ? 1 : 0.8,
      duration: 0.35,
      ease: 'power3.out',
    })
  }, [active])

  // Entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance — slide only (never hides opacity, so content can't vanish)
      gsap.from('.acc-head', {
        y: 36, duration: 0.7, ease: 'power4.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
      })
      gsap.from('.acc-row', {
        y: 30, duration: 0.6, ease: 'power4.out', stagger: 0.08,
        scrollTrigger: { trigger: '.acc-list', start: 'top 88%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const proj = PROJECTS[current]

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        padding: 'clamp(64px, 8vw, 120px) clamp(24px, 4vw, 56px)',
        backgroundColor: 'transparent',
        overflow: 'hidden',
      }}
    >
      <AmbientGlow />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', margin: '0 auto',
      }}>
        {/* Heading */}
        <div className="acc-head" style={{ marginBottom: 'clamp(32px, 5vw, 56px)' }}>
          <p className="mono-label" style={{ marginBottom: '12px' }}>
            {'// '}{t('eyebrow')}
          </p>
          <h2 style={{
            fontFamily: 'var(--font-syne), ui-sans-serif',
            fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 700,
            lineHeight: 1.1, letterSpacing: '-0.02em', textTransform: 'uppercase',
            color: 'var(--color-text-primary)', margin: 0,
          }}>
            {t('heading')}
          </h2>
        </div>

        {/* Accordion list */}
        <div
          className="acc-list"
          style={{ borderTop: '2px solid var(--color-ink)' }}
          onMouseLeave={() => setActive(null)}
        >
          {PROJECTS.map((p, i) => {
            const isActive = active === i
            const dim = active !== null && !isActive
            return (
              <div
                key={p.id}
                className="acc-row"
                onMouseEnter={() => { setActive(i); setCurrent(i) }}
                onClick={() => router.push(`/work/${p.slug}`)}
                style={{
                  borderBottom: '2px solid var(--color-ink)',
                  padding: isActive ? '36px 8px' : '24px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '24px',
                  cursor: 'pointer',
                  opacity: dim ? 0.4 : 1,
                  transition: 'padding 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'clamp(16px, 3vw, 40px)' }}>
                  <span className="mono-label" style={{ color: 'var(--color-accent)' }}>
                    [0{i + 1}]
                  </span>
                  <h3 style={{
                    fontFamily: 'var(--font-syne), ui-sans-serif',
                    fontSize: 'clamp(26px, 4vw, 52px)',
                    fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em',
                    margin: 0, textTransform: 'uppercase',
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-primary)',
                    transform: isActive ? 'translateX(12px)' : 'translateX(0)',
                    transition: 'color 0.3s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)',
                  }}>
                    {p.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{p.year}</span>
                  <svg
                    width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke={isActive ? 'var(--color-accent)' : 'var(--color-text-muted)'}
                    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                    style={{
                      transform: isActive ? 'translateX(4px)' : 'translateX(0)',
                      transition: 'transform 0.3s ease, stroke 0.3s ease',
                    }}
                  >
                    <path d="M7 17L17 7M17 7H8M17 7v9"/>
                  </svg>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cursor-following preview card — portaled to body to escape any
          transformed ancestor (PageTransition / trajectory) */}
      {mounted && createPortal(
        <div
          ref={previewRef}
          aria-hidden
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '260px',
            height: '170px',
            borderRadius: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 45,
            opacity: 0,
            border: '2px solid var(--color-ink)',
            boxShadow: '6px 6px 0 var(--color-ink)',
            willChange: 'transform',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            background: proj.coverColor,
          }} />
          {proj.coverSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={proj.coverSrc} alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          <video
            key={current}
            src={SAMPLE_VIDEOS[current % SAMPLE_VIDEOS.length]}
            muted loop autoPlay playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px 14px',
            background: 'var(--color-ink)',
          }}>
            <p style={{
              fontFamily: 'var(--font-syne), ui-sans-serif',
              fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0,
            }}>
              {proj.title}
            </p>
          </div>
        </div>,
        document.body,
      )}
    </section>
  )
}
