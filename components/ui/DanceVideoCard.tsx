'use client'
import { useRef, useCallback, useState } from 'react'
import gsap from 'gsap'

type BentoType = 'tall' | 'wide' | 'sq'

type DanceVideo = {
  id: string
  title: string
  year: number
  location: string
  bento: BentoType
  videoSrc?: string
  thumbnailSrc?: string
}

const BENTO_STYLE: Record<BentoType, React.CSSProperties> = {
  tall: { gridColumn: '1', gridRow: '1 / span 2' },
  wide: { gridColumn: '2 / span 2', gridRow: '1' },
  sq:   {},  // auto-placed
}

// Accent color per card for visual variety
const ACCENT_GRADIENTS: Record<string, string> = {
  '1': 'linear-gradient(160deg, #122333 0%, #1B3550 100%)',
  '2': 'linear-gradient(140deg, #1B3550 0%, #2E5F82 100%)',
  '3': 'linear-gradient(150deg, #0D1B2A 0%, #254A64 100%)',
  '4': 'linear-gradient(145deg, #122333 0%, #3D6480 100%)',
}

export function DanceVideoCard({ video }: { video: DanceVideo }) {
  const cardRef    = useRef<HTMLDivElement>(null)
  const videoRef   = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)

  const onMouseEnter = useCallback(() => {
    videoRef.current?.play().catch(() => {})
    setPlaying(true)
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 })
    gsap.to(cardRef.current, { scale: 1.015, duration: 0.35, ease: 'power2.out' })
  }, [])

  const onMouseLeave = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
    setPlaying(false)
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.4 })
    gsap.to(cardRef.current, { scale: 1, duration: 0.4, ease: 'power3.out' })
  }, [])

  return (
    <div
      ref={cardRef}
      className="bento-card"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        ...BENTO_STYLE[video.bento],
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        willChange: 'transform',
        border: '1px solid var(--color-border)',
        position: 'relative',
        background: ACCENT_GRADIENTS[video.id] ?? 'var(--color-surface-2)',
      }}
    >
      {/* Video */}
      {video.videoSrc && (
        <video
          ref={videoRef}
          src={video.videoSrc}
          poster={video.thumbnailSrc}
          muted loop playsInline
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
          }}
        />
      )}

      {/* Overlay with info */}
      <div
        ref={overlayRef}
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          padding: video.bento === 'wide' ? '20px 24px' : '16px',
        }}
      >
        {/* Top: play button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {playing ? (
            <SoundBars />
          ) : (
            <div style={{
              width: '36px', height: '36px', borderRadius: '9999px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
          )}
        </div>

        {/* Bottom: title + meta */}
        <div>
          {video.bento !== 'sq' && (
            <p style={{
              fontSize: video.bento === 'wide' ? '20px' : '16px',
              fontFamily: 'var(--font-syne), ui-sans-serif',
              fontWeight: 600, color: 'rgba(255,255,255,0.92)',
              margin: '0 0 6px', lineHeight: 1.2,
            }}>
              {video.title}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {video.bento === 'sq' && (
              <p style={{
                fontSize: '13px', fontWeight: 500,
                color: 'rgba(255,255,255,0.8)', margin: 0,
              }}>
                {video.title}
              </p>
            )}
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>
              {video.location} · {video.year}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SoundBars() {
  return (
    <div style={{
      display: 'flex', gap: '3px', alignItems: 'flex-end',
      height: '20px', padding: '2px',
    }}>
      {[0.5, 1, 0.7, 0.9, 0.4].map((h, i) => (
        <div key={i} style={{
          width: '3px',
          height: `${h * 100}%`,
          backgroundColor: 'var(--color-accent)',
          borderRadius: '2px',
          animation: `soundbar 0.7s ease-in-out ${i * 0.12}s infinite alternate`,
        }} />
      ))}
    </div>
  )
}
