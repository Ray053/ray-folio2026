'use client'
import { useRef, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import gsap from 'gsap'

type Project = {
  slug: string
  title: string
  description: string
  tags: string[]
  year: number
  coverColor: string
  coverSrc?: string
  liveUrl?: string
  role?: string
  duration?: string
  outcome?: string
}

export function ProjectDetailPage({ project }: { project: Project }) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.detail-line', {
        y: 24, opacity: 0, duration: 0.65,
        ease: 'power4.out', stagger: 0.08, delay: 0.1,
      })
    }, wrapRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={wrapRef} style={{ backgroundColor: 'var(--color-background)' }}>

      {/* Hero cover */}
      <div style={{
        position: 'relative',
        height: 'clamp(280px, 40vw, 520px)',
        background: `radial-gradient(ellipse at 65% 35%, ${project.coverColor}, #060d15)`,
        display: 'flex',
        alignItems: 'flex-end',
        overflow: 'hidden',
      }}>
        {project.coverSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.coverSrc} alt="" style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: 0.9,
          }} />
        )}
        <div style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '0 24px 48px',
          background: project.coverSrc ? 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' : 'none',
        }}>
          <Link href="/work" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none', marginBottom: '20px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            All Work
          </Link>
          <div className="detail-line" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            {project.tags.map(tag => (
              <span key={tag} style={{
                padding: '3px 10px', borderRadius: '2px', fontSize: '11px',
                fontWeight: 500, color: 'var(--color-accent)',
                border: '1px solid rgba(92,130,160,0.4)',
                backgroundColor: 'rgba(92,130,160,0.12)',
              }}>
                {tag}
              </span>
            ))}
          </div>
          <h1 className="detail-line" style={{
            fontFamily: 'var(--font-syne), ui-sans-serif',
            fontSize: 'clamp(28px, 4vw, 56px)',
            fontWeight: 700, lineHeight: 1.0,
            letterSpacing: '-0.02em', color: '#fff', margin: 0,
          }}>
            {project.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(48px, 6vw, 80px) 24px clamp(80px, 10vw, 140px)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: 'clamp(40px, 6vw, 96px)',
          alignItems: 'start',
        }}>
          {/* Left: description */}
          <div>
            <p className="detail-line" style={{
              fontSize: 'clamp(16px, 1.4vw, 20px)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.8, margin: '0 0 40px',
            }}>
              {project.description}
            </p>

            {/* Outcome highlight */}
            {project.outcome && (
              <div className="detail-line" style={{
                padding: '24px 28px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
              }}>
                <p style={{
                  fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: 'var(--color-accent)',
                  margin: '0 0 10px',
                }}>
                  Outcome
                </p>
                <p style={{ fontSize: '16px', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.6 }}>
                  {project.outcome}
                </p>
              </div>
            )}

            {project.liveUrl && (
              <a className="detail-line" href={project.liveUrl} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '24px',
                fontSize: '14px', fontWeight: 500, color: 'var(--color-accent)', textDecoration: 'none',
              }}>
                Visit live site
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M17 7H8M17 7v9"/>
                </svg>
              </a>
            )}
          </div>

          {/* Right: meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '88px' }}>
            {[
              { label: 'Role',     value: project.role },
              { label: 'Duration', value: project.duration },
              { label: 'Year',     value: String(project.year) },
            ].filter(item => item.value).map(item => (
              <div key={item.label} className="detail-line">
                <p style={{
                  fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 6px',
                }}>
                  {item.label}
                </p>
                <p style={{ fontSize: '15px', color: 'var(--color-text-primary)', margin: 0 }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Placeholder for full case study content */}
        <div className="detail-line" style={{
          marginTop: 'clamp(48px, 6vw, 80px)',
          padding: '48px',
          borderRadius: '12px',
          border: '1px dashed var(--color-border)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            Full case study content — add via Payload CMS
          </p>
        </div>
      </div>
    </div>
  )
}
