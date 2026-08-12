'use client'
import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { WorkBentoCard, type WorkProject } from '@/components/ui/WorkBentoCard'
import { AmbientGlow } from '@/components/ui/AmbientGlow'
import { Marquee } from '@/components/ui/Marquee'

gsap.registerPlugin(ScrollTrigger)

// Bento grid positions for 6 cards (3-col, 3-row alternating layout)
// Row 1: [wide ×2] [normal]
// Row 2: [normal]  [wide ×2]
// Row 3: [wide ×2] [normal]
const BENTO_POSITIONS: React.CSSProperties[] = [
  { gridColumn: '1 / span 2', gridRow: '1' },
  { gridColumn: '3',          gridRow: '1' },
  { gridColumn: '1',          gridRow: '2' },
  { gridColumn: '2 / span 2', gridRow: '2' },
  { gridColumn: '1 / span 2', gridRow: '3' },
  { gridColumn: '3',          gridRow: '3' },
]

export type WorkItem = Omit<WorkProject, 'gridStyle'>

const PLACEHOLDER_PROJECTS: WorkItem[] = [
  { id: '1', slug: 'healthcare-app-redesign', title: 'Healthcare App Redesign', description: 'Redesigned the patient journey for a telehealth app, reducing drop-off by 38%.', tags: ['UX Research', 'Product Design'], year: 2025, coverColor: '#0033FF' },
  { id: '2', slug: 'e-commerce-checkout', title: 'E-Commerce Checkout Flow', description: 'Simplified a 7-step checkout into 3, increasing conversion by 22%.', tags: ['Interaction Design', 'Testing'], year: 2024, coverColor: '#001A80' },
  { id: '3', slug: 'design-system', title: 'Design System at Scale', description: 'Built a cross-platform design system used by 4 product teams.', tags: ['Design Systems'], year: 2024, coverColor: '#3D6BFF' },
  { id: '4', slug: 'onboarding-experience', title: 'Onboarding Experience', description: 'Personalised onboarding that improved day-7 retention by 31%.', tags: ['UX Research'], year: 2023, coverColor: '#0033FF' },
  { id: '5', slug: 'mobile-banking', title: 'Mobile Banking Redesign', description: 'Led the UX strategy for a complete mobile banking overhaul.', tags: ['UX Strategy'], year: 2023, coverColor: '#00C2FF' },
  { id: '6', slug: 'dashboard-dataviz', title: 'Dashboard & Data Viz', description: 'Real-time analytics dashboard turning complex data into clear insights.', tags: ['Data Visualisation'], year: 2022, coverColor: '#001A80' },
]

export function WorkPage({ projects }: { projects?: WorkItem[] }) {
  const t       = useTranslations('workPage')
  const wrapRef = useRef<HTMLDivElement>(null)

  const source = projects && projects.length ? projects : PLACEHOLDER_PROJECTS
  const ALL_PROJECTS: WorkProject[] = source.map((p, i) => ({
    ...p,
    gridStyle: BENTO_POSITIONS[i % BENTO_POSITIONS.length],
  }))

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.work-header', {
        y: 28, opacity: 0, duration: 0.7, ease: 'power4.out', stagger: 0.1, delay: 0.1,
      })
      gsap.from('.work-bento-card', {
        y: 40, opacity: 0, duration: 0.65, ease: 'power4.out', stagger: 0.08,
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
          gridTemplateRows: '300px 220px 300px',
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
