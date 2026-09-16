'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from '@/i18n/navigation'
import { ProjectPreviewMedia } from './ProjectPreviewMedia'

export type WorkProject = {
  id: string
  slug: string
  title: string
  description: string
  tags: string[]
  year: number
  coverColor: string
  coverSrc?: string
  videoSrc?: string
  orientation?: 'landscape' | 'portrait' | 'square'
  /** When set, the card links out to this URL (e.g. Behance) instead of
   *  the internal /work/[slug] case-study page. */
  liveUrl?: string
  gridStyle?: React.CSSProperties
}

// Layered blues cycled across the bento (with a11y-correct text colour).
const BLOCKS: { bg: string; fg: string }[] = [
  { bg: '#DCE4FF', fg: '#0A0A0A' }, // pale  → ink
  { bg: '#0033FF', fg: '#FFFFFF' }, // primary → white
  { bg: '#8AA5FF', fg: '#0A0A0A' }, // light → ink
  { bg: '#001A80', fg: '#FFFFFF' }, // deep  → white
  { bg: '#3D6BFF', fg: '#FFFFFF' }, // mid   → white
  { bg: '#00C2FF', fg: '#0A0A0A' }, // cyan  → ink
]

export function WorkBentoCard({ project, index = 0 }: { project: WorkProject; index?: number }) {
  const router = useRouter()
  const [hover, setHover] = useState(false)
  const [reduce, setReduce] = useState(false)

  useEffect(() => {
    setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const block = BLOCKS[index % BLOCKS.length]
  const num = String(index + 1).padStart(2, '0')

  const onEnter = useCallback(() => {
    setHover(true)
  }, [])
  const onLeave = useCallback(() => {
    setHover(false)
  }, [])

  const lifted = hover && !reduce

  // Staggered reveal for the overlay's inner content — each line rises in on
  // hover-enter with an increasing delay, and drops back together (no delay)
  // on hover-leave so the overlay doesn't linger.
  const revealStyle = (delayMs: number): React.CSSProperties => ({
    transform: hover ? 'translateY(0)' : 'translateY(10px)',
    opacity: hover ? 1 : 0,
    transition: reduce
      ? 'opacity 0.15s ease'
      : `transform 0.4s cubic-bezier(0.16,1,0.3,1) ${hover ? delayMs : 0}ms, opacity 0.3s ease ${hover ? delayMs : 0}ms`,
  })

  return (
    <div
      className={`work-bento-card bento-${project.orientation ?? 'landscape'}`}
      style={{
        ...project.gridStyle,
        position: 'relative',
        display: 'block',
        cursor: 'pointer',
        borderRadius: 0,
        border: '2px solid var(--color-ink)',
        background: block.bg,
        color: block.fg,
        overflow: 'hidden',
        zIndex: hover ? 3 : 1,
        transform: lifted ? 'rotate(-2deg) translateY(-6px)' : 'rotate(0deg) translateY(0)',
        boxShadow: lifted ? '10px 10px 0 var(--color-ink)' : '6px 6px 0 var(--color-ink)',
        transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease',
        willChange: 'transform',
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={() => {
        if (project.liveUrl) window.open(project.liveUrl, '_blank', 'noopener,noreferrer')
        else router.push(`/work/${project.slug}`)
      }}
    >
      <ProjectPreviewMedia key={project.id} slug={project.slug}
        coverSrc={project.coverSrc} videoSrc={project.videoSrc} active={hover && !reduce} />

      {/* Number tag — top-left, on a dark chip so it reads over any image */}
      <span className="mono-label" style={{
        position: 'absolute', top: '14px', left: '16px', zIndex: 2,
        color: '#fff', fontSize: '12px', letterSpacing: '0.14em',
        padding: '2px 8px',
        backgroundColor: (project.coverSrc || project.videoSrc) ? 'rgba(10,10,10,0.55)' : 'transparent',
      }}>
        [{num}]
      </span>

      {/* Bottom scrim — title always visible; description/tags/CTA fade and
          slide in on hover, and the video (if any) stays visible through it
          instead of being covered by a full-card takeover. */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '18px', paddingTop: '48px',
        background: 'linear-gradient(to top, rgba(10,10,10,0.85), rgba(10,10,10,0.45) 55%, transparent)',
        pointerEvents: hover ? 'auto' : 'none',
      }}>
        <span className="mono-label" style={{ color: 'var(--color-acid)', marginBottom: '6px', ...revealStyle(0) }}>
          {project.year}
        </span>
        <h3 style={{
          fontFamily: 'var(--font-syne), ui-sans-serif',
          fontSize: 'clamp(16px, 1.6vw, 22px)', fontWeight: 700,
          margin: '0 0 8px', lineHeight: 1.15, textTransform: 'uppercase', color: '#fff',
        }}>
          {project.title}
        </h3>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.78)', margin: '0 0 12px', lineHeight: 1.55, ...revealStyle(40) }}>
          {project.description}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px', ...revealStyle(80) }}>
          {project.tags.map(tag => (
            <span key={tag} style={{
              padding: '3px 9px', borderRadius: 0,
              fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
              fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--color-ink)', background: 'var(--color-acid)',
            }}>
              {tag}
            </span>
          ))}
        </div>
        <span style={{
          fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
          fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--color-acid)', display: 'flex', alignItems: 'center', gap: '8px',
          ...revealStyle(120),
        }}>
          {project.liveUrl ? 'View on Behance' : 'View Case Study'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </span>
      </div>
    </div>
  )
}
