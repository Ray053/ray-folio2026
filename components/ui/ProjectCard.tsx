'use client'
import { useRef, useCallback } from 'react'
import { useRouter } from '@/i18n/navigation'
import gsap from 'gsap'

type Project = {
  id: string
  slug: string
  title: string
  description: string
  tags: string[]
  year: number
  coverColor: string
  videoSrc?: string
}

export function ProjectCard({ project }: { project: Project }) {
  const router     = useRouter()
  const cardRef    = useRef<HTMLDivElement>(null)
  const innerRef   = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const videoRef   = useRef<HTMLVideoElement>(null)

  // 3D parallax tilt on mouse move
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width  - 0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5

    gsap.to(innerRef.current, {
      rotateY: x * 10,
      rotateX: -y * 8,
      duration: 0.4,
      ease: 'power2.out',
    })
    gsap.to(card.querySelector('.card-bg'), {
      x: x * 16, y: y * 12,
      duration: 0.4, ease: 'power2.out',
    })
  }, [])

  const onMouseEnter = useCallback(() => {
    videoRef.current?.play().catch(() => {})
    gsap.to(innerRef.current, { scale: 1.02, duration: 0.4, ease: 'power2.out' })
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.35, ease: 'power2.out' })
    gsap.to(contentRef.current, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' })
  }, [])

  const onMouseLeave = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
    gsap.to(innerRef.current, {
      rotateX: 0, rotateY: 0, scale: 1,
      duration: 0.6, ease: 'power3.out',
    })
    gsap.to(card.querySelector('.card-bg'), { x: 0, y: 0, duration: 0.6, ease: 'power3.out' })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in' })
    gsap.to(contentRef.current, { y: 16, opacity: 0, duration: 0.25, ease: 'power2.in' })
  }, [])

  return (
    <div
      ref={cardRef}
      className="project-card"
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => router.push(`/work/${project.slug}`)}
      style={{ perspective: '900px', cursor: 'pointer' }}
    >
      <div
        ref={innerRef}
        style={{
          position: 'relative',
          aspectRatio: '4/5',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid color-mix(in srgb, var(--color-border) 70%, transparent)',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          boxShadow: '0 8px 32px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.06)',
          background: project.coverColor,
        }}
      >
        {/* Animated gradient cover (parallax layer) */}
        <div
          className="card-bg"
          style={{
            position: 'absolute',
            inset: '-12%',
            background: `radial-gradient(ellipse at 65% 35%, ${project.coverColor}, #060d15)`,
            willChange: 'transform',
          }}
        />

        {/* Video */}
        {project.videoSrc && (
          <video
            ref={videoRef}
            src={project.videoSrc}
            muted loop playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Default: title at bottom over scrim */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          padding: '22px 24px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
          zIndex: 1,
        }}>
          <p style={{
            fontFamily: 'var(--font-syne), ui-sans-serif',
            fontSize: '16px', fontWeight: 600,
            color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.25,
          }}>
            {project.title}
          </p>
        </div>

        {/* Hover overlay — liquid glass reveal */}
        <div
          ref={overlayRef}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            zIndex: 2,
            background: 'rgba(6, 13, 21, 0.55)',
            backdropFilter: 'blur(14px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(14px) saturate(1.3)',
            display: 'flex',
            alignItems: 'flex-end',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <div
            ref={contentRef}
            style={{ padding: '24px', width: '100%', transform: 'translateY(16px)', opacity: 0 }}
          >
            <p style={{
              fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--color-accent)', margin: '0 0 8px',
            }}>
              {project.year}
            </p>
            <h3 style={{
              fontFamily: 'var(--font-syne), ui-sans-serif',
              fontSize: 'clamp(17px, 1.6vw, 22px)', fontWeight: 700,
              color: '#fff', margin: '0 0 10px', lineHeight: 1.2,
            }}>
              {project.title}
            </h3>
            <p style={{
              fontSize: '13px', color: 'rgba(255,255,255,0.62)',
              margin: '0 0 14px', lineHeight: 1.6,
            }}>
              {project.description}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
              {project.tags.map(tag => (
                <span key={tag} style={{
                  padding: '3px 10px', borderRadius: '2px', fontSize: '11px', fontWeight: 500,
                  color: 'var(--color-accent)',
                  border: '1px solid rgba(92,130,160,0.4)',
                  backgroundColor: 'rgba(92,130,160,0.12)',
                }}>
                  {tag}
                </span>
              ))}
            </div>
            <span style={{
              fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)',
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
    </div>
  )
}
