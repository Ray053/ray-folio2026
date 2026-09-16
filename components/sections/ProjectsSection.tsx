'use client'
import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AmbientGlow } from '@/components/ui/AmbientGlow'
import { ProjectPreviewMedia } from '@/components/ui/ProjectPreviewMedia'
import { ease, duration, scrollTriggerDefaults } from '@/lib/motion'
import { PLACEHOLDER_PROJECTS as SHARED_PLACEHOLDER_PROJECTS } from '@/lib/placeholderProjects'

gsap.registerPlugin(ScrollTrigger)

export type ProjectItem = {
  id: string
  slug: string
  title: string
  description?: string
  tags: string[]
  year: number
  coverColor: string
  videoSrc?: string
  coverSrc?: string
}

const PLACEHOLDER_PROJECTS: ProjectItem[] = SHARED_PLACEHOLDER_PROJECTS.map(
  ({ id, slug, title, description, tags, year, coverColor, videoSrc, coverSrc }) => ({
    id, slug, title, description, tags, year, coverColor, videoSrc, coverSrc,
  })
)

/** Media + title only — just a visual anchor for whichever row is active.
 *  The actual project intro expands inline in the accordion row itself
 *  (see `.acc-row` below), not in this card. */
function PreviewCardBody({ proj }: { proj: ProjectItem }) {
  return (
    <div style={{ width: '100%', height: '170px', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: proj.coverColor }} />
      <ProjectPreviewMedia key={proj.id} slug={proj.slug}
        coverSrc={proj.coverSrc} videoSrc={proj.videoSrc} active />
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
    </div>
  )
}

export function ProjectsSection({ projects }: { projects?: ProjectItem[] }) {
  const t = useTranslations('projects')
  const router = useRouter()
  const PROJECTS = projects && projects.length ? projects : PLACEHOLDER_PROJECTS
  const sectionRef = useRef<HTMLElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const [active, setActive]   = useState<number | null>(null)
  const [current, setCurrent] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)
  const [sectionInView, setSectionInView] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsCoarsePointer(window.matchMedia('(hover: none)').matches)
  }, [])

  // Cursor follow — set transform imperatively (no re-render per move).
  useEffect(() => {
    if (!mounted) return
    const onMouseMove = (e: MouseEvent) => {
      const el = previewRef.current
      if (el) el.style.transform = `translate(${e.clientX + 24}px, ${e.clientY - 90}px)`
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [mounted])

  // Only float the mobile preview while this section is actually on screen —
  // it's position:fixed, so without this it would hover over Hero/About too.
  useEffect(() => {
    if (!mounted || !isCoarsePointer || !sectionRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setSectionInView(entry.isIntersecting),
      { threshold: 0.05 }
    )
    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [mounted, isCoarsePointer])

  // Entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance — slide only (never hides opacity, so content can't vanish)
      gsap.from('.acc-head', {
        y: 36, duration: duration.slow, ease: ease.outExpo,
        scrollTrigger: { trigger: sectionRef.current, start: scrollTriggerDefaults.start },
      })
      gsap.from('.acc-row', {
        y: 30, duration: 0.6, ease: ease.outExpo, stagger: 0.08,
        scrollTrigger: { trigger: '.acc-list', start: 'top 88%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  // No hover on touch devices, so there's no way to trigger the preview —
  // instead, whichever row is scrolled to the vertical center "activates"
  // itself, reusing the same active/current state hover already drives.
  useEffect(() => {
    if (!mounted || !isCoarsePointer) return
    const rows = sectionRef.current?.querySelectorAll<HTMLDivElement>('.acc-row')
    if (!rows?.length) return
    const triggers = Array.from(rows).map((row, i) => ScrollTrigger.create({
      trigger: row,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => { if (self.isActive) { setActive(i); setCurrent(i) } },
    }))
    return () => triggers.forEach((tr) => tr.kill())
  }, [mounted, isCoarsePointer, PROJECTS.length])

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
                  padding: isActive ? '36px 8px 28px' : '24px 8px',
                  cursor: 'pointer',
                  opacity: dim ? 0.4 : 1,
                  transition: 'padding 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
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

                {/* Intro — expands in place when this row activates, on
                    both desktop hover and mobile scroll-progress. */}
                {p.description && (
                  <div style={{
                    maxHeight: isActive ? '100px' : '0px',
                    opacity: isActive ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease',
                  }}>
                    <p style={{
                      fontSize: '14px', lineHeight: 1.6, color: 'var(--color-text-secondary)',
                      maxWidth: '620px', margin: '14px 0 0',
                      paddingLeft: 'clamp(32px, 5vw, 56px)',
                    }}>
                      {p.description}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Cursor-following preview card — portaled to body to escape any
          transformed ancestor (PageTransition / trajectory). Desktop only:
          touch devices get the floating scroll-driven preview below instead. */}
      {mounted && !isCoarsePointer && createPortal(
        <div
          ref={previewRef}
          aria-hidden
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '260px',
            borderRadius: 0,
            pointerEvents: 'none',
            zIndex: 45,
            opacity: active !== null ? 1 : 0,
            transition: 'opacity 0.3s ease',
            border: '2px solid var(--color-ink)',
            boxShadow: '6px 6px 0 var(--color-ink)',
            willChange: 'transform',
          }}
        >
          <PreviewCardBody proj={proj} />
        </div>,
        document.body,
      )}

      {/* Touch-device preview — no hover to trigger the card above, so
          instead float a fixed card near the top of the viewport (like the
          desktop one, minus cursor-tracking) that swaps to whichever
          project you've scrolled to (driven by `current`, set by the
          ScrollTrigger effect above). Only shown while this section itself
          is in view, since position:fixed would otherwise hover over
          Hero/About too. */}
      {mounted && isCoarsePointer && createPortal(
        <div
          aria-hidden
          style={{
            position: 'fixed',
            top: 'clamp(72px, 12vw, 92px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(88vw, 340px)',
            borderRadius: 0,
            zIndex: 45,
            opacity: sectionInView ? 1 : 0,
            transition: 'opacity 0.3s ease',
            border: '2px solid var(--color-ink)',
            boxShadow: '6px 6px 0 var(--color-ink)',
            pointerEvents: 'none',
          }}
        >
          <PreviewCardBody proj={proj} />
        </div>,
        document.body,
      )}
    </section>
  )
}
