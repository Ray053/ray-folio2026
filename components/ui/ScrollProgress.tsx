'use client'
import { useEffect, useRef } from 'react'

export function ScrollProgress() {
  const fillRef  = useRef<HTMLDivElement>(null)
  const ballRef  = useRef<HTMLDivElement>(null)
  const ghostRefs = useRef<(HTMLDivElement | null)[]>([])

  const target  = useRef(0)
  const current = useRef(0)
  const history = useRef<number[]>([])   // past positions → comet trail
  const raf     = useRef(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      target.current = max > 0 ? Math.min(window.scrollY / max, 1) : 0
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    const tick = () => {
      // Lerp → ball lags behind scroll, forming a trailing motion
      current.current += (target.current - current.current) * (reduce ? 1 : 0.12)
      const p = current.current

      if (fillRef.current) fillRef.current.style.height = `${p * 100}%`
      if (ballRef.current) ballRef.current.style.top = `${p * 100}%`

      // Comet ghost trail: store recent positions, render with fade
      history.current.unshift(p)
      if (history.current.length > 24) history.current.pop()

      ghostRefs.current.forEach((g, i) => {
        if (!g) return
        const idx = (i + 1) * 4           // sample every few frames back
        const gp  = history.current[idx] ?? p
        g.style.top = `${gp * 100}%`
        g.style.opacity = `${0.32 * (1 - i / ghostRefs.current.length)}`
      })

      raf.current = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: '84px',
        bottom: '84px',
        right: '20px',
        width: '2px',
        zIndex: 40,
        pointerEvents: 'none',
      }}
    >
      {/* Track */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'var(--color-border)',
        opacity: 0.45,
        borderRadius: '2px',
      }} />

      {/* Fill — brighter near the ball */}
      <div
        ref={fillRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '0%',
          background: 'linear-gradient(to bottom, transparent, var(--color-accent))',
          borderRadius: '2px',
        }}
      />

      {/* Comet ghost trail */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          ref={el => { ghostRefs.current[i] = el }}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: `${8 - i}px`,
            height: `${8 - i}px`,
            transform: 'translate(-50%, -50%)',
            borderRadius: '9999px',
            backgroundColor: 'rgba(140, 185, 210, 1)',
            opacity: 0,
          }}
        />
      ))}

      {/* Ball head — emerges blue, like a piece of the blob */}
      <div
        ref={ballRef}
        style={{
          position: 'absolute',
          top: '0%',
          left: '50%',
          width: '13px',
          height: '13px',
          transform: 'translate(-50%, -50%)',
          borderRadius: '9999px',
          background: 'radial-gradient(circle at 35% 30%, #d8e8f0, #5C82A0 70%)',
          boxShadow: '0 0 14px 3px rgba(140,185,210,0.75), 0 0 4px 1px rgba(216,232,240,0.9)',
        }}
      />
    </div>
  )
}
