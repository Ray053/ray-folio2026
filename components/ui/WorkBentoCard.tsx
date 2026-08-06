'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from '@/i18n/navigation'

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

  const onEnter = useCallback(() => setHover(true), [])
  const onLeave = useCallback(() => setHover(false), [])

  const lifted = hover && !reduce

  return (
    <div
      className="work-bento-card"
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
      onClick={() => router.push(`/work/${project.slug}`)}
    >
      {/* Number tag — top-left */}
      <span className="mono-label" style={{
        position: 'absolute', top: '14px', left: '16px', zIndex: 1,
        color: block.fg, fontSize: '12px', letterSpacing: '0.14em',
      }}>
        [{num}]
      </span>

      {/* Default title — bottom-left */}
      <p style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '16px 18px', margin: 0, zIndex: 1,
        fontFamily: 'var(--font-syne), ui-sans-serif',
        fontSize: 'clamp(15px, 1.6vw, 22px)', fontWeight: 700,
        lineHeight: 1.1, letterSpacing: '-0.01em', textTransform: 'uppercase',
        color: block.fg,
      }}>
        {project.title}
      </p>

      {/* Hover detail overlay — solid ink, no blur */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        background: 'var(--color-ink)', color: '#fff',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '22px',
        opacity: hover ? 1 : 0,
        pointerEvents: hover ? 'auto' : 'none',
        transition: 'opacity 0.2s ease',
      }}>
        <span className="mono-label" style={{ color: 'var(--color-acid)', marginBottom: '8px' }}>
          {project.year}
        </span>
        <h3 style={{
          fontFamily: 'var(--font-syne), ui-sans-serif',
          fontSize: 'clamp(16px, 1.6vw, 22px)', fontWeight: 700,
          margin: '0 0 10px', lineHeight: 1.15, textTransform: 'uppercase', color: '#fff',
        }}>
          {project.title}
        </h3>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.72)', margin: '0 0 14px', lineHeight: 1.55 }}>
          {project.description}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
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
        }}>
          View Case Study
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </span>
      </div>
    </div>
  )
}
