'use client'
import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import gsap from 'gsap'
import { ease, duration } from '@/lib/motion'

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
  caseStudy?: string[]
  /** Extra project images added via the CMS Gallery field (Behance/Webflow-
   * style) — independent of the single Cover Image. */
  gallery?: { src: string; caption?: string }[]
}

function GallerySection({ items }: { items: { src: string; caption?: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(24px, 4vw, 48px)' }}>
      {items.map((item, i) => (
        <figure key={item.src + i} style={{ margin: 0 }}>
          <Image src={item.src} alt={item.caption || ''} width={1600} height={1000}
            sizes="100vw" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }} />
          {item.caption && (
            <figcaption style={{
              fontSize: '13px', color: 'var(--color-text-muted)',
              marginTop: '12px', textAlign: 'center'
            }}>
              {item.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  )
}

export function ProjectDetailPage({ project, diagrams }: { project: Project; diagrams?: Record<string, React.ReactNode> }) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.detail-line', {
        y: 24, opacity: 0, duration: duration.slow,
        ease: ease.outExpo, stagger: 0.08, delay: 0.1,
      })
    }, wrapRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={wrapRef} style={{ backgroundColor: 'var(--color-background)' }}>

      {/* Hero cover - full width, clean */}
      <div style={{
        position: 'relative',
        backgroundColor: project.coverColor,
        overflow: 'hidden',
      }}>
        {project.coverSrc && (
          <Image src={project.coverSrc} alt="" width={1920} height={1080} priority
            sizes="100vw" style={{ width: '100%', height: 'auto', display: 'block' }} />
        )}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1,
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '0 24px 48px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3) 50%, transparent)',
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
          <div className="detail-line" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {project.tags.map(tag => (
              <span key={tag} style={{
                display: 'inline-block', padding: '6px 12px', borderRadius: '2px',
                fontSize: '14px', lineHeight: 1.5, fontWeight: 600,
                color: '#001A80', border: '1px solid #001A80',
                // Solid backing keeps contrast independent of the cover image.
                backgroundColor: '#DCE4FF', overflowWrap: 'anywhere', maxWidth: '100%',
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

        {/* Full case study body, when supplied — otherwise a note that this
            entry is CMS-only and hasn't had a long-form write-up added yet.
            Each block in caseStudy can be:
              "## Heading"            -> section heading
              "- one\n- two"          -> bullet list (every line starts "- ")
              "[[diagram:key]]"       -> the matching node from `diagrams`
              "[[gallery]]"           -> the CMS Gallery field, placed here
              anything else           -> a plain paragraph
            so the narrative reads as Problem -> Research -> Solution ->
            Outcome with flow charts / design-system swatches / a real image
            gallery placed right where they're relevant. If there's a
            gallery but no "[[gallery]]" marker (the common case for anyone
            just uploading images in the admin without editing the write-up),
            it's appended automatically instead of silently not showing. */}
        {(() => {
          const gallery = project.gallery?.filter((g) => g.src) ?? []
          const hasGalleryMarker = project.caseStudy?.some((p) => p.trim() === '[[gallery]]') ?? false
          const showAutoGallery = gallery.length > 0 && !hasGalleryMarker

          if (project.caseStudy && project.caseStudy.length > 0) {
            return (
              <div style={{
                marginTop: 'clamp(48px, 6vw, 80px)',
                borderTop: '1px solid var(--color-border)',
                paddingTop: 'clamp(32px, 5vw, 56px)',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {project.caseStudy.map((para, i) => {
                    const heading = para.match(/^##\s+(.*)/)
                    if (heading) {
                      return (
                        <h2 key={i} className="detail-line" style={{
                          fontFamily: 'var(--font-syne), ui-sans-serif',
                          fontSize: 'clamp(20px, 2.2vw, 28px)', fontWeight: 700,
                          color: 'var(--color-text-primary)', margin: i === 0 ? 0 : '16px 0 0',
                        }}>
                          {heading[1]}
                        </h2>
                      )
                    }

                    if (para.trim() === '[[gallery]]') {
                      if (gallery.length === 0) return null
                      return (
                        <div key={i} className="detail-line" style={{ margin: '8px 0' }}>
                          <GallerySection items={gallery} />
                        </div>
                      )
                    }

                    const diagramKey = para.match(/^\[\[diagram:(\w+)\]\]$/)
                    if (diagramKey && diagrams?.[diagramKey[1]]) {
                      return (
                        <div key={i} className="detail-line" style={{ margin: '8px 0' }}>
                          {diagrams[diagramKey[1]]}
                        </div>
                      )
                    }

                    const lines = para.split('\n').map((l) => l.trim()).filter(Boolean)
                    if (lines.length > 0 && lines.every((l) => l.startsWith('- '))) {
                      return (
                        <ul key={i} className="detail-line" style={{
                          margin: 0, paddingLeft: '20px',
                          display: 'flex', flexDirection: 'column', gap: '8px',
                        }}>
                          {lines.map((l, li) => (
                            <li key={li} style={{
                              fontSize: '16px', lineHeight: 1.7,
                              color: 'var(--color-text-secondary)',
                            }}>
                              {l.slice(2)}
                            </li>
                          ))}
                        </ul>
                      )
                    }

                    return (
                      <p key={i} className="detail-line" style={{
                        fontSize: '16px', lineHeight: 1.85,
                        color: 'var(--color-text-secondary)', margin: 0,
                      }}>
                        {para}
                      </p>
                    )
                  })}
                  {showAutoGallery && (
                    <div className="detail-line" style={{ margin: '8px 0' }}>
                      <GallerySection items={gallery} />
                    </div>
                  )}
                </div>
              </div>
            )
          }

          if (gallery.length > 0) {
            return (
              <div className="detail-line" style={{
                marginTop: 'clamp(48px, 6vw, 80px)',
                borderTop: '1px solid var(--color-border)',
                paddingTop: 'clamp(32px, 5vw, 56px)',
              }}>
                <GallerySection items={gallery} />
              </div>
            )
          }

          return (
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
          )
        })()}
      </div>
    </div>
  )
}
