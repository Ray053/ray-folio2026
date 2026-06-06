'use client'
import { useEffect, useRef } from 'react'
import { ensureVelocityTracker, getScrollVelocity } from '@/lib/scrollVelocity'

type Props = {
  children: React.ReactNode
  max?: number      // max skew degrees
  factor?: number   // velocity → skew multiplier
}

export function SkewOnScroll({ children, max = 3.5, factor = 0.16 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const cur = useRef(0)

  useEffect(() => {
    ensureVelocityTracker()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    let raf = 0
    const tick = () => {
      const v = getScrollVelocity()
      const target = Math.max(-max, Math.min(max, v * factor))
      cur.current += (target - cur.current) * 0.1
      if (ref.current) ref.current.style.transform = `skewY(${cur.current}deg)`
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [max, factor])

  return (
    <div ref={ref} style={{ willChange: 'transform' }}>
      {children}
    </div>
  )
}
