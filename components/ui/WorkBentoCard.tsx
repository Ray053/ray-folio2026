'use client'
import { useRef, useCallback } from 'react'
import { useRouter } from '@/i18n/navigation'
import gsap from 'gsap'

export type WorkProject = {
  id: string
  slug: string
  title: string
  description: string
  tags: string[]
  year: number
  coverColor: string
  gridStyle?: React.CSSProperties
}

export function WorkBentoCard({ project }: { project: WorkProject }) {
  const router     = useRouter()
  const cardRef    = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const onMouseEnter = useCallback(() => {
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: 'power2.out' })
    gsap.to(contentRef.current, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' })
    gsap.to(cardRef.current, { scale: 1.015, duration: 0.35, ease: 'power2.out' })
  }, [])

  const onMouseLeave = useCallback(() => {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in' })
    gsap.to(contentRef.current, { y: 16, opacity: 0, duration: 0.25, ease: 'power2.in' })
    gsap.to(cardRef.current, { scale: 1, duration: 0.35, ease: 'power3.out' })
  }, [])

  return (
    <div
      ref={cardRef}
      className="work-bento-card"
      style={{
        // Grid placement from parent
        ...project.gridStyle,
        // Card itself
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        willChange: 'transform',
        position: 'relative',
        border: '1px solid var(--color-border)',
        // Must be block-level so grid row height actually applies
        display: 'block',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => router.push(`/work/${project.slug}`)}
    >
      {/* Gradient bg fills 100% of the card */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 70% 30%, ${project.coverColor}, #060d15)`,
      }} />

      {/* Default: title at bottom-left */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '20px 22px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
        zIndex: 1,
      }}>
        <p style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.9)',
          margin: 0,
          fontFamily: 'var(--font-syne), ui-sans-serif',
        }}>
          {project.title}
        </p>
      </div>

      {/* Hover overlay */}
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          zIndex: 2,
          background: 'rgba(6, 13, 21, 0.88)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <div
          ref={contentRef}
          style={{
            padding: '24px',
            width: '100%',
            transform: 'translateY(16px)',
            opacity: 0,
          }}
        >
          <p style={{
            fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--color-accent)',
            margin: '0 0 8px',
          }}>
            {project.year}
          </p>

          <h3 style={{
            fontFamily: 'var(--font-syne), ui-sans-serif',
            fontSize: 'clamp(15px, 1.5vw, 21px)',
            fontWeight: 700, color: '#fff',
            margin: '0 0 10px', lineHeight: 1.2,
          }}>
            {project.title}
          </h3>

          <p style={{
            fontSize: '13px', color: 'rgba(255,255,255,0.6)',
            margin: '0 0 14px', lineHeight: 1.6,
          }}>
            {project.description}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
            {project.tags.map(tag => (
              <span key={tag} style={{
                padding: '3px 10px', borderRadius: '2px',
                fontSize: '11px', fontWeight: 500,
                color: 'var(--color-accent)',
                border: '1px solid rgba(92,130,160,0.4)',
                backgroundColor: 'rgba(92,130,160,0.12)',
              }}>
                {tag}
              </span>
            ))}
          </div>

          <span style={{
            fontSize: '13px', fontWeight: 500,
            color: 'rgba(255,255,255,0.8)',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            View Case Study
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  )
}
