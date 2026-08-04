'use client'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// One continuous path (normalized 0..1 over the wrapper):
// top-centre → swing right → swing left behind the photo → down to mid →
// swing right → descend the right side to the bottom.
const PATH_D =
  'M 0.50 0.01 ' +
  'C 0.94 0.10, 0.08 0.24, 0.46 0.38 ' +
  'C 0.66 0.48, 0.92 0.66, 0.88 0.99'

/**
 * A single colourful ball that travels one continuous trajectory across the
 * profile + projects sections it wraps. Sits behind the (transparent) sections.
 */
export function UnifiedTrajectory({ children }: { children: React.ReactNode }) {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const pathRef  = useRef<SVGPathElement>(null)
  const ballRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const path = pathRef.current
      const ball = ballRef.current
      const layer = layerRef.current
      if (!path || !ball || !layer) return

      const len = path.getTotalLength()
      path.style.strokeDasharray  = `${len}`
      path.style.strokeDashoffset = `${len}`

      ScrollTrigger.create({
        trigger: wrapRef.current,
        start: 'top 75%',
        end: 'bottom 60%',
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress
          const pt = path.getPointAtLength(len * p)   // pt.x / pt.y in 0..1
          const w = layer.clientWidth, h = layer.clientHeight
          ball.style.transform = `translate(${pt.x * w}px, ${pt.y * h}px)`
          path.style.strokeDashoffset = `${len * (1 - p)}`
        },
      })
    }, wrapRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={wrapRef} style={{ position: 'relative', backgroundColor: 'var(--color-background)' }}>
      {/* Trajectory layer — behind the transparent sections */}
      <div
        ref={layerRef}
        aria-hidden
        style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      >
        <svg width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id="uni-trail" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#001B3D" />
              <stop offset="30%"  stopColor="#0060DF" />
              <stop offset="55%"  stopColor="#0A84FF" />
              <stop offset="80%"  stopColor="#5AB0FF" />
              <stop offset="100%" stopColor="#EAF4FF" />
            </linearGradient>
          </defs>
          <path
            ref={pathRef}
            d={PATH_D}
            fill="none" stroke="url(#uni-trail)" strokeWidth={2}
            vectorEffect="non-scaling-stroke" strokeLinecap="round" opacity={0.72}
          />
        </svg>
        <div
          ref={ballRef}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '20px', height: '20px', marginLeft: '-10px', marginTop: '-10px',
            borderRadius: '9999px',
            background: 'conic-gradient(from 120deg, #001B3D, #0060DF, #0A84FF, #5AB0FF, #EAF4FF, #001B3D)',
            boxShadow: '0 0 20px 5px rgba(10,132,255,0.5), 0 0 6px 2px rgba(234,244,255,0.85)',
            willChange: 'transform',
          }}
        />
      </div>

      {/* Sections (transparent backgrounds) above the trajectory */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
