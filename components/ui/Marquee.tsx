'use client'
import { useEffect, useRef } from 'react'
import { ensureVelocityTracker, getScrollVelocity } from '@/lib/scrollVelocity'

type Props = {
  items: string[]
  baseSpeed?: number   // px/frame idle drift
}

export function Marquee({ items, baseSpeed = 0.5 }: Props) {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const x        = useRef(0)
  const skew     = useRef(0)

  useEffect(() => {
    ensureVelocityTracker()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const track  = trackRef.current
    const wrap   = wrapRef.current
    if (!track || !wrap) return

    let half = track.scrollWidth / 2
    const onResize = () => { half = track.scrollWidth / 2 }
    window.addEventListener('resize', onResize)

    let raf = 0
    const tick = () => {
      const v = getScrollVelocity()

      // Drift + scroll velocity influences speed & direction
      x.current -= baseSpeed + (reduce ? 0 : v * 0.55)
      if (x.current <= -half) x.current += half
      if (x.current > 0)      x.current -= half
      track.style.transform = `translateX(${x.current}px)`

      // Skew whole band with velocity
      if (!reduce) {
        const target = Math.max(-7, Math.min(7, v * 0.28))
        skew.current += (target - skew.current) * 0.1
        wrap.style.transform = `skewY(${skew.current}deg)`
      }

      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [baseSpeed])

  // Render the sequence twice for a seamless loop
  const seq = [...items, ...items]

  return (
    <div
      ref={wrapRef}
      aria-hidden
      style={{
        overflow: 'hidden',
        padding: 'clamp(32px, 5vw, 64px) 0',
        willChange: 'transform',
        maskImage: 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)',
      }}
    >
      <div
        ref={trackRef}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          willChange: 'transform',
        }}
      >
        {seq.map((item, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'clamp(28px, 4vw, 56px)',
              paddingRight: 'clamp(28px, 4vw, 56px)',
              fontFamily: 'var(--font-syne), ui-sans-serif',
              fontSize: 'clamp(36px, 7vw, 92px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              color: i % 3 === 1 ? 'var(--color-accent)' : 'var(--color-text-muted)',
              opacity: i % 3 === 1 ? 0.9 : 0.32,
            }}
          >
            {item}
            <span style={{
              width: 'clamp(8px, 1vw, 14px)',
              height: 'clamp(8px, 1vw, 14px)',
              borderRadius: '9999px',
              background: 'var(--color-accent)',
              opacity: 0.5,
              flexShrink: 0,
            }} />
          </span>
        ))}
      </div>
    </div>
  )
}
