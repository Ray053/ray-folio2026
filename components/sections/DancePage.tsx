'use client'
import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DanceVideoCard } from '@/components/ui/DanceVideoCard'
import { AmbientGlow } from '@/components/ui/AmbientGlow'
import { Marquee } from '@/components/ui/Marquee'

gsap.registerPlugin(ScrollTrigger)

// bento: tall = col1 span 2 rows | wide = col2-3 row1 | sq = single cell
type BentoType = 'tall' | 'wide' | 'sq'
const BENTO_PATTERN: BentoType[] = ['tall', 'wide', 'sq', 'sq']

export type DanceVideoItem = {
  id: string
  title: string
  year: number
  location?: string
  videoSrc?: string
  thumbnailSrc?: string
}

const PLACEHOLDER_VIDEOS: DanceVideoItem[] = [
  { id: '1', title: 'Freestyle Session', year: 2025, location: 'Taipei' },
  { id: '2', title: 'Crew Collab',       year: 2025, location: 'Tainan' },
  { id: '3', title: 'Street Jam',        year: 2024, location: 'Taipei' },
  { id: '4', title: 'Solo Cut',          year: 2024, location: 'Studio' },
]

export function DancePage({ videos }: { videos?: DanceVideoItem[] }) {
  const t       = useTranslations('dancePage')
  const wrapRef = useRef<HTMLDivElement>(null)

  const source = videos && videos.length ? videos : PLACEHOLDER_VIDEOS
  const list = source.map((v, i) => ({
    ...v,
    location: v.location ?? '',
    bento: BENTO_PATTERN[i % BENTO_PATTERN.length],
  }))

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.dance-header-text', {
        y: 28, opacity: 0, duration: 0.7, ease: 'power4.out', stagger: 0.1, delay: 0.1,
      })
      gsap.from('.bento-card', {
        y: 40, opacity: 0, duration: 0.65, ease: 'power4.out', stagger: 0.08,
        scrollTrigger: { trigger: '.bento-grid', start: 'top 82%' },
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
        padding: 'clamp(64px, 8vw, 120px) 24px clamp(40px, 5vw, 64px)',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap',
      }}>
        <div>
          <p className="dance-header-text" style={{
            fontSize: '12px', fontWeight: 500, letterSpacing: '0.15em',
            textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '12px',
          }}>
            {t('eyebrow')}
          </p>
          <h1 className="dance-header-text" style={{
            fontFamily: 'var(--font-syne), ui-sans-serif',
            fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 700,
            lineHeight: 1.0, letterSpacing: '-0.03em',
            color: 'var(--color-text-primary)', margin: 0,
          }}>
            {t('heading')}
          </h1>
        </div>
        <p className="dance-header-text" style={{
          fontSize: '15px', color: 'var(--color-text-muted)',
          maxWidth: '280px', lineHeight: 1.7, margin: 0,
        }}>
          {t('description')}
        </p>
      </div>

      <div style={{ position: 'relative', zIndex: 1, height: '1px', backgroundColor: 'var(--color-border)', maxWidth: '1200px', margin: '0 auto' }} />

      {/* Bento grid */}
      <div
        className="bento-grid"
        style={{
          position: 'relative', zIndex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'clamp(32px, 4vw, 56px) 24px clamp(48px, 6vw, 80px)',
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr 1.4fr',
          gridTemplateRows: '340px 240px',
          gap: '12px',
        }}
      >
        {list.map((video) => (
          <DanceVideoCard key={video.id} video={video} />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, paddingBottom: 'clamp(40px, 5vw, 72px)' }}>
        <Marquee items={['STREET DANCE', 'FREESTYLE', 'GROOVE', 'MOVEMENT']} baseSpeed={0.45} />
      </div>
    </div>
  )
}
