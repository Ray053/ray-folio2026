'use client'
import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { WorkBentoCard, type WorkProject } from '@/components/ui/WorkBentoCard'
import { AmbientGlow } from '@/components/ui/AmbientGlow'
import { Marquee } from '@/components/ui/Marquee'
import { ease } from '@/lib/motion'
import { PLACEHOLDER_PROJECTS as SHARED_PLACEHOLDER_PROJECTS } from '@/lib/placeholderProjects'

gsap.registerPlugin(ScrollTrigger)

// Card shapes allowed per media orientation — landscape media only ever gets
// wide/normal (short) cells, portrait only ever gets tall cells, so a video
// never gets stretched or cropped into the wrong aspect. Cycling through a
// couple of variants per orientation keeps the bento feel instead of every
// card being identical, and `grid-auto-flow: dense` (set on the grid below)
// packs them without gaps regardless of how many projects there are.
const SHAPES: Record<NonNullable<WorkProject['orientation']>, { col: number; row: number }[]> = {
  landscape: [{ col: 2, row: 1 }, { col: 1, row: 1 }],
  portrait: [{ col: 1, row: 2 }],
  square: [{ col: 1, row: 1 }],
}

export type WorkItem = Omit<WorkProject, 'gridStyle'>

const PLACEHOLDER_PROJECTS: WorkItem[] = SHARED_PLACEHOLDER_PROJECTS.map(
  ({ id, slug, title, description, tags, year, coverColor, coverSrc, videoSrc, orientation, liveUrl }) => ({
    id, slug, title, description, tags, year, coverColor, coverSrc, videoSrc, orientation, liveUrl,
  })
)

export function WorkPage({ projects }: { projects?: WorkItem[] }) {
  const t       = useTranslations('workPage')
  const wrapRef = useRef<HTMLDivElement>(null)

  const source = projects && projects.length ? projects : PLACEHOLDER_PROJECTS
  const orientationCounts: Partial<Record<string, number>> = {}
  const ALL_PROJECTS: WorkProject[] = source.map((p) => {
    const orientation = p.orientation ?? 'landscape'
    const count = orientationCounts[orientation] ?? 0
    orientationCounts[orientation] = count + 1
    const shapes = SHAPES[orientation]
    const { col, row } = shapes[count % shapes.length]
    return {
      ...p,
      orientation,
      gridStyle: { gridColumn: `span ${col}`, gridRow: `span ${row}` },
    }
  })

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.work-header', {
        y: 28, opacity: 0, duration: 0.7, ease: ease.outExpo, stagger: 0.1, delay: 0.1,
      })
      gsap.from('.work-bento-card', {
        y: 40, opacity: 0, duration: 0.65, ease: ease.outExpo, stagger: 0.08,
        scrollTrigger: { trigger: '.work-bento-grid', start: 'top 82%' },
      })
    }, wrapRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={wrapRef} style={{ position: 'relative', backgroundColor: 'var(--color-background)', overflow: 'hidden' }}>

      <AmbientGlow />

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: 'clamp(64px, 8vw, 120px) 24px clamp(40px, 5vw, 56px)',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <p className="work-header mono-label" style={{ marginBottom: '12px' }}>
          {'// '}{t('eyebrow')}
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <h1 className="work-header" style={{
            fontFamily: 'var(--font-syne), ui-sans-serif',
            fontSize: 'clamp(40px, 5.5vw, 72px)', fontWeight: 700,
            lineHeight: 1.0, letterSpacing: '-0.03em', textTransform: 'uppercase',
            color: 'var(--color-text-primary)', margin: 0,
          }}>
            {t('heading')}
          </h1>
          <p className="work-header" style={{
            fontSize: '15px', color: 'var(--color-text-muted)',
            maxWidth: '360px', lineHeight: 1.7, margin: 0,
          }}>
            {t('description')}
          </p>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, height: '2px', backgroundColor: 'var(--color-ink)', maxWidth: '1200px', margin: '0 auto' }} />

      {/* Bento grid */}
      <div
        className="work-bento-grid"
        style={{
          position: 'relative', zIndex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'clamp(40px, 5vw, 64px) 24px clamp(48px, 6vw, 80px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridAutoRows: '260px',
          gridAutoFlow: 'dense',
          gap: '22px',
        }}
      >
        {ALL_PROJECTS.map((project, i) => (
          <WorkBentoCard key={project.id} project={project} index={i} />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, paddingBottom: 'clamp(40px, 5vw, 72px)' }}>
        <Marquee items={['SELECTED WORK', 'CASE STUDIES', 'UX', 'PRODUCT DESIGN']} baseSpeed={0.4} />
      </div>
    </div>
  )
}
